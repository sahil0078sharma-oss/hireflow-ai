/**
 * Document Extractor Utility — src/utils/documentExtractor.js
 *
 * Extracts plain text from PDF, DOCX, and TXT files entirely in the browser.
 * No file is sent to the backend.
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';

// Configure PDF.js worker using legacy bundled worker in Vite
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/legacy/build/pdf.worker.min.mjs`;
  }
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Extract plain text from a user-uploaded resume document.
 *
 * @param {File} file - Browser File object
 * @returns {Promise<{ text: string, fileName: string, fileType: string, charCount: number }>}
 */
export async function extractTextFromFile(file) {
  if (!file) {
    throw new Error('No file provided.');
  }

  // 1. File Size Validation (Max 5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File is too large. Please upload a resume smaller than 5 MB.');
  }

  const name = file.name.toLowerCase();

  // 2. Format Detection & Extraction
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return await extractFromPdf(file);
  } else if (
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await extractFromDocx(file);
  } else if (name.endsWith('.txt') || file.type.startsWith('text/')) {
    return await extractFromTxt(file);
  } else {
    throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT document.');
  }
}

/**
 * Extract text from PDF document using pdfjs-dist
 */
async function extractFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    if (!pdf || pdf.numPages === 0) {
      throw new Error('PDF document has no pages.');
    }

    const pagesText = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items
        .map((item) => (item.str ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageStr) {
        pagesText.push(pageStr);
      }
    }

    const combinedText = pagesText.join('\n\n').trim();

    if (!combinedText) {
      throw new Error(
        'Unable to extract text from this PDF. Please use a text-based PDF or paste your resume manually.'
      );
    }

    return {
      text: combinedText,
      fileName: file.name,
      fileType: 'PDF',
      charCount: combinedText.length,
    };
  } catch (err) {
    if (err.message && err.message.includes('Unable to extract text')) {
      throw err;
    }
    console.error('PDF parsing error:', err);
    throw new Error(
      'Unable to extract text from this PDF. Please use a text-based PDF or paste your resume manually.'
    );
  }
}

/**
 * Extract text from DOCX document using mammoth
 */
async function extractFromDocx(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = (result.value || '').trim();

    if (!text) {
      throw new Error(
        'Unable to read this DOCX file. Please try another document or paste the resume text manually.'
      );
    }

    return {
      text,
      fileName: file.name,
      fileType: 'DOCX',
      charCount: text.length,
    };
  } catch (err) {
    if (err.message && err.message.includes('Unable to read this DOCX')) {
      throw err;
    }
    console.error('DOCX parsing error:', err);
    throw new Error(
      'Unable to read this DOCX file. Please try another document or paste the resume text manually.'
    );
  }
}

/**
 * Extract text from TXT document using native File API
 */
async function extractFromTxt(file) {
  try {
    const text = (await file.text()).trim();

    if (!text) {
      throw new Error(
        'The uploaded TXT file is empty. Please provide a resume with text content.'
      );
    }

    return {
      text,
      fileName: file.name,
      fileType: 'TXT',
      charCount: text.length,
    };
  } catch (err) {
    console.error('TXT parsing error:', err);
    throw new Error('Unable to read TXT file. Please paste your resume text manually.');
  }
}
