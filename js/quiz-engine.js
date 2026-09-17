const MAX_QUESTIONS = 40;
const PASS_THRESHOLD = 0.75;

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function loadQuestionBank(url = 'questions.json') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nepodařilo se načíst otázky (HTTP ${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Soubor s otázkami je prázdný nebo má neplatný formát.');
  }
  return data;
}

function buildQuestionInstance(source) {
  const optionOrder = shuffle(source.options.map((_, idx) => idx));
  const options = optionOrder.map((originalIdx) => source.options[originalIdx]);
  const correctAnswerIndex = optionOrder.indexOf(source.correctAnswerIndex);
  return {
    id: source.id,
    question: source.question,
    options,
    correctAnswerIndex,
    explanation: source.explanation,
    selectedIndex: null
  };
}

export function createQuizSession(questionBank) {
  const count = Math.min(MAX_QUESTIONS, questionBank.length);
  const picked = shuffle(questionBank).slice(0, count);
  const questions = picked.map(buildQuestionInstance);

  return {
    questions,
    currentIndex: 0,
    finished: false
  };
}

export function selectAnswer(session, questionIndex, optionIndex) {
  session.questions[questionIndex].selectedIndex = optionIndex;
}

export function goToQuestion(session, index) {
  if (index < 0 || index >= session.questions.length) return;
  session.currentIndex = index;
}

export function goNext(session) {
  goToQuestion(session, session.currentIndex + 1);
}

export function goPrev(session) {
  goToQuestion(session, session.currentIndex - 1);
}

export function answeredCount(session) {
  return session.questions.filter((q) => q.selectedIndex !== null).length;
}

export function scoreSession(session) {
  const total = session.questions.length;
  const correct = session.questions.filter(
    (q) => q.selectedIndex === q.correctAnswerIndex
  ).length;
  const percent = total === 0 ? 0 : (correct / total) * 100;
  const passed = total > 0 && correct / total >= PASS_THRESHOLD;
  return { correct, total, percent, passed };
}

export { PASS_THRESHOLD, MAX_QUESTIONS };
