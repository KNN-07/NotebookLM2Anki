// NotebookLM2Anki - Popup Script
// Handles popup UI interactions and export actions

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const quizCount = document.getElementById('quiz-count');
  const flashcardCount = document.getElementById('flashcard-count');
  const contentInfo = document.getElementById('content-info');
  const noContent = document.getElementById('no-content');
  const deckNameInput = document.getElementById('deck-name');
  const messageEl = document.getElementById('message');
  
  // Buttons
  const btnAnkiConnect = document.getElementById('btn-anki-connect');
  const btnApkg = document.getElementById('btn-apkg');
  const btnCsvAll = document.getElementById('btn-csv-all');
  const btnCsvDropdown = document.getElementById('btn-csv-dropdown');
  const csvMenu = document.getElementById('csv-menu');
  const btnCsvQuizzes = document.getElementById('btn-csv-quizzes');
  const btnCsvFlashcards = document.getElementById('btn-csv-flashcards');
  const btnCsvHeaderless = document.getElementById('btn-csv-all-headerless');

  // State
  let extractedData = null;
  let ankiConnected = false;

  // ==================== INITIALIZATION ====================
  
  // Check AnkiConnect status
  checkAnkiStatus();
  
  // Extract data from current page
  extractDataFromPage();

  // ==================== ANKI STATUS ====================
  
  async function checkAnkiStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAnki' });
      if (response && response.connected) {
        ankiConnected = true;
        statusIndicator.className = 'status connected';
        statusText.textContent = 'Anki Connected';
      } else {
        ankiConnected = false;
        statusIndicator.className = 'status disconnected';
        statusText.textContent = 'Anki Not Found';
      }
    } catch (error) {
      ankiConnected = false;
      statusIndicator.className = 'status disconnected';
      statusText.textContent = 'Connection Error';
    }
    updateButtonStates();
  }

  // ==================== DATA EXTRACTION ====================
  
  async function extractDataFromPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('notebooklm.google.com')) {
        showNoContent();
        return;
      }

      // Execute extraction script in all frames
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: extractFromPageContext
      });

      // Find the result with data
      for (const result of results) {
        if (result.result && (result.result.quizzes?.length > 0 || result.result.flashcards?.length > 0)) {
          extractedData = result.result;
          break;
        }
      }

      if (extractedData) {
        updateContentDisplay();
      } else {
        showNoContent();
      }
    } catch (error) {
      console.error('[NotebookLM2Anki] Extraction error:', error);
      showNoContent();
    }
  }

  function extractFromPageContext() {
    const appRoot = document.querySelector('[data-app-data]');
    if (!appRoot) return null;
    
    const jsonString = appRoot.getAttribute('data-app-data');
    if (!jsonString) return null;
    
    try {
      // Unescape HTML entities
      const cleanJson = jsonString
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
      
      const data = JSON.parse(cleanJson);
      
      // Extract title
      let title = data.title || 'Unknown Notebook';
      const titleInput = document.querySelector('input[placeholder="Notebook title"]');
      if (titleInput && titleInput.value) {
        title = titleInput.value.trim();
      }
      title = title.replace(/::/g, ' - ').trim();
      
      // Extract quizzes
      const quizData = data.quiz || (data.mostRecentQuery && data.mostRecentQuery.quiz) || [];
      const quizzes = Array.isArray(quizData) ? quizData.map(q => ({
        type: 'quiz',
        question: q.question || '',
        hint: q.hint || '',
        options: (q.answerOptions || []).map(opt => ({
          text: opt.text || '',
          isCorrect: !!opt.isCorrect,
          rationale: opt.rationale || ''
        }))
      })) : [];
      
      // Extract flashcards
      const flashcardData = data.flashcards || [];
      const flashcards = Array.isArray(flashcardData) ? flashcardData.map(card => ({
        type: 'flashcard',
        front: card.f || '',
        back: card.b || ''
      })) : [];
      
      return { title, quizzes, flashcards };
    } catch (e) {
      console.error('Parse error:', e);
      return null;
    }
  }

  function updateContentDisplay() {
    const numQuizzes = extractedData.quizzes?.length || 0;
    const numFlashcards = extractedData.flashcards?.length || 0;
    
    quizCount.textContent = `${numQuizzes} Quiz Question${numQuizzes !== 1 ? 's' : ''}`;
    flashcardCount.textContent = `${numFlashcards} Flashcard${numFlashcards !== 1 ? 's' : ''}`;
    
    deckNameInput.value = extractedData.title || '';
    
    contentInfo.classList.remove('hidden');
    noContent.classList.add('hidden');
    
    updateButtonStates();
  }

  function showNoContent() {
    contentInfo.classList.add('hidden');
    noContent.classList.remove('hidden');
    updateButtonStates();
  }

  function updateButtonStates() {
    const hasContent = extractedData && 
      ((extractedData.quizzes?.length || 0) > 0 || (extractedData.flashcards?.length || 0) > 0);
    
    btnAnkiConnect.disabled = !hasContent || !ankiConnected;
    btnApkg.disabled = !hasContent;
    btnCsvAll.disabled = !hasContent;
    btnCsvDropdown.disabled = !hasContent;
  }

  // ==================== EXPORT FUNCTIONS ====================
  
  function getDeckName() {
    return deckNameInput.value.trim() || extractedData?.title || 'NotebookLM Export';
  }

  function showMessage(text, type = 'info') {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove('hidden');
    
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 5000);
  }

  // Send to AnkiConnect
  btnAnkiConnect.addEventListener('click', async () => {
    if (!extractedData) return;
    
    btnAnkiConnect.disabled = true;
    btnAnkiConnect.innerHTML = '<span class="btn-icon">⏳</span> Sending...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'sendToAnki',
        data: extractedData,
        deckName: getDeckName(),
        type: 'all'
      });
      
      if (response && response.success) {
        showMessage(`✅ Sent ${response.count} cards to Anki!`, 'success');
      } else {
        showMessage(`❌ ${response?.error || 'Failed to send to Anki'}`, 'error');
      }
    } catch (error) {
      showMessage(`❌ ${error.message}`, 'error');
    } finally {
      btnAnkiConnect.disabled = false;
      btnAnkiConnect.innerHTML = '<span class="btn-icon">⚡</span> Send to Anki';
      updateButtonStates();
    }
  });

  // Download APKG
  btnApkg.addEventListener('click', async () => {
    if (!extractedData) return;
    
    btnApkg.disabled = true;
    btnApkg.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject vendor scripts and generate APKG
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['vendor/sql.js', 'vendor/jszip.min.js', 'vendor/FileSaver.min.js', 'vendor/genanki.js']
      });
      
      const deckName = getDeckName();
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: generateApkgInPage,
        args: [extractedData, deckName]
      });
      
      showMessage(`✅ Downloaded ${deckName}.apkg`, 'success');
    } catch (error) {
      console.error('[NotebookLM2Anki] APKG error:', error);
      showMessage(`❌ ${error.message}`, 'error');
    } finally {
      btnApkg.disabled = false;
      btnApkg.innerHTML = '<span class="btn-icon">📦</span> Download .apkg';
      updateButtonStates();
    }
  });

  // CSV Export Functions
  function exportCSV(type, includeHeader = true) {
    if (!extractedData) return;
    
    const deckName = getDeckName().replace(/[^a-z0-9]/gi, '_');
    
    if (type === 'quizzes' || type === 'all') {
      if (extractedData.quizzes?.length > 0) {
        const csv = quizzesToCSV(extractedData.quizzes, includeHeader);
        downloadCSV(csv, `${deckName}-quizzes.csv`);
      }
    }
    
    if (type === 'flashcards' || type === 'all') {
      if (extractedData.flashcards?.length > 0) {
        const csv = flashcardsToCSV(extractedData.flashcards, includeHeader);
        downloadCSV(csv, `${deckName}-flashcards.csv`);
      }
    }
    
    showMessage('✅ CSV downloaded!', 'success');
  }

  function quizzesToCSV(quizzes, includeHeader) {
    const headers = ['Question', 'Hint', 'Option1', 'Flag1', 'Rationale1', 'Option2', 'Flag2', 'Rationale2', 'Option3', 'Flag3', 'Rationale3', 'Option4', 'Flag4', 'Rationale4'];
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
    
    return csv;
  }

  function flashcardsToCSV(flashcards, includeHeader) {
    let csv = includeHeader ? 'Front,Back\n' : '';
    
    for (const card of flashcards) {
      csv += `${escapeCSV(card.front)},${escapeCSV(card.back)}\n`;
    }
    
    return csv;
  }

  function escapeCSV(value) {
    if (!value) return '""';
    const escaped = String(value).replace(/"/g, '""');
    return `"${escaped}"`;
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // CSV button event listeners
  btnCsvAll.addEventListener('click', () => exportCSV('all', true));
  
  btnCsvDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    csvMenu.classList.toggle('hidden');
  });
  
  btnCsvQuizzes.addEventListener('click', () => {
    exportCSV('quizzes', true);
    csvMenu.classList.add('hidden');
  });
  
  btnCsvFlashcards.addEventListener('click', () => {
    exportCSV('flashcards', true);
    csvMenu.classList.add('hidden');
  });
  
  btnCsvHeaderless.addEventListener('click', () => {
    exportCSV('all', false);
    csvMenu.classList.add('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    csvMenu.classList.add('hidden');
  });

  // APKG generation function to inject into page
  function generateApkgInPage(data, deckName) {
    return new Promise(async (resolve, reject) => {
      try {
        // Wait for SQL.js to initialize
        const SQL = await initSqlJs({
          locateFile: file => chrome.runtime.getURL(`vendor/${file}`)
        });
        
        const deckId = Math.floor(Math.random() * (2 ** 31 - 2 ** 30) + 2 ** 30);
        const deck = new Deck(deckId, deckName);
        
        // Create quiz model
        const quizModel = new Model({
          name: "NotebookLM Quiz",
          id: "1609234567890",
          flds: [
            { name: "Question" }, { name: "Hint" }, { name: "ArchDiagram" },
            { name: "Option1" }, { name: "Flag1" }, { name: "Rationale1" },
            { name: "Option2" }, { name: "Flag2" }, { name: "Rationale2" },
            { name: "Option3" }, { name: "Flag3" }, { name: "Rationale3" },
            { name: "Option4" }, { name: "Flag4" }, { name: "Rationale4" }
          ],
          req: [[0, "all", [0]]],
          tmpls: [{
            name: "Quiz Card",
            qfmt: "{{Question}}",
            afmt: "{{Question}}<hr>{{Option1}} {{Flag1}}"
          }]
        });
        
        // Create flashcard model
        const flashcardModel = new Model({
          name: "NotebookLM Flashcard",
          id: "1609234567891",
          flds: [{ name: "Front" }, { name: "Back" }],
          req: [[0, "all", [0]]],
          tmpls: [{
            name: "Flashcard",
            qfmt: "{{Front}}",
            afmt: "{{FrontSide}}<hr>{{Back}}"
          }]
        });
        
        // Add quizzes
        if (data.quizzes) {
          for (const quiz of data.quizzes) {
            const options = quiz.options || [];
            const fields = [
              quiz.question || "", quiz.hint || "", "",
              options[0]?.text || "", options[0]?.isCorrect ? "True" : "False", options[0]?.rationale || "",
              options[1]?.text || "", options[1]?.isCorrect ? "True" : "False", options[1]?.rationale || "",
              options[2]?.text || "", options[2]?.isCorrect ? "True" : "False", options[2]?.rationale || "",
              options[3]?.text || "", options[3]?.isCorrect ? "True" : "False", options[3]?.rationale || ""
            ];
            deck.addNote(quizModel.note(fields));
          }
        }
        
        // Add flashcards
        if (data.flashcards) {
          for (const card of data.flashcards) {
            deck.addNote(flashcardModel.note([card.front || "", card.back || ""]));
          }
        }
        
        // Generate package
        const pkg = new Package();
        pkg.addDeck(deck);
        pkg.writeToFile(`${deckName.replace(/[^a-z0-9]/gi, '_')}.apkg`);
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }
});
