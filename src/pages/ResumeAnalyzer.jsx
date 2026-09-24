import React from 'react';
import Header from '../components/layout/Header.jsx';
import ResumeAnalyzerComponent from '../components/resume/ResumeAnalyzer.jsx';

export default function ResumeAnalyzer() {
  return (
    <>
      <Header
        title="Resume Analyzer"
        subtitle="AI/ML-powered resume analysis using Amazon Comprehend NLP"
        badge="Amazon Comprehend NLP"
      />
      <main className="page-content">
        <ResumeAnalyzerComponent />
      </main>
    </>
  );
}
