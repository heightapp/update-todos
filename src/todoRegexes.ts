import commentPatterns from '@heightapp/comment-patterns';
import {commentRegexesFromPatterns} from 'helpers/commentRegexes';
import {multiLineTodoRegex, singleLineTodoRegex} from 'helpers/todoRegex';

const todoRegexes = (withMatch: boolean) => {
  const allPatterns = commentPatterns.allPatterns();
  return allPatterns.map((pattern) => {
    const commentRegexes = commentRegexesFromPatterns(pattern);
    const singleLine = (() => {
      if (withMatch) {
        return commentRegexes.singleLine?.length ? singleLineTodoRegex(true, ...commentRegexes.singleLine) : undefined;
      }
      return commentRegexes.singleLine?.length ? singleLineTodoRegex(false, ...commentRegexes.singleLine) : undefined;
    })();

    const multiLine = (() => {
      if (withMatch) {
        return commentRegexes.multiLine?.length ? commentRegexes.multiLine.map(({start, end}) => multiLineTodoRegex(true, start, end)) : undefined;
      }
      return commentRegexes.multiLine?.length ? commentRegexes.multiLine.map(({start, end}) => multiLineTodoRegex(false, start, end)) : undefined;
    })();

    return {
      name: pattern.name,
      nameMatchers: pattern.nameMatchers,
      singleLine,
      multiLine,
    };
  });
};

export default todoRegexes;
