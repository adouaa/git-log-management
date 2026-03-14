const sqlite3 = require('sqlite3').verbose();
// 替换为你实际的数据库文件名
const dbPath = './data/logs.db'; 

const db = new sqlite3.Database(dbPath);

db.run(`ALTER TABLE projects ADD COLUMN path TEXT`, function(err) {
    if (err) {
        console.error('添加列失败:', err.message);
        // 如果是因为列已存在，可以忽略这个错误
        if (!err.message.includes('duplicate column')) {
            process.exit(1);
        }
    } else {
        console.log('成功添加 path 列！');
    }
    db.close();
});