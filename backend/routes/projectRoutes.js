const Router = require("koa-router");
const ProjectController = require("../controllers/ProjectController");

const router = new Router();
console.log("444: ", 444);
// 项目相关路由
router.get("/projects", ProjectController.getAllProjects);
router.post("/projects", ProjectController.createProject);

module.exports = router;
