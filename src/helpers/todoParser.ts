import {commentRegexesFromPath} from 'helpers/commentRegexes';

import {multiLineTodoRegex, singleLineTodoRegex} from './todoRegex';

class TodoParser {
  private filePath: string;

  static isFileSupported(filePath: string) {
    const regexes = commentRegexesFromPath(filePath);
    return !!(regexes.singleLine?.length || regexes.multiLine?.length);
  }

  constructor({filePath}: {filePath: string}) {
    this.filePath = filePath;
  }

  private taskIndexFromCapture(capture: string | undefined) {
    if (!capture) {
      return null;
    }

    const taskIndexString = capture.trim().replace(/T-/i, '');
    const taskIndex = parseInt(taskIndexString, 10);
    return isNaN(taskIndex) ? null : taskIndex;
  }

  parse(line: string): {prefix: string; suffix?: string; name: string; taskIndex: number | null} | null {
    // Find regex to use to find todos in the file
    const regexes = commentRegexesFromPath(this.filePath);

    // Test for single line comments
    const singleLineRegex = regexes.singleLine ? singleLineTodoRegex(true, ...regexes.singleLine) : null;
    if (singleLineRegex) {
      const singleLineMatch = line.match(singleLineRegex.regex);
      if (singleLineMatch?.length) {
        return {
          prefix: singleLineMatch[singleLineRegex.prefixCapture],
          name: singleLineMatch[singleLineRegex.nameCapture].trim(),
          taskIndex: this.taskIndexFromCapture(singleLineMatch[singleLineRegex.taskIndexCapture]),
        };
      }
    }

    // Test for multi line comments
    const multiLineRegexes = regexes.multiLine?.map(({start, end}) => multiLineTodoRegex(true, start, end)) ?? [];
    for (let i = 0; i < multiLineRegexes.length; i++) {
      const mutiLineRegex = multiLineRegexes[i];
      const multiLineMatch = line.match(mutiLineRegex.regex);
      if (multiLineMatch?.length) {
        return {
          prefix: multiLineMatch[mutiLineRegex.prefixCapture],
          suffix: multiLineMatch[mutiLineRegex.suffixCapture],
          name: multiLineMatch[mutiLineRegex.nameCapture].trim(),
          taskIndex: this.taskIndexFromCapture(multiLineMatch[mutiLineRegex.taskIndexCapture]),
        };
      }
    }

    return null;
  }
}

export default TodoParser;
