<template>
  <div class="self-service-page page-content-enter">
    <h1 class="page-title fade-in-up">{{ $t('selfService.title') }}</h1>

    <el-card class="main-card fade-in-delay-2">
      <!-- 子标签切换 -->
      <div class="sub-tabs">
        <el-radio-group v-model="activeTab">
          <el-radio-button value="attendance">
            <el-icon><Clock /></el-icon>
            {{ $t('selfService.tabs.attendance') }}
          </el-radio-button>
          <el-radio-button value="payroll" v-if="canViewPayroll">
            <el-icon><Money /></el-icon>
            {{ $t('selfService.tabs.payroll') }}
          </el-radio-button>
          <el-radio-button value="training">
            <el-icon><Reading /></el-icon>
            {{ $t('selfService.tabs.training') }}
          </el-radio-button>
          <el-radio-button value="performance">
            <el-icon><TrendCharts /></el-icon>
            {{ $t('selfService.tabs.performance') }}
          </el-radio-button>
          <el-radio-button value="recruitment" v-if="canSubmitRecruitment">
            <el-icon><Briefcase /></el-icon>
            {{ $t('selfService.tabs.recruitment') }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- ====== 考勤与请假 ====== -->
      <div v-show="activeTab === 'attendance'">
        <el-tabs v-model="attendanceSubTab" class="inner-tabs">
          <el-tab-pane name="records">
            <template #label>
              <el-icon><List /></el-icon>
              {{ $t('selfService.attendance.myRecords') }}
            </template>
            <div class="stats-row" style="margin-bottom: 16px;">
              <div class="stat-item">
                <div class="stat-value">{{ myAttendanceStats.total || 0 }}</div>
                <div class="stat-label">{{ $t('selfService.attendance.totalDays') }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value success">{{ myAttendanceStats.present || 0 }}</div>
                <div class="stat-label">{{ $t('selfService.attendance.present') }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value warning">{{ myAttendanceStats.late || 0 }}</div>
                <div class="stat-label">{{ $t('selfService.attendance.late') }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value info">{{ myAttendanceStats.overtime || 0 }}</div>
                <div class="stat-label">{{ $t('selfService.attendance.overtime') }}</div>
              </div>
            </div>
            <div class="filter-bar">
              <el-date-picker
                v-model="attDateRange"
                type="daterange"
                range-separator="~"
                :start-placeholder="$t('selfService.attendance.startDate')"
                :end-placeholder="$t('selfService.attendance.endDate')"
                value-format="YYYY-MM-DD"
                style="width: 240px; margin-right: 12px;"
                @change="loadMyAttendance"
              />
              <el-select
                v-model="attStatusFilter"
                :placeholder="$t('selfService.attendance.filterByStatus')"
                clearable
                style="width: 140px; margin-right: 12px;"
                @change="loadMyAttendance"
              >
                <el-option :label="$t('selfService.attendance.all')" value="" />
                <el-option :label="$t('selfService.attendance.statusTypes.present')" value="present" />
                <el-option :label="$t('selfService.attendance.statusTypes.late')" value="late" />
                <el-option :label="$t('selfService.attendance.statusTypes.earlyLeave')" value="early_leave" />
                <el-option :label="$t('selfService.attendance.status.absent')" value="absent" />
                <el-option :label="$t('selfService.attendance.status.overtime')" value="overtime" />
                <el-option :label="$t('selfService.attendance.status.leave')" value="leave" />
              </el-select>
              <el-button :icon="Refresh" @click="loadMyAttendance">{{ $t('common.refresh') }}</el-button>
            </div>
            <el-table :data="myAttendanceRecords" stripe v-loading="attLoading" max-height="360" style="margin-top: 12px;">
              <el-table-column prop="date" :label="$t('selfService.attendance.date')" width="120" />
              <el-table-column prop="checkInTime" :label="$t('selfService.attendance.checkIn')" width="100" />
              <el-table-column prop="checkOutTime" :label="$t('selfService.attendance.checkOut')" width="100" />
              <el-table-column :label="$t('selfService.attendance.statusText')" width="110">
                <template #default="{ row }">
                  <el-tag :type="getAttStatusType(row.status)" size="small">{{ getAttStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lateMinutes" :label="$t('selfService.attendance.lateMinutes')" width="90" />
              <el-table-column prop="overtimeMinutes" :label="$t('selfService.attendance.overtimeMinutes')" width="90" />
              <el-table-column prop="remarks" :label="$t('selfService.attendance.remarks')" min-width="140" show-overflow-tooltip />
            </el-table>
            <el-pagination
              v-if="attPagination.total > 0"
              v-model:current-page="attPagination.page"
              v-model:page-size="attPagination.pageSize"
              :total="attPagination.total"
              layout="prev, pager, next, total"
              @current-change="loadMyAttendance"
              style="margin-top: 12px; justify-content: flex-end;"
            />
          </el-tab-pane>

          <el-tab-pane name="leave">
            <template #label>
              <el-icon><Calendar /></el-icon>
              {{ $t('selfService.attendance.leaveRequest') }}
              <el-badge :value="pendingLeaveCount" class="tab-badge" type="warning" v-if="pendingLeaveCount > 0" />
            </template>
            <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
              <el-button type="primary" :icon="Plus" @click="openLeaveDialog">
                {{ $t('selfService.attendance.submitLeave') }}
              </el-button>
            </div>
            <el-table :data="myLeaveRequests" stripe v-loading="leaveLoading" max-height="400">
              <el-table-column prop="leaveType" :label="$t('selfService.attendance.leaveType')" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ getLeaveTypeLabel(row.leaveType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('selfService.attendance.dateRange')" width="220">
                <template #default="{ row }">
                  {{ row.startDate }} ~ {{ row.endDate }} ({{ row.days }} {{ $t('selfService.attendance.days') }})
                </template>
              </el-table-column>
              <el-table-column prop="reason" :label="$t('selfService.attendance.reason')" min-width="160" show-overflow-tooltip />
              <el-table-column :label="$t('selfService.attendance.status')" width="100">
                <template #default="{ row }">
                  <el-tag :type="getLeaveStatusType(row.status)" size="small">{{ getLeaveStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('selfService.attendance.approver')" width="100">
                <template #default="{ row }">
                  <span>{{ row.approverName || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" :label="$t('selfService.attendance.createdAt')" width="160">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column :label="$t('common.operations')" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button type="danger" size="small" v-if="row.status === 'pending'" @click="handleCancelLeave(row)">
                    {{ $t('selfService.attendance.cancel') }}
                  </el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty :description="$t('selfService.attendance.noLeaveRequests')" :image-size="60" />
              </template>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- ====== 薪资明细 ====== -->
      <div v-show="activeTab === 'payroll'">
        <el-alert
          :title="$t('selfService.payroll.tip')"
          type="info" :closable="false"
          style="margin-bottom: 16px; border-radius: 8px;"
        />
        <el-table :data="myPayrollRecords" stripe v-loading="payrollLoading" max-height="480">
          <el-table-column prop="period" :label="$t('selfService.payroll.period')" width="100" />
          <el-table-column prop="employeeName" :label="$t('selfService.payroll.employeeName')" width="100" />
          <el-table-column prop="department" :label="$t('selfService.payroll.department')" width="120" />
          <el-table-column :label="$t('selfService.payroll.baseSalary')" width="110" align="right">
            <template #default="{ row }">{{ formatCurrency(row.baseSalary) }}</template>
          </el-table-column>
          <el-table-column :label="$t('selfService.payroll.performanceSalary')" width="130" align="right">
            <template #default="{ row }">{{ formatCurrency(row.performanceSalary) }}</template>
          </el-table-column>
          <el-table-column :label="$t('selfService.payroll.grossSalary')" width="110" align="right">
            <template #default="{ row }"><strong>{{ formatCurrency(row.grossSalary) }}</strong></template>
          </el-table-column>
          <el-table-column :label="$t('selfService.payroll.totalDeductions')" width="130" align="right">
            <template #default="{ row }"><span style="color: #f56c6c;">{{ formatCurrency(row.totalDeductions) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('selfService.payroll.netSalary')" width="110" align="right">
            <template #default="{ row }"><strong style="color: #67c23a;">{{ formatCurrency(row.netSalary) }}</strong></template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('selfService.payroll.statusText')" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'paid' ? 'success' : 'warning'" size="small">{{ getPayrollStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty :description="$t('selfService.payroll.noRecords')" :image-size="60" />
          </template>
        </el-table>
      </div>

      <!-- ====== 培训与学习 ====== -->
      <div v-show="activeTab === 'training'">
        <el-tabs v-model="trainingSubTab" class="inner-tabs">
          <el-tab-pane name="my">
            <template #label>
              <el-icon><Reading /></el-icon>
              {{ $t('selfService.training.myLearning') }}
            </template>
            <el-table :data="myTrainingRecords" stripe v-loading="myTrainingLoading" max-height="440">
              <el-table-column prop="course" :label="$t('selfService.training.courseName')" min-width="180">
                <template #default="{ row }">{{ row.course?.title || '-' }}</template>
              </el-table-column>
              <el-table-column prop="plan" :label="$t('selfService.training.planName')" width="160">
                <template #default="{ row }">{{ row.plan?.name || '-' }}</template>
              </el-table-column>
              <el-table-column :label="$t('selfService.training.progress')" width="150">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress || 0" :stroke-width="8" />
                </template>
              </el-table-column>
              <el-table-column prop="examScore" :label="$t('selfService.training.examScore')" width="100" align="center">
                <template #default="{ row }">
                  <span v-if="row.score !== undefined && row.score !== null">{{ row.score }}分</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" :label="$t('selfService.training.statusText')" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'COMPLETED' ? 'success' : row.status === 'IN_PROGRESS' ? 'primary' : 'info'" size="small">
                    {{ getTrainingStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.operations')" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="(row.progress || 0) < 100" type="primary" size="small" @click="openTrainingProgressDialog(row)">
                    {{ $t('selfService.training.updateProgress') }}
                  </el-button>
                  <span v-else style="color: #67c23a; font-size: 12px;">{{ $t('selfService.training.completed') }}</span>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty :description="$t('selfService.training.noRecords')" :image-size="60" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="request">
            <template #label>
              <el-icon><Plus /></el-icon>
              {{ $t('selfService.training.applyForCourse') }}
            </template>
            <div class="filter-bar" style="margin-bottom: 12px;">
              <el-input
                v-model="courseKeyword"
                :placeholder="$t('selfService.training.searchCoursePlaceholder')"
                clearable
                style="width: 240px; margin-right: 12px;"
                @input="loadAvailableCourses"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-button :icon="Refresh" @click="loadAvailableCourses">{{ $t('common.refresh') }}</el-button>
            </div>
            <el-table :data="availableCourses" stripe v-loading="coursesLoading" max-height="400">
              <el-table-column prop="title" :label="$t('selfService.training.courseName')" min-width="180" />
              <el-table-column prop="category" :label="$t('selfService.training.category')" width="120" />
              <el-table-column prop="instructor" :label="$t('selfService.training.trainer')" width="100" />
              <el-table-column prop="duration" :label="$t('selfService.training.duration')" width="90" align="center">
                <template #default="{ row }">{{ row.durationHours || row.duration || '-' }}h</template>
              </el-table-column>
              <el-table-column :label="$t('selfService.training.statusText')" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'" size="small">
                    {{ row.status === 'PUBLISHED' ? $t('selfService.training.published') : $t('selfService.training.draft') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.operations')" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="applyForCourse(row)">
                    {{ $t('selfService.training.apply') }}
                  </el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty :description="$t('selfService.training.noCourses')" :image-size="60" />
              </template>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- ====== 我的绩效 ====== -->
      <div v-show="activeTab === 'performance'">
        <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
          <el-select
            v-model="perfPeriodFilter"
            :placeholder="$t('selfService.performance.selectPeriod')"
            clearable
            style="width: 160px; margin-right: 12px;"
            @change="loadMyPerformance"
          >
            <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
          </el-select>
          <el-button :icon="Refresh" @click="loadMyPerformance">{{ $t('common.refresh') }}</el-button>
        </div>
        <el-table :data="myPerformanceRecords" stripe v-loading="perfLoading" max-height="400">
          <el-table-column prop="period" :label="$t('selfService.performance.period')" width="100" />
          <el-table-column prop="employeeName" :label="$t('selfService.performance.employeeName')" width="110" />
          <el-table-column prop="department" :label="$t('selfService.performance.department')" width="120" />
          <el-table-column :label="$t('selfService.performance.selfScore')" width="110" align="center">
            <template #default="{ row }"><span>{{ row.selfScore ?? '-' }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('selfService.performance.supervisorScore')" width="130" align="center">
            <template #default="{ row }"><span>{{ row.supervisorScore ?? '-' }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('selfService.performance.finalScore')" width="110" align="center">
            <template #default="{ row }"><strong>{{ row.finalScore ?? '-' }}</strong></template>
          </el-table-column>
          <el-table-column :label="$t('selfService.performance.rating')" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.rating" :type="getRatingType(row.rating)" size="small">{{ row.rating }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('selfService.performance.statusText')" width="100">
            <template #default="{ row }">
              <el-tag :type="getPerfStatusType(row.status)" size="small">{{ getPerfStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.operations')" width="140" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'draft'" type="primary" size="small" @click="openSelfReviewDialog(row)">
                {{ $t('selfService.performance.submitSelfReview') }}
              </el-button>
              <el-button type="info" size="small" @click="viewPerfDetail(row)">
                {{ $t('selfService.performance.viewDetail') }}
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty :description="$t('selfService.performance.noRecords')" :image-size="60" />
          </template>
        </el-table>
      </div>

      <!-- ====== 招聘需求 ====== -->
      <div v-show="activeTab === 'recruitment'">
        <div class="filter-bar" style="margin-bottom: 16px; justify-content: flex-end;">
          <el-button type="primary" :icon="Plus" @click="openRecruitDemandDialog">
            {{ $t('selfService.recruitment.submitDemand') }}
          </el-button>
        </div>
        <el-table :data="myRecruitDemands" stripe v-loading="recruitLoading" max-height="400">
          <el-table-column prop="department" :label="$t('selfService.recruitment.department')" width="130" />
          <el-table-column prop="position" :label="$t('selfService.recruitment.position')" width="130" />
          <el-table-column prop="headcount" :label="$t('selfService.recruitment.headcount')" width="90" align="center" />
          <el-table-column prop="reason" :label="$t('selfService.recruitment.reason')" min-width="180" show-overflow-tooltip />
          <el-table-column :label="$t('selfService.recruitment.statusText')" width="100">
            <template #default="{ row }">
              <el-tag :type="getDemandStatusType(row.status)" size="small">{{ getDemandStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" :label="$t('selfService.recruitment.createdAt')" width="160">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <template #empty>
            <el-empty :description="$t('selfService.recruitment.noDemands')" :image-size="60" />
          </template>
        </el-table>
      </div>
    </el-card>

    <!-- ====== 提交请假对话框 ====== -->
    <el-dialog
      v-model="showLeaveDialog"
      :title="$t('selfService.attendance.submitLeave')"
      width="560px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
    >
      <el-form ref="leaveFormRef" :model="leaveForm" :rules="leaveRules" label-width="120px">
        <el-form-item :label="$t('selfService.attendance.leaveType')" prop="leaveType">
          <el-select v-model="leaveForm.leaveType" style="width: 100%;">
            <el-option :label="$t('selfService.attendance.leaveTypes.annual')" value="annual" />
            <el-option :label="$t('selfService.attendance.leaveTypes.sick')" value="sick" />
            <el-option :label="$t('selfService.attendance.leaveTypes.personal')" value="personal" />
            <el-option :label="$t('selfService.attendance.leaveTypes.maternity')" value="maternity" />
            <el-option :label="$t('selfService.attendance.leaveTypes.paternity')" value="paternity" />
            <el-option :label="$t('selfService.attendance.leaveTypes.marriage')" value="marriage" />
            <el-option :label="$t('selfService.attendance.leaveTypes.bereavement')" value="bereavement" />
            <el-option :label="$t('selfService.attendance.leaveTypes.unpaid')" value="unpaid" />
            <el-option :label="$t('selfService.attendance.leaveTypes.other')" value="other" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('selfService.attendance.startDate')" prop="startDate">
              <el-date-picker v-model="leaveForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('selfService.attendance.endDate')" prop="endDate">
              <el-date-picker v-model="leaveForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('selfService.attendance.days')" prop="days">
          <el-input-number v-model="leaveForm.days" :min="1" :max="30" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('selfService.attendance.reason')">
          <el-input v-model="leaveForm.reason" type="textarea" :rows="3" :placeholder="$t('selfService.attendance.reasonPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLeaveDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="leaveSaving" @click="handleSubmitLeave">{{ $t('common.submit') }}</el-button>
      </template>
    </el-dialog>

    <!-- ====== 招聘需求对话框 ====== -->
    <el-dialog
      v-model="showRecruitDialog"
      :title="$t('selfService.recruitment.submitDemand')"
      width="560px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
    >
      <el-form ref="recruitFormRef" :model="recruitForm" :rules="recruitRules" label-width="120px">
        <el-form-item :label="$t('selfService.recruitment.department')" prop="department">
          <el-input v-model="recruitForm.department" :placeholder="$t('selfService.recruitment.departmentPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('selfService.recruitment.position')" prop="position">
          <el-input v-model="recruitForm.position" :placeholder="$t('selfService.recruitment.positionPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('selfService.recruitment.headcount')" prop="headcount">
          <el-input-number v-model="recruitForm.headcount" :min="1" :max="50" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('selfService.recruitment.reason')" prop="reason">
          <el-input v-model="recruitForm.reason" type="textarea" :rows="3" :placeholder="$t('selfService.recruitment.reasonPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('selfService.recruitment.requirements')">
          <el-input v-model="recruitForm.requirements" type="textarea" :rows="3" :placeholder="$t('selfService.recruitment.requirementsPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecruitDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="recruitSaving" @click="handleSubmitRecruitDemand">{{ $t('common.submit') }}</el-button>
      </template>
    </el-dialog>

    <!-- ====== 绩效自评对话框 ====== -->
    <el-dialog
      v-model="showPerfDialog"
      :title="$t('selfService.performance.selfReview')"
      width="560px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
    >
      <el-alert
        v-if="perfReviewingRecord"
        :title="`${perfReviewingRecord.period} - ${perfReviewingRecord.employeeName}`"
        type="info" :closable="false" style="margin-bottom: 16px;"
      />
      <el-form label-width="130px">
        <el-form-item :label="$t('selfService.performance.selfScore')">
          <el-input-number v-model="perfForm.selfScore" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item :label="$t('selfService.performance.selfComment')">
          <el-input v-model="perfForm.selfComment" type="textarea" :rows="4" :placeholder="$t('selfService.performance.selfCommentPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPerfDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="perfSaving" @click="handleSubmitSelfReview">{{ $t('common.submit') }}</el-button>
      </template>
    </el-dialog>

    <!-- ====== 绩效详情对话框 ====== -->
    <el-dialog
      v-model="showPerfDetailDialog"
      :title="$t('selfService.performance.detailTitle')"
      width="640px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
    >
      <div v-if="perfDetailRecord" class="perf-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('selfService.performance.period')">{{ perfDetailRecord.period }}</el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.employeeName')">{{ perfDetailRecord.employeeName }}</el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.department')">{{ perfDetailRecord.department }}</el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.position')">{{ perfDetailRecord.position || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.selfScore')">{{ perfDetailRecord.selfScore ?? '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.supervisorScore')">{{ perfDetailRecord.supervisorScore ?? '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.finalScore')">
            <strong>{{ perfDetailRecord.finalScore ?? '-' }}</strong>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.rating')">
            <el-tag v-if="perfDetailRecord.rating" :type="getRatingType(perfDetailRecord.rating)">{{ perfDetailRecord.rating }}</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('selfService.performance.statusText')">
            <el-tag :type="getPerfStatusType(perfDetailRecord.status)">{{ getPerfStatusLabel(perfDetailRecord.status) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider v-if="perfDetailRecord.selfComment" />
        <div v-if="perfDetailRecord.selfComment">
          <div class="perf-comment-label">{{ $t('selfService.performance.selfComment') }}</div>
          <div class="perf-comment-content">{{ perfDetailRecord.selfComment }}</div>
        </div>
        <div v-if="perfDetailRecord.supervisorComment" style="margin-top: 12px;">
          <div class="perf-comment-label">{{ $t('selfService.performance.supervisorComment') }}</div>
          <div class="perf-comment-content">{{ perfDetailRecord.supervisorComment }}</div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showPerfDetailDialog = false">{{ $t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <!-- ====== 培训进度更新对话框 ====== -->
    <el-dialog
      v-model="showTrainingProgressDialog"
      :title="$t('selfService.training.updateProgress')"
      width="400px"
      :overlay-style="{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '99998' }"
      :z-index="100000"
    >
      <div v-if="trainingProgressRecord">
        <p style="margin-bottom: 12px; font-weight: 600;">{{ trainingProgressRecord.courseName }}</p>
        <el-form label-width="80px">
          <el-form-item :label="$t('selfService.training.progress')">
            <el-slider v-model="trainingProgressForm.progress" :min="0" :max="100" show-input />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showTrainingProgressDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="trainingProgressSaving" @click="handleUpdateTrainingProgress">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Clock, Money, Reading, TrendCharts, Briefcase, List, Calendar, Search, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import {
  getAttendanceList, getAttendanceStats,
  createLeaveRequest, getLeaveRequests, cancelLeaveRequest,
  getMyPayroll,
  getTrainingCourses, getMyTrainingRecords, updateLearningProgress, getMyTrainingCourses,
  getPerformanceList, updatePerformance,
  createRecruitmentDemand, createMyRecruitmentDemand, getMyRecruitmentDemands,
} from '../api/hr'

const { t } = useI18n()
const userStore = useUserStore()

// ========== 权限控制 ==========
// 薪资查看权限：拥有 hr.payroll.view 权限或超管可见
const canViewPayroll = computed(() => userStore.hasPermission('hr.payroll.view') || userStore.isSuperAdmin)
// 招聘需求入口：仅主管/总监/超管可见
const canSubmitRecruitment = computed(() =>
  userStore.isSuperAdmin ||
  userStore.userInfo?.role === 'department_head'
)

// ========== 通用方法 ==========
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// ========== 考勤与请假 ==========
const activeTab = ref('attendance')
const attendanceSubTab = ref('records')
const attDateRange = ref<[string, string] | null>(null)
const attStatusFilter = ref('')
const attLoading = ref(false)
const myAttendanceRecords = ref<any[]>([])
const myAttendanceStats = ref<any>({})
const attPagination = ref({ page: 1, pageSize: 20, total: 0 })

const loadMyAttendance = async () => {
  attLoading.value = true
  try {
    const [startDate, endDate] = attDateRange.value || [undefined, undefined]
    const result = await getAttendanceList({
      page: attPagination.value.page,
      pageSize: attPagination.value.pageSize,
      startDate,
      endDate,
      status: attStatusFilter.value as any || undefined,
    })
    myAttendanceRecords.value = result.data
    attPagination.value.total = result.total
    const stats = await getAttendanceStats({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    myAttendanceStats.value = stats
  } catch {
    myAttendanceRecords.value = []
    myAttendanceStats.value = {}
  } finally {
    attLoading.value = false
  }
}

const getAttStatusType = (status: string) => {
  const map: Record<string, string> = {
    present: 'success', late: 'warning', early_leave: 'warning',
    absent: 'danger', overtime: 'info', leave: '',
  }
  return map[status] || ''
}

const getAttStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    present: t('selfService.attendance.statusTypes.present'),
    late: t('selfService.attendance.statusTypes.late'),
    early_leave: t('selfService.attendance.statusTypes.earlyLeave'),
    absent: t('selfService.attendance.statusTypes.absent'),
    overtime: t('selfService.attendance.statusTypes.overtime'),
    leave: t('selfService.attendance.statusTypes.leave'),
  }
  return map[status] || status
}

// 请假
const leaveLoading = ref(false)
const myLeaveRequests = ref<any[]>([])
const showLeaveDialog = ref(false)
const leaveFormRef = ref<FormInstance>()
const leaveSaving = ref(false)
const leaveForm = ref({ leaveType: 'personal', startDate: '', endDate: '', days: 1, reason: '' })
const leaveRules: FormRules = {
  leaveType: [{ required: true, message: t('selfService.attendance.leaveTypeRequired'), trigger: 'change' }],
  startDate: [{ required: true, message: t('selfService.attendance.startDateRequired'), trigger: 'change' }],
  endDate: [{ required: true, message: t('selfService.attendance.endDateRequired'), trigger: 'change' }],
  days: [{ required: true, message: t('selfService.attendance.daysRequired'), trigger: 'blur' }],
}

const pendingLeaveCount = computed(() => myLeaveRequests.value.filter(r => r.status === 'pending').length)

const loadMyLeaveRequests = async () => {
  leaveLoading.value = true
  try {
    const result = await getLeaveRequests()
    myLeaveRequests.value = result.data
  } catch {
    myLeaveRequests.value = []
  } finally {
    leaveLoading.value = false
  }
}

const openLeaveDialog = () => {
  leaveForm.value = { leaveType: 'personal', startDate: '', endDate: '', days: 1, reason: '' }
  showLeaveDialog.value = true
}

const handleSubmitLeave = async () => {
  if (!leaveFormRef.value) return
  try { await leaveFormRef.value.validate() } catch { return }
  leaveSaving.value = true
  try {
    await createLeaveRequest(leaveForm.value as any)
    ElMessage.success(t('common.submitSuccess'))
    showLeaveDialog.value = false
    await loadMyLeaveRequests()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.error'))
  } finally {
    leaveSaving.value = false
  }
}

const handleCancelLeave = async (row: any) => {
  try {
    await cancelLeaveRequest(row.id)
    ElMessage.success(t('common.operationSuccess'))
    await loadMyLeaveRequests()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.error'))
  }
}

const getLeaveTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    annual: t('selfService.attendance.leaveTypes.annual'),
    sick: t('selfService.attendance.leaveTypes.sick'),
    personal: t('selfService.attendance.leaveTypes.personal'),
    maternity: t('selfService.attendance.leaveTypes.maternity'),
    paternity: t('selfService.attendance.leaveTypes.paternity'),
    marriage: t('selfService.attendance.leaveTypes.marriage'),
    bereavement: t('selfService.attendance.leaveTypes.bereavement'),
    unpaid: t('selfService.attendance.leaveTypes.unpaid'),
    other: t('selfService.attendance.leaveTypes.other'),
  }
  return map[type] || type
}

const getLeaveStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info' }
  return map[status] || ''
}

const getLeaveStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: t('selfService.attendance.leaveStatus.pending'),
    approved: t('selfService.attendance.leaveStatus.approved'),
    rejected: t('selfService.attendance.leaveStatus.rejected'),
    cancelled: t('selfService.attendance.leaveStatus.cancelled'),
  }
  return map[status] || status
}

// ========== 薪资明细 ==========
const payrollLoading = ref(false)
const myPayrollRecords = ref<any[]>([])

const loadMyPayroll = async () => {
  payrollLoading.value = true
  try {
    myPayrollRecords.value = await getMyPayroll()
  } catch {
    myPayrollRecords.value = []
  } finally {
    payrollLoading.value = false
  }
}

const formatCurrency = (val: number | undefined) => {
  if (val === undefined || val === null) return '-'
  return `¥${Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getPayrollStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    paid: t('selfService.payroll.payrollStatus.paid'),
    pending: t('selfService.payroll.payrollStatus.pending'),
  }
  return map[status] || status
}

// ========== 培训与学习 ==========
const trainingSubTab = ref('my')
const myTrainingLoading = ref(false)
const myTrainingRecords = ref<any[]>([])
const coursesLoading = ref(false)
const availableCourses = ref<any[]>([])
const courseKeyword = ref('')
const showTrainingProgressDialog = ref(false)
const trainingProgressRecord = ref<any>(null)
const trainingProgressForm = ref({ progress: 0 })
const trainingProgressSaving = ref(false)

const loadMyTraining = async () => {
  myTrainingLoading.value = true
  try {
    myTrainingRecords.value = await getMyTrainingRecords()
  } catch {
    myTrainingRecords.value = []
  } finally {
    myTrainingLoading.value = false
  }
}

const loadAvailableCourses = async () => {
  coursesLoading.value = true
  try {
    const courses = await getMyTrainingCourses()
    availableCourses.value = courses.filter((c: any) => !courseKeyword.value ||
      c.title?.includes(courseKeyword.value) || c.category?.includes(courseKeyword.value))
  } catch {
    availableCourses.value = []
  } finally {
    coursesLoading.value = false
  }
}

const getTrainingStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    NOT_STARTED: t('selfService.training.trainingStatus.notStarted'),
    IN_PROGRESS: t('selfService.training.trainingStatus.inProgress'),
    COMPLETED: t('selfService.training.trainingStatus.completed'),
  }
  return map[status] || status
}

const applyForCourse = async (course: any) => {
  try {
    await updateLearningProgress(course.id, { progress: 0 })
    ElMessage.success(t('common.submitSuccess'))
    await loadMyTraining()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.error'))
  }
}

const openTrainingProgressDialog = (record: any) => {
  trainingProgressRecord.value = record
  trainingProgressForm.value.progress = record.progress || 0
  showTrainingProgressDialog.value = true
}

const handleUpdateTrainingProgress = async () => {
  if (!trainingProgressRecord.value) return
  trainingProgressSaving.value = true
  try {
    await updateLearningProgress(trainingProgressRecord.value.id, trainingProgressForm.value)
    ElMessage.success(t('common.saveSuccess'))
    showTrainingProgressDialog.value = false
    await loadMyTraining()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.error'))
  } finally {
    trainingProgressSaving.value = false
  }
}

// ========== 绩效 ==========
const perfLoading = ref(false)
const myPerformanceRecords = ref<any[]>([])
const perfPeriodFilter = ref('')
const periodOptions = computed(() => {
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)
  const options: string[] = []
  years.forEach(y => {
    for (let q = 4; q >= 1; q--) options.push(`${y} Q${q}`)
  })
  return options
})
const showPerfDialog = ref(false)
const showPerfDetailDialog = ref(false)
const perfReviewingRecord = ref<any>(null)
const perfDetailRecord = ref<any>(null)
const perfForm = ref({ selfScore: 0, selfComment: '' })
const perfSaving = ref(false)

const loadMyPerformance = async () => {
  perfLoading.value = true
  try {
    const result = await getPerformanceList({ employeeId: userStore.userInfo?.id, period: perfPeriodFilter.value || undefined })
    myPerformanceRecords.value = result.data
  } catch {
    myPerformanceRecords.value = []
  } finally {
    perfLoading.value = false
  }
}

const openSelfReviewDialog = (record: any) => {
  perfReviewingRecord.value = record
  perfForm.value = { selfScore: record.selfScore || 0, selfComment: record.selfComment || '' }
  showPerfDialog.value = true
}

const handleSubmitSelfReview = async () => {
  if (!perfReviewingRecord.value) return
  if (perfSaving.value) return
  perfSaving.value = true
  try {
    await updatePerformance(perfReviewingRecord.value.id, {
      selfScore: perfForm.value.selfScore,
      selfComment: perfForm.value.selfComment,
      status: 'submitted',
    })
    ElMessage.success(t('common.submitSuccess'))
    showPerfDialog.value = false
    await loadMyPerformance()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.error'))
  } finally {
    perfSaving.value = false
  }
}

const viewPerfDetail = (record: any) => {
  perfDetailRecord.value = record
  showPerfDetailDialog.value = true
}

const getRatingType = (rating: string) => {
  const map: Record<string, string> = { A: 'success', B: 'primary', C: 'warning', D: 'warning', E: 'danger' }
  return map[rating] || 'info'
}

const getPerfStatusType = (status: string) => {
  const map: Record<string, string> = { draft: 'info', submitted: 'warning', reviewed: 'primary', completed: 'success' }
  return map[status] || ''
}

const getPerfStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    draft: t('selfService.performance.perfStatus.draft'),
    submitted: t('selfService.performance.perfStatus.submitted'),
    reviewed: t('selfService.performance.perfStatus.reviewed'),
    completed: t('selfService.performance.perfStatus.completed'),
  }
  return map[status] || status
}

// ========== 招聘需求 ==========
const recruitLoading = ref(false)
const myRecruitDemands = ref<any[]>([])
const showRecruitDialog = ref(false)
const recruitFormRef = ref<FormInstance>()
const recruitSaving = ref(false)
const recruitForm = ref({ department: '', position: '', headcount: 1, reason: '', requirements: '' })
const recruitRules: FormRules = {
  department: [{ required: true, message: t('selfService.recruitment.departmentRequired'), trigger: 'blur' }],
  position: [{ required: true, message: t('selfService.recruitment.positionRequired'), trigger: 'blur' }],
  headcount: [{ required: true, message: t('selfService.recruitment.headcountRequired'), trigger: 'blur' }],
  reason: [{ required: true, message: t('selfService.recruitment.reasonRequired'), trigger: 'blur' }],
}

const loadMyRecruitDemands = async () => {
  recruitLoading.value = true
  try {
    myRecruitDemands.value = await getMyRecruitmentDemands()
  } catch {
    myRecruitDemands.value = []
  } finally {
    recruitLoading.value = false
  }
}

const openRecruitDemandDialog = () => {
  recruitForm.value = { department: '', position: '', headcount: 1, reason: '', requirements: '' }
  showRecruitDialog.value = true
}

const handleSubmitRecruitDemand = async () => {
  if (!recruitFormRef.value) return
  try { await recruitFormRef.value.validate() } catch { return }
  recruitSaving.value = true
  try {
    await createMyRecruitmentDemand(recruitForm.value as any)
    ElMessage.success(t('common.submitSuccess'))
    showRecruitDialog.value = false
    await loadMyRecruitDemands()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.error'))
  } finally {
    recruitSaving.value = false
  }
}

const getDemandStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', filled: 'info' }
  return map[status] || ''
}

const getDemandStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: t('selfService.recruitment.demandStatus.pending'),
    approved: t('selfService.recruitment.demandStatus.approved'),
    rejected: t('selfService.recruitment.demandStatus.rejected'),
    filled: t('selfService.recruitment.demandStatus.filled'),
  }
  return map[status] || status
}

// ========== Tab 切换加载 ==========
watch(activeTab, (tab) => {
  if (tab === 'attendance') { loadMyAttendance(); loadMyLeaveRequests() }
  else if (tab === 'payroll') loadMyPayroll()
  else if (tab === 'training') { loadMyTraining(); loadAvailableCourses() }
  else if (tab === 'performance') loadMyPerformance()
  else if (tab === 'recruitment') loadMyRecruitDemands()
})

onMounted(() => {
  loadMyAttendance()
  loadMyLeaveRequests()
})
</script>

<style scoped lang="scss">
.self-service-page {
  padding: 24px;
  background: #f5f5f7;
  min-height: 100vh;

  .page-title {
    margin: 0 0 24px 0;
    font-size: 28px;
    font-weight: 600;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .main-card {
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e5e7;
  }

  .sub-tabs {
    padding: 4px 0 20px;

    :deep(.el-radio-group) {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .el-radio-button {
        .el-radio-button__inner {
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 8px !important;
          font-size: 13px;
          padding: 8px 16px;
        }
      }
    }
  }

  .stats-row {
    display: flex;
    gap: 16px;

    .stat-item {
      flex: 1;
      background: #f8f9fb;
      border: 1px solid #e8e8ed;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      min-width: 0;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #1d1d1f;
        line-height: 1.2;
        letter-spacing: -0.02em;

        &.success { color: #67c23a; }
        &.warning { color: #e6a23c; }
        &.info { color: #409eff; }
        &.danger { color: #f56c6c; }
      }

      .stat-label {
        font-size: 12px;
        color: #86868b;
        margin-top: 4px;
        font-weight: 500;
      }
    }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tab-badge {
    margin-left: 4px;
  }

  :deep(.inner-tabs) {
    .el-tabs__header {
      margin-bottom: 16px;
    }
  }

  .perf-detail {
    .perf-comment-label {
      font-size: 13px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 6px;
    }
    .perf-comment-content {
      background: #f8f9fb;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      color: #303133;
      line-height: 1.6;
    }
  }
}

@media (max-width: 768px) {
  .self-service-page {
    padding: 16px;

    .page-title {
      font-size: 22px;
    }

    .stats-row {
      flex-wrap: wrap;
      .stat-item {
        min-width: calc(50% - 8px);
      }
    }
  }
}
</style>
