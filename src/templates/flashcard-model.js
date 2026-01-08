// NotebookLM2Anki - Flashcard Card Template
// Simple Front/Back template for flashcards

export const FLASHCARD_MODEL_ID = 1609234567891;
export const FLASHCARD_MODEL_NAME = "NotebookLM Flashcard";

export const FLASHCARD_FIELDS = [
  { name: "Front" },
  { name: "Back" }
];

export const FLASHCARD_STYLING = `html { overflow-y: scroll; overflow-x: hidden; }
body { margin: 0; padding: 0; width: 100%; background-color: transparent; font-family: 'Roboto', 'Segoe UI', sans-serif; color: #e3e3e3; }
.card { font-size: 18px; line-height: 1.7; text-align: center; background-color: transparent; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; box-sizing: border-box; }
.flashcard-container { max-width: 600px; width: 100%; background-color: #2d2d2d; border: 1px solid #444746; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
.front-section { font-size: 1.4rem; font-weight: 500; color: #ffffff; line-height: 1.6; }
.divider { display: flex; align-items: center; margin: 28px 0; gap: 16px; }
.divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #444746, transparent); }
.divider-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 2px; color: #6dd58c; text-transform: uppercase; padding: 4px 12px; background-color: rgba(109,213,140,0.1); border-radius: 4px; }
.back-section { font-size: 1.25rem; color: #a8c7fa; line-height: 1.6; }
.question-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 2px; color: #888; text-transform: uppercase; margin-bottom: 12px; }
.front-repeat { font-size: 1rem; color: #888; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #3a3a3a; }
.latex-snippet { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.95em; border: 1px solid #444; }
code { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; }
@media (max-width: 600px) { .flashcard-container { padding: 24px; margin: 0 10px; } .front-section { font-size: 1.2rem; } .back-section { font-size: 1.1rem; } }`;

export const FLASHCARD_FRONT_TEMPLATE = `<div class="card">
  <div class="flashcard-container">
    <div class="front-section" id="front-content">{{Front}}</div>
  </div>
</div>
<script>
(function() {
    function cleanMath(str) {
        if (!str) return "";
        let s = str.replace(/\\$\\$(.*?)\\$\\$/gs, '\\\\[$1\\\\]');
        s = s.replace(/\\$((?:[^$]}\\\\\\$)+?)\\$/g, '\\\\($1\\\\)');
        s = s.replace(/\\\`([^\\\`]+)\\\`/g, '<code class="latex-snippet">$1</code>');
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
<\\/script>`;

export const FLASHCARD_BACK_TEMPLATE = `<div class="card">
  <div class="flashcard-container">
    <div class="front-repeat" id="back-front">{{Front}}</div>
    <div class="divider">
      <span class="divider-line"></span>
      <span class="divider-label">Answer</span>
      <span class="divider-line"></span>
    </div>
    <div class="back-section" id="back-content">{{Back}}</div>
  </div>
</div>
<script>
(function() {
    function cleanMath(str) {
        if (!str) return "";
        let s = str.replace(/\\$\\$(.*?)\\$\\$/gs, '\\\\[$1\\\\]');
        s = s.replace(/\\$((?:[^$]|\\\\\\$)+?)\\$/g, '\\\\($1\\\\)');
        s = s.replace(/\\\`([^\\\`]+)\\\`/g, '<code class="latex-snippet">$1</code>');
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
<\\/script>`;

// Export the complete model definition for genanki-js
export function getFlashcardModel() {
  return {
    name: FLASHCARD_MODEL_NAME,
    id: FLASHCARD_MODEL_ID.toString(),
    flds: FLASHCARD_FIELDS,
    req: [[0, "all", [0]]],
    tmpls: [
      {
        name: "Flashcard",
        qfmt: FLASHCARD_FRONT_TEMPLATE,
        afmt: FLASHCARD_BACK_TEMPLATE
      }
    ],
    css: FLASHCARD_STYLING
  };
}
