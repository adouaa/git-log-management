const path = require('path');
const fs = require('fs');

const checkPathIsValid = (projectPath) => {
  const absolutePath = path.resolve(projectPath);
  const pathExists = fs.existsSync(absolutePath);
  if (!pathExists) {
    return "路径不存在";
  }
  const isDirectory = fs.statSync(absolutePath).isDirectory();
  return pathExists && isDirectory;
}

module.exports = checkPathIsValid;