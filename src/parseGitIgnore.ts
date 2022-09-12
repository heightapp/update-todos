import GitRepo from 'helpers/gitRepo';

function parseGitIgnore(repoPath: string) {
  return new GitRepo({path: repoPath}).parseGitIgnore();
}

export default parseGitIgnore;
