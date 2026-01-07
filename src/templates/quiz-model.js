// NotebookLM2Anki - Quiz Card Template
// HTML/CSS/JS for the interactive quiz card in Anki

export const QUIZ_MODEL_ID = 1609234567890;
export const QUIZ_MODEL_NAME = "NotebookLM Quiz";

export const QUIZ_FIELDS = [
  { name: "Question" },
  { name: "Hint" },
  { name: "ArchDiagram" },
  { name: "Option1" },
  { name: "Flag1" },
  { name: "Rationale1" },
  { name: "Option2" },
  { name: "Flag2" },
  { name: "Rationale2" },
  { name: "Option3" },
  { name: "Flag3" },
  { name: "Rationale3" },
  { name: "Option4" },
  { name: "Flag4" },
  { name: "Rationale4" }
];

export const QUIZ_STYLING = `/* NotebookLM Quiz Card v1.1 */
html { overflow-y: scroll; overflow-x: hidden; }
body { margin: 0; padding: 0; width: 100%; background-color: #1e1e1e; font-family: 'Roboto', 'Segoe UI', sans-serif; color: #e3e3e3; }
.card { font-size: 16px; line-height: 1.6; text-align: left; background-color: #1e1e1e; min-height: 100vh; display: flex; flex-direction: column; }
.main-wrapper { width: 100%; min-height: 100vh; box-sizing: border-box; display: flex; }
.mode-centered { justify-content: center; }
.mode-centered .quiz-column { width: 100%; max-width: 580px; margin: 0 auto; padding: 60px 20px; }
.mode-split { justify-content: flex-start; }
.mode-split .quiz-column { width: 50%; padding: 60px 40px; align-items: center; }
.mode-split .quiz-content-wrapper { width: 100%; max-width: 580px; }
.quiz-column { display: flex; flex-direction: column; box-sizing: border-box; min-height: 100vh; z-index: 1; }
.diagram-column { position: fixed; top: 0; right: 0; width: 50%; height: 100vh; background-color: #121212; border-left: 1px solid #333; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; z-index: 10; }
.diagram-column img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: block; }
.question-text { font-size: 1.35rem; font-weight: 500; margin-bottom: 30px; color: #ffffff; line-height: 1.5; }
.hint-container { margin-bottom: 30px; }
.hint-btn { background-color: #2d2d2d; border: 1px solid #444746; border-radius: 20px; padding: 8px 16px; color: #a8c7fa; font-size: 0.9rem; font-weight: 500; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; width: fit-content; transition: background-color 0.2s; }
.hint-btn:hover { background-color: #383838; }
.hint-text-box { margin-top: 15px; background-color: #252525; border-left: 4px solid #a8c7fa; padding: 15px; color: #e3e3e3; display: none; border-radius: 0 8px 8px 0; }
.options-list { display: flex; flex-direction: column; gap: 15px; padding-bottom: 100px; }
.option-block { background-color: #2d2d2d; border: 1px solid #444746; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; position: relative; transition: background-color 0.1s ease; }
.option-block:hover { background-color: #383838; }
.option-content { display: flex; align-items: flex-start; font-size: 1.05rem; }
.option-letter { font-weight: bold; margin-right: 15px; color: #a8c7fa; min-width: 25px; }
.state-correct { border: 2px solid #6dd58c !important; background-color: #252525 !important; }
.state-wrong { border: 2px solid #e87c7c !important; background-color: #252525 !important; }
.state-dimmed { opacity: 0.4; pointer-events: none; }
.feedback-section { margin-top: 12px; display: none; padding-top: 15px; border-top: 1px solid #444; }
.thats-right { color: #6dd58c; font-weight: bold; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; margin-bottom: 8px; }
.not-quite { color: #e87c7c; font-weight: bold; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; margin-bottom: 8px; }
.rationale-text { color: #cccccc; margin-left: 4px; line-height: 1.6; }
.status-icon { width: 24px; height: 24px; min-width: 24px; fill: currentColor; display: block; }
.latex-snippet { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.95em; border: 1px solid #444; }
@media (max-width: 1000px) { .main-wrapper { flex-direction: column-reverse; } .mode-split .quiz-column, .mode-centered .quiz-column { width: 100%; padding: 20px; } .diagram-column { position: relative; width: 100%; height: auto; border-left: none; border-bottom: 1px solid #333; display: flex !important; } .diagram-column img { max-height: 40vh; } }`;

export const QUIZ_FRONT_TEMPLATE = `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<div class="main-wrapper mode-centered">
    <div class="quiz-column">
        <div class="quiz-content-wrapper">
            <div class="question-text" id="q-text"></div>
            <div class="hint-container">
                <div class="hint-btn" id="hint-toggle">
                    <span class="material-icons" style="font-size: 18px;">lightbulb</span> Hint
                </div>
                <div class="hint-text-box" id="hint-content"></div>
            </div>
            <div class="options-list" id="front-options">
                <div style="color: #666; padding: 20px;">Loading...</div>
            </div>
        </div>
    </div>
</div>
<div id="raw-data" style="display:none;">
    <div id="d-question">{{Question}}</div>
    <div id="d-hint">{{Hint}}</div>
    <div data-opt="A" data-text="{{Option1}}" data-flag="{{Flag1}}" data-reason="{{Rationale1}}"></div>
    <div data-opt="B" data-text="{{Option2}}" data-flag="{{Flag2}}" data-reason="{{Rationale2}}"></div>
    <div data-opt="C" data-text="{{Option3}}" data-flag="{{Flag3}}" data-reason="{{Rationale3}}"></div>
    <div data-opt="D" data-text="{{Option4}}" data-flag="{{Flag4}}" data-reason="{{Rationale4}}"></div>
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
        const qRaw = document.getElementById('d-question').innerHTML;
        const hRaw = document.getElementById('d-hint').innerHTML;
        document.getElementById('q-text').innerHTML = cleanMath(qRaw);
        const hBox = document.getElementById('hint-content');
        if (hRaw.trim()) {
            hBox.innerHTML = cleanMath(hRaw);
        } else {
            const hBtn = document.getElementById('hint-toggle');
            if(hBtn) hBtn.style.display = 'none';
        }
        const container = document.getElementById('front-options');
        const dataItems = document.querySelectorAll('#raw-data > div[data-opt]');
        container.innerHTML = '';
        const iconCheck = '<svg class="status-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        const iconClose = '<svg class="status-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        dataItems.forEach(item => {
            const letter = item.dataset.opt;
            const rawText = item.dataset.text || "";
            const rawReason = item.dataset.reason || "";
            if (!rawText.trim() && !rawReason.trim()) return;
            const text = cleanMath(rawText);
            const reason = cleanMath(rawReason);
            const flagStr = (item.dataset.flag || "").trim().toLowerCase();
            const isCorrect = (flagStr === "true" || flagStr === "yes" || flagStr === "1");
            const btn = document.createElement('div');
            btn.className = 'option-block';
            btn.innerHTML = '<div class="option-content"><span class="option-letter">' + letter + '.</span><span>' + text + '</span></div><div class="feedback-section"><div class="' + (isCorrect ? 'thats-right' : 'not-quite') + '">' + (isCorrect ? iconCheck : iconClose) + '<span>' + (isCorrect ? "That's right!" : "Not quite") + '</span></div><div class="rationale-text">' + reason + '</div></div>';
            btn.addEventListener('click', function() {
                document.querySelectorAll('.option-block').forEach(b => {
                    b.classList.remove('state-correct', 'state-wrong');
                    b.querySelector('.feedback-section').style.display = 'none';
                });
                if (isCorrect) btn.classList.add('state-correct');
                else btn.classList.add('state-wrong');
                const feed = btn.querySelector('.feedback-section');
                if(reason.trim()) { feed.style.display = 'block'; triggerMath(feed); }
            });
            container.appendChild(btn);
        });
        const hintBtn = document.getElementById('hint-toggle');
        if(hintBtn && hintBtn.style.display !== 'none') {
            hintBtn.addEventListener('click', () => {
                const isVis = hBox.style.display === "block";
                hBox.style.display = isVis ? "none" : "block";
                hintBtn.style.color = isVis ? "#ffffff" : "#a8c7fa";
                if(!isVis) triggerMath(hBox);
            });
        }
        setTimeout(() => triggerMath(document.body), 100);
    } catch (e) { console.log("Template Error:", e); }
})();
<\/script>`;

export const QUIZ_BACK_TEMPLATE = `<div id="layout-root" class="main-wrapper">
    <div class="quiz-column">
        <div class="quiz-content-wrapper">
            <div class="question-text" id="back-q-text"></div>
            <div class="options-list" id="back-options"></div>
        </div>
    </div>
    <div class="diagram-column" id="diagram-container">{{ArchDiagram}}</div>
</div>
<div id="back-data" style="display:none;">
    <div id="d-question">{{Question}}</div>
    <div data-opt="A" data-text="{{Option1}}" data-flag="{{Flag1}}" data-reason="{{Rationale1}}"></div>
    <div data-opt="B" data-text="{{Option2}}" data-flag="{{Flag2}}" data-reason="{{Rationale2}}"></div>
    <div data-opt="C" data-text="{{Option3}}" data-flag="{{Flag3}}" data-reason="{{Rationale3}}"></div>
    <div data-opt="D" data-text="{{Option4}}" data-flag="{{Flag4}}" data-reason="{{Rationale4}}"></div>
    <div id="diagram-check">{{ArchDiagram}}</div>
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
        const diagramCheck = document.getElementById('diagram-check');
        const diagramContent = diagramCheck ? diagramCheck.innerHTML.trim() : "";
        const root = document.getElementById('layout-root');
        const diagramCol = document.getElementById('diagram-container');
        if (diagramContent.length > 0) { root.classList.add('mode-split'); diagramCol.style.display = 'flex'; }
        else { root.classList.add('mode-centered'); diagramCol.style.display = 'none'; }
        const qRaw = document.getElementById('d-question').innerHTML;
        document.getElementById('back-q-text').innerHTML = cleanMath(qRaw);
        const container = document.getElementById('back-options');
        const dataItems = document.querySelectorAll('#back-data > div[data-opt]');
        const iconCheck = '<svg class="status-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        dataItems.forEach(item => {
            const letter = item.dataset.opt;
            const rawText = item.dataset.text || "";
            const rawReason = item.dataset.reason || "";
            if (!rawText.trim() && !rawReason.trim()) return;
            const text = cleanMath(rawText);
            const reason = cleanMath(rawReason);
            const flagStr = (item.dataset.flag || "").trim().toLowerCase();
            const isCorrect = (flagStr === "true" || flagStr === "yes" || flagStr === "1");
            const block = document.createElement('div');
            block.className = 'option-block';
            if (isCorrect) {
                block.classList.add('state-correct');
                block.innerHTML = '<div class="option-content"><span class="option-letter">' + letter + '.</span><span>' + text + '</span></div><div class="feedback-section" style="display:block;"><div class="thats-right">' + iconCheck + " That's right!</div><div class=\"rationale-text\">" + reason + '</div></div>';
            } else {
                block.classList.add('state-dimmed');
                block.innerHTML = '<div class="option-content"><span class="option-letter">' + letter + '.</span><span>' + text + '</span></div>';
            }
            container.appendChild(block);
        });
        setTimeout(() => triggerMath(document.body), 100);
    } catch (e) { console.log("Back Template Error:", e); }
})();
<\/script>`;

export function getQuizModel() {
  return {
    name: QUIZ_MODEL_NAME,
    id: QUIZ_MODEL_ID.toString(),
    flds: QUIZ_FIELDS,
    req: [[0, "all", [0]]],
    tmpls: [
      {
        name: "Quiz Card",
        qfmt: QUIZ_FRONT_TEMPLATE,
        afmt: QUIZ_BACK_TEMPLATE
      }
    ],
    css: QUIZ_STYLING
  };
}
