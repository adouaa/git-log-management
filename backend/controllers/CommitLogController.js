const { CommitLog, Project, Sequelize } = require("../models");
const { Op } = Sequelize;

class CommitLogController {
  // 获取记录列表（支持按项目ID、分类、关键词模糊查询）
  static async getCommitLogs(ctx) {
    try {
      const { projectId, category, keyword } = ctx.query;

      const where = {};

      if (projectId) {
        where.projectId = projectId;
      }

      if (category) {
        where.category = category;
      }

      if (keyword) {
        where.content = {
          [Op.like]: `%${keyword}%`,
        };
      }

      const commitLogs = await CommitLog.findAll({
        where,
        include: [
          {
            model: Project,
            as: "project",
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: commitLogs,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取记录列表失败",
        error: error.message,
      };
    }
  }

  // 新增记录
  static async createCommitLog(ctx) {
    try {
      const { projectId, content, category, tags } = ctx.request.body;

      if (!projectId || !content) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "项目ID和修改内容不能为空",
        };
        return;
      }

      const commitLog = await CommitLog.create({
        projectId,
        content,
        category,
        tags,
      });
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: commitLog,
        message: "记录创建成功",
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建记录失败",
        error: error.message,
      };
    }
  }

  // 修改记录
  static async updateCommitLog(ctx) {
    try {
      const { id } = ctx.params;
      const { content, category, tags } = ctx.request.body;

      const commitLog = await CommitLog.findByPk(id);

      if (!commitLog) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "记录不存在",
        };
        return;
      }

      await commitLog.update({ content, category, tags });
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: commitLog,
        message: "记录更新成功",
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "更新记录失败",
        error: error.message,
      };
    }
  }

  // 删除记录
  static async deleteCommitLog(ctx) {
    try {
      const { id } = ctx.params;

      const commitLog = await CommitLog.findByPk(id);

      if (!commitLog) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "记录不存在",
        };
        return;
      }

      await commitLog.destroy();
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "记录删除成功",
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除记录失败",
        error: error.message,
      };
    }
  }
}

module.exports = CommitLogController;
