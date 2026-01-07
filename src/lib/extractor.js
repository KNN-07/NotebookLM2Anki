// NotebookLM2Anki - Data Extractor
// Extracts quiz and flashcard data from NotebookLM's data-app-data attribute

import { unescapeHtml, parseAppData, sanitizeDeckName } from './utils.js';

/**
 * Extract all content from the page's data-app-data
 * @returns {Object|null} Extracted data with quizzes and flashcards
 */
export function extractFromPage() {
  // Try multiple selectors for the app data element
  const appRoot = document.querySelector('[data-app-data]') || 
                  document.querySelector('app-root[data-app-data]');
  
  if (!appRoot) {
    console.log("[NotebookLM2Anki] No data-app-data element found");
    return null;
  }
  
  const jsonString = appRoot.getAttribute('data-app-data');
  if (!jsonString) {
    console.log("[NotebookLM2Anki] data-app-data attribute is empty");
    return null;
  }
  
  const data = parseAppData(jsonString);
  if (!data) {
    return null;
  }
  
  const title = sanitizeDeckName(data.title || getNotebookTitleFromPage());
  
  return {
    title: title,
    quizzes: extractQuizzes(data),
    flashcards: extractFlashcards(data),
    extractedAt: new Date().toISOString()
  };
}

/**
 * Try to get notebook title from page DOM
 */
function getNotebookTitleFromPage() {
  // Try input field
  const input = document.querySelector('input[placeholder="Notebook title"]');
  if (input && input.value) return input.value.trim();
  
  // Try title label
  const label = document.querySelector('.title-label');
  if (label && label.textContent) return label.textContent.trim();
  
  // Try document title
  if (document.title && document.title.includes("- NotebookLM")) {
    return document.title.replace("- NotebookLM", "").trim();
  }
  
  return "Unknown Notebook";
}

/**
 * Extract quiz questions from data
 */
function extractQuizzes(data) {
  // Quiz data can be in different locations
  const quizData = data.quiz || 
                   (data.mostRecentQuery && data.mostRecentQuery.quiz) ||
                   [];
  
  if (!Array.isArray(quizData) || quizData.length === 0) {
    return [];
  }
  
  return quizData.map(q => ({
    type: 'quiz',
    question: q.question || "",
    hint: q.hint || "",
    options: (q.answerOptions || []).map((opt, idx) => ({
      text: opt.text || "",
      isCorrect: !!opt.isCorrect,
      rationale: opt.rationale || ""
    }))
  }));
}

/**
 * Extract flashcards from data
 */
function extractFlashcards(data) {
  const flashcards = data.flashcards || [];
  
  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    return [];
  }
  
  return flashcards.map(card => ({
    type: 'flashcard',
    front: card.f || "",
    back: card.b || ""
  }));
}

/**
 * Convert quiz to Anki-compatible format (15 fields)
 */
export function quizToAnkiFields(quiz) {
  const options = quiz.options || [];
  
  return {
    Question: quiz.question,
    Hint: quiz.hint || "",
    ArchDiagram: "",
    Option1: options[0]?.text || "",
    Flag1: options[0]?.isCorrect ? "True" : "False",
    Rationale1: options[0]?.rationale || "",
    Option2: options[1]?.text || "",
    Flag2: options[1]?.isCorrect ? "True" : "False",
    Rationale2: options[1]?.rationale || "",
    Option3: options[2]?.text || "",
    Flag3: options[2]?.isCorrect ? "True" : "False",
    Rationale3: options[2]?.rationale || "",
    Option4: options[3]?.text || "",
    Flag4: options[3]?.isCorrect ? "True" : "False",
    Rationale4: options[3]?.rationale || ""
  };
}

/**
 * Convert flashcard to Anki-compatible format (2 fields)
 */
export function flashcardToAnkiFields(flashcard) {
  return {
    Front: flashcard.front,
    Back: flashcard.back
  };
}
