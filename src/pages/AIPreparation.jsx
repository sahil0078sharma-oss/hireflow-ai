import React from 'react';
import Header from '../components/layout/Header.jsx';
import AIPrepComponent from '../components/ai/AIPrep.jsx';

export default function AIPreparation() {
  return (
    <>
      <Header
        title="Adaptive Placement Preparation"
        subtitle="Context-aware preparation engine powered by RDS placement drives, live application stages, and Amazon Comprehend resume gap signals"
        badge="Personalized from your placement drive"
      />
      <main className="page-content">
        <AIPrepComponent />
      </main>
    </>
  );
}
