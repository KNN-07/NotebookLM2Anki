let sqlInitialized = false;
let SQL = null;

async function initSql() {
  if (sqlInitialized) return SQL;
  
  SQL = await initSqlJs({
    locateFile: file => chrome.runtime.getURL(`vendor/${file}`)
  });
  
  sqlInitialized = true;
  return SQL;
}

const FLASHCARD_CSS = `html { overflow-y: scroll; overflow-x: hidden; }
body { margin: 0; padding: 0; width: 100%; background-color: #1e1e1e; font-family: 'Roboto', 'Segoe UI', sans-serif; color: #e3e3e3; }
.card { font-size: 18px; line-height: 1.7; text-align: center; background-color: #1e1e1e; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; box-sizing: border-box; }
.content { max-width: 600px; width: 100%; }
.front-text, .back-text { font-size: 1.3rem; color: #ffffff; }
.back-text { color: #a8c7fa; margin-top: 20px; padding-top: 20px; border-top: 1px solid #444; }
hr#answer { border: none; border-top: 2px solid #444; margin: 30px 0; }
.latex-snippet { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.95em; border: 1px solid #444; }
code { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; }`;

const FLASHCARD_FRONT = `<div class="card">
  <div class="content">
    <div class="front-text" id="front-content">{{Front}}</div>
  </div>
</div>
<script>
(function() {
    function cleanMath(str) {
        if (!str) return "";
        let s = str.replace(/\\$\\$(.*?)\\$\\$/gs, '\\\\[$1\\\\]');
        s = s.replace(/\\$((?:[^$]|\\\\\\$)+?)\\$/g, '\\\\($1\\\\)');
        s = s.replace(/\`([^\`]+)\`/g, '<code class="latex-snippet">$1</code>');
        return s;
    }
    function triggerMath(element) {
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([element]).catch(err => {});
        } else if (typeof MathJax !== 'undefined' && MathJax.Hub) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        }
    }
    try {
        const el = document.getElementById('front-content');
        el.innerHTML = cleanMath(el.innerHTML);
        setTimeout(() => triggerMath(document.body), 100);
    } catch (e) {}
})();
<\/script>`;

const FLASHCARD_BACK = `<div class="card">
  <div class="content">
    <div class="front-text" id="back-front">{{Front}}</div>
    <hr id="answer">
    <div class="back-text" id="back-content">{{Back}}</div>
  </div>
</div>
<script>
(function() {
    function cleanMath(str) {
        if (!str) return "";
        let s = str.replace(/\\$\\$(.*?)\\$\\$/gs, '\\\\[$1\\\\]');
        s = s.replace(/\\$((?:[^$]|\\\\\\$)+?)\\$/g, '\\\\($1\\\\)');
        s = s.replace(/\`([^\`]+)\`/g, '<code class="latex-snippet">$1</code>');
        return s;
    }
    function triggerMath(element) {
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([element]).catch(err => {});
        } else if (typeof MathJax !== 'undefined' && MathJax.Hub) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        }
    }
    try {
        const front = document.getElementById('back-front');
        const back = document.getElementById('back-content');
        front.innerHTML = cleanMath(front.innerHTML);
        back.innerHTML = cleanMath(back.innerHTML);
        setTimeout(() => triggerMath(document.body), 100);
    } catch (e) {}
})();
<\/script>`;

const QUIZ_CSS = `html { overflow-y: scroll; overflow-x: hidden; }
body { margin: 0; padding: 0; width: 100%; background-color: #1e1e1e; font-family: 'Roboto', 'Segoe UI', sans-serif; color: #e3e3e3; }
.card { font-size: 16px; line-height: 1.6; text-align: left; background-color: #1e1e1e; min-height: 100vh; display: flex; flex-direction: column; }
.main-wrapper { width: 100%; min-height: 100vh; box-sizing: border-box; display: flex; justify-content: center; }
.quiz-column { width: 100%; max-width: 580px; margin: 0 auto; padding: 60px 20px; display: flex; flex-direction: column; box-sizing: border-box; }
.question-text { font-size: 1.35rem; font-weight: 500; margin-bottom: 30px; color: #ffffff; line-height: 1.5; }
.options-list { display: flex; flex-direction: column; gap: 15px; }
.option-block { background-color: #2d2d2d; border: 1px solid #444746; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.option-content { display: flex; align-items: flex-start; font-size: 1.05rem; }
.option-letter { font-weight: bold; margin-right: 15px; color: #a8c7fa; min-width: 25px; }
.state-correct { border: 2px solid #6dd58c !important; background-color: #252525 !important; }
.state-dimmed { opacity: 0.4; }
.feedback-section { margin-top: 12px; display: block; padding-top: 15px; border-top: 1px solid #444; }
.thats-right { color: #6dd58c; font-weight: bold; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; margin-bottom: 8px; }
.rationale-text { color: #cccccc; margin-left: 4px; line-height: 1.6; }
.latex-snippet { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.95em; border: 1px solid #444; }`;

const QUIZ_FRONT = `<div class="main-wrapper">
  <div class="quiz-column">
    <div class="question-text" id="q-text">{{Question}}</div>
    <div class="options-list">
      <div class="option-block"><div class="option-content"><span class="option-letter">A.</span><span id="opt1">{{Option1}}</span></div></div>
      <div class="option-block"><div class="option-content"><span class="option-letter">B.</span><span id="opt2">{{Option2}}</span></div></div>
      <div class="option-block"><div class="option-content"><span class="option-letter">C.</span><span id="opt3">{{Option3}}</span></div></div>
      <div class="option-block"><div class="option-content"><span class="option-letter">D.</span><span id="opt4">{{Option4}}</span></div></div>
    </div>
  </div>
</div>
<script>
(function() {
    function cleanMath(str) {
        if (!str) return "";
        let s = str.replace(/\\$\\$(.*?)\\$\\$/gs, '\\\\[$1\\\\]');
        s = s.replace(/\\$((?:[^$]|\\\\\\$)+?)\\$/g, '\\\\($1\\\\)');
        s = s.replace(/\`([^\`]+)\`/g, '<code class="latex-snippet">$1</code>');
        return s;
    }
    function triggerMath(element) {
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([element]).catch(err => {});
        } else if (typeof MathJax !== 'undefined' && MathJax.Hub) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        }
    }
    try {
        ['q-text','opt1','opt2','opt3','opt4'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = cleanMath(el.innerHTML);
        });
        setTimeout(() => triggerMath(document.body), 100);
    } catch (e) {}
})();
<\/script>`;

const QUIZ_BACK = `<div class="main-wrapper">
  <div class="quiz-column">
    <div class="question-text" id="back-q-text">{{Question}}</div>
    <div class="options-list" id="back-options"></div>
  </div>
</div>
<div id="data-holder" style="display:none;">
  <span id="d-opt1">{{Option1}}</span><span id="d-flag1">{{Flag1}}</span><span id="d-rat1">{{Rationale1}}</span>
  <span id="d-opt2">{{Option2}}</span><span id="d-flag2">{{Flag2}}</span><span id="d-rat2">{{Rationale2}}</span>
  <span id="d-opt3">{{Option3}}</span><span id="d-flag3">{{Flag3}}</span><span id="d-rat3">{{Rationale3}}</span>
  <span id="d-opt4">{{Option4}}</span><span id="d-flag4">{{Flag4}}</span><span id="d-rat4">{{Rationale4}}</span>
</div>
<script>
(function() {
    function cleanMath(str) {
        if (!str) return "";
        let s = str.replace(/\\$\\$(.*?)\\$\\$/gs, '\\\\[$1\\\\]');
        s = s.replace(/\\$((?:[^$]|\\\\\\$)+?)\\$/g, '\\\\($1\\\\)');
        s = s.replace(/\`([^\`]+)\`/g, '<code class="latex-snippet">$1</code>');
        return s;
    }
    function triggerMath(element) {
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([element]).catch(err => {});
        } else if (typeof MathJax !== 'undefined' && MathJax.Hub) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        }
    }
    try {
        document.getElementById('back-q-text').innerHTML = cleanMath(document.getElementById('back-q-text').innerHTML);
        const letters = ['A','B','C','D'];
        const container = document.getElementById('back-options');
        for (let i = 1; i <= 4; i++) {
            const optText = document.getElementById('d-opt'+i)?.innerHTML || '';
            const flag = (document.getElementById('d-flag'+i)?.innerHTML || '').trim().toLowerCase();
            const rat = document.getElementById('d-rat'+i)?.innerHTML || '';
            if (!optText.trim()) continue;
            const isCorrect = flag === 'true' || flag === 'yes' || flag === '1';
            const block = document.createElement('div');
            block.className = 'option-block ' + (isCorrect ? 'state-correct' : 'state-dimmed');
            let html = '<div class="option-content"><span class="option-letter">' + letters[i-1] + '.</span><span>' + cleanMath(optText) + '</span></div>';
            if (isCorrect && rat.trim()) {
                html += '<div class="feedback-section"><div class="thats-right">Correct!</div><div class="rationale-text">' + cleanMath(rat) + '</div></div>';
            }
            block.innerHTML = html;
            container.appendChild(block);
        }
        setTimeout(() => triggerMath(document.body), 100);
    } catch (e) {}
})();
<\/script>`;

async function generateApkg(data, deckName) {
  await initSql();
  
  const deckId = Math.floor(Math.random() * (2 ** 31 - 2 ** 30) + 2 ** 30);
  const deck = new Deck(deckId, deckName);
  
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
    tmpls: [{ name: "Quiz Card", qfmt: QUIZ_FRONT, afmt: QUIZ_BACK }],
    css: QUIZ_CSS
  });
  
  const flashcardModel = new Model({
    name: "NotebookLM Flashcard",
    id: "1609234567891",
    flds: [{ name: "Front" }, { name: "Back" }],
    req: [[0, "all", [0]]],
    tmpls: [{ name: "Flashcard", qfmt: FLASHCARD_FRONT, afmt: FLASHCARD_BACK }],
    css: FLASHCARD_CSS
  });
  
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
  
  if (data.flashcards) {
    for (const card of data.flashcards) {
      deck.addNote(flashcardModel.note([card.front || "", card.back || ""]));
    }
  }
  
  const pkg = new Package();
  pkg.addDeck(deck);
  pkg.writeToFile(`${deckName.replace(/[^a-z0-9]/gi, '_')}.apkg`);
  
  const totalCards = (data.quizzes?.length || 0) + (data.flashcards?.length || 0);
  return { success: true, count: totalCards };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'generateApkg') {
    generateApkg(message.data, message.deckName)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
