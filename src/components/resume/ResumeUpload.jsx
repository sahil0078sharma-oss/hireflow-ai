import React, { useState, useRef } from 'react';
import { extractTextFromFile } from '../../utils/documentExtractor.js';
import Button from '../ui/Button.jsx';

/**
 * Reusable Document Upload component for PDF, DOCX, and TXT files.
 * Extracts text in the browser without uploading files to AWS.
 * Used for both Resume and Job Description inputs.
 */
export default function ResumeUpload({
  label = 'Upload Document',
  dropzoneText = 'Drag & drop document here',
  fileTypeLabel = 'document',
  successPrefix = 'Document loaded:',
  inputId = 'document-file-input',
  onTextExtracted,
  isExtracting = false,
  setIsExtracting,
  onError,
  uploadedFileInfo = null,
  onClearFile,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  async function processFile(file) {
    if (!file) return;

    if (setIsExtracting) setIsExtracting(true);
    try {
      const extracted = await extractTextFromFile(file);
      onTextExtracted(extracted);
    } catch (err) {
      console.error(`Document extraction failed for ${fileTypeLabel}:`, err);
      if (onError) {
        onError(err.message || `Failed to extract text from the selected ${fileTypeLabel}.`);
      }
    } finally {
      if (setIsExtracting) setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function triggerFileInput() {
    if (fileInputRef.current && !isExtracting) {
      fileInputRef.current.click();
    }
  }

  return (
    <div className="document-upload-container" style={{ marginBottom: '0.75rem' }}>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={isExtracting}
      />

      {/* Compact Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        aria-label={`${label} — Click or drag and drop a PDF, DOCX, or TXT file`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerFileInput();
          }
        }}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '0.625rem',
          padding: '1rem 1.25rem',
          textAlign: 'center',
          backgroundColor: isDragOver
            ? 'rgba(59, 130, 246, 0.05)'
            : 'var(--color-surface-alt)',
          cursor: isExtracting ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {isExtracting ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0' }}>
            <span
              className="spinner-border"
              style={{
                width: 22,
                height: 22,
                border: '2.5px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Reading {fileTypeLabel}...
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Extracting text in browser
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.25rem' }}>📄</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {dropzoneText}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>or</span>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
              >
                Choose PDF / DOCX / TXT
              </Button>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
              Supported: <strong>PDF, DOCX, TXT</strong> · Max size: <strong>5 MB</strong>
            </div>
          </div>
        )}
      </div>

      {/* Success Badge / Loaded File Info */}
      {uploadedFileInfo && !isExtracting && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--color-success-bg, rgba(16, 185, 129, 0.08))',
            border: '1px solid var(--color-success-border, rgba(16, 185, 129, 0.2))',
            borderRadius: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {successPrefix} <strong>{uploadedFileInfo.fileName}</strong>{' '}
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                ({uploadedFileInfo.charCount.toLocaleString()} characters extracted)
              </span>
            </span>
          </div>
          {onClearFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500,
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Clear file
            </button>
          )}
        </div>
      )}
    </div>
  );
}
