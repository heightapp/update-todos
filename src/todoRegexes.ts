import commentPatterns from '@heightapp/comment-patterns';
import {commentRegexesFromPatterns} from 'helpers/commentRegexes';
import {multiLineTodoRegex, singleLineTodoRegex} from 'helpers/todoRegex';

const todoRegexes = () => {
  const allPatterns = commentPatterns.allPatterns();
  return allPatterns.map((pattern) => {
    const commentRegexes = commentRegexesFromPatterns(pattern);
    return {
      name: pattern.name,
      nameMatchers: pattern.nameMatchers,
      singleLine: commentRegexes.singleLine?.length ? singleLineTodoRegex(...commentRegexes.singleLine) : undefined,
      multiLine: commentRegexes.multiLine?.length ? commentRegexes.multiLine.map(({start, end}) => multiLineTodoRegex(start, end)) : undefined,
    };
  });
};

export default todoRegexes;
