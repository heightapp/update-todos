import commentPatterns from 'comment-patterns';
import escapeStringRegexp from 'escape-string-regexp';
import memoize from 'memoizee';

import path from 'path';

const TODO_PATTERN = 'TODO(?!:?\\s+T-\\d+):?\\s+(.*)';

// Map extensions not supported by commentPatterns to their original ones
const EXTENSION_MAP: Record<string, string> = {
  cjs: 'js',
  jsx: 'js',
  tsx: 'ts',
};

const regexSourceFromString = memoize((text: string) => {
  return escapeStringRegexp(text);
}, {
  max: 100,
  maxAge: 10 * 60 * 1000, // 10 minutes
});

// Find patterns to use to find comments based on the filePath (language type)
const fileCommentRegexPatterns = memoize(
  (filePath: string) => {
    let patterns: ReturnType<typeof commentPatterns> | null = null;

    try {
      const extension = path.extname(filePath).substring(1);
      const mappedExtension = EXTENSION_MAP[extension];
      if (mappedExtension) {
        patterns = commentPatterns(`${filePath.substring(0, filePath.length - extension.length)}${mappedExtension}`);
      } else {
        patterns = commentPatterns(filePath);
      }
    } catch (e) {
      return null;
    }

    // For all single line patterns, create the start prefix to identify a comment (prefix is regex-ready)
    const singleLinePatterns = patterns?.singleLineComment?.reduce<Array<{start: string}>>((acc, comment) => {
      if (comment.start) {
        acc.push({
          start: comment.start instanceof RegExp ? comment.start.source : regexSourceFromString(comment.start),
        });
      }
      return acc;
    }, []);

    // For all single line patterns, create the start prefix and end suffix to identify a comment (prefix/suffix is regex-ready)
    const multiLinePatterns = patterns?.multiLineComment?.reduce<Array<{start: string, end: string}>>((acc, comment) => {
      if (comment.start && comment.end) {
        acc.push({
          start: (comment.start instanceof RegExp ? comment.start.source : regexSourceFromString(comment.start)),
          end: (comment.end instanceof RegExp ? comment.end.source : regexSourceFromString(comment.end)),
        });
      }
      return acc;
    }, []);

    if (!singleLinePatterns?.length && !multiLinePatterns?.length) {
      return null;
    }

    return {
      singleLinePatterns: singleLinePatterns ?? [],
      multiLinePatterns: multiLinePatterns ?? [],
    };
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
);

// Create regex to use to find comments for single line pattern
const fileSingleLineCommentRegex = memoize(
  (...regexSources: Array<string>) => {
    const startSource = regexSources.map((regexSource) => `(?:${regexSource})`).join('|');
    return new RegExp(`^(\\s*${startSource}\\s*)${TODO_PATTERN}`, 'i');
  },
  {
    max: 10,
    maxAge: 60 * 60 * 1000, // 1 hour
    length: false,
  },
);

// Create regex to use to find comments for multi line patterns
const fileMultiLineCommentRegex = memoize(
  (startSource: string, endSource: string) => {
    // Do not use multi-line regex. We only want to match a multi comment if it takes only one line
    return new RegExp(`^(\\s*${startSource}\\s*)${TODO_PATTERN}(${endSource})`, 'i');
  },
  {
    max: 10,
    maxAge: 60 * 60 * 1000, // 1 hour
    length: false,
  },
);

class TodoParser {
  private filePath: string;

  static isFileSupported(filePath: string) {
    return fileCommentRegexPatterns(filePath) !== null;
  }

  constructor({filePath}: {filePath: string}) {
    this.filePath = filePath;
  }

  parse(line: string): {prefix: string, suffix?: string, name: string} | null {
    // Find regex to use to find todos in the file
    const patterns = fileCommentRegexPatterns(this.filePath);
    if (!patterns) {
      return null;
    }

    // Test for single line comments
    const singleLineRegex = patterns.singleLinePatterns.length ? fileSingleLineCommentRegex(...patterns.singleLinePatterns.map((comment) => comment.start)) : null;
    if (singleLineRegex) {
      const singleLineMatch = line.match(singleLineRegex);
      if (singleLineMatch?.length) {
        return {
          prefix: singleLineMatch[1],
          name: singleLineMatch[2],
        };
      }
    }

    // Test for multi line comments
    const multiLineRegexes = patterns.multiLinePatterns.map((comment) => fileMultiLineCommentRegex(comment.start, comment.end));
    for (let i = 0; i < multiLineRegexes.length; i++) {
      const mutiLineRegex = multiLineRegexes[i];
      const multiLineMatch = line.match(mutiLineRegex);
      if (multiLineMatch?.length) {
        return {
          prefix: multiLineMatch[1],
          suffix: multiLineMatch[3],
          name: multiLineMatch[2].trim(),
        };
      }
    }

    return null;
  }
}

export default TodoParser;
