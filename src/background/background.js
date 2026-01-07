// NotebookLM2Anki - Background Service Worker
// Handles AnkiConnect API calls and extension messaging

// Configuration
const CONFIG = {
  ANKI_CONNECT_URL: "http://127.0.0.1:8765",
  ANKI_CONNECT_VERSION: 6,
  DEFAULT_PARENT_DECK: "NotebookLM",
  DEFAULT_TAGS: ["notebooklm_export"]
};

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender)
    .then(sendResponse)
    .catch(error => sendResponse({ success: false, error: error.message }));
  
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender) {
  console.log("[NotebookLM2Anki] Background received:", request.action);
  
  switch (request.action) {
    case 'checkAnki':
      return await checkAnkiConnect();
    
    case 'sendToAnki':
      return await handleSendToAnki(request);
    
    case 'sendBatchToAnki':
      return await handleLegacySendBatch(request);
    
    case 'generateApkg':
      return await handleGenerateApkg(request);
    
    default:
      return { success: false, error: `Unknown action: ${request.action}` };
  }
}

// ==================== ANKICONNECT API ====================

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

async function checkAnkiConnect() {
  try {
    const version = await ankiRequest('version');
    return { connected: true, version };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

async function createDeck(deckName) {
  return await ankiRequest('createDeck', { deck: deckName });
}

async function modelExists(modelName) {
  const models = await ankiRequest('modelNames');
  return models.includes(modelName);
}

async function addNotes(notes) {
  return await ankiRequest('addNotes', { notes });
}

// ==================== NOTE TYPE TEMPLATES ====================

const QUIZ_STYLING = `html{overflow-y:scroll;overflow-x:hidden}body{margin:0;padding:0;width:100%;background-color:#1e1e1e;font-family:'Roboto','Segoe UI',sans-serif;color:#e3e3e3}.card{font-size:16px;line-height:1.6;text-align:left;background-color:#1e1e1e;min-height:100vh;display:flex;flex-direction:column}.main-wrapper{width:100%;min-height:100vh;box-sizing:border-box;display:flex}.mode-centered{justify-content:center}.mode-centered .quiz-column{width:100%;max-width:580px;margin:0 auto;padding:60px 20px}.quiz-column{display:flex;flex-direction:column;box-sizing:border-box;min-height:100vh;z-index:1}.question-text{font-size:1.35rem;font-weight:500;margin-bottom:30px;color:#ffffff;line-height:1.5}.hint-container{margin-bottom:30px}.hint-btn{background-color:#2d2d2d;border:1px solid #444746;border-radius:20px;padding:8px 16px;color:#a8c7fa;font-size:0.9rem;font-weight:500;display:inline-flex;align-items:center;gap:8px;cursor:pointer}.hint-text-box{margin-top:15px;background-color:#252525;border-left:4px solid #a8c7fa;padding:15px;color:#e3e3e3;display:none;border-radius:0 8px 8px 0}.options-list{display:flex;flex-direction:column;gap:15px;padding-bottom:100px}.option-block{background-color:#2d2d2d;border:1px solid #444746;border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:10px;cursor:pointer}.option-block:hover{background-color:#383838}.option-content{display:flex;align-items:flex-start;font-size:1.05rem}.option-letter{font-weight:bold;margin-right:15px;color:#a8c7fa;min-width:25px}.state-correct{border:2px solid #6dd58c!important;background-color:#252525!important}.state-wrong{border:2px solid #e87c7c!important;background-color:#252525!important}.state-dimmed{opacity:0.4;pointer-events:none}.feedback-section{margin-top:12px;display:none;padding-top:15px;border-top:1px solid #444}.thats-right{color:#6dd58c;font-weight:bold;display:flex;align-items:center;gap:10px;font-size:1.1rem;margin-bottom:8px}.not-quite{color:#e87c7c;font-weight:bold;display:flex;align-items:center;gap:10px;font-size:1.1rem;margin-bottom:8px}.rationale-text{color:#cccccc;margin-left:4px;line-height:1.6}.status-icon{width:24px;height:24px;min-width:24px;fill:currentColor;display:block}.latex-snippet{background-color:#383838;color:#e6b455;padding:2px 6px;border-radius:4px;font-family:'Consolas','Monaco',monospace;font-size:0.95em;border:1px solid #444}`;

const FLASHCARD_STYLING = `html{overflow-y:scroll;overflow-x:hidden}body{margin:0;padding:0;width:100%;background-color:#1e1e1e;font-family:'Roboto','Segoe UI',sans-serif;color:#e3e3e3}.card{font-size:18px;line-height:1.7;text-align:center;background-color:#1e1e1e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;box-sizing:border-box}.content{max-width:600px;width:100%}.front-text,.back-text{font-size:1.3rem;color:#ffffff}.back-text{color:#a8c7fa;margin-top:20px;padding-top:20px;border-top:1px solid #444}hr#answer{border:none;border-top:2px solid #444;margin:30px 0}.latex-snippet{background-color:#383838;color:#e6b455;padding:2px 6px;border-radius:4px;font-family:'Consolas','Monaco',monospace;font-size:0.95em;border:1px solid #444}code{background-color:#383838;color:#e6b455;padding:2px 6px;border-radius:4px;font-family:'Consolas','Monaco',monospace}`;

async function ensureQuizModel() {
  const modelName = "NotebookLM Quiz";
  const exists = await modelExists(modelName);
  if (exists) return true;
  
  try {
    await ankiRequest('createModel', {
      modelName: modelName,
      inOrderFields: ["Question", "Hint", "ArchDiagram", "Option1", "Flag1", "Rationale1", "Option2", "Flag2", "Rationale2", "Option3", "Flag3", "Rationale3", "Option4", "Flag4", "Rationale4"],
      css: QUIZ_STYLING,
      cardTemplates: [{
        Name: "Quiz Card",
        Front: "{{Question}}",
        Back: "{{Question}}<hr>{{#Option1}}A. {{Option1}} ({{Flag1}})<br>{{/Option1}}{{#Option2}}B. {{Option2}} ({{Flag2}})<br>{{/Option2}}{{#Option3}}C. {{Option3}} ({{Flag3}})<br>{{/Option3}}{{#Option4}}D. {{Option4}} ({{Flag4}}){{/Option4}}"
      }]
    });
    return true;
  } catch (error) {
    console.error("[NotebookLM2Anki] Failed to create quiz model:", error);
    return false;
  }
}

async function ensureFlashcardModel() {
  const modelName = "NotebookLM Flashcard";
  const exists = await modelExists(modelName);
  if (exists) return true;
  
  try {
    await ankiRequest('createModel', {
      modelName: modelName,
      inOrderFields: ["Front", "Back"],
      css: FLASHCARD_STYLING,
      cardTemplates: [{
        Name: "Flashcard",
        Front: "{{Front}}",
        Back: "{{FrontSide}}<hr id=answer>{{Back}}"
      }]
    });
    return true;
  } catch (error) {
    console.error("[NotebookLM2Anki] Failed to create flashcard model:", error);
    return false;
  }
}

// ==================== EXPORT HANDLERS ====================

async function handleSendToAnki(request) {
  const { data, deckName, type } = request;
  
  if (!data) {
    return { success: false, error: "No data provided" };
  }
  
  try {
    const name = deckName || data.title || "Unknown Notebook";
    
    switch (type) {
      case 'quizzes':
        if (!data.quizzes || data.quizzes.length === 0) {
          return { success: false, error: "No quizzes to send" };
        }
        return await sendQuizzesToAnki(data.quizzes, name);
      
      case 'flashcards':
        if (!data.flashcards || data.flashcards.length === 0) {
          return { success: false, error: "No flashcards to send" };
        }
        return await sendFlashcardsToAnki(data.flashcards, name);
      
      case 'all':
      default:
        return await sendAllToAnki(data, name);
    }
  } catch (error) {
    console.error("[NotebookLM2Anki] AnkiConnect error:", error);
    return { success: false, error: error.message };
  }
}

async function sendQuizzesToAnki(quizzes, deckName) {
  const targetDeck = `${CONFIG.DEFAULT_PARENT_DECK}::${deckName}`;
  
  await createDeck(targetDeck);
  await ensureQuizModel();
  
  const notes = quizzes.map(quiz => {
    const options = quiz.options || [];
    return {
      deckName: targetDeck,
      modelName: "NotebookLM Quiz",
      fields: {
        Question: quiz.question || "",
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
      },
      tags: CONFIG.DEFAULT_TAGS
    };
  });
  
  const results = await addNotes(notes);
  const successCount = results.filter(id => id !== null).length;
  
  return { success: true, count: successCount, total: notes.length };
}

async function sendFlashcardsToAnki(flashcards, deckName) {
  const targetDeck = `${CONFIG.DEFAULT_PARENT_DECK}::${deckName}`;
  
  await createDeck(targetDeck);
  await ensureFlashcardModel();
  
  const notes = flashcards.map(card => ({
    deckName: targetDeck,
    modelName: "NotebookLM Flashcard",
    fields: {
      Front: card.front || "",
      Back: card.back || ""
    },
    tags: CONFIG.DEFAULT_TAGS
  }));
  
  const results = await addNotes(notes);
  const successCount = results.filter(id => id !== null).length;
  
  return { success: true, count: successCount, total: notes.length };
}

async function sendAllToAnki(data, deckName) {
  let totalSuccess = 0;
  let totalCards = 0;
  
  if (data.quizzes && data.quizzes.length > 0) {
    const result = await sendQuizzesToAnki(data.quizzes, deckName);
    totalSuccess += result.count;
    totalCards += data.quizzes.length;
  }
  
  if (data.flashcards && data.flashcards.length > 0) {
    const result = await sendFlashcardsToAnki(data.flashcards, deckName);
    totalSuccess += result.count;
    totalCards += data.flashcards.length;
  }
  
  return { success: true, count: totalSuccess, total: totalCards };
}

// Legacy handler for backwards compatibility
async function handleLegacySendBatch(request) {
  const { batchData, deckTitle } = request;
  
  if (!batchData || !Array.isArray(batchData)) {
    return { success: false, error: "No batch data provided" };
  }
  
  try {
    const targetDeck = `${CONFIG.DEFAULT_PARENT_DECK}::${deckTitle || 'Default Notebook'}`;
    
    await createDeck(targetDeck);
    await ensureQuizModel();
    
    const notes = batchData.map(card => ({
      deckName: targetDeck,
      modelName: "NotebookLM Quiz",
      fields: {
        Question: card.question || "",
        Hint: card.hint || "",
        ArchDiagram: "",
        Option1: card.option1 || "",
        Flag1: card.flag1 || "False",
        Rationale1: card.rationale1 || "",
        Option2: card.option2 || "",
        Flag2: card.flag2 || "False",
        Rationale2: card.rationale2 || "",
        Option3: card.option3 || "",
        Flag3: card.flag3 || "False",
        Rationale3: card.rationale3 || "",
        Option4: card.option4 || "",
        Flag4: card.flag4 || "False",
        Rationale4: card.rationale4 || ""
      },
      tags: CONFIG.DEFAULT_TAGS
    }));
    
    const results = await addNotes(notes);
    const successCount = results.filter(id => id !== null).length;
    
    if (successCount === 0 && notes.length > 0) {
      return { success: false, error: "0 Cards Added. Check if 'NotebookLM Quiz' Note Type exists!" };
    }
    
    return { success: true, count: successCount };
  } catch (error) {
    return { success: false, error: "Connection Failed: Is Anki open?" };
  }
}

// Log when service worker starts
console.log("[NotebookLM2Anki] Background service worker started");

// ==================== OFFSCREEN DOCUMENT FOR APKG ====================

let creatingOffscreen = null;

async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('src/offscreen/offscreen.html');
  
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreen) {
    await creatingOffscreen;
  } else {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['DOM_SCRAPING'],
      justification: 'Generate APKG files using sql.js WebAssembly'
    });
    await creatingOffscreen;
    creatingOffscreen = null;
  }
}

async function handleGenerateApkg(request) {
  try {
    await setupOffscreenDocument();
    
    const response = await chrome.runtime.sendMessage({
      action: 'generateApkg',
      data: request.data,
      deckName: request.deckName
    });
    
    return response;
  } catch (error) {
    console.error("[NotebookLM2Anki] APKG generation error:", error);
    return { success: false, error: error.message };
  }
}
