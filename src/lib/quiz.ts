import { getLang, getTranslations, onLangChange } from './i18n';
import { getRankKey } from './rank';
import { highlightScenario, escapeAttr } from './highlight';
import { buildShareUrl, buildXIntentUrl, copyToClipboard } from './share';

interface AnswerLog {
  q: number;
  correct: boolean;
  picked: number;
}

const KEYS = ['A', 'B', 'C', 'D'] as const;
const TOTAL = 10;

interface Refs {
  intro: HTMLElement;
  quiz: HTMLElement;
  result: HTMLElement;

  qNumber: HTMLElement;
  qTopic: HTMLElement;
  questionText: HTMLElement;
  scenarioBox: HTMLElement;
  options: HTMLElement;
  progressFill: HTMLElement;

  explanation: HTMLElement;
  verdict: HTMLElement;
  verdictMeta: HTMLElement;
  explanationTitle: HTMLElement;
  explanationText: HTMLElement;
  takeaway: HTMLElement;
  sources: HTMLElement;
  sourcesList: HTMLElement;
  nextBtn: HTMLButtonElement;

  finalScore: HTMLElement;
  rankName: HTMLElement;
  resultMsg: HTMLElement;
  breakdownList: HTMLElement;

  shareX: HTMLAnchorElement;
  shareCopy: HTMLButtonElement;
  copiedToast: HTMLElement;
}

const state = {
  currentQ: 0,
  score: 0,
  answers: [] as AnswerLog[],
  screen: 'intro' as 'intro' | 'quiz' | 'result',
};

let refs: Refs;

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

export function initQuiz(): void {
  refs = {
    intro: $('intro-screen'),
    quiz: $('quiz-screen'),
    result: $('result-screen'),

    qNumber: $('q-number'),
    qTopic: $('q-topic'),
    questionText: $('question-text'),
    scenarioBox: $('scenario-box'),
    options: $('options'),
    progressFill: $('progress-fill'),

    explanation: $('explanation'),
    verdict: $('verdict'),
    verdictMeta: $('verdict-meta'),
    explanationTitle: $('explanation-title'),
    explanationText: $('explanation-text'),
    takeaway: $('takeaway'),
    sources: $('sources'),
    sourcesList: $('sources-list'),
    nextBtn: $('next-btn') as HTMLButtonElement,

    finalScore: $('final-score'),
    rankName: $('rank-name'),
    resultMsg: $('result-msg'),
    breakdownList: $('breakdown-list'),

    shareX: $('share-x') as HTMLAnchorElement,
    shareCopy: $('share-copy') as HTMLButtonElement,
    copiedToast: $('copied-toast'),
  };

  $('start-btn').addEventListener('click', startQuiz);
  refs.nextBtn.addEventListener('click', nextQuestion);
  $('restart-btn').addEventListener('click', restart);
  refs.shareCopy.addEventListener('click', onCopyClick);

  onLangChange(() => {
    if (state.screen === 'quiz') renderQuestion();
    else if (state.screen === 'result') renderResult();
  });
}

function startQuiz(): void {
  state.currentQ = 0;
  state.score = 0;
  state.answers = [];
  state.screen = 'quiz';
  refs.intro.style.display = 'none';
  refs.quiz.classList.add('active');
  refs.result.classList.remove('active');
  renderQuestion();
}

function getCurrentAnswer(): AnswerLog | undefined {
  return state.answers.find((a) => a.q === state.currentQ);
}

function renderQuestion(): void {
  const t = getTranslations();
  const q = t.questions[state.currentQ];

  refs.qNumber.textContent = t.ui.qProgressLabel(state.currentQ + 1, TOTAL);
  refs.qTopic.textContent = q.topic;
  refs.questionText.textContent = q.q;

  if (q.scenario) {
    const scenarioLabel = getLang() === 'ja' ? '観測対象' : 'OBSERVED';
    refs.scenarioBox.innerHTML = `<span class="label">// ${scenarioLabel}</span>${highlightScenario(
      q.scenario,
    )}`;
    refs.scenarioBox.style.display = 'block';
  } else {
    refs.scenarioBox.style.display = 'none';
  }

  refs.options.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.innerHTML = `<span class="key">${KEYS[i]}</span><span>${escapeAttr(opt)}</span><span class="check"></span>`;
    btn.addEventListener('click', () => selectAnswer(i));
    refs.options.appendChild(btn);
  });

  refs.explanation.classList.remove('show');
  refs.nextBtn.classList.remove('show');
  refs.sources.style.display = 'none';

  const progress = (state.currentQ / TOTAL) * 100;
  refs.progressFill.style.width = progress + '%';

  const existing = getCurrentAnswer();
  if (existing) revealAnswer(existing);
}

function selectAnswer(picked: number): void {
  if (getCurrentAnswer()) return;

  const t = getTranslations();
  const q = t.questions[state.currentQ];
  const correct = picked === q.answer;
  if (correct) state.score++;
  const log: AnswerLog = { q: state.currentQ, correct, picked };
  state.answers.push(log);
  revealAnswer(log);

  const progress = ((state.currentQ + 1) / TOTAL) * 100;
  refs.progressFill.style.width = progress + '%';
}

function revealAnswer(log: AnswerLog): void {
  const t = getTranslations();
  const q = t.questions[log.q];

  const buttons = refs.options.querySelectorAll<HTMLButtonElement>('.option');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    btn.classList.remove('correct', 'wrong');
    const check = btn.querySelector<HTMLElement>('.check');
    if (check) check.textContent = '';
    if (i === q.answer) {
      btn.classList.add('correct');
      if (check) check.textContent = t.ui.optionMarkCorrect;
    }
    if (i === log.picked && !log.correct) {
      btn.classList.add('wrong');
      if (check) check.textContent = t.ui.optionMarkWrong;
    }
  });

  refs.verdict.textContent = log.correct
    ? t.ui.verdictCorrect
    : t.ui.verdictWrong;
  refs.verdict.className = 'verdict ' + (log.correct ? 'correct' : 'wrong');
  refs.verdictMeta.textContent = `${state.score} / ${state.currentQ + 1}`;
  refs.explanationTitle.textContent = q.title;
  refs.explanationText.innerHTML = `<p>${q.explanation}</p>`;
  refs.takeaway.textContent = q.takeaway;
  refs.takeaway.setAttribute('data-lang', getLang());

  if (q.sources && q.sources.length > 0) {
    refs.sourcesList.innerHTML = '';
    q.sources.forEach((s) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = s.label;
      li.appendChild(a);
      refs.sourcesList.appendChild(li);
    });
    refs.sources.style.display = 'block';
  } else {
    refs.sources.style.display = 'none';
  }

  refs.explanation.classList.add('show');

  refs.nextBtn.textContent =
    state.currentQ === TOTAL - 1 ? t.ui.nextLast : t.ui.nextNormal;
  refs.nextBtn.classList.add('show');
}

function nextQuestion(): void {
  state.currentQ++;
  if (state.currentQ >= TOTAL) {
    showResult();
  } else {
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showResult(): void {
  state.screen = 'result';
  refs.quiz.classList.remove('active');
  refs.result.classList.add('active');
  renderResult();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderResult(): void {
  const t = getTranslations();
  refs.finalScore.textContent = String(state.score * 10);

  const rankKey = getRankKey(state.score);
  const rank = t.ui.ranks[rankKey];
  refs.rankName.textContent = rank;
  refs.resultMsg.innerHTML = t.ui.resultMessages[rankKey];

  refs.breakdownList.innerHTML = '';
  state.answers.forEach((a) => {
    const q = t.questions[a.q];
    const item = document.createElement('div');
    item.className = 'breakdown-item';

    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = `Q.${String(a.q + 1).padStart(2, '0')}`;

    const topic = document.createElement('div');
    topic.className = 'topic';
    topic.textContent = q.topic + ' ';
    const title = document.createElement('span');
    title.style.color = 'var(--ink-faint)';
    title.style.marginLeft = '8px';
    title.textContent = `— ${q.title}`;
    topic.appendChild(title);

    const mark = document.createElement('div');
    mark.className = 'mark ' + (a.correct ? 'ok' : 'ng');
    mark.textContent = a.correct ? t.ui.okMark : t.ui.ngMark;

    item.append(num, topic, mark);
    refs.breakdownList.appendChild(item);
  });

  const lang = getLang();
  refs.shareX.href = buildXIntentUrl(
    state.score,
    lang,
    t.ui.shareTweetText(state.score, rank),
  );
}

function restart(): void {
  state.screen = 'intro';
  refs.result.classList.remove('active');
  refs.quiz.classList.remove('active');
  refs.intro.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function onCopyClick(): Promise<void> {
  await copyToClipboard(buildShareUrl(state.score, getLang()));
  refs.copiedToast.classList.add('show');
  setTimeout(() => refs.copiedToast.classList.remove('show'), 2000);
}
