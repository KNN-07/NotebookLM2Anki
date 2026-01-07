// NotebookLM2Anki - CSV Exporter
// Exports quizzes and flashcards to CSV format

import { escapeCSV, downloadFile } from './utils.js';

/**
 * Export flashcards to CSV format
 * @param {Array} flashcards - Array of flashcard objects
 * @param {Object} options - Export options
 */
export function exportFlashcardsToCSV(flashcards, options = {}) {
  const { includeHeader = true, filename = 'notebooklm-flashcards.csv' } = options;
  
  let csv = includeHeader ? 'Front,Back\n' : '';
  
  for (const card of flashcards) {
    const front = escapeCSV(card.front);
    const back = escapeCSV(card.back);
    csv += `${front},${back}\n`;
  }
  
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  return { success: true, count: flashcards.length };
}

/**
 * Export quizzes to CSV format
 * @param {Array} quizzes - Array of quiz objects
 * @param {Object} options - Export options
 */
export function exportQuizzesToCSV(quizzes, options = {}) {
  const { includeHeader = true, filename = 'notebooklm-quizzes.csv' } = options;
  
  const headers = [
    'Question', 'Hint',
    'Option1', 'Flag1', 'Rationale1',
    'Option2', 'Flag2', 'Rationale2',
    'Option3', 'Flag3', 'Rationale3',
    'Option4', 'Flag4', 'Rationale4'
  ];
  
  let csv = includeHeader ? headers.join(',') + '\n' : '';
  
  for (const quiz of quizzes) {
    const options = quiz.options || [];
    const row = [
      escapeCSV(quiz.question),
      escapeCSV(quiz.hint || ''),
      escapeCSV(options[0]?.text || ''),
      escapeCSV(options[0]?.isCorrect ? 'True' : 'False'),
      escapeCSV(options[0]?.rationale || ''),
      escapeCSV(options[1]?.text || ''),
      escapeCSV(options[1]?.isCorrect ? 'True' : 'False'),
      escapeCSV(options[1]?.rationale || ''),
      escapeCSV(options[2]?.text || ''),
      escapeCSV(options[2]?.isCorrect ? 'True' : 'False'),
      escapeCSV(options[2]?.rationale || ''),
      escapeCSV(options[3]?.text || ''),
      escapeCSV(options[3]?.isCorrect ? 'True' : 'False'),
      escapeCSV(options[3]?.rationale || '')
    ];
    csv += row.join(',') + '\n';
  }
  
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  return { success: true, count: quizzes.length };
}

/**
 * Export all content (quizzes + flashcards) to separate CSV files
 * @param {Object} data - Extracted data with quizzes and flashcards
 * @param {Object} options - Export options
 */
export function exportAllToCSV(data, options = {}) {
  const results = { quizzes: null, flashcards: null };
  
  if (data.quizzes && data.quizzes.length > 0) {
    const quizFilename = `${data.title || 'notebooklm'}-quizzes.csv`;
    results.quizzes = exportQuizzesToCSV(data.quizzes, { 
      ...options, 
      filename: quizFilename 
    });
  }
  
  if (data.flashcards && data.flashcards.length > 0) {
    const flashcardFilename = `${data.title || 'notebooklm'}-flashcards.csv`;
    results.flashcards = exportFlashcardsToCSV(data.flashcards, { 
      ...options, 
      filename: flashcardFilename 
    });
  }
  
  return results;
}
