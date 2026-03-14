const simpleGit = require("simple-git");

const checkIsRepoByAbsolutePath = async (absolutePath) => {
  const git = simpleGit({ baseDir: absolutePath });
  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return "不是Git仓库";
    }
    return true;
  } catch (error) {
    return false;
  }
};

const commitGit = async (absolutePath, message) => {
  const git = simpleGit({ baseDir: absolutePath });
  // 获取所有远程仓库信息
  const remotes = await git.getRemotes(true);

  if (remotes.length === 0) {
    console.log("当前仓库没有关联任何远程仓库。");
    return;
  } else {
    console.log("当前仓库关联的远程仓库信息：");
    const remote = remotes[0].refs.fetch;
    if (!remote) {
      console.log("当前仓库关联的远程仓库没有fetch remote。");
      return;
    } else {
      console.log("远程仓库remote:", remote);
      try {
        await git.add(".");
        await git.commit(message);
        const res = await git.push(remote, branch);
        console.log("res------------>: ", res);
        return true;
      } catch (error) {
        console.log("error------------>: ", error);
        return false;
      }
    }
  }
};

const gitAdd = async (absolutePath) => {
  const git = simpleGit({ baseDir: absolutePath });
  try {
    await git.add(".");
    return true;
  } catch (error) {
    return false;
  }
};

const gitCommit = async (absolutePath, message) => {
  const git = simpleGit({ baseDir: absolutePath });
  try {
    await git.commit(message);
    return true;
  } catch (error) {
    return false;
  }
};

const gitPush = async (absolutePath, remote, branch) => {
  const git = simpleGit({ baseDir: absolutePath });
  try {
    await git.push(remote, branch);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  checkIsRepoByAbsolutePath,
  commitGit,
};
