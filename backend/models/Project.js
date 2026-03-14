module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '项目名称'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '项目描述'
    }
  }, {
    tableName: 'projects',
    timestamps: false
  });

  return Project;
};
