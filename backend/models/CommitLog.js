module.exports = (sequelize, DataTypes) => {
  const CommitLog = sequelize.define('CommitLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      },
      comment: '项目ID'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '修改内容'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '分类'
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '便签，逗号分隔'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    }
  }, {
    tableName: 'commit_logs',
    timestamps: false
  });

  return CommitLog;
};
