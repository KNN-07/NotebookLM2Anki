// NotebookLM2Anki - Flashcard Card Template
// Simple Front/Back template for flashcards

export const FLASHCARD_MODEL_ID = 1609234567891;
export const FLASHCARD_MODEL_NAME = "NotebookLM Flashcard";

export const FLASHCARD_FIELDS = [
  { name: "Front" },
  { name: "Back" }
];

export const FLASHCARD_STYLING = `/* NotebookLM Flashcard v1.0 */
html { overflow-y: scroll; overflow-x: hidden; }
body { margin: 0; padding: 0; width: 100%; background-color: #1e1e1e; font-family: 'Roboto', 'Segoe UI', sans-serif; color: #e3e3e3; }
.card { font-size: 18px; line-height: 1.7; text-align: center; background-color: #1e1e1e; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; box-sizing: border-box; }
.content { max-width: 600px; width: 100%; }
.front-text, .back-text { font-size: 1.3rem; color: #ffffff; }
.back-text { color: #a8c7fa; margin-top: 20px; padding-top: 20px; border-top: 1px solid #444; }
hr#answer { border: none; border-top: 2px solid #444; margin: 30px 0; }
.latex-snippet { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.95em; border: 1px solid #444; }
code { background-color: #383838; color: #e6b455; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; }
@media (max-width: 600px) { .card { padding: 20px; } .front-text, .back-text { font-size: 1.1rem; } }`;

export const FLASHCARD_FRONT_TEMPLATE = `<div class="card">
  <div class="content">
    <div class="front-text" id="front-content">{{Front}}</div>
  </div>
</div>
<script>
(function() {
    function cleanMath(str) {
        if (!str) return "";
        let s = str.replace(/\\$\\$(.*?)\\$\\$/gs, '\\\\[$1\\\\]');
        s = s.replace(/\\$((?:[^$]|\\\\$)+?)\\$/g, '\\\\($1\\\\)');
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
    } catch (e) { console.log("Flashcard Front Error:", e); }
})();
</script>`;

export const FLASHCARD_BACK_TEMPLATE = `<div class="card">
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
        s = s.replace(/\\$((?:[^$]|\\\\$)+?)\\$/g, '\\\\($1\\\\)');
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
    } catch (e) { console.log("Flashcard Back Error:", e); }
})();
</script>`;

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
