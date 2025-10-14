import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import TextInput from './components/TextInput';
import Results from './components/Results';
import WorkIcon from '@mui/icons-material/Work';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (text) => {
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), jobTitle: jobTitle.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data) throw new Error('No data received');

      setResults(data);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setError(error.message || 'Failed to analyze resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Animated Background Elements */}
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="container">
        {/* Modern Header with Icon */}
        <header className="header">
          <div className="header-icon">
            <AutoAwesomeIcon style={{ fontSize: 48 }} />
          </div>
          <h1 className="header-title">
            <span className="gradient-text">Resume Optimizer</span>
          </h1>
          <p className="header-subtitle">
            AI-Powered ATS Resume Analysis & Enhancement
          </p>
          <div className="header-badges">
            <span className="badge">✨ AI-Powered</span>
            <span className="badge">🚀 Instant Results</span>
            <span className="badge">🎯 ATS Optimized</span>
          </div>
        </header>

        {/* Input Card */}
        <div className="input-section">
          <div className="section-header">
            <WorkIcon style={{ fontSize: 24, color: '#6366f1' }} />
            <h2>Get Started</h2>
          </div>
          
          <div className="job-title-input">
            <label htmlFor="jobTitle">Target Job Title</label>
            <input
              id="jobTitle"
              type="text"
              placeholder="e.g., Software Engineer, Data Analyst, Product Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
            />
          </div>

          <div className="upload-section">
            <FileUpload onTextExtracted={handleSubmit} />
            <div className="divider">
              <span>OR</span>
            </div>
            <TextInput onSubmit={handleSubmit} />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner animate-slide-down">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="loading-section animate-fade-in">
            <div className="loading-content">
              <div className="spinner-container">
                <div className="spinner-large"></div>
                <div className="spinner-glow"></div>
              </div>
              <h3>Analyzing Your Resume</h3>
              <p>Our AI is reviewing your resume for ATS compatibility...</p>
              <div className="loading-steps">
                <div className="step active">📄 Parsing Content</div>
                <div className="step active">🔍 Analyzing Keywords</div>
                <div className="step active">✨ Generating Insights</div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && !isLoading && <Results analysis={results} />}
      </div>
    </div>
  );
}

export default App;