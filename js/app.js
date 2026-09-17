import {
  loadQuestionBank,
  createQuizSession,
  selectAnswer,
  goToQuestion,
  goNext,
  goPrev,
  answeredCount,
  scoreSession,
  PASS_THRESHOLD
} from './quiz-engine.js';

const appEl = document.getElementById('app');

const state = {
  view: 'loading',
  bank: [],
  session: null,
  error: null
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTemplate(id) {
  const tpl = document.getElementById(id);
  const clone = tpl.content.cloneNode(true);
  appEl.innerHTML = '';
  appEl.appendChild(clone);
}

function renderLoading() {
  appEl.innerHTML = `
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="text-center">
        <div class="w-10 h-10 mx-auto mb-4 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p class="text-ink-500">Načítám otázky…</p>
      </div>
    </div>`;
}

function renderError(message) {
  appEl.innerHTML = `
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="max-w-md text-center bg-white dark:bg-ink-800 border border-red-200 dark:border-red-900 rounded-2xl p-6 shadow-sm">
        <div class="text-3xl mb-3">⚠️</div>
        <h1 class="font-bold text-lg mb-2">Nepodařilo se načíst test</h1>
        <p class="text-sm text-ink-500 dark:text-ink-300">${escapeHtml(message)}</p>
      </div>
    </div>`;
}

function renderHome() {
  renderTemplate('tpl-home');
  appEl.querySelector('[data-field="question-count"]').textContent =
    Math.min(40, state.bank.length);
  appEl.querySelector('[data-field="bank-size"]').textContent = state.bank.length;
  appEl.querySelector('[data-action="start-test"]').addEventListener('click', () => {
    state.session = createQuizSession(state.bank);
    state.view = 'quiz';
    render();
  });
}

function renderQuiz() {
  renderTemplate('tpl-quiz');
  const session = state.session;
  const q = session.questions[session.currentIndex];
  const total = session.questions.length;

  appEl.querySelector('[data-field="progress-label"]').textContent =
    `Otázka ${session.currentIndex + 1} z ${total} · Zodpovězeno ${answeredCount(session)}/${total}`;
  appEl.querySelector('[data-field="progress-bar"]').style.width =
    `${((session.currentIndex + 1) / total) * 100}%`;

  appEl.querySelector('[data-field="question-text"]').textContent = q.question;

  const optionsList = appEl.querySelector('[data-field="options-list"]');
  optionsList.innerHTML = '';
  q.options.forEach((optionText, idx) => {
    const btn = document.createElement('button');
    const isSelected = q.selectedIndex === idx;
    btn.type = 'button';
    btn.dataset.optionIndex = String(idx);
    btn.className = [
      'option-btn w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium',
      isSelected
        ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-800 dark:text-brand-200'
        : 'border-ink-200 dark:border-ink-700 hover:border-brand-300 dark:hover:border-brand-700'
    ].join(' ');
    btn.innerHTML = `
      <span class="inline-flex items-center gap-3">
        <span class="flex-none w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
          isSelected
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-ink-300 dark:border-ink-600 text-ink-400'
        }">${String.fromCharCode(65 + idx)}</span>
        <span>${escapeHtml(optionText)}</span>
      </span>`;
    btn.addEventListener('click', () => {
      selectAnswer(session, session.currentIndex, idx);
      renderQuiz();
    });
    optionsList.appendChild(btn);
  });

  const navGrid = appEl.querySelector('[data-field="nav-grid"]');
  navGrid.innerHTML = '';
  session.questions.forEach((qq, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    const isCurrent = idx === session.currentIndex;
    const isAnswered = qq.selectedIndex !== null;
    dot.className = [
      'w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center border transition-colors',
      isCurrent
        ? 'bg-brand-600 border-brand-600 text-white'
        : isAnswered
          ? 'bg-brand-100 dark:bg-brand-900 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-200'
          : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-400'
    ].join(' ');
    dot.textContent = String(idx + 1);
    dot.addEventListener('click', () => {
      goToQuestion(session, idx);
      renderQuiz();
    });
    navGrid.appendChild(dot);
  });

  const prevBtn = appEl.querySelector('[data-action="prev-question"]');
  const nextBtn = appEl.querySelector('[data-action="next-question"]');
  prevBtn.disabled = session.currentIndex === 0;
  if (session.currentIndex === total - 1) {
    nextBtn.textContent = 'Dokončit test →';
  } else {
    nextBtn.textContent = 'Další →';
  }

  prevBtn.addEventListener('click', () => {
    goPrev(session);
    renderQuiz();
  });
  nextBtn.addEventListener('click', () => {
    if (session.currentIndex === total - 1) {
      finishTest();
    } else {
      goNext(session);
      renderQuiz();
    }
  });

  appEl.querySelector('[data-action="finish-test"]').addEventListener('click', finishTest);
}

function finishTest() {
  const session = state.session;
  const unanswered = session.questions.length - answeredCount(session);
  if (unanswered > 0) {
    const proceed = window.confirm(
      `Máte ${unanswered} nezodpovězených otázek. Opravdu chcete test ukončit a vyhodnotit?`
    );
    if (!proceed) return;
  }
  session.finished = true;
  state.view = 'results';
  render();
}

function renderResults() {
  renderTemplate('tpl-results');
  const session = state.session;
  const { correct, total, percent, passed } = scoreSession(session);

  const badge = appEl.querySelector('[data-field="pass-badge"]');
  if (passed) {
    badge.textContent = '✓ Test splněn';
    badge.className += ' bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
  } else {
    badge.textContent = '✗ Test nesplněn';
    badge.className += ' bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  }

  appEl.querySelector('[data-field="score-text"]').textContent = `${correct} / ${total} bodů`;
  appEl.querySelector('[data-field="percent-text"]').textContent =
    `Úspěšnost ${percent.toFixed(1)} % (hranice pro splnění: ${(PASS_THRESHOLD * 100).toFixed(0)} %)`;

  const reviewList = appEl.querySelector('[data-field="review-list"]');
  reviewList.innerHTML = '';
  session.questions.forEach((q, idx) => {
    const isCorrect = q.selectedIndex === q.correctAnswerIndex;
    const wasAnswered = q.selectedIndex !== null;

    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5 fade-in';

    let optionsHtml = '';
    q.options.forEach((optText, optIdx) => {
      const isUserChoice = q.selectedIndex === optIdx;
      const isCorrectChoice = q.correctAnswerIndex === optIdx;
      let cls = 'flex items-start gap-2 px-3 py-2 rounded-lg text-sm border ';
      if (isCorrectChoice) {
        cls += 'border-green-300 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300 dark:border-green-800 font-medium';
      } else if (isUserChoice && !isCorrectChoice) {
        cls += 'border-red-300 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300 dark:border-red-800 font-medium';
      } else {
        cls += 'border-ink-100 dark:border-ink-700 text-ink-500 dark:text-ink-400';
      }
      const marker = isCorrectChoice ? '✓' : (isUserChoice ? '✗' : '');
      optionsHtml += `
        <div class="${cls}">
          <span class="flex-none w-4">${marker}</span>
          <span>${escapeHtml(optText)}</span>
        </div>`;
    });

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-3">
        <h3 class="font-semibold leading-snug">${idx + 1}. ${escapeHtml(q.question)}</h3>
        <span class="flex-none text-xs font-bold px-2.5 py-1 rounded-full ${
          !wasAnswered
            ? 'bg-ink-100 text-ink-500 dark:bg-ink-700 dark:text-ink-300'
            : isCorrect
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
        }">${!wasAnswered ? 'Nezodpovězeno' : isCorrect ? 'Správně' : 'Špatně'}</span>
      </div>
      <div class="space-y-1.5 mb-3">${optionsHtml}</div>
      <div class="text-sm bg-brand-50 dark:bg-brand-950 text-brand-900 dark:text-brand-200 rounded-lg px-3 py-2.5 border border-brand-100 dark:border-brand-900">
        <span class="font-semibold">Vysvětlení: </span>${escapeHtml(q.explanation)}
      </div>`;
    reviewList.appendChild(card);
  });

  appEl.querySelector('[data-action="restart-test"]').addEventListener('click', () => {
    state.session = createQuizSession(state.bank);
    state.view = 'quiz';
    render();
  });
  appEl.querySelector('[data-action="go-home"]').addEventListener('click', () => {
    state.session = null;
    state.view = 'home';
    render();
  });
}

function render() {
  window.scrollTo({ top: 0 });
  if (state.view === 'loading') renderLoading();
  else if (state.view === 'error') renderError(state.error);
  else if (state.view === 'home') renderHome();
  else if (state.view === 'quiz') renderQuiz();
  else if (state.view === 'results') renderResults();
}

async function init() {
  state.view = 'loading';
  render();
  try {
    state.bank = await loadQuestionBank('questions.json');
    state.view = 'home';
  } catch (err) {
    state.error = err.message || 'Neznámá chyba při načítání otázek.';
    state.view = 'error';
  }
  render();
}

init();
