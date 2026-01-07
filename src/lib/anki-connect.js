// NotebookLM2Anki - AnkiConnect API
// Handles communication with local Anki instance via AnkiConnect

import { CONFIG, QUIZ_FIELDS, FLASHCARD_FIELDS } from './constants.js';
import { cleanMath } from './utils.js';
import { 
  QUIZ_MODEL_NAME, QUIZ_MODEL_ID, QUIZ_FIELDS as QUIZ_MODEL_FIELDS,
  QUIZ_FRONT_TEMPLATE, QUIZ_BACK_TEMPLATE, QUIZ_STYLING 
} from '../templates/quiz-model.js';
import { 
  FLASHCARD_MODEL_NAME, FLASHCARD_MODEL_ID, FLASHCARD_FIELDS as FLASHCARD_MODEL_FIELDS,
  FLASHCARD_FRONT_TEMPLATE, FLASHCARD_BACK_TEMPLATE, FLASHCARD_STYLING 
} from '../templates/flashcard-model.js';

/**
 * Make an AnkiConnect API request
 */
async function ankiRequest(action, params = {}) {
  const response = await fetch(CONFIG.ANKI_CONNECT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action,
      version: CONFIG.ANKI_CONNECT_VERSION,
      params
    })
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.result;
}

/**
 * Check if AnkiConnect is available
 */
export async function checkAnkiConnect() {
  try {
    const version = await ankiRequest('version');
    return { connected: true, version };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Create a deck if it doesn't exist
 */
export async function createDeck(deckName) {
  return await ankiRequest('createDeck', { deck: deckName });
}

/**
 * Check if a model (note type) exists
 */
export async function modelExists(modelName) {
  const models = await ankiRequest('modelNames');
  return models.includes(modelName);
}

/**
 * Create the Quiz note type if it doesn't exist
 */
export async function ensureQuizModel() {
  const exists = await modelExists(QUIZ_MODEL_NAME);
  if (exists) return true;
  
  try {
    await ankiRequest('createModel', {
      modelName: QUIZ_MODEL_NAME,
      inOrderFields: QUIZ_MODEL_FIELDS.map(f => f.name),
      css: QUIZ_STYLING,
      cardTemplates: [
        {
          Name: "Quiz Card",
          Front: QUIZ_FRONT_TEMPLATE,
          Back: QUIZ_BACK_TEMPLATE
        }
      ]
    });
    return true;
  } catch (error) {
    console.error("[NotebookLM2Anki] Failed to create quiz model:", error);
    return false;
  }
}

/**
 * Create the Flashcard note type if it doesn't exist
 */
export async function ensureFlashcardModel() {
  const exists = await modelExists(FLASHCARD_MODEL_NAME);
  if (exists) return true;
  
  try {
    await ankiRequest('createModel', {
      modelName: FLASHCARD_MODEL_NAME,
      inOrderFields: FLASHCARD_MODEL_FIELDS.map(f => f.name),
      css: FLASHCARD_STYLING,
      cardTemplates: [
        {
          Name: "Flashcard",
          Front: FLASHCARD_FRONT_TEMPLATE,
          Back: FLASHCARD_BACK_TEMPLATE
        }
      ]
    });
    return true;
  } catch (error) {
    console.error("[NotebookLM2Anki] Failed to create flashcard model:", error);
    return false;
  }
}

/**
 * Add notes to Anki
 */
export async function addNotes(notes) {
  return await ankiRequest('addNotes', { notes });
}

/**
 * Send quizzes to Anki
 */
export async function sendQuizzesToAnki(quizzes, deckName) {
  const targetDeck = `${CONFIG.DEFAULT_PARENT_DECK}::${deckName}`;
  
  // Ensure deck and model exist
  await createDeck(targetDeck);
  await ensureQuizModel();
  
  // Build notes
  const notes = quizzes.map(quiz => {
    const options = quiz.options || [];
    return {
      deckName: targetDeck,
      modelName: QUIZ_MODEL_NAME,
      fields: {
        Question: cleanMath(quiz.question || ""),
        Hint: cleanMath(quiz.hint || ""),
        ArchDiagram: "",
        Option1: cleanMath(options[0]?.text || ""),
        Flag1: options[0]?.isCorrect ? "True" : "False",
        Rationale1: cleanMath(options[0]?.rationale || ""),
        Option2: cleanMath(options[1]?.text || ""),
        Flag2: options[1]?.isCorrect ? "True" : "False",
        Rationale2: cleanMath(options[1]?.rationale || ""),
        Option3: cleanMath(options[2]?.text || ""),
        Flag3: options[2]?.isCorrect ? "True" : "False",
        Rationale3: cleanMath(options[2]?.rationale || ""),
        Option4: cleanMath(options[3]?.text || ""),
        Flag4: options[3]?.isCorrect ? "True" : "False",
        Rationale4: cleanMath(options[3]?.rationale || "")
      },
      tags: CONFIG.DEFAULT_TAGS
    };
  });
  
  const results = await addNotes(notes);
  const successCount = results.filter(id => id !== null).length;
  
  return { success: true, count: successCount, total: notes.length };
}

/**
 * Send flashcards to Anki
 */
export async function sendFlashcardsToAnki(flashcards, deckName) {
  const targetDeck = `${CONFIG.DEFAULT_PARENT_DECK}::${deckName}`;
  
  // Ensure deck and model exist
  await createDeck(targetDeck);
  await ensureFlashcardModel();
  
  // Build notes
  const notes = flashcards.map(card => ({
    deckName: targetDeck,
    modelName: FLASHCARD_MODEL_NAME,
    fields: {
      Front: cleanMath(card.front || ""),
      Back: cleanMath(card.back || "")
    },
    tags: CONFIG.DEFAULT_TAGS
  }));
  
  const results = await addNotes(notes);
  const successCount = results.filter(id => id !== null).length;
  
  return { success: true, count: successCount, total: notes.length };
}

/**
 * Send all content to Anki
 */
export async function sendAllToAnki(data, deckName) {
  const results = { quizzes: null, flashcards: null };
  
  if (data.quizzes && data.quizzes.length > 0) {
    results.quizzes = await sendQuizzesToAnki(data.quizzes, deckName);
  }
  
  if (data.flashcards && data.flashcards.length > 0) {
    results.flashcards = await sendFlashcardsToAnki(data.flashcards, deckName);
  }
  
  const totalSuccess = (results.quizzes?.count || 0) + (results.flashcards?.count || 0);
  const totalCards = (data.quizzes?.length || 0) + (data.flashcards?.length || 0);
  
  return { 
    success: true, 
    count: totalSuccess, 
    total: totalCards,
    details: results 
  };
}
