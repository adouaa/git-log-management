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
        // 正确获取当前分支名称
        // git.branch() 返回一个对象，其中 'current' 属性是当前分支名
        const branchSummary = await git.branch();
        const branch = branchSummary.current; // <--- 必须先从 branchSummary 中取出 current
        const remoteName = "origin"; // 通常远程名称是 origin
        if (!branch) {
          throw new Error("无法获取当前分支名称（可能处于分离头指针状态）");
        }

        console.log(`当前分支: ${branch}`);
        const addRes =  await git.add(".");
        console.log("addRes: ", addRes);
        const commitRes = await git.commit(message);
        console.log("commitRes: ", commitRes);
        // 先 Pull (拉取远程代码并合并)
        // 这会自动 fetch 并 merge 远程的变更到本地
        const pullResult = await git.pull(remoteName, branch, ['--allow-unrelated-histories']);
        if (
          pullResult.summary.changes > 0 ||
          pullResult.summary.insertions > 0 ||
          pullResult.summary.deletions > 0
        ) {
          console.log(
            `[0] 已同步远程变更：+${pullResult.summary.insertions} -${pullResult.summary.deletions}`,
          );
        } else {
          console.log(`[0] 本地已是最新，无需同步。`);
        }
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
