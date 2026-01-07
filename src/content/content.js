// NotebookLM2Anki - Content Script
// Main content script that orchestrates data extraction and UI injection

(function() {
  'use strict';
  
  // ==================== CONFIGURATION ====================
  const CONFIG = {
    BUTTON_ID: "notebooklm-to-anki-btn",
    ANCHOR_SELECTORS: [
      'button[aria-label="Good content rating"]',
      'button[aria-label="Copy"]',
      'button[aria-label="Download"]'
    ]
  };

  // ==================== UTILITY FUNCTIONS ====================
  function unescapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
  }

  function sanitizeDeckName(name) {
    if (!name) return "Unknown Notebook";
    return name.replace(/::/g, " - ").trim();
  }

  // ==================== DATA EXTRACTION ====================
  function extractFromPage() {
    const appRoot = document.querySelector('[data-app-data]');
    if (!appRoot) return null;
    
    const jsonString = appRoot.getAttribute('data-app-data');
    if (!jsonString) return null;
    
    try {
      const cleanJson = unescapeHtml(jsonString);
      const data = JSON.parse(cleanJson);
      
      return {
        title: sanitizeDeckName(data.title || getNotebookTitleFromPage()),
        quizzes: extractQuizzes(data),
        flashcards: extractFlashcards(data),
        extractedAt: new Date().toISOString()
      };
    } catch (e) {
      console.error("[NotebookLM2Anki] Parse error:", e);
      return null;
    }
  }

  function getNotebookTitleFromPage() {
    const input = document.querySelector('input[placeholder="Notebook title"]');
    if (input && input.value) return input.value.trim();
    
    const label = document.querySelector('.title-label');
    if (label && label.textContent) return label.textContent.trim();
    
    if (document.title && document.title.includes("- NotebookLM")) {
      return document.title.replace("- NotebookLM", "").trim();
    }
    
    return "Unknown Notebook";
  }

  function extractQuizzes(data) {
    const quizData = data.quiz || (data.mostRecentQuery && data.mostRecentQuery.quiz) || [];
    if (!Array.isArray(quizData)) return [];
    
    return quizData.map(q => ({
      type: 'quiz',
      question: q.question || "",
      hint: q.hint || "",
      options: (q.answerOptions || []).map(opt => ({
        text: opt.text || "",
        isCorrect: !!opt.isCorrect,
        rationale: opt.rationale || ""
      }))
    }));
  }

  function extractFlashcards(data) {
    const flashcards = data.flashcards || [];
    if (!Array.isArray(flashcards)) return [];
    
    return flashcards.map(card => ({
      type: 'flashcard',
      front: card.f || "",
      back: card.b || ""
    }));
  }

  // ==================== DATA MINER (for iframes) ====================
  let isMinerConnected = false;

  function initDataMiner() {
    const appRoot = document.querySelector('[data-app-data]');
    if (appRoot) {
      console.log("[NotebookLM2Anki] ⛏️ Miner Ready");
      window.top.postMessage({ action: "ANKI_MINER_READY" }, "*");
      
      window.addEventListener("message", (event) => {
        if (event.data.action === "ANKI_TRIGGER_EXTRACT") {
          const data = extractFromPage();
          
          if (!data || (data.quizzes.length === 0 && data.flashcards.length === 0)) {
            window.top.postMessage({ 
              action: "ANKI_REAL_FAIL", 
              error: "No content found (0 quizzes, 0 flashcards)" 
            }, "*");
            return;
          }

          const customTitle = event.data.notebookTitle || data.title;
          
          // Convert to legacy format for background script
          if (data.quizzes.length > 0) {
            const batchData = data.quizzes.map(q => ({
              question: q.question,
              hint: q.hint,
              option1: q.options[0]?.text || "",
              flag1: q.options[0]?.isCorrect ? "True" : "False",
              rationale1: q.options[0]?.rationale || "",
              option2: q.options[1]?.text || "",
              flag2: q.options[1]?.isCorrect ? "True" : "False",
              rationale2: q.options[1]?.rationale || "",
              option3: q.options[2]?.text || "",
              flag3: q.options[2]?.isCorrect ? "True" : "False",
              rationale3: q.options[2]?.rationale || "",
              option4: q.options[3]?.text || "",
              flag4: q.options[3]?.isCorrect ? "True" : "False",
              rationale4: q.options[3]?.rationale || ""
            }));
            
            chrome.runtime.sendMessage({
              action: "sendBatchToAnki",
              batchData: batchData,
              deckTitle: customTitle
            }, (res) => {
              if (res && res.success) {
                window.top.postMessage({ 
                  action: "ANKI_REAL_SUCCESS", 
                  count: batchData.length, 
                  deck: customTitle,
                  type: "quizzes"
                }, "*");
              } else {
                window.top.postMessage({ 
                  action: "ANKI_REAL_FAIL", 
                  error: res ? res.error : "Unknown Error" 
                }, "*");
              }
            });
          } else if (data.flashcards.length > 0) {
            // Handle flashcards (need to send via new format)
            chrome.runtime.sendMessage({
              action: "sendToAnki",
              data: data,
              deckName: customTitle,
              type: "flashcards"
            }, (res) => {
              if (res && res.success) {
                window.top.postMessage({ 
                  action: "ANKI_REAL_SUCCESS", 
                  count: data.flashcards.length, 
                  deck: customTitle,
                  type: "flashcards"
                }, "*");
              } else {
                window.top.postMessage({ 
                  action: "ANKI_REAL_FAIL", 
                  error: res ? res.error : "Unknown Error" 
                }, "*");
              }
            });
          }
        }
      });
    }
  }

  // ==================== UI INJECTOR ====================
  function initUiInjector() {
    window.addEventListener("message", (event) => {
      if (event.data.action === "ANKI_MINER_READY") {
        isMinerConnected = true;
        updateButtonState("ready");
      } else if (event.data.action === "ANKI_REAL_SUCCESS") {
        updateButtonState("success", event.data.count, event.data.deck);
      } else if (event.data.action === "ANKI_REAL_FAIL") {
        alert("⚠️ Export Failed: " + event.data.error);
        updateButtonState("error");
      }
    });

    const observer = new MutationObserver(() => {
      if (document.getElementById(CONFIG.BUTTON_ID)) return;
      
      let anchorBtn = null;
      for (const selector of CONFIG.ANCHOR_SELECTORS) {
        const found = document.querySelector(selector);
        if (found) { anchorBtn = found; break; }
      }
      
      if (anchorBtn) {
        const container = anchorBtn.closest('div.flex') || anchorBtn.parentElement;
        if (container) {
          container.insertBefore(createExportButton(), container.firstChild);
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function createExportButton() {
    const btn = document.createElement("button");
    btn.id = CONFIG.BUTTON_ID;
    btn.className = "mdc-button mat-mdc-button mat-mdc-outlined-button mat-unthemed mat-mdc-button-base";
    btn.style.cssText = `
      border: 1px solid #3c4043;
      border-radius: 20px;
      padding: 0 16px;
      margin-right: 8px;
      color: #e3e3e3;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: not-allowed;
      opacity: 0.5;
      background: transparent;
      font-family: 'Google Sans', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.25px;
      transition: all 0.2s ease;
      outline: none;
    `;
    
    const downloadIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;
    
    btn.innerHTML = `
      <span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
      <span class="mat-mdc-button-touch-target"></span>
      <span class="mdc-button__label" style="display: flex; align-items: center; gap: 6px;">
        ${downloadIconSvg}
        <span>Anki Export</span>
      </span>
    `;
    
    btn.disabled = true;
    
    btn.onmouseenter = () => {
      if (!btn.disabled) {
        btn.style.background = 'rgba(232, 234, 237, 0.08)';
      }
    };
    
    btn.onmouseleave = () => {
      btn.style.background = 'transparent';
    };
    
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isMinerConnected) {
        alert("Wait for page to fully load...");
        return;
      }
      
      const labelText = btn.querySelector(".mdc-button__label span:last-child");
      if (labelText) labelText.innerText = "Extracting...";
      btn.style.borderColor = "#a8c7fa";
      btn.style.color = "#a8c7fa";
      
      let deckName = getNotebookTitleFromPage();
      if (!deckName || deckName === "NotebookLM") {
        deckName = prompt("Enter Notebook Name:");
        if (!deckName) {
          updateButtonState("ready");
          return;
        }
      }
      
      // Trigger extraction in iframes
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow.postMessage({ 
            action: "ANKI_TRIGGER_EXTRACT", 
            notebookTitle: deckName 
          }, "*");
        } catch (e) {
          // Cross-origin iframe, ignore
        }
      });
    };
    
    return btn;
  }

  function updateButtonState(state, count = 0, deckName = "") {
    const btn = document.getElementById(CONFIG.BUTTON_ID);
    if (!btn) return;
    
    const labelText = btn.querySelector(".mdc-button__label span:last-child");
    
    switch (state) {
      case "ready":
        if (labelText) labelText.innerText = "Anki Export";
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.style.borderColor = "#3c4043";
        btn.style.color = "#e3e3e3";
        btn.style.background = "transparent";
        btn.disabled = false;
        break;
        
      case "success":
        if (labelText) labelText.innerText = `Saved ${count}!`;
        btn.style.borderColor = "#6dd58c";
        btn.style.color = "#6dd58c";
        btn.style.background = "rgba(109, 213, 140, 0.1)";
        setTimeout(() => updateButtonState("ready"), 3000);
        break;
        
      case "error":
        if (labelText) labelText.innerText = "Error";
        btn.style.borderColor = "#f28b82";
        btn.style.color = "#f28b82";
        btn.style.background = "rgba(242, 139, 130, 0.1)";
        setTimeout(() => updateButtonState("ready"), 3000);
        break;
    }
  }

  // ==================== INITIALIZATION ====================
  initDataMiner();
  initUiInjector();
  
  console.log("[NotebookLM2Anki] Content script loaded");
})();
