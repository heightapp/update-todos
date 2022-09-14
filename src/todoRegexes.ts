import commentPatterns from '@heightapp/comment-patterns';
import {commentRegexesFromPatterns} from 'helpers/commentRegexes';
import {multiLineTodoRegex, singleLineTodoRegex} from 'helpers/todoRegex';

type WithMatchResult = {
  name: string;
  nameMatchers: Array<string>;
  singleLine: {regex: RegExp; prefixCapture: number; nameCapture: number} | undefined;
  multiLine: Array<{regex: RegExp; prefixCapture: number; nameCapture: number; suffixCapture: number}> | undefined;
};

type WithoutMatchResult = {
  name: string;
  nameMatchers: Array<string>;
  singleLine: RegExp | undefined;
  multiLine: Array<RegExp> | undefined;
};

function todoRegex(withMatch: true, pattern: ReturnType<typeof commentPatterns.allPatterns>[0]): WithMatchResult;
function todoRegex(withMatch: false, pattern: ReturnType<typeof commentPatterns.allPatterns>[0]): WithoutMatchResult;
function todoRegex(withMatch: boolean, pattern: ReturnType<typeof commentPatterns.allPatterns>[0]) {
  const commentRegexes = commentRegexesFromPatterns(pattern);

  if (withMatch) {
    const singleLine = commentRegexes.singleLine?.length ? singleLineTodoRegex(withMatch, ...commentRegexes.singleLine) : undefined;
    const multiLine = commentRegexes.multiLine?.length ? commentRegexes.multiLine.map(({start, end}) => multiLineTodoRegex(withMatch, start, end)) : undefined;
    return {
      name: pattern.name,
      nameMatchers: pattern.nameMatchers,
      singleLine,
      multiLine,
    };
  }

  const singleLine = commentRegexes.singleLine?.length ? singleLineTodoRegex(withMatch, ...commentRegexes.singleLine) : undefined;
  const multiLine = commentRegexes.multiLine?.length ? commentRegexes.multiLine.map(({start, end}) => multiLineTodoRegex(withMatch, start, end)) : undefined;
  return {
    name: pattern.name,
    nameMatchers: pattern.nameMatchers,
    singleLine,
    multiLine,
  };
}

function todoRegexes(withMatch: true): Array<WithMatchResult>;
function todoRegexes(withMatch: false): Array<WithoutMatchResult>;
function todoRegexes(withMatch: boolean) {
  const allPatterns = commentPatterns.allPatterns();
  return withMatch ? allPatterns.map((pattern) => todoRegex(withMatch, pattern)) : allPatterns.map((pattern) => todoRegex(withMatch, pattern));
}

export default todoRegexes;
