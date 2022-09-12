import memoize from 'memoizee';

const TODO_PATTERN = 'TODO(?!:?\\s+T-\\d+):?\\s+(.*)';

const singleLineTodoRegexFromSources = memoize(
  (...regexSources: Array<string>) => {
    const startSource = regexSources.map((regexSource) => `(?:${regexSource})`).join('|');
    return new RegExp(`^(\\s*${startSource}\\s*)${TODO_PATTERN}`, 'i');
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
    length: false, // Do not use the length of the arguments since it's unknown
  },
);

const multiLineTodoRegexFromSources = memoize(
  (startRegexSource: string, endRegexSource: string) => {
    // Do not use multi-line regex. We only want to match a multi comment if it takes only one line
    return new RegExp(`^(\\s*${startRegexSource}\\s*)${TODO_PATTERN}(${endRegexSource})`, 'i');
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
);

export const singleLineTodoRegex = (...regexes: Array<RegExp>) => {
  return {
    regex: singleLineTodoRegexFromSources(...regexes.map((regex) => regex.source)),
    prefixCapture: 1,
    nameCapture: 2,
  };
};

export const multiLineTodoRegex = (startRegexSource: RegExp, endRegexSource: RegExp) => {
  return {
    regex: multiLineTodoRegexFromSources(startRegexSource.source, endRegexSource.source),
    prefixCapture: 1,
    nameCapture: 2,
    suffixCapture: 3,
  };
};
