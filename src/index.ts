import GitRepo from 'helpers/gitRepo';

export function parseGitIgnore(repoPath: string) {
  return new GitRepo({path: repoPath}).parseGitIgnore();
}

export {default} from 'updateTodos';
