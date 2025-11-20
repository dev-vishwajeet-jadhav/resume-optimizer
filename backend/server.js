require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");
const OpenAI = require("openai");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const app = express();

// Initialize OpenRouter client (using OpenAI SDK)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // Optional: Your site URL
    "X-Title": "Resume Optimizer", // Optional: Your app name
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// MongoDB Connection (Optional - uncomment if you want to use MongoDB)
/*
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
*/

// Test route
app.get("/api", (req, res) => {
  res.json({ 
    message: "Resume Optimizer API is running",
    status: "active"
  });
});

// Extract text from PDF
app.post("/api/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const dataBuffer = req.file.buffer;
    const data = await pdf(dataBuffer);

    if (!data.text || data.text.trim().length === 0) {
      return res.status(422).json({ message: "No text content found in PDF" });
    }

    res.status(200).json({ text: data.text.trim() });
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({
      message: error.message || "Error processing PDF",
    });
  }
});


// ============================
// Resume Analysis Route
// ============================


// Apply rate limiter: max 3 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api/analyze", limiter);

// Helper: Retry logic
async function safeRequest(payload, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await openai.chat.completions.create(payload);
    } catch (err) {
      if (err.message.includes("429") && i < retries) {
        console.log("Rate limit hit, retrying in 5s...");
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        throw err;
      }
    }
  }
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { text, jobTitle } = req.body;

    if (!text || !jobTitle) {
      return res.status(400).json({ message: "Text and job title are required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: "OpenRouter API key not configured" });
    }

    // =========================
    // Best possible prompt for resume improvement
    // =========================
    const systemMessage = `
You are a top ATS resume expert and career coach. Your job is to analyze resumes for any job title and provide:
1. ATS score (0-100)
2. Missing or weak keywords relevant to the role
3. 10-12 actionable improvement suggestions (concise, professional)
4. An optimized, modern, and recruiter-friendly version of the resume text
Focus on:
- Skills & keywords relevant to the job
- Professional formatting & bullet points
- Strong action verbs and readability
- Concise and high-impact phrasing

Return strictly in JSON format ONLY:
{
  "score": <number>,
  "keywords": ["keyword1", "keyword2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "optimized_text": "optimized resume text here"
}
`;

    const userPrompt = `
Job Title: ${jobTitle}

Resume Text:
${text}

Instructions:
- Score the resume based on ATS compatibility for this job.
- Identify missing or low-priority keywords.
- Provide 10-12 actionable suggestions.
- Rewrite the resume professionally and concisely.
- Return ONLY valid JSON as instructed in system message.
`;

    // =========================
    // Send request to DeepSeek first
    // =========================
    let completion;
    let modelUsed = "deepseek/deepseek-chat-v3-0324:free";

    try {
      completion = await safeRequest({
        model: modelUsed,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });
    } catch (err) {
      console.error("AI provider error:", err.message || err);
      return res.status(502).json({
        message: "AI provider error. Please try again in a minute.",
        detail: err.message,
      });
    }

    if (!completion || !completion.choices || !completion.choices[0]?.message?.content) {
      return res.status(500).json({
        message: "Empty response from AI provider",
      });
    }

    const responseText = completion.choices[0].message.content;

    // =========================
    // Parse JSON safely
    // =========================
    let analysis;
    try {
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }
      analysis = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        return res.status(500).json({
          message: "Failed to parse AI response",
          debug: responseText.substring(0, 200),
        });
      }
    }

    // =========================
    // Send structured response
    // =========================
    res.status(200).json({
      model_used: modelUsed,
      score: analysis.score || 0,
      keywords: analysis.keywords || [],
      suggestions: analysis.suggestions || [],
      revised_text: analysis.optimized_text || text,
    });

  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({
      message: error.message || "Error analyzing resume",
      error: error.toString(),
    });
  }
});






// ============================
// Server Start
// ============================

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ API Key configured: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app;
