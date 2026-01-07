// NotebookLM2Anki - Constants
// Shared configuration and constants

export const CONFIG = {
  // UI Configuration
  BUTTON_ID: "notebooklm-to-anki-btn",
  ANCHOR_SELECTORS: [
    'button[aria-label="Good content rating"]',
    'button[aria-label="Copy"]',
    'button[aria-label="Download"]'
  ],
  
  // AnkiConnect Configuration
  ANKI_CONNECT_URL: "http://127.0.0.1:8765",
  ANKI_CONNECT_VERSION: 6,
  
  // Default Deck Configuration
  DEFAULT_PARENT_DECK: "NotebookLM",
  DEFAULT_QUIZ_NOTE_TYPE: "NotebookLM Quiz",
  DEFAULT_FLASHCARD_NOTE_TYPE: "NotebookLM Flashcard",
  
  // Export tags
  DEFAULT_TAGS: ["notebooklm_export"]
};

// Quiz Note Type Fields (15 fields for MCQ)
export const QUIZ_FIELDS = [
  "Question",
  "Hint",
  "ArchDiagram",
  "Option1", "Flag1", "Rationale1",
  "Option2", "Flag2", "Rationale2",
  "Option3", "Flag3", "Rationale3",
  "Option4", "Flag4", "Rationale4"
];

// Flashcard Note Type Fields (2 fields)
export const FLASHCARD_FIELDS = [
  "Front",
  "Back"
];

// Message Actions
export const ACTIONS = {
  // Miner -> Parent
  MINER_READY: "ANKI_MINER_READY",
  REAL_SUCCESS: "ANKI_REAL_SUCCESS",
  REAL_FAIL: "ANKI_REAL_FAIL",
  
  // Parent -> Miner
  TRIGGER_EXTRACT: "ANKI_TRIGGER_EXTRACT",
  
  // Content -> Background
  SEND_TO_ANKI: "sendToAnki",
  EXPORT_APKG: "exportApkg",
  EXPORT_CSV: "exportCsv",
  GET_DATA: "getData",
  CHECK_ANKI: "checkAnki"
};

// Export formats
export const EXPORT_FORMATS = {
  ANKI_CONNECT: "ankiconnect",
  APKG: "apkg",
  CSV: "csv"
};
