import React, { useState } from 'react';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import SendIcon from '@mui/icons-material/Send';
import './TextInput.css';

export default function TextInput({ onSubmit }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="text-input-form">
      <div className="textarea-container">
        <div className="textarea-header">
          <div className="textarea-label">
            <TextSnippetIcon style={{ fontSize: 20, color: '#6366f1' }} />
            <span>Paste Resume Text</span>
          </div>
          <div className="word-count">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </div>
        </div>
        <textarea
          className="text-input"
          placeholder="Paste your resume content here...&#10;&#10;Include all sections: contact info, summary, experience, education, skills, etc."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
        />
      </div>
      <button 
        type="submit" 
        className="submit-button" 
        disabled={!text.trim()}
      >
        <SendIcon style={{ fontSize: 20 }} />
        <span>Analyze Resume</span>
      </button>
    </form>
  );
}