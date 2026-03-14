const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const path = require("path");
const { Sequelize, Op } = require("sequelize");
const serve = require("koa-static");
const checkPathIsValid = require("./utils/checkPathIsValid");
const { checkIsRepoByAbsolutePath, commitGit } = require("./utils/gitAction");

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "./data/logs.db"),
  logging: false,
});

// 测试连接
sequelize
  .authenticate()
  .then(() => {
    console.log("数据库连接成功");
  })
  .catch((err) => {
    console.error("数据库连接失败:", err);
  });

// 定义模型
const Category = sequelize.define(
  "Category",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: "分类名称",
    },
  },
  {
    tableName: "categories",
    timestamps: false,
  },
);

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "项目名称",
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "项目描述",
    },
    categoryId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "分类ID",
    },
    path: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "项目路径",
    },
  },
  {
    tableName: "projects",
    timestamps: false,
  },
);

// 关联关系
Project.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

const CommitLog = sequelize.define(
  "CommitLog",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      comment: "项目ID",
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
      comment: "修改内容",
    },
    categoryId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "分类ID",
    },
    tags: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "便签，逗号分隔",
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      comment: "创建时间",
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      comment: "更新时间",
    },
  },
  {
    tableName: "commit_logs",
    timestamps: false,
  },
);

// 建立关联关系
Project.hasMany(CommitLog, {
  foreignKey: "projectId",
  as: "commitLogs",
});

CommitLog.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// 同步数据库模型
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("数据库模型同步成功");
  })
  .catch((err) => {
    console.error("数据库模型同步失败:", err);
  });

const app = new Koa();
const PORT = process.env.PORT || 8080;
console.log("process.env.PORT: ", process.env.PORT);

const staticPath = path.join(__dirname, "../frontend/dist"); // 静态资源目录
app.use(serve(staticPath));

// 中间件
// app.use(cors());
app.use(bodyParser());

// 直接处理所有请求
app.use(async (ctx) => {
  const { method, url } = ctx.request;

  console.log(`收到请求: ${method} ${url}`);

  // 项目相关路由
  if (method === "GET" && url === "/projects") {
    try {
      const projects = await Project.findAll({
        include: [
          {
            model: Category,
            as: "category",
          },
        ],
      });
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: projects,
      };
    } catch (error) {
      console.error("获取项目列表失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取项目列表失败",
        error: error.message,
      };
    }
    return;
  }

  if (method === "POST" && url === "/projects") {
    try {
      const { name, description, categoryId, path } = ctx.request.body;

      if (!name) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "项目名称不能为空",
        };
        return;
      }

      const isPathValid = checkPathIsValid(path);
      if (isPathValid !== true) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: isPathValid,
        };
        return;
      }

      const project = await Project.create({
        name,
        description,
        categoryId,
        path,
      });
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: project,
        message: "项目创建成功",
      };
    } catch (error) {
      console.error("创建项目失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建项目失败",
        error: error.message,
      };
    }
    return;
  }

  if (method === "PUT" && url.match(/^\/projects\/\d+$/)) {
    try {
      const id = parseInt(url.split("/")[2]);
      const { name, description, categoryId, path } = ctx.request.body;

      if (!name) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "项目名称不能为空",
        };
        return;
      }

      const isPathValid = checkPathIsValid(path);
      if (isPathValid !== true) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: isPathValid,
        };
        return;
      }

      const isRepo = await checkIsRepoByAbsolutePath(path);
      if (isRepo !== true) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: isRepo,
        };
        return;
      } else {
        console.log("是一个git仓库: ");
      }

      const project = await Project.findByPk(id);

      if (!project) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "项目不存在",
        };
        return;
      }

      await project.update({ name, description, categoryId, path });
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: project,
        message: "项目更新成功",
      };
    } catch (error) {
      console.error("更新项目失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "更新项目失败",
        error: error.message,
      };
    }
    return;
  }

  if (method === "DELETE" && url.match(/^\/projects\/\d+$/)) {
    try {
      const id = parseInt(url.split("/")[2]);

      const project = await Project.findByPk(id);

      if (!project) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "项目不存在",
        };
        return;
      }

      // 检查是否有关联的记录
      const commitLogs = await CommitLog.findAll({ where: { projectId: id } });
      if (commitLogs.length > 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "该项目下有关联的记录，无法删除",
        };
        return;
      }

      await project.destroy();
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "项目删除成功",
      };
    } catch (error) {
      console.error("删除项目失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除项目失败",
        error: error.message,
      };
    }
    return;
  }

  // 分类相关路由 - 获取分类列表
  if (method === "GET" && url === "/categories") {
    try {
      const categories = await Category.findAll();
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: categories,
      };
    } catch (error) {
      console.error("获取分类列表失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取分类列表失败",
        error: error.message,
      };
    }
    return;
  }

  // 分类相关路由 - 创建分类
  if (method === "POST" && url === "/categories") {
    try {
      const { name } = ctx.request.body;

      if (!name) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "分类名称不能为空",
        };
        return;
      }

      const category = await Category.create({ name });
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: category,
        message: "分类创建成功",
      };
    } catch (error) {
      console.error("创建分类失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建分类失败",
        error: error.message,
      };
    }
    return;
  }

  // 分类相关路由 - 更新分类
  if (method === "PUT" && url.match(/^\/categories\/\d+$/)) {
    try {
      const id = parseInt(url.split("/")[2]);
      const { name } = ctx.request.body;

      if (!name) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "分类名称不能为空",
        };
        return;
      }

      const category = await Category.findByPk(id);

      if (!category) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "分类不存在",
        };
        return;
      }

      await category.update({ name });
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: category,
        message: "分类更新成功",
      };
    } catch (error) {
      console.error("更新分类失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "更新分类失败",
        error: error.message,
      };
    }
    return;
  }

  // 分类相关路由 - 删除分类
  if (method === "DELETE" && url.match(/^\/categories\/\d+$/)) {
    try {
      const id = parseInt(url.split("/")[2]);

      // 检查是否有项目关联到该分类
      const projectsCount = await Project.count({ where: { categoryId: id } });
      if (projectsCount > 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: `该分类下有 ${projectsCount} 个项目，无法删除`,
        };
        return;
      }

      const category = await Category.findByPk(id);

      if (!category) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "分类不存在",
        };
        return;
      }

      await category.destroy();
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "分类删除成功",
      };
    } catch (error) {
      console.error("删除分类失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除分类失败",
        error: error.message,
      };
    }
    return;
  }

  // 记录相关路由
  if (method === "GET" && url.startsWith("/commits")) {
    try {
      const { projectId, category, tag, keyword, startTime, endTime } =
        ctx.query;
      const where = {};

      if (projectId) {
        where.projectId = projectId;
      }

      if (category) {
        where.categoryId = category;
      }

      if (keyword) {
        where.content = {
          [Op.like]: `%${keyword}%`,
        };
      }

      if (tag) {
        if (tag === "已更新" || tag === "已提交") {
          where.tags = {
            [Op.like]: `%${tag}%`,
          };
        } else if (tag === "未更新") {
          where.tags = {
            [Op.notLike]: "%已更新%",
          };
        } else if (tag === "未提交") {
          where.tags = {
            [Op.notLike]: "%已提交%",
          };
        }
      }

      // 时间范围筛选
      if (startTime) {
        where.createdAt = {
          ...where.createdAt,
          [Op.gte]: new Date(startTime),
        };
      }

      if (endTime) {
        where.createdAt = {
          ...where.createdAt,
          [Op.lte]: new Date(endTime),
        };
      }
      console.log("where: ", where);
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
      console.error("获取记录列表失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取记录列表失败",
        error: error.message,
      };
    }
    return;
  }

  if (method === "POST" && url === "/commits") {
    try {
      const { projectId, content, category, tags, createdAt, updatedAt } =
        ctx.request.body;
      console.log("创建记录请求参数:", {
        projectId,
        content,
        category,
        tags,
        createdAt,
        updatedAt,
      });

      if (!projectId || !content) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "项目ID和修改内容不能为空",
        };
        return;
      }

      // 检查项目是否存在
      const project = await Project.findByPk(projectId);
      console.log("项目是否存在:", !!project);

      // 检查分类是否存在
      if (category) {
        const categoryExists = await Category.findByPk(category);
        console.log("分类是否存在:", !!categoryExists);
      }

      const commitLog = await CommitLog.create({
        projectId,
        content,
        categoryId: category,
        tags,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      });
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: commitLog,
        message: "记录创建成功",
      };
    } catch (error) {
      console.error("创建记录失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建记录失败",
        error: error.message,
      };
    }
    return;
  }

  if (method === "PUT" && url.match(/^\/commits\/\d+$/)) {
    try {
      const id = parseInt(url.split("/")[2]);
      const { content, category, tags, createdAt, updatedAt } =
        ctx.request.body;

      const commitLog = await CommitLog.findByPk(id);

      if (!commitLog) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "记录不存在",
        };
        return;
      }

      await commitLog.update({
        content,
        categoryId: category,
        tags,
        createdAt: createdAt ? new Date(createdAt) : commitLog.createdAt,
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      });
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: commitLog,
        message: "记录更新成功",
      };
    } catch (error) {
      console.error("更新记录失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "更新记录失败",
        error: error.message,
      };
    }
    return;
  }

  if (method === "DELETE" && url.match(/^\/commits\/\d+$/)) {
    try {
      const id = parseInt(url.split("/")[2]);

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
      console.error("删除记录失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除记录失败",
        error: error.message,
      };
    }
    return;
  }

  if (method === "POST" && url === `/commits/git`) {
    try {
      const { project, id } = ctx.request.body;

      const commitLog = await CommitLog.findByPk(id);
      const path = project.path;
      console.log("path-------->: ", path);
      if (!path) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "路径不存在",
        };
        return;
      }

      const commitMessage = commitLog.content?.trim();

      console.log("commitMessage: ", commitMessage);

      commitGit(path, commitMessage);

      ctx.body = {
        success: true,
        message: "操作成功",
      };
    } catch (error) {
      console.error("操作失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "操作失败",
        error: error.message,
      };
    }
    return;
  }

  // 404 处理
  console.log(`未匹配的请求: ${method} ${url}`);
  ctx.status = 404;
  ctx.body = { success: false, message: "接口不存在" };
});

// 错误处理
app.on("error", (err, ctx) => {
  console.error("服务器错误:", err);
  ctx.status = 500;
  ctx.body = {
    success: false,
    message: "服务器内部错误",
  };
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
