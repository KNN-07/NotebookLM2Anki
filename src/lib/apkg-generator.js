// NotebookLM2Anki - APKG Generator
// Client-side Anki package generation using genanki-js

import { generateId } from './utils.js';
import { getQuizModel, QUIZ_MODEL_ID, QUIZ_MODEL_NAME } from '../templates/quiz-model.js';
import { getFlashcardModel, FLASHCARD_MODEL_ID, FLASHCARD_MODEL_NAME } from '../templates/flashcard-model.js';

let SQL = null;
let isInitialized = false;

/**
 * Initialize SQL.js for database operations
 */
export async function initApkgGenerator() {
  if (isInitialized) return true;
  
  try {
    // Get the extension URL for vendor files
    const wasmUrl = chrome.runtime.getURL('vendor/sql-wasm.wasm');
    
    // Initialize SQL.js with WASM
    SQL = await initSqlJs({
      locateFile: file => chrome.runtime.getURL(`vendor/${file}`)
    });
    
    isInitialized = true;
    console.log("[NotebookLM2Anki] APKG generator initialized");
    return true;
  } catch (error) {
    console.error("[NotebookLM2Anki] Failed to initialize APKG generator:", error);
    return false;
  }
}

/**
 * Generate an APKG file from extracted data
 * @param {Object} data - Extracted data with quizzes and flashcards
 * @param {string} deckName - Name for the Anki deck
 * @returns {Promise<Blob>} The generated APKG file as a Blob
 */
export async function generateApkg(data, deckName = "NotebookLM Export") {
  if (!isInitialized) {
    const success = await initApkgGenerator();
    if (!success) {
      throw new Error("Failed to initialize APKG generator");
    }
  }
  
  const deckId = generateId();
  const deck = new Deck(deckId, deckName);
  
  // Add quiz cards
  if (data.quizzes && data.quizzes.length > 0) {
    const quizModel = new Model(getQuizModel());
    
    for (const quiz of data.quizzes) {
      const options = quiz.options || [];
      const fields = [
        quiz.question || "",
        quiz.hint || "",
        "", // ArchDiagram
        options[0]?.text || "",
        options[0]?.isCorrect ? "True" : "False",
        options[0]?.rationale || "",
        options[1]?.text || "",
        options[1]?.isCorrect ? "True" : "False",
        options[1]?.rationale || "",
        options[2]?.text || "",
        options[2]?.isCorrect ? "True" : "False",
        options[2]?.rationale || "",
        options[3]?.text || "",
        options[3]?.isCorrect ? "True" : "False",
        options[3]?.rationale || ""
      ];
      
      deck.addNote(quizModel.note(fields));
    }
  }
  
  // Add flashcards
  if (data.flashcards && data.flashcards.length > 0) {
    const flashcardModel = new Model(getFlashcardModel());
    
    for (const card of data.flashcards) {
      const fields = [card.front || "", card.back || ""];
      deck.addNote(flashcardModel.note(fields));
    }
  }
  
  // Create package and generate file
  const pkg = new Package();
  pkg.addDeck(deck);
  
  // Write to blob
  const blob = await pkg.writeToBlob();
  return blob;
}

/**
 * Download the generated APKG file
 * @param {Object} data - Extracted data
 * @param {string} deckName - Deck name
 */
export async function downloadApkg(data, deckName) {
  try {
    const blob = await generateApkg(data, deckName);
    const filename = `${deckName.replace(/[^a-z0-9]/gi, '_')}.apkg`;
    
    // Use FileSaver to download
    saveAs(blob, filename);
    
    const totalCards = (data.quizzes?.length || 0) + (data.flashcards?.length || 0);
    return { success: true, count: totalCards, filename };
  } catch (error) {
    console.error("[NotebookLM2Anki] APKG generation failed:", error);
    return { success: false, error: error.message };
  }
}
