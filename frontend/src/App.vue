<template>
  <div class="app-container">
    <!-- 顶部标题栏 -->
    <div class="app-header">
      <h1>Git 提交日志管理系统</h1>
    </div>

    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filter.category" placeholder="选择分类" @change="handleCategoryChange">
        <el-option label="全部分类" value=""></el-option>
        <el-option v-for="category in categories" :key="category.id" :label="category.name"
          :value="category.id"></el-option>
      </el-select>

      <el-select v-model="filter.projectId" placeholder="选择项目" @change="handleProjectChange">
        <el-option label="全部项目" value=""></el-option>
        <el-option v-for="project in filteredProjects" :key="project.id" :label="project.name"
          :value="project.id"></el-option>
      </el-select>

      <el-select v-model="filter.tag" placeholder="标签筛选" @change="loadCommitLogs">
        <el-option label="全部标签" value=""></el-option>
        <el-option label="已更新" value="已更新"></el-option>
        <el-option label="未更新" value="未更新"></el-option>
        <el-option label="已提交" value="已提交"></el-option>
        <el-option label="未提交" value="未提交"></el-option>
      </el-select>

      <el-date-picker v-model="filter.startTime" type="datetime" placeholder="开始时间" @change="loadCommitLogs"
        format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />

      <el-date-picker v-model="filter.endTime" type="datetime" placeholder="结束时间" @change="loadCommitLogs"
        format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />

      <el-input v-model="filter.keyword" placeholder="关键词搜索" clearable @keyup.enter="loadCommitLogs">
        <template #append>
          <el-button @click="loadCommitLogs"><el-icon>
              <Search />
            </el-icon></el-button>
        </template>
      </el-input>

      <el-button type="primary" @click="openAddDialog"><el-icon>
          <Plus />
        </el-icon> 新增记录</el-button>

      <el-button @click="showProjectDialog = true">
        <el-icon>
          <Setting />
        </el-icon> 项目管理
      </el-button>

      <el-button @click="showCategoryDialog = true">
        <el-icon>
          <Collection />
        </el-icon> 分类管理
      </el-button>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <el-empty v-if="commitLogs.length === 0" description="暂无记录" />
      <el-table v-else :data="commitLogs" style="width: 100%" border>
        <el-table-column type="index" label="序号" width="80">
        </el-table-column>
        <el-table-column prop="projectId" label="项目" width="180">
          <template #default="scope">
            {{ getProjectName(scope.row.projectId) }}
          </template>
        </el-table-column>
        <el-table-column prop="categoryId" label="类别" width="120">
          <template #default="scope">
            {{ getCategoryName(scope.row.categoryId) }}
          </template>
        </el-table-column>
        <el-table-column prop="content" label="提交内容">
          <template #default="scope">
            <div class="content-cell">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="200">
          <template #default="scope">
            <div class="tags-cell" v-if="scope.row.tags">
              <el-tag v-for="tag in (scope.row.tags || '').split(',')" :key="tag" size="small">
                {{ tag }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" @click="editLog(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteLog(scope.row.id)">删除</el-button>
              <el-popconfirm title="确定要提交该条记录吗？" @confirm="handleAutoCommit(scope.row)" confirm-button-text="确定"
                cancel-button-text="取消" type="warning">
                <template #reference>
                  <el-button type="primary">一键提交</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑记录对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingLog ? '编辑记录' : '新增记录'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="left">
        <el-form-item label="类别" prop="category">
          <el-select v-model="form.category" placeholder="选择分类" @change="handleFormCategoryChange">
            <el-option v-for="category in categories" :key="category.id" :label="category.name"
              :value="category.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="项目" prop="projectId">
          <el-select v-model="form.projectId" placeholder="选择项目">
            <el-option v-for="project in formFilteredProjects" :key="project.id" :label="project.name"
              :value="project.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" rows=4 placeholder="请输入修改内容"></el-input>
        </el-form-item>
        <el-form-item label="创建时间" v-if="!editingLog">
          <el-date-picker v-model="form.createdAt" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="更新时间" v-else>
          <el-date-picker v-model="form.updatedAt" type="datetime" placeholder="选择时间" format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="便签">
          <div class="tag-checkbox">
            <el-checkbox v-model="form.checkboxTags" label="已更新" @change="updateTagsFromCheckbox"></el-checkbox>
            <el-checkbox v-model="form.checkboxTags" label="已提交" @change="updateTagsFromCheckbox"></el-checkbox>
          </div>
          <el-input v-model="form.newTag" placeholder="输入自定义标签，按回车添加" @keyup.enter="addCustomTag"></el-input>
          <div class="tag-list" v-if="form.tags.length > 0">
            <el-tag v-for="(tag, index) in form.tags" :key="index" size="small" closable @close="removeTag(index)">{{
              tag
              }}</el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目管理对话框 -->
    <el-dialog v-model="showProjectDialog" title="项目管理" width="85%">
      <div class="dialog-content">
        <el-button type="primary" size="small" @click="showAddProjectDialog = true" style="margin-bottom: 16px;">
          <el-icon>
            <Plus />
          </el-icon> 新增项目
        </el-button>

        <el-table :data="projects" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="项目名称" />
          <el-table-column label="类别" width="120">
            <template #default="scope">
              {{ getCategoryName(scope.row.categoryId) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="path" label="路径" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="editProject(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteProject(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 新增/编辑项目对话框 -->
    <el-dialog v-model="showAddProjectDialog" :title="editingProject ? '编辑项目' : '新增项目'" width="500px">
      <el-form :model="projectForm" :rules="projectRules" ref="projectFormRef">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称"></el-input>
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="projectForm.categoryId" placeholder="选择项目分类">
            <el-option v-for="category in categories" :key="category.id" :label="category.name"
              :value="category.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="projectForm.description" placeholder="请输入项目描述"></el-input>
        </el-form-item>
        <el-form-item label="路径">
          <el-input v-model="projectForm.path" placeholder="请输入项目路径"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddProjectDialog = false">取消</el-button>
          <el-button type="primary" @click="submitProjectForm">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分类管理对话框 -->
    <el-dialog v-model="showCategoryDialog" title="分类管理" width="600px">
      <div class="dialog-content">
        <el-button type="primary" size="small" @click="showAddCategoryDialog = true" style="margin-bottom: 16px;">
          <el-icon>
            <Plus />
          </el-icon> 新增分类
        </el-button>

        <el-table :data="categories" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="分类名称" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="editCategory(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteCategory(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog v-model="showAddCategoryDialog" :title="editingCategory ? '编辑分类' : '新增分类'" width="400px">
      <el-form :model="categoryForm" :rules="categoryRules" ref="categoryFormRef">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddCategoryDialog = false">取消</el-button>
          <el-button type="primary" @click="submitCategoryForm">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Search, Plus, Setting, Collection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus';
import * as api from './api'
import dayjs from 'dayjs'

// 数据
const projects = ref([])
const categories = ref([])
const commitLogs = ref([])

// 生成当天的开始和结束时间
function getTodayStartEnd() {
  // 当天开始时间
  const start = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss')
  // 当天结束时间
  const end = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')

  return {
    start: start,
    end: end
  }
}

const today = getTodayStartEnd()
console.log("today: ", today);
const filter = ref({ projectId: '', category: '', tag: '', keyword: '', startTime: today.start, endTime: today.end })
const showAddDialog = ref(false)
const form = ref({
  projectId: '',
  content: '',
  category: '',
  tags: [],
  checkboxTags: [],
  newTag: '',
  createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
})
const editingLog = ref(null)
const formRef = ref(null)

// 项目管理相关
const showProjectDialog = ref(false)
const showAddProjectDialog = ref(false)
const projectForm = ref({ name: '', description: '', categoryId: '' })
const editingProject = ref(null)
const projectFormRef = ref(null)

// 分类管理相关
const showCategoryDialog = ref(false)
const showAddCategoryDialog = ref(false)
const categoryForm = ref({ name: '' })
const editingCategory = ref(null)
const categoryFormRef = ref(null)

// 规则
const rules = {
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  content: [{ required: true, message: '请输入修改内容', trigger: 'blur' }]
}

const projectRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }]
}

const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 根据筛选栏的分类过滤项目
const filteredProjects = computed(() => {
  if (!filter.value.category) {
    return projects.value
  }
  return projects.value.filter(project => project.categoryId === parseInt(filter.value.category))
})

// 根据表单的分类过滤项目
const formFilteredProjects = computed(() => {
  if (!form.value.category) {
    return []
  }
  return projects.value.filter(project => project.categoryId === parseInt(form.value.category))
})

// 获取分类名称
/* function getCategoryName(categoryId) {
  if (!categoryId) return ''
  const category = categories.value.find(cat => cat.id === parseInt(categoryId))
  return category ? category.name : ''
} */

// 初始化
onMounted(() => {
  loadCategories()
  loadProjects()
  loadCommitLogs()
})

// 加载分类列表
async function loadCategories() {
  try {
    const response = await api.getCategories()
    if (response.success) {
      categories.value = response.data
      console.log('加载分类成功:', categories.value)
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载项目列表
async function loadProjects() {
  try {
    const response = await api.getProjects()
    if (response.success) {
      projects.value = response.data
    }
  } catch (error) {
    console.error('加载项目失败:', error)
  }
}

// 加载提交记录
async function loadCommitLogs() {
  try {
    const response = await api.getCommitLogs(filter.value)
    if (response.success) {
      commitLogs.value = response.data
      console.log('加载记录成功:', commitLogs.value)
    }
  } catch (error) {
    console.error('加载记录失败:', error)
  }
}

// 获取项目名称
function getProjectName(projectId) {
  const project = projects.value.find(p => p.id === projectId)
  return project ? project.name : '未知项目'
}

// 获取分类名称
function getCategoryName(categoryId) {
  if (!categoryId) return '未分类'
  const category = categories.value.find(c => c.id === parseInt(categoryId))
  return category ? category.name : '未分类'
}

// 格式化时间
function formatTime(time) {
  return new Date(time).toLocaleString('zh-CN')
}

// 添加自定义标签
function addCustomTag() {
  if (form.value.newTag) {
    if (!form.value.tags.includes(form.value.newTag)) {
      form.value.tags.push(form.value.newTag)
    }
    form.value.newTag = ''
  }
}

// 移除标签
function removeTag(index) {
  const removedTag = form.value.tags[index]
  form.value.tags.splice(index, 1)
  // 如果移除的标签是复选框标签，也从 checkboxTags 中移除
  if (form.value.checkboxTags.includes(removedTag)) {
    const checkboxIndex = form.value.checkboxTags.indexOf(removedTag)
    form.value.checkboxTags.splice(checkboxIndex, 1)
  }
}

// 从复选框更新标签
function updateTagsFromCheckbox() {
  // 获取所有非复选框标签
  const customTags = form.value.tags.filter(tag => !['已更新', '已提交'].includes(tag))
  // 合并复选框标签和自定义标签
  form.value.tags = [...new Set([...form.value.checkboxTags, ...customTags])]
}

// 打开编辑对话框
function editLog(log) {
  editingLog.value = log
  // 处理标签字段，将字符串转换为数组
  const tagsArray = typeof log.tags === 'string' ? log.tags.split(',').filter(tag => tag) : []
  // 提取复选框标签
  const checkboxTags = tagsArray.filter(tag => ['已更新', '已提交'].includes(tag))
  form.value = {
    ...log,
    category: log.category || log.categoryId,
    tags: tagsArray,
    checkboxTags: checkboxTags,
    newTag: '',
    createdAt: log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  showAddDialog.value = true
}

// 提交表单
async function submitForm() {
  try {
    await formRef.value.validate()

    // 合并复选框标签和自定义标签
    const allTags = [...new Set([...form.value.checkboxTags, ...form.value.tags])]
    const tagsString = allTags.join(',')
    form.value.content = `${editingLog.value ? "" : `【${getProjectName(form.value.projectId)}】`} ${form.value.content}`
    // 创建提交数据
    const submitData = {
      ...form.value,
      tags: tagsString,
      createdAt: form.value.createdAt,
      updatedAt: form.value.updatedAt
    }

    let response
    if (editingLog.value) {
      response = await api.updateCommitLog(editingLog.value.id, submitData)
    } else {
      response = await api.createCommitLog(submitData)
    }

    if (response.success) {
      showAddDialog.value = false
      form.value = {
        projectId: '',
        content: '',
        category: '',
        tags: [],
        checkboxTags: [],
        newTag: ''
      }
      editingLog.value = null
      loadCommitLogs()
    }
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 删除记录
async function deleteLog(id) {
  try {
    const response = await api.deleteCommitLog(id)
    if (response.success) {
      loadCommitLogs()
    }
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 处理分类变更
function handleCategoryChange() {
  // 当分类变更时，清空项目选择、标签筛选、关键词搜索和时间范围
  filter.value.projectId = ''
  filter.value.tag = ''
  filter.value.keyword = ''
  // 重新加载记录
  loadCommitLogs()
}

// 处理项目变更
function handleProjectChange() {
  // 当项目变更时，清空标签筛选、关键词搜索和时间范围
  filter.value.tag = ''
  filter.value.keyword = ''
  // 重新加载记录
  loadCommitLogs()
}

// 处理表单类别变更
function handleFormCategoryChange() {
  // 当类别变更时，清空项目选择
  form.value.projectId = ''
}

// 打开新增对话框
function openAddDialog() {
  editingLog.value = null
  // 默认使用筛选栏中的分类和项目值
  form.value = {
    projectId: filter.value.projectId || '',
    content: '',
    category: filter.value.category || '',
    tags: [],
    checkboxTags: [],
    newTag: '',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  showAddDialog.value = true
}

// 项目管理方法
function editProject(project) {
  editingProject.value = project
  projectForm.value = { ...project, categoryId: project.categoryId || '' }
  showAddProjectDialog.value = true
}

async function submitProjectForm() {
  try {
    await projectFormRef.value.validate()
    let response
    if (editingProject.value) {
      response = await api.updateProject(editingProject.value.id, projectForm.value)
    } else {
      response = await api.createProject(projectForm.value)
    }

    if (response.success) {
      showAddProjectDialog.value = false
      projectForm.value = { name: '', description: '', categoryId: '' }
      editingProject.value = null
      loadProjects()
    }
  } catch (error) {
    console.error('提交失败:', error)
  }
}

async function deleteProject(id) {
  try {

    // 向后端发送接口来删除数据
    await api.deleteProject(id)
    // 这里需要后端提供删除项目的API，暂时只从前端移除
    projects.value = projects.value.filter(p => p.id !== id)
    // 同时更新所有相关记录的项目ID
    commitLogs.value.forEach(log => {
      if (log.projectId === id) {
        log.projectId = null
      }
    })
    // 提示成功
    ElMessage.success('项目删除成功')
  } catch (error) {
    console.error('删除失败:', error)
  }
}

const handleAutoCommit = async (projectInfo) => {
  await api.commitGitAPI(projectInfo)
};

// 分类管理方法
function editCategory(category) {
  editingCategory.value = category
  categoryForm.value = { name: category.name }
  showAddCategoryDialog.value = true
}

async function submitCategoryForm() {
  try {
    await categoryFormRef.value.validate()
    let response
    if (editingCategory.value) {
      response = await api.updateCategory(editingCategory.value.id, categoryForm.value)
    } else {
      response = await api.createCategory(categoryForm.value)
    }

    if (response.success) {
      showAddCategoryDialog.value = false
      categoryForm.value = { name: '' }
      editingCategory.value = null
      loadCategories()
      loadProjects()
    }
  } catch (error) {
    console.error('提交失败:', error)
  }
}

async function deleteCategory(category) {
  try {
    const response = await api.deleteCategory(category.id)
    if (response.success) {
      loadCategories()
      loadProjects()
    }
  } catch (error) {
    console.error('删除失败:', error)
  }
}
</script>

<style scoped>
/* 全局样式 */
* {
  box-sizing: border-box;
}

.app-container {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 顶部标题 */
.app-header {
  text-align: center;
  margin-bottom: 8px;
  padding: 20px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-in-out;
}

.app-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.5s ease-in-out;
  border: 1px solid #e8e8e8;
  align-items: center;
}

.filter-bar .el-select,
.filter-bar .el-input {
  width: 140px;
  border-radius: 8px;
}

.filter-bar .el-button {
  white-space: nowrap;
}

/* 主内容区 */
.main-content {
  margin-top: 8px;
}

/* 表格样式 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-in-out;
  margin-bottom: 20px;
}

/* 移除斑马纹 */
.el-table--striped .el-table__row--striped {
  background-color: #ffffff;
}

.el-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #333;
  padding: 8px 12px;
}

.el-table td {
  vertical-align: middle;
  padding: 8px 12px;
}

.el-table tr:hover {
  background-color: #f5f7fa;
}

/* 表格内容样式 */
.content-cell {
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
  font-weight: bold;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 标签样式 */
.el-tag {
  margin-bottom: 4px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.card-footer {
  margin-top: 0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
}

/* 表格样式 */
.content-cell {
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 按钮样式 */
.el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.el-button--primary:hover {
  opacity: 0.9;
}

/* 表单样式 */
.el-form-item {
  margin-bottom: 20px;
}

.el-form-item__label {
  font-weight: 500;
  color: #333;
}

.el-input,
.el-select,
.el-checkbox-group {
  border-radius: 8px;
}

.el-input__inner,
.el-select__input {
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s ease;
}

.el-input__inner:focus,
.el-select__input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

/* 标签列表 */
.tag-list {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 对话框 */
.el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  margin: 0;
}

.el-dialog__title {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.el-dialog__body {
  padding: 24px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

/* 空状态 */
.el-empty {
  padding: 60px 0;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 12px;
  }

  .app-header h1 {
    font-size: 24px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar .el-select,
  .filter-bar .el-input {
    width: 100%;
    min-width: unset;
  }

  .card-header {
    flex-wrap: wrap;
  }

  .time {
    margin-left: 0;
    width: 100%;
    text-align: right;
  }

  .card-body {
    padding: 16px;
  }

  .card-footer {
    padding: 12px 16px;
  }
}
</style>
