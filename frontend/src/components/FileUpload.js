import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './FileUpload.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export default function FileUpload({ onTextExtracted }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) {
        setError('Please select a PDF file');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 5MB limit`
        );
        return;
      }

      if (!file.type.includes('pdf')) {
        setError('Only PDF files are allowed');
        return;
      }

      setError(null);
      setFileName(file.name);
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${API_BASE}/api/extract`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        if (!data.text) {
          throw new Error('No text content could be extracted from the PDF');
        }

        onTextExtracted(data.text.trim());
      } catch (error) {
        setError(error.message || 'Failed to process PDF');
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    },
    [onTextExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <div className="file-upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${
          isLoading ? 'loading' : ''
        } ${error ? 'error' : ''}`}
      >
        <input {...getInputProps()} disabled={isLoading} />
        
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Processing PDF...</p>
            <p className="file-name">{fileName}</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">
              {isDragActive ? (
                <CheckCircleIcon style={{ fontSize: 48, color: '#10b981' }} />
              ) : (
                <CloudUploadIcon style={{ fontSize: 48, color: '#6366f1' }} />
              )}
            </div>
            <h3 className="upload-title">
              {isDragActive ? 'Drop your PDF here' : 'Upload Resume PDF'}
            </h3>
            <p className="upload-description">
              Drag and drop your resume PDF, or click to browse
            </p>
            <div className="upload-features">
              <span className="feature">
                <PictureAsPdfIcon style={{ fontSize: 16 }} /> PDF Only
              </span>
              <span className="feature">📦 Max 5MB</span>
              <span className="feature">🔒 Secure</span>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
}