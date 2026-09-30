// Quiz content limits, shared by the game server and the quiz builder page.
// Constants only: the front end imports this at runtime, so it must not pull
// in Node modules.

export const TIME_OPTIONS = [5, 10, 20, 30, 45, 60, 90, 120, 240];
export const DEFAULT_TIME = 20;
export const MAX_QUESTIONS = 100;
export const MAX_QUESTION_LEN = 120;
export const MAX_ANSWER_LEN = 75;
export const MAX_TITLE_LEN = 80;
