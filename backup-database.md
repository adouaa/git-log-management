# 数据库备份方案

## 1. 直接复制数据库文件

**适用场景**：简单、快速的备份方法，适用于个人项目或小型应用。

**操作步骤**：
1. 关闭运行中的服务器（如果正在运行）
2. 找到数据库文件：`backend/data/logs.db`
3. 复制该文件到其他位置（例如 `backup/logs-20260226.db`）
4. 当需要恢复时，将备份文件复制回 `backend/data/logs.db` 位置

**优点**：简单、快速，不需要额外工具
**缺点**：需要手动操作，不能自动定期备份

## 2. 使用 SQLite 命令行工具

**适用场景**：需要更灵活的备份选项，例如只备份特定表或数据。

**操作步骤**：
1. 下载并安装 SQLite 命令行工具：[SQLite 官方下载](https://www.sqlite.org/download.html)
2. 打开命令行窗口，进入 `backend/data` 目录
3. 执行备份命令：
   ```bash
   sqlite3 logs.db ".backup backup.db"
   ```
4. 备份文件将生成在当前目录下的 `backup.db` 文件中

**优点**：可以使用 SQLite 命令行工具的其他功能，例如导出特定表
**缺点**：需要安装额外工具，操作稍复杂

## 3. 编写备份脚本

**适用场景**：需要自动定期备份，或者需要更复杂的备份策略。

**操作步骤**：
1. 在 `backend` 目录下创建 `backup.js` 文件
2. 编写备份脚本，例如：
   ```javascript
   const fs = require('fs');
   const path = require('path');
   
   // 数据库文件路径
   const dbPath = path.join(__dirname, 'data', 'logs.db');
   // 备份目录路径
   const backupDir = path.join(__dirname, 'backup');
   
   // 确保备份目录存在
   if (!fs.existsSync(backupDir)) {
     fs.mkdirSync(backupDir, { recursive: true });
   }
   
   // 生成备份文件名（包含当前日期）
   const backupFileName = `logs-${new Date().toISOString().slice(0, 10)}.db`;
   const backupPath = path.join(backupDir, backupFileName);
   
   try {
     // 复制数据库文件
     fs.copyFileSync(dbPath, backupPath);
     console.log(`数据库备份成功：${backupPath}`);
   } catch (error) {
     console.error('数据库备份失败：', error);
   }
   ```
3. 运行备份脚本：
   ```bash
   node backup.js
   ```
4. 可以将脚本添加到定时任务中，例如使用 Windows 的任务计划程序或 Linux 的 crontab

**优点**：可以自动化备份过程，支持定期备份
**缺点**：需要编写和维护脚本

## 4. 使用第三方工具

**适用场景**：需要图形界面操作，或者需要更高级的备份功能。

**推荐工具**：
- [SQLite Database Browser](https://sqlitebrowser.org/)：开源的 SQLite 数据库管理工具，支持备份和恢复功能
- [DB Browser for SQLite](https://github.com/sqlitebrowser/sqlitebrowser)：另一个流行的 SQLite 管理工具

**操作步骤**：
1. 下载并安装第三方工具
2. 打开工具，连接到 `backend/data/logs.db` 数据库
3. 使用工具提供的备份功能进行备份

**优点**：图形界面操作，更直观
**缺点**：需要安装额外软件

## 总结

对于个人项目或小型应用，推荐使用 **直接复制数据库文件** 的方法，简单、快速且可靠。如果需要更高级的功能，可以考虑使用备份脚本或第三方工具。

无论使用哪种方法，建议定期备份数据库，以防止数据丢失。