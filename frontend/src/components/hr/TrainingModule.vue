<template>
  <div class="training-module">
    <el-card class="module-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><Reading /></el-icon>
            <span>{{ $t('hr.training.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="handleAddCourse">{{ $t('hr.training.addCourse') }}</el-button>
          </div>
        </div>
      </template>

      <!-- 子标签页 -->
      <el-tabs v-model="activeTab" class="sub-tabs">
        <!-- 课程库 -->
        <el-tab-pane :label="$t('hr.training.courses')" name="courses">
          <!-- 统计卡片 -->
          <div class="stats-cards">
            <div class="stat-item">
              <div class="stat-value">{{ stats.totalCourses || 0 }}</div>
              <div class="stat-label">{{ $t('hr.training.totalCourses') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.totalLearners || 0 }}</div>
              <div class="stat-label">{{ $t('hr.training.totalLearners') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value success">{{ stats.completionRate || 0 }}%</div>
              <div class="stat-label">{{ $t('hr.training.completionRate') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value info">{{ stats.avgScore || 0 }}</div>
              <div class="stat-label">{{ $t('hr.training.avgScore') }}</div>
            </div>
          </div>

          <!-- 筛选 -->
          <div class="filter-bar">
            <el-select v-model="courseFilters.category" placeholder="分类" clearable style="width: 140px; margin-right: 12px;" @change="loadCourses">
              <el-option label="产品培训" value="产品" />
              <el-option label="技能培训" value="技能" />
              <el-option label="入职培训" value="入职" />
              <el-option label="管理培训" value="管理" />
            </el-select>
            <el-input v-model="courseFilters.keyword" :placeholder="$t('hr.training.searchPlaceholder')" clearable style="width: 200px;" @input="loadCourses">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 课程列表 -->
          <el-table :data="courses" stripe v-loading="loading" @row-click="handleCourseRowClick">
            <el-table-column prop="code" label="课程编码" width="120" />
            <el-table-column prop="title" :label="$t('hr.training.courseTitle')" min-width="200" />
            <el-table-column prop="category" :label="$t('hr.training.category')" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.category || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" :label="$t('hr.training.type')" width="120">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.type)" size="small">{{ $t(`hr.training.types.${row.type}`) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="instructor" :label="$t('hr.training.instructor')" width="100" />
            <el-table-column prop="duration" :label="$t('hr.training.duration')" width="100">
              <template #default="{ row }">
                {{ row.duration ? `${row.duration}分钟` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="isRequired" :label="$t('hr.training.isRequired')" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isRequired" type="danger" size="small">{{ $t('hr.training.isRequired') }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('hr.payroll.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'" size="small">
                  {{ $t(`hr.training.courseStatuses.${row.status}`) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" :icon="Edit" @click.stop="handleEditCourse(row)" />
                <el-button v-if="row.status === 'DRAFT'" type="success" size="small" @click.stop="handlePublishCourse(row)">{{ $t('hr.training.publish') }}</el-button>
                <el-button type="info" size="small" @click.stop="handleCourseDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 培训计划 -->
        <el-tab-pane :label="$t('hr.training.plans')" name="plans">
          <div class="filter-bar">
            <el-button type="primary" :icon="Plus" @click="handleAddPlan">{{ $t('hr.training.addPlan') }}</el-button>
          </div>
          <el-table :data="plans" stripe v-loading="loadingPlan">
            <el-table-column prop="name" :label="$t('hr.training.planName')" width="200" />
            <el-table-column :label="$t('hr.training.periodStart')" width="120">
              <template #default="{ row }">
                {{ formatDate(row.periodStart) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('hr.training.periodEnd')" width="120">
              <template #default="{ row }">
                {{ formatDate(row.periodEnd) }}
              </template>
            </el-table-column>
            <el-table-column prop="targetDepartment" :label="$t('hr.training.targetDepartment')" width="120" />
            <el-table-column prop="status" :label="$t('hr.payroll.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="getPlanStatusTag(row.status)" size="small">
                  {{ $t(`hr.training.planStatuses.${row.status}`) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" :label="$t('common.remarks')" show-overflow-tooltip />
            <el-table-column :label="$t('common.operations')" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click.stop="handlePlanDetail(row)">查看课程</el-button>
                <el-button v-if="row.status === 'DRAFT'" type="success" size="small" @click.stop="handlePublishPlan(row)">{{ $t('hr.training.publish') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 我的学习 -->
        <el-tab-pane :label="$t('hr.training.myLearning')" name="my">
          <el-table :data="myRecords" stripe v-loading="loadingMy">
            <el-table-column prop="course.title" :label="$t('hr.training.courseTitle')" min-width="200" />
            <el-table-column prop="course.category" :label="$t('hr.training.category')" width="100" />
            <el-table-column prop="progress" :label="$t('hr.training.updateProgress')" width="180">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :status="row.progress >= 100 ? 'success' : ''" />
              </template>
            </el-table-column>
            <el-table-column prop="score" :label="$t('hr.training.score')" width="100">
              <template #default="{ row }">
                <span v-if="row.score !== null && row.score !== undefined" :class="getScoreClass(row.score)">
                  {{ row.score }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="bestScore" :label="$t('hr.training.bestScore')" width="100">
              <template #default="{ row }">
                {{ row.bestScore ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('hr.payroll.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="getRecordStatusTag(row.status)" size="small">
                  {{ $t(`hr.training.statuses.${row.status}`) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="160" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status !== 'COMPLETED'" type="primary" size="small" @click="handleUpdateProgress(row)">{{ $t('hr.training.updateProgress') }}</el-button>
                <el-button v-if="row.progress >= 100 && row.status !== 'COMPLETED'" type="success" size="small" @click="handleSubmitExam(row)">{{ $t('hr.training.submitExam') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 课程编辑对话框 -->
    <el-dialog
      v-model="showCourseDialog"
      :title="editingCourse ? $t('common.edit') : $t('hr.training.addCourse')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form ref="courseFormRef" :model="courseForm" :rules="courseRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.courseTitle')" prop="title">
              <el-input v-model="courseForm.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.category')">
              <el-input v-model="courseForm.category" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.type')" prop="type">
              <el-select v-model="courseForm.type" style="width: 100%;">
                <el-option label="视频课程" value="VIDEO" />
                <el-option label="文档课程" value="DOCUMENT" />
                <el-option label="线下培训" value="OFFLINE" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.duration')">
              <el-input-number v-model="courseForm.duration" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.instructor')">
              <el-input v-model="courseForm.instructor" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.passingScore')">
              <el-input-number v-model="courseForm.passingScore" :min="0" :max="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.cost')">
              <el-input-number v-model="courseForm.cost" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.isRequired')">
              <el-switch v-model="courseForm.isRequired" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 发布范围 -->
        <el-form-item :label="$t('hr.training.targetScope') || '发布范围'">
          <el-radio-group v-model="targetScope" size="default" style="margin-bottom: 8px;">
            <el-radio-button value="ALL">全员可见</el-radio-button>
            <el-radio-button value="DEPT">指定部门</el-radio-button>
            <el-radio-button value="USERS">指定人员</el-radio-button>
          </el-radio-group>
          <el-select
            v-if="targetScope === 'DEPT'"
            v-model="courseForm.targetDepartments"
            multiple
            filterable
            collapse-tags
            placeholder="选择可见部门（留空=全员）"
            style="width: 100%; margin-top: 6px;"
          >
            <el-option
              v-for="d in departmentOptions"
              :key="d.code"
              :label="d.name"
              :value="d.code"
            />
          </el-select>
          <el-select
            v-if="targetScope === 'USERS'"
            v-model="courseForm.targetUserIds"
            multiple
            filterable
            collapse-tags
            placeholder="选择可见人员"
            style="width: 100%; margin-top: 6px;"
          >
            <el-option
              v-for="e in employeeOptions"
              :key="e.id"
              :label="e.nickname || e.username"
              :value="e.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="视频链接" v-if="courseForm.type === 'VIDEO'">
          <el-input v-model="courseForm.videoUrl" placeholder="请输入视频URL或上传视频" />
        </el-form-item>
        <el-form-item label="上传视频" v-if="courseForm.type === 'VIDEO'">
          <el-upload
            ref="videoUploadRef"
            :auto-upload="false"
            :limit="1"
            accept="video/*"
            :on-change="handleVideoChange"
            :on-remove="handleVideoRemove"
          >
            <el-button type="primary">选择视频文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 mp4、webm、ogg 格式，最大 500MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="courseForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCourseDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveCourse" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 计划编辑对话框 -->
    <el-dialog
      v-model="showPlanDialog"
      :title="editingPlan ? $t('common.edit') : $t('hr.training.addPlan')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-width="140px">
        <el-form-item :label="$t('hr.training.planName')" prop="name">
          <el-input v-model="planForm.name" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.periodStart')" prop="periodStart">
              <el-date-picker v-model="planForm.periodStart" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.periodEnd')" prop="periodEnd">
              <el-date-picker v-model="planForm.periodEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.targetDepartment')">
              <el-input v-model="planForm.targetDepartment" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hr.training.targetPosition')">
              <el-input v-model="planForm.targetPosition" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="planForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPlanDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSavePlan" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 课程详情对话框 -->
    <el-dialog
      v-model="showCourseDetailDialog"
      title="课程详情"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="900px"
    >
      <div v-if="currentCourse" class="course-detail">
        <div class="course-header">
          <h3>{{ currentCourse.title }}</h3>
          <el-tag :type="getTypeTag(currentCourse.type)" size="small">
            {{ $t(`hr.training.types.${currentCourse.type}`) }}
          </el-tag>
        </div>
        
        <!-- 视频播放器 -->
        <div v-if="currentCourse.type === 'VIDEO' && currentCourse.videoUrl" class="video-player-container">
          <video ref="videoPlayer" :src="currentCourse.videoUrl" controls class="video-player"></video>
        </div>
        <div v-else-if="currentCourse.type === 'VIDEO' && !currentCourse.videoUrl" class="no-video">
          <el-empty description="暂无视频" />
        </div>
        
        <!-- 课程信息 -->
        <div class="course-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="课程编码">{{ currentCourse.code }}</el-descriptions-item>
            <el-descriptions-item label="课程分类">
              <el-tag size="small">{{ currentCourse.category || '-' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="讲师">{{ currentCourse.instructor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="课程时长">{{ currentCourse.duration ? `${currentCourse.duration}分钟` : '-' }}</el-descriptions-item>
            <el-descriptions-item label="及格分数">{{ currentCourse.passingScore }}</el-descriptions-item>
            <el-descriptions-item label="是否必修">
              <el-tag v-if="currentCourse.isRequired" type="danger" size="small">必修</el-tag>
              <span v-else>选修</span>
            </el-descriptions-item>
            <el-descriptions-item label="课程费用">¥{{ currentCourse.cost || 0 }}</el-descriptions-item>
            <el-descriptions-item label="课程状态">
              <el-tag :type="currentCourse.status === 'PUBLISHED' ? 'success' : 'info'" size="small">
                {{ $t(`hr.training.courseStatuses.${currentCourse.status}`) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <div v-if="currentCourse.description" class="course-description">
            <h4>课程描述</h4>
            <p>{{ currentCourse.description }}</p>
          </div>
          
          <!-- 视频URL编辑 -->
          <div v-if="currentCourse.type === 'VIDEO'" class="video-url-section">
            <h4>视频链接</h4>
            <div class="video-url-input">
              <el-input v-model="videoUrlInput" placeholder="请输入视频URL" clearable />
              <el-button type="primary" @click="handleUpdateVideoUrl" :loading="updatingVideoUrl">
                更新视频
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCourseDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleEnrollCourse" v-if="currentCourse && currentCourse.status === 'PUBLISHED'">
          {{ $t('hr.training.enrollCourse') || '立即学习' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 进度更新对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      :title="$t('hr.training.updateProgress')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="400px"
    >
      <el-form label-width="100px">
        <el-form-item :label="$t('hr.training.updateProgress')">
          <el-slider v-model="progressValue" :min="0" :max="100" :step="5" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProgressDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveProgress" :loading="saving">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 考试提交对话框 -->
    <el-dialog
      v-model="showExamDialog"
      :title="$t('hr.training.submitExam')"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
      width="400px"
    >
      <el-form label-width="100px">
        <el-form-item :label="$t('hr.training.score')">
          <el-input-number v-model="examScore" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExamDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmitExamScore" :loading="saving">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Search, Reading } from '@element-plus/icons-vue'
import {
  getTrainingCourses, createTrainingCourse, updateTrainingCourse, publishTrainingCourse,
  getTrainingPlans, createTrainingPlan, getMyTrainingRecords,
  updateLearningProgress, submitTrainingExam, getTrainingStats,
  uploadTrainingCourseWithVideo,
  type HrTrainingCourse, type HrTrainingPlan, type HrTrainingRecord, type TrainingStats,
} from '../../api/hr'
import { getDepartments } from '../../api/permissions'
import { getEmployeeOptions } from '../../api/employees'

const { t } = useI18n()

const loading = ref(false)
const loadingPlan = ref(false)
const loadingMy = ref(false)
const saving = ref(false)
const activeTab = ref('courses')

// 统计数据
const stats = ref<TrainingStats>({ total: 0, completed: 0, completionRate: 0, avgProgress: 0, avgScore: 0, totalCourses: 0, totalLearners: 0 })

// 课程相关
const courses = ref<HrTrainingCourse[]>([])
const courseFilters = reactive({ category: '', keyword: '' })
const showCourseDialog = ref(false)
const editingCourse = ref<HrTrainingCourse | null>(null)
const courseFormRef = ref()
const courseForm = reactive({
  title: '', code: '', category: '', type: 'VIDEO' as 'VIDEO' | 'DOCUMENT' | 'OFFLINE',
  duration: 60, instructor: '', passingScore: 60, cost: 0, isRequired: false,
  videoUrl: '', description: '',
  targetDepartments: [] as string[], targetUserIds: [] as number[],
})
const courseRules = {
  title: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择课程类型', trigger: 'change' }],
}

// 计划相关
const plans = ref<HrTrainingPlan[]>([])
const showPlanDialog = ref(false)
const editingPlan = ref<HrTrainingPlan | null>(null)
const planFormRef = ref()
const planForm = reactive({
  name: '', periodStart: '', periodEnd: '', targetDepartment: '', targetPosition: '', description: '',
})
const planRules = {
  name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  periodStart: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  periodEnd: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
}

// 我的学习
const myRecords = ref<HrTrainingRecord[]>([])
const showProgressDialog = ref(false)
const showExamDialog = ref(false)
const progressRecord = ref<HrTrainingRecord | null>(null)
const progressValue = ref(0)
const examScore = ref(60)

// 课程详情
const showCourseDetailDialog = ref(false)
const currentCourse = ref<HrTrainingCourse | null>(null)
const videoPlayer = ref<HTMLVideoElement | null>(null)
const videoUrlInput = ref('')
const updatingVideoUrl = ref(false)

// 视频上传
const videoUploadRef = ref()
const selectedVideoFile = ref<File | null>(null)
const videoUploading = ref(false)

const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  return new Date(date).toISOString().split('T')[0]
}

const getTypeTag = (type: string): string => {
  const map: Record<string, string> = { VIDEO: 'primary', DOCUMENT: 'warning', OFFLINE: 'success' }
  return map[type] || 'info'
}

const getPlanStatusTag = (status: string): string => {
  const map: Record<string, string> = { DRAFT: 'info', PUBLISHED: 'success', CLOSED: '' }
  return map[status] || 'info'
}

const getRecordStatusTag = (status: string): string => {
  const map: Record<string, string> = { NOT_STARTED: 'info', IN_PROGRESS: 'primary', COMPLETED: 'success', FAILED: 'danger' }
  return map[status] || 'info'
}

const getScoreClass = (score: number): string => {
  if (score >= 90) return 'score-excellent'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
}

const loadCourses = async () => {
  loading.value = true
  try {
    courses.value = await getTrainingCourses(courseFilters.category ? { category: courseFilters.category } : undefined)
    stats.value = await getTrainingStats()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

const loadPlans = async () => {
  loadingPlan.value = true
  try {
    plans.value = await getTrainingPlans()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loadingPlan.value = false
  }
}

const loadMyRecords = async () => {
  loadingMy.value = true
  try {
    myRecords.value = await getMyTrainingRecords()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    loadingMy.value = false
  }
}

// 课程操作
const handleAddCourse = () => {
  editingCourse.value = null
  const code = 'C' + Date.now().toString(36).toUpperCase()
  Object.assign(courseForm, {
    title: '', code, category: '', type: 'VIDEO', duration: 60, instructor: '',
    passingScore: 60, cost: 0, isRequired: false, videoUrl: '', description: '',
    targetDepartments: [], targetUserIds: [],
  })
  targetScope.value = 'ALL'
  showCourseDialog.value = true
}

const handleEditCourse = (row: HrTrainingCourse) => {
  editingCourse.value = row
  Object.assign(courseForm, { ...row })
  if (row.targetUserIds && row.targetUserIds.length > 0) {
    targetScope.value = 'USERS'
  } else if (row.targetDepartments && row.targetDepartments.length > 0) {
    targetScope.value = 'DEPT'
  } else {
    targetScope.value = 'ALL'
  }
  showCourseDialog.value = true
}

const handleCourseRowClick = (row: HrTrainingCourse) => {
  handleCourseDetail(row)
}

const handleCourseDetail = async (row: HrTrainingCourse) => {
  currentCourse.value = row
  videoUrlInput.value = row.videoUrl || ''
  showCourseDetailDialog.value = true
}

const handleEnrollCourse = async () => {
  if (!currentCourse.value) return
  try {
    // 开始学习
    await updateLearningProgress(currentCourse.value.id, { progress: 0 })
    ElMessage.success('已开始学习')
    showCourseDetailDialog.value = false
    loadMyRecords()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

const handleUpdateVideoUrl = async () => {
  if (!currentCourse.value) return
  try {
    updatingVideoUrl.value = true
    await updateTrainingCourse(currentCourse.value.id, { videoUrl: videoUrlInput.value })
    ElMessage.success('视频链接已更新')
    loadCourses()
    if (currentCourse.value) {
      currentCourse.value.videoUrl = videoUrlInput.value
    }
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    updatingVideoUrl.value = false
  }
}

const handleSaveCourse = async () => {
  if (!courseFormRef.value) return
  try {
    await courseFormRef.value.validate()
    saving.value = true
    
    // 如果有选择视频文件，先上传
    let finalForm = { ...courseForm }
    if (selectedVideoFile.value) {
      const formData = new FormData()
      formData.append('video', selectedVideoFile.value)
      formData.append('courseData', JSON.stringify(courseForm))
      // 使用特殊接口上传视频课程
      const uploaded = await uploadTrainingCourseWithVideo(formData)
      finalForm = uploaded
    }
    
    if (editingCourse.value) {
      await updateTrainingCourse(editingCourse.value.id, finalForm)
    } else {
      await createTrainingCourse(finalForm)
    }
    ElMessage.success(t('common.success'))
    showCourseDialog.value = false
    loadCourses()
  } catch (error: any) {
    if (error !== false) ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

// 视频文件选择
const handleVideoChange = (file: any) => {
  selectedVideoFile.value = file.raw
}

// 视频文件移除
const handleVideoRemove = () => {
  selectedVideoFile.value = null
}

const handlePublishCourse = async (row: HrTrainingCourse) => {
  try {
    await publishTrainingCourse(row.id)
    ElMessage.success(t('common.success'))
    loadCourses()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 计划操作
const handleAddPlan = () => {
  editingPlan.value = null
  Object.assign(planForm, {
    name: '', periodStart: '', periodEnd: '', targetDepartment: '', targetPosition: '', description: '',
  })
  showPlanDialog.value = true
}

const handlePlanDetail = (row: HrTrainingPlan) => {
  ElMessage.info(`计划详情: ${row.name}`)
}

const handleSavePlan = async () => {
  if (!planFormRef.value) return
  try {
    await planFormRef.value.validate()
    saving.value = true
    await createTrainingPlan(planForm as any)
    ElMessage.success(t('common.success'))
    showPlanDialog.value = false
    loadPlans()
  } catch (error: any) {
    if (error !== false) ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const handlePublishPlan = async (row: HrTrainingPlan) => {
  ElMessage.info('发布计划功能待实现')
}

// 学习记录操作
const handleUpdateProgress = (row: HrTrainingRecord) => {
  progressRecord.value = row
  progressValue.value = row.progress
  showProgressDialog.value = true
}

const handleSaveProgress = async () => {
  if (!progressRecord.value) return
  try {
    saving.value = true
    await updateLearningProgress(progressRecord.value.courseId, { progress: progressValue.value })
    ElMessage.success(t('common.success'))
    showProgressDialog.value = false
    loadMyRecords()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const handleSubmitExam = (row: HrTrainingRecord) => {
  progressRecord.value = row
  examScore.value = 60
  showExamDialog.value = true
}

const handleSubmitExamScore = async () => {
  if (!progressRecord.value) return
  try {
    saving.value = true
    await submitTrainingExam(progressRecord.value.courseId, { score: examScore.value })
    ElMessage.success(t('common.success'))
    showExamDialog.value = false
    loadMyRecords()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const departmentOptions = ref<{ code: string; name: string }[]>([])
const employeeOptions = ref<any[]>([])
const targetScope = ref<'ALL' | 'DEPT' | 'USERS'>('ALL')

const loadSelectors = async () => {
  try {
    const [deptRes, empRes] = await Promise.all([
      getDepartments(),
      getEmployeeOptions(),
    ])
    departmentOptions.value = deptRes.departments.map((d: any) => ({ code: d.code, name: d.name }))
    employeeOptions.value = empRes
    if (departmentOptions.value.length === 0) {
      console.warn('[TrainingModule] 部门列表为空，可能是权限不足')
    }
    if (employeeOptions.value.length === 0) {
      console.warn('[TrainingModule] 员工列表为空，可能是权限不足或无在职员工')
    }
  } catch (error: any) {
    console.error('[TrainingModule] 加载发布范围选项失败:', error?.message || error)
    ElMessage.warning(t('hr.training.loadScopeFailed') || '加载发布范围选项失败，请检查权限')
  }
}

onMounted(() => {
  loadCourses()
  loadPlans()
  loadMyRecords()
  loadSelectors()
})
</script>

<style scoped lang="scss">
.training-module {
  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #1d1d1f;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .sub-tabs {
      margin-top: 16px;
    }

    .stats-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;

      .stat-item {
        flex: 1;
        text-align: center;

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1d1d1f;
          &.success { color: #67c23a; }
          &.info { color: #409eff; }
        }

        .stat-label {
          font-size: 12px;
          color: #86868b;
          margin-top: 4px;
        }
      }
    }

    .filter-bar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
  }
}

.score-excellent { color: #67c23a; font-weight: 600; }
.score-pass { color: #409eff; font-weight: 600; }
.score-fail { color: #f56c6c; font-weight: 600; }

.course-detail {
  .course-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .video-player-container {
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
    
    .video-player {
      width: 100%;
      max-height: 450px;
      display: block;
    }
  }
  
  .no-video {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 40px;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .course-info {
    .course-description {
      margin-top: 20px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
      
      p {
        margin: 0;
        color: #606266;
        line-height: 1.6;
      }
    }
    
    .video-url-section {
      margin-top: 20px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
      
      .video-url-input {
        display: flex;
        gap: 12px;
        
        .el-input {
          flex: 1;
        }
      }
    }
  }
}
</style>