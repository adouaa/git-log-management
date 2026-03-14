const { Project } = require("../models");

class ProjectController {
  // 获取所有项目列表
  static async getAllProjects(ctx) {
    try {
      console.log("123321: ", 123321);
      const projects = await Project.findAll();
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: projects,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取项目列表失败",
        error: error.message,
      };
    }
  }

  // 新增项目
  static async createProject(ctx) {
    try {
      const { name, description } = ctx.request.body;

      if (!name) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "项目名称不能为空",
        };
        return;
      }

      const project = await Project.create({ name, description });
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: project,
        message: "项目创建成功",
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建项目失败",
        error: error.message,
      };
    }
  }
}

module.exports = ProjectController;
