import gitDiffParser from 'git-diff-parser';

import {exec as execSync} from 'child_process';
import fs from 'fs';
import readLine from 'readline';
import util from 'util';

const exec = util.promisify(execSync);

type Line = {
  text: string;
  index: number;
};

class GitFile {
  private filePath: string;
  private repoPath?: string;

  constructor({filePath, repoPath}: {filePath: string; repoPath?: string}) {
    this.filePath = filePath;
    this.repoPath = repoPath;
  }

  async isTracked() {
    if (!this.repoPath) {
      return false;
    }

    try {
      // It will return a string with filename if its tracked
      const result = (await exec(`git ls-files ${this.filePath}`, {cwd: this.repoPath})).stdout;
      return !!result;
    } catch {
      return false;
    }
  }

  async changedLines(callback: (line: Line) => void) {
    if ((await this.isTracked()) && this.repoPath) {
      try {
        // Read lines with git diff
        const diff = (await exec(`git diff ${this.filePath}`, {cwd: this.repoPath})).stdout;
        const files = gitDiffParser(diff).commits?.[0]?.files ?? [];
        files.forEach((file) => {
          file.lines.forEach((line) => {
            callback({text: line.text, index: line.ln1 - 1}); // ln1 is 1 based
          });
        });
        return Promise.resolve();
      } catch (e) {
        return Promise.resolve();
      }
    } else {
      // Read whole file line by line
      return new Promise<void>((resolve) => {
        const readInterface = readLine.createInterface({
          input: fs.createReadStream(this.filePath),
          crlfDelay: Infinity,
        });

        let lineIndex = 0;
        readInterface.on('line', (line) => {
          callback({text: line, index: lineIndex++});
        });

        readInterface.on('close', () => {
          resolve();
        });
      });
    }
  }

  async updateLine({lineIndex, previousContent, newContent}: {lineIndex: number; previousContent: string; newContent: string}) {
    const file = await fs.promises.readFile(this.filePath);
    const lines = file.toString().split(/\r?\n/);
    const lineText = lines[lineIndex];
    if (lineText !== previousContent) {
      // Line text might have changed
      return;
    }

    lines[lineIndex] = newContent;
    await fs.promises.writeFile(this.filePath, lines.join('\n'));
  }
}

export default GitFile;
