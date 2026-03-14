const { Sequelize } = require("sequelize");
const path = require("path");

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../data/logs.db"),
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

// 导入模型
const Project = require("./Project")(sequelize, Sequelize.DataTypes);
const CommitLog = require("./CommitLog")(sequelize, Sequelize.DataTypes);

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
  .sync({ alter: true })
  .then(() => {
    console.log("数据库模型同步成功");
  })
  .catch((err) => {
    console.error("数据库模型同步失败:", err);
  });

module.exports = {
  sequelize,
  Sequelize,
  Project,
  CommitLog,
};
