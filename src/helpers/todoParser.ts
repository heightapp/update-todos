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

  parse(line: string): {prefix: string; suffix?: string; name: string} | null {
    // Find regex to use to find todos in the file
    const regexes = commentRegexesFromPath(this.filePath);

    // Test for single line comments
    const singleLineRegex = regexes.singleLine ? singleLineTodoRegex(...regexes.singleLine) : null;
    if (singleLineRegex) {
      const singleLineMatch = line.match(singleLineRegex.regex);
      if (singleLineMatch?.length) {
        return {
          prefix: singleLineMatch[singleLineRegex.prefixCapture],
          name: singleLineMatch[singleLineRegex.nameCapture].trim(),
        };
      }
    }

    // Test for multi line comments
    const multiLineRegexes = regexes.multiLine?.map(({start, end}) => multiLineTodoRegex(start, end)) ?? [];
    for (let i = 0; i < multiLineRegexes.length; i++) {
      const mutiLineRegex = multiLineRegexes[i];
      const multiLineMatch = line.match(mutiLineRegex.regex);
      if (multiLineMatch?.length) {
        return {
          prefix: multiLineMatch[mutiLineRegex.prefixCapture],
          suffix: multiLineMatch[mutiLineRegex.suffixCapture],
          name: multiLineMatch[mutiLineRegex.nameCapture].trim(),
        };
      }
    }

    return null;
  }
}

export default TodoParser;
