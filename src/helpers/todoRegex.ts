import memoize from 'memoizee';

export const TODO_PATTERN_WITHOUT_MATCH = 'TODO:?\\s+';
export const TODO_PATTERN_WITH_MATCH = `${TODO_PATTERN_WITHOUT_MATCH}(.*)`;

const singleLineTodoRegexFromSources = memoize(
  (match: boolean, ...regexSources: Array<string>) => {
    const startSource = regexSources.map((regexSource) => `(?:${regexSource})`).join('|');
    return new RegExp(`^(\\s*${startSource}\\s*)${match ? TODO_PATTERN_WITH_MATCH : TODO_PATTERN_WITHOUT_MATCH}`, 'i');
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
    length: false, // Do not use the length of the arguments since it's unknown
  },
);

const multiLineTodoRegexFromSources = memoize(
  (withMatch: boolean, startRegexSource: string, endRegexSource: string) => {
    // Do not use multi-line regex. We only want to match a multi comment if it takes only one line
    return new RegExp(`^(\\s*${startRegexSource}\\s*)${withMatch ? TODO_PATTERN_WITH_MATCH : TODO_PATTERN_WITHOUT_MATCH}(${endRegexSource})`, 'i');
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
);

export function singleLineTodoRegex(withMatch: true, ...regexes: Array<RegExp>): {regex: RegExp; prefixCapture: number; nameCapture: number};
export function singleLineTodoRegex(withMatch: false, ...regexes: Array<RegExp>): RegExp;
export function singleLineTodoRegex(withMatch: boolean, ...regexes: Array<RegExp>) {
  const regex = singleLineTodoRegexFromSources(withMatch, ...regexes.map((r) => r.source));
  if (withMatch) {
    return {
      regex,
      prefixCapture: 1,
      nameCapture: 2,
    };
  }

  return regex;
}

export function multiLineTodoRegex(
  withMatch: true,
  startRegexSource: RegExp,
  endRegexSource: RegExp,
): {regex: RegExp; prefixCapture: number; nameCapture: number; suffixCapture: number};
export function multiLineTodoRegex(withMatch: false, startRegexSource: RegExp, endRegexSource: RegExp): RegExp;
export function multiLineTodoRegex(withMatch: boolean, startRegexSource: RegExp, endRegexSource: RegExp) {
  const regex = multiLineTodoRegexFromSources(withMatch, startRegexSource.source, endRegexSource.source);
  if (withMatch) {
    return {
      regex,
      prefixCapture: 1,
      nameCapture: 2,
      suffixCapture: 3,
    };
  }

  return regex;
}
