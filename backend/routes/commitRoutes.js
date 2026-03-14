const Router = require('koa-router');
const CommitLogController = require('../controllers/CommitLogController');

const router = new Router();

// 记录相关路由
router.get('/commits', CommitLogController.getCommitLogs);
router.post('/commits', CommitLogController.createCommitLog);
router.put('/commits/:id', CommitLogController.updateCommitLog);
router.delete('/commits/:id', CommitLogController.deleteCommitLog);

module.exports = router;
