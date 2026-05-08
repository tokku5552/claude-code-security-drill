export type Lang = 'ja' | 'en';

export interface Source {
  label: string;
  url: string;
}

export interface Question {
  topic: string;
  q: string;
  scenario?: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  title: string;
  explanation: string;
  takeaway: string;
  sources: Source[];
}

export type RankKey =
  | 'security_sentinel'
  | 'cautious_operator'
  | 'aware_but_vulnerable'
  | 'at_risk'
  | 'high_exposure';

export interface UiStrings {
  htmlTitle: string;
  topbarLeft: string;
  topbarRight: string;

  heroMeta: string;
  heroTitleHtml: string;
  heroLedeHtml: string;

  statQuestionsLabel: string;
  statTopicsLabel: string;
  statTimeLabel: string;
  statTimeValue: string;
  statDifficultyLabel: string;

  startBtn: string;

  topicsTitle: string;
  topic01Name: string;
  topic01Desc: string;
  topic02Name: string;
  topic02Desc: string;
  topic03Name: string;
  topic03Desc: string;
  topic04Name: string;
  topic04Desc: string;

  qProgressLabel: (n: number, total: number) => string;
  resultLabel: string;
  rankHeading: string;
  breakdownTitle: string;

  verdictCorrect: string;
  verdictWrong: string;
  optionMarkCorrect: string;
  optionMarkWrong: string;
  okMark: string;
  ngMark: string;
  sourcesLabel: string;

  nextLast: string;
  nextNormal: string;

  shareLabel: string;
  shareXBtn: string;
  shareCopyBtn: string;
  copiedToast: string;

  restartBtn: string;
  footerHtml: string;

  ranks: Record<RankKey, string>;
  resultMessages: Record<RankKey, string>;

  shareTweetText: (score: number, rank: string) => string;
}

export interface Translations {
  ui: UiStrings;
  questions: Question[];
}
