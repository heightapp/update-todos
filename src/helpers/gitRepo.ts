import {compile as gitIgnoreParserCompile} from 'gitignore-parser';

import fs from 'fs';
import path from 'path';

class GitRepo {
  private path: string;

  constructor(options: {path: string}) {
    this.path = options.path;
  }

  async parseGitIgnore() {
    try {
      const gitignorePath = path.resolve(this.path, './.gitignore');
      const file = await fs.promises.readFile(gitignorePath, {
        encoding: 'utf-8',
      });

      return gitIgnoreParserCompile(file);
    } catch {
      return null;
    }
  }
}

export default GitRepo;
