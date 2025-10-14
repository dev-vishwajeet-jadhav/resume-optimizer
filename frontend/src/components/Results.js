import React, { useState } from 'react';
import SpeedIcon from '@mui/icons-material/Speed';
import LabelIcon from '@mui/icons-material/Label';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './Results.css';

export default function Results({ analysis }) {
  const { score, keywords, suggestions, revised_text } = analysis;
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([revised_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-resume.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(revised_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h2 className="results-title">Analysis Results</h2>
        <p className="results-subtitle">AI-powered insights for your resume</p>
      </div>

      {/* Score Card */}
      <div className="score-card animate-fade-in">
        <div className="card-header">
          <SpeedIcon style={{ fontSize: 24, color: getScoreColor() }} />
          <h3>ATS Compatibility Score</h3>
        </div>
        <div className="score-content">
          <div className="score-circle" style={{ '--score': score, '--color': getScoreColor() }}>
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" className="score-bg" />
              <circle cx="100" cy="100" r="90" className="score-progress" />
            </svg>
            <div className="score-text">
              <span className="score-number">{score}</span>
              <span className="score-percent">%</span>
            </div>
          </div>
          <div className="score-info">
            <div className="score-label" style={{ color: getScoreColor() }}>
              {getScoreLabel()}
            </div>
            <p className="score-description">
              {score >= 80 && "Your resume is well-optimized for ATS systems!"}
              {score >= 60 && score < 80 && "Your resume is good, but there's room for improvement."}
              {score < 60 && "Your resume needs significant improvements for ATS compatibility."}
            </p>
          </div>
        </div>
      </div>

      {/* Keywords Card */}
      <div className="keywords-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-header">
          <LabelIcon style={{ fontSize: 24, color: '#6366f1' }} />
          <h3>Missing Keywords</h3>
          <span className="badge-count">{keywords.length}</span>
        </div>
        <div className="keywords-grid">
          {keywords.length > 0 ? (
            keywords.map((keyword, index) => (
              <div key={index} className="keyword-tag" style={{ animationDelay: `${index * 0.05}s` }}>
                <span className="keyword-icon">🔑</span>
                {keyword}
              </div>
            ))
          ) : (
            <p className="empty-state">No missing keywords found! Your resume is well-optimized.</p>
          )}
        </div>
      </div>

      {/* Suggestions Card */}
      <div className="suggestions-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="card-header">
          <LightbulbIcon style={{ fontSize: 24, color: '#f59e0b' }} />
          <h3>Improvement Suggestions</h3>
          <span className="badge-count">{suggestions.length}</span>
        </div>
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="suggestion-number">{index + 1}</div>
              <p className="suggestion-text">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Optimized Resume Card */}
      <div className="optimized-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="card-header">
          <DescriptionIcon style={{ fontSize: 24, color: '#8b5cf6' }} />
          <h3>Optimized Resume</h3>
        </div>
        <div className="optimized-content">
          <div className="optimized-text">
            <pre>{revised_text}</pre>
          </div>
          <div className="action-buttons">
            <button onClick={handleCopy} className="action-button copy-button">
              {copied ? (
                <>
                  <CheckCircleIcon style={{ fontSize: 20 }} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <ContentCopyIcon style={{ fontSize: 20 }} />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
            <button onClick={handleDownload} className="action-button download-button">
              <DownloadIcon style={{ fontSize: 20 }} />
              <span>Download as TXT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}