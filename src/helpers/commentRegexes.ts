import commentPatterns from '@heightapp/comment-patterns';
import escapeStringRegexp from 'escape-string-regexp';
import memoize from 'memoizee';

const regexFromString = memoize(
  (text: string) => {
    return new RegExp(escapeStringRegexp(text));
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
);

const patternsFromPath = memoize(
  (filePath: string) => {
    try {
      return commentPatterns(filePath);
    } catch (e) {
      return null;
    }
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
);

export const commentRegexesFromPatterns = (patterns: ReturnType<typeof commentPatterns>) => {
  // For all single line patterns, create the start prefix to identify a comment (prefix is regex-ready)
  const singleLine = patterns?.singleLineComment?.reduce<Array<RegExp>>((acc, comment) => {
    if (comment.start) {
      acc.push(comment.start instanceof RegExp ? comment.start : regexFromString(comment.start));
    }
    return acc;
  }, []);

  // For all single line patterns, create the start prefix and end suffix to identify a comment (prefix/suffix is regex-ready)
  const multiLine = patterns?.multiLineComment?.reduce<Array<{start: RegExp; end: RegExp}>>((acc, comment) => {
    if (comment.start && comment.end) {
      acc.push({
        start: comment.start instanceof RegExp ? comment.start : regexFromString(comment.start),
        end: comment.end instanceof RegExp ? comment.end : regexFromString(comment.end),
      });
    }
    return acc;
  }, []);

  if (!singleLine?.length && !multiLine?.length) {
    return {};
  }

  return {
    singleLine: singleLine?.length ? singleLine : undefined,
    multiLine: multiLine?.length ? multiLine : undefined,
  };
};

// Find patterns to use to find comments based on the filePath (language type)
export const commentRegexesFromPath = (filePath: string) => {
  const patterns = patternsFromPath(filePath);
  if (!patterns) {
    return {};
  }

  return commentRegexesFromPatterns(patterns);
};
