import React, { useState } from 'react';

/**
 * QuestionCard — displays a single Q&A item with collapsible answer
 */
export default function QuestionCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const tipText = item.tip || item.tips;

  return (
    <article className="question-card" style={{ transition: 'all 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span className="question-card__number">Question {index + 1}</span>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {item.topic && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {item.topic}
            </span>
          )}
          {item.difficulty && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                background:
                  item.difficulty === 'Advanced'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : item.difficulty === 'Intermediate'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                color:
                  item.difficulty === 'Advanced'
                    ? '#DC2626'
                    : item.difficulty === 'Intermediate'
                    ? '#D97706'
                    : '#059669',
                border: `1px solid ${
                  item.difficulty === 'Advanced'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : item.difficulty === 'Intermediate'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)'
                }`,
              }}
            >
              {item.difficulty}
            </span>
          )}
        </div>
      </div>

      <h3 className="question-card__question">{item.question}</h3>

      <button
        className="question-card__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        id={`question-toggle-${index}`}
      >
        {open ? '▲ Hide Answer' : '▼ Show Answer & Tips'}
      </button>

      {open && (
        <>
          <div className="question-card__answer">
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
              Answer / Explanation
            </strong>
            {item.answer}
          </div>

          {tipText && (
            <div className="question-card__tip">
              <span aria-hidden="true">💡</span>
              <span><strong>Tip:</strong> {tipText}</span>
            </div>
          )}
        </>
      )}
    </article>
  );
}
