import axios from "axios";
import { ElMessage } from "element-plus";

// import.meta.env.MODE 在开发时是 'development'，构建后是 'production'
const isDev = import.meta.env.MODE === "development";

// 创建axios实例
const instance = axios.create({
  baseURL: isDev ? "/api" : "",
  timeout: 10000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("请求错误:", error);
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.log("响应错误:", error);
    ElMessage.error(error.message);
    return Promise.reject(error);
  },
);

// API方法
// 项目相关
export async function getProjects() {
  return instance.get("/projects");
}

export async function createProject(data) {
  return instance.post("/projects", data);
}

// 记录相关
export async function getCommitLogs(params) {
  return instance.get("/commits", { params });
}

export async function createCommitLog(data) {
  return instance.post("/commits", data);
}

export async function updateCommitLog(id, data) {
  return instance.put(`/commits/${id}`, data);
}

export async function deleteCommitLog(id) {
  return instance.delete(`/commits/${id}`);
}

// 删除项目
export async function deleteProject(id) {
  return instance.delete(`/projects/${id}`);
}

// 更新项目
export async function updateProject(id, data) {
  return instance.put(`/projects/${id}`, data);
}

// 分类相关
export async function getCategories() {
  return instance.get("/categories");
}

export async function createCategory(data) {
  return instance.post("/categories", data);
}

export async function updateCategory(id, data) {
  return instance.put(`/categories/${id}`, data);
}

export async function deleteCategory(id) {
  return instance.delete(`/categories/${id}`);
}

export async function commitGitAPI(data) {
  return instance.post(`/commits/git`, data);
}
