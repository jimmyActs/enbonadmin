<template>
  <div class="admin-reception-module">
    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" class="reception-tabs">
      <!-- 物料管理 -->
      <el-tab-pane :label="$t('workspace.adminReception.materialManagement')" name="material">
        <el-card class="module-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon><Box /></el-icon>
                <span>{{ $t('workspace.adminReception.materialManagement') }}</span>
              </div>
              <el-button type="primary" :icon="Plus" @click="showMaterialDialog = true">
                {{ $t('workspace.adminReception.addMaterial') }}
              </el-button>
            </div>
          </template>

          <!-- 物料操作标签 -->
          <el-tabs v-model="materialTab" class="material-tabs">
            <el-tab-pane :label="$t('workspace.adminReception.materialList')" name="list">
              <!-- 物料筛选区域 -->
              <div class="filter-bar">
                <el-input
                  v-model="materialSearchText"
                  :placeholder="$t('workspace.adminReception.searchPlaceholder')"
                  clearable
                  style="width: 300px; margin-right: 12px;"
                  @input="handleMaterialSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-select
                  v-model="materialCategoryFilter"
                  :placeholder="$t('workspace.adminReception.filterByCategory')"
                  clearable
                  style="width: 150px; margin-right: 12px;"
                  @change="handleMaterialFilter"
                >
                  <el-option :label="$t('workspace.adminReception.all')" value="" />
                  <el-option
                    v-for="cat in materialCategories"
                    :key="cat"
                    :label="cat"
                    :value="cat"
                  />
                </el-select>
                <el-button :icon="Refresh" @click="resetMaterialFilter">
                  {{ $t('common.reset') }}
                </el-button>
              </div>

              <el-table :data="filteredMaterials" stripe>
                <el-table-column prop="name" :label="$t('workspace.adminReception.materialName')" min-width="150" />
                <el-table-column prop="category" :label="$t('workspace.adminReception.category')" width="120" />
                <el-table-column prop="quantity" :label="$t('workspace.adminReception.quantity')" width="100" />
                <el-table-column prop="unit" :label="$t('workspace.adminReception.unit')" width="80" />
                <el-table-column prop="location" :label="$t('workspace.adminReception.location')" width="120" />
                <el-table-column :label="$t('common.operations')" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="handleEditMaterial(row)">
                      {{ $t('common.edit') }}
                    </el-button>
                    <el-button type="danger" size="small" @click="handleDeleteMaterial(row)">
                      {{ $t('common.delete') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane :label="$t('workspace.adminReception.materialRequest')" name="request">
              <el-table :data="materialRequests" stripe v-loading="loadingApplications">
                <el-table-column prop="materialName" :label="$t('workspace.adminReception.materialName')" min-width="150" />
                <el-table-column prop="applicantName" :label="$t('workspace.adminReception.requestUser')" width="120" />
                <el-table-column prop="applicantDepartment" :label="$t('workspace.adminReception.department')" width="120" />
                <el-table-column prop="quantity" :label="$t('workspace.adminReception.quantity')" width="100">
                  <template #default="{ row }">
                    {{ row.quantity }} {{ row.unit }}
                  </template>
                </el-table-column>
                <el-table-column prop="urgency" :label="$t('workspace.materialApplication.urgency')" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.urgency === 'urgent' ? 'danger' : 'info'">
                      {{ row.urgency === 'urgent' ? $t('workspace.materialApplication.urgencyUrgent') : $t('workspace.materialApplication.urgencyNormal') }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" :label="$t('workspace.adminReception.status')" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRequestStatusType(row.status)">
                      {{ getRequestStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" :label="$t('workspace.adminReception.requestTime')" width="180">
                  <template #default="{ row }">
                    {{ formatDateTime(row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('common.operations')" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="row.status === 'pending'"
                      type="success"
                      size="small"
                      @click="handleApproveRequest(row)"
                    >
                      {{ $t('workspace.adminReception.approve') }}
                    </el-button>
                    <el-button
                      v-if="row.status === 'pending'"
                      type="danger"
                      size="small"
                      @click="handleRejectRequest(row)"
                    >
                      {{ $t('workspace.adminReception.reject') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!loadingApplications && materialRequests.length === 0" :description="$t('common.noData')" />
            </el-tab-pane>

            <el-tab-pane :label="$t('workspace.adminReception.materialInventory')" name="inventory">
              <el-table :data="materials" stripe>
                <el-table-column prop="name" :label="$t('workspace.adminReception.materialName')" min-width="150" />
                <el-table-column prop="category" :label="$t('workspace.adminReception.category')" width="120" />
                <el-table-column prop="currentQuantity" :label="$t('workspace.adminReception.currentQuantity')" width="120" />
                <el-table-column prop="unit" :label="$t('workspace.adminReception.unit')" width="80" />
                <el-table-column :label="$t('workspace.adminReception.operation')" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="handleInventory(row)">
                      {{ $t('workspace.adminReception.inventory') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-tab-pane>

      <!-- 来访登记 -->
      <el-tab-pane :label="$t('workspace.adminReception.visitorRegistration')" name="visitor">
        <el-card class="module-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon><User /></el-icon>
                <span>{{ $t('workspace.adminReception.visitorRegistration') }}</span>
              </div>
              <el-button type="primary" :icon="Plus" @click="showVisitorDialog = true">
                {{ $t('workspace.adminReception.addVisitor') }}
              </el-button>
            </div>
          </template>

          <!-- 筛选区域 -->
          <div class="filter-bar">
            <el-input
              v-model="visitorSearchText"
              :placeholder="$t('workspace.adminReception.searchPlaceholder')"
              clearable
              style="width: 300px; margin-right: 12px;"
              @input="handleVisitorSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="visitorStatusFilter"
              :placeholder="$t('workspace.adminReception.filterByStatus')"
              clearable
              style="width: 150px; margin-right: 12px;"
              @change="handleVisitorFilter"
            >
              <el-option :label="$t('workspace.adminReception.all')" value="" />
              <el-option :label="$t('workspace.adminReception.in')" value="in" />
              <el-option :label="$t('workspace.adminReception.out')" value="out" />
            </el-select>
            <el-date-picker
              v-model="visitorDateRange"
              type="daterange"
              :range-separator="$t('common.to')"
              :start-placeholder="$t('workspace.adminReception.startDate')"
              :end-placeholder="$t('workspace.adminReception.endDate')"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px; margin-right: 12px;"
              @change="handleVisitorFilter"
            />
            <el-button :icon="Refresh" @click="resetVisitorFilter">
              {{ $t('common.reset') }}
            </el-button>
          </div>

          <el-table :data="filteredVisitors" stripe>
            <el-table-column prop="visitorName" :label="$t('workspace.adminReception.visitorName')" width="120" />
            <el-table-column prop="company" :label="$t('workspace.adminReception.company')" min-width="150" />
            <el-table-column prop="purpose" :label="$t('workspace.adminReception.purpose')" min-width="150" />
            <el-table-column prop="contactPerson" :label="$t('workspace.adminReception.contactPerson')" width="120" />
            <el-table-column prop="visitTime" :label="$t('workspace.adminReception.visitTime')" width="180" />
            <el-table-column prop="status" :label="$t('workspace.adminReception.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'in' ? 'success' : 'info'">
                  {{ row.status === 'in' ? $t('workspace.adminReception.in') : $t('workspace.adminReception.out') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'in'"
                  type="success"
                  size="small"
                  @click="handleVisitorOut(row)"
                >
                  {{ $t('workspace.adminReception.signOut') }}
                </el-button>
                <el-button type="primary" size="small" @click="handleEditVisitor(row)">
                  {{ $t('common.edit') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 资产登记 -->
      <el-tab-pane :label="$t('workspace.adminReception.assetRegistration')" name="asset">
        <el-card class="module-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon><TrendCharts /></el-icon>
                <span>{{ $t('workspace.adminReception.assetRegistration') }}</span>
              </div>
              <el-button type="primary" :icon="Plus" @click="showAssetDialog = true">
                {{ $t('workspace.adminReception.addAsset') }}
              </el-button>
            </div>
          </template>

          <!-- 筛选区域 -->
          <div class="filter-bar">
            <el-input
              v-model="assetSearchText"
              :placeholder="$t('workspace.adminReception.searchPlaceholder')"
              clearable
              style="width: 300px; margin-right: 12px;"
              @input="handleAssetSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="assetCategoryFilter"
              :placeholder="$t('workspace.adminReception.filterByCategory')"
              clearable
              style="width: 150px; margin-right: 12px;"
              @change="handleAssetFilter"
            >
              <el-option :label="$t('workspace.adminReception.all')" value="" />
              <el-option
                v-for="(label, key) in assetCategories"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
            <el-select
              v-model="assetStatusFilter"
              :placeholder="$t('workspace.adminReception.filterByStatus')"
              clearable
              style="width: 150px; margin-right: 12px;"
              @change="handleAssetFilter"
            >
              <el-option :label="$t('workspace.adminReception.all')" value="" />
              <el-option
                v-for="(label, key) in assetStatuses"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
            <el-button :icon="Refresh" @click="resetAssetFilter">
              {{ $t('common.reset') }}
            </el-button>
          </div>

          <el-table :data="filteredAssets" stripe>
            <el-table-column prop="assetNumber" :label="$t('workspace.adminReception.assetNumber')" width="150" />
            <el-table-column prop="name" :label="$t('workspace.adminReception.assetName')" min-width="150" />
            <el-table-column prop="category" :label="$t('workspace.adminReception.assetCategory')" width="120">
              <template #default="{ row }">
                {{ getAssetCategoryText(row.category) }}
              </template>
            </el-table-column>
            <el-table-column prop="purchaseDate" :label="$t('workspace.adminReception.purchaseDate')" width="120" />
            <el-table-column prop="purchasePrice" :label="$t('workspace.adminReception.purchasePrice')" width="120">
              <template #default="{ row }">
                ¥{{ row.purchasePrice?.toLocaleString() || '0' }}
              </template>
            </el-table-column>
            <el-table-column prop="supplier" :label="$t('workspace.adminReception.supplier')" width="120" />
            <el-table-column prop="location" :label="$t('workspace.adminReception.location')" width="120" />
            <el-table-column prop="status" :label="$t('workspace.adminReception.status')" width="120">
              <template #default="{ row }">
                <el-tag :type="getAssetStatusType(row.status)">
                  {{ getAssetStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operations')" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEditAsset(row)">
                  {{ $t('common.edit') }}
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteAsset(row)">
                  {{ $t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 资产统计 -->
      <el-tab-pane :label="$t('workspace.adminReception.assetStatistics')" name="statistics">
        <el-card class="module-card">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>{{ $t('workspace.adminReception.assetStatistics') }}</span>
            </div>
          </template>
          <div class="asset-statistics">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-statistic :title="$t('workspace.adminReception.statistics.totalAssets')" :value="totalAssets" />
              </el-col>
              <el-col :span="6">
                <el-statistic :title="$t('workspace.adminReception.statistics.totalValue')" :value="totalValue" prefix="¥" />
              </el-col>
              <el-col :span="6">
                <el-statistic :title="$t('workspace.adminReception.statistics.normalAssets')" :value="normalAssets" />
              </el-col>
              <el-col :span="6">
                <el-statistic :title="$t('workspace.adminReception.statistics.maintenanceAssets')" :value="maintenanceAssets" />
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加物料对话框 -->
    <el-dialog
      v-model="showMaterialDialog"
      :title="editingMaterial ? $t('workspace.adminReception.editMaterial') : $t('workspace.adminReception.addMaterial')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="materialFormRef"
        :model="materialForm"
        :rules="materialRules"
        label-width="120px"
      >
        <el-form-item :label="$t('workspace.adminReception.materialName')" prop="name">
          <el-input
            v-model="materialForm.name"
            :placeholder="$t('workspace.adminReception.materialNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.category')" prop="category">
          <el-select
            v-model="materialForm.category"
            :placeholder="$t('workspace.adminReception.selectCategory')"
            style="width: 100%"
          >
            <el-option
              v-for="cat in materialCategories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.quantity')" prop="quantity">
          <el-input-number
            v-model="materialForm.quantity"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.unit')" prop="unit">
          <el-input
            v-model="materialForm.unit"
            :placeholder="$t('workspace.adminReception.unitPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.location')" prop="location">
          <el-input
            v-model="materialForm.location"
            :placeholder="$t('workspace.adminReception.locationPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancelMaterial">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveMaterial" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 来访登记对话框 -->
    <el-dialog
      v-model="showVisitorDialog"
      :title="editingVisitor ? $t('workspace.adminReception.editVisitor') : $t('workspace.adminReception.addVisitor')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="visitorFormRef"
        :model="visitorForm"
        :rules="visitorRules"
        label-width="120px"
      >
        <el-form-item :label="$t('workspace.adminReception.visitorName')" prop="visitorName">
          <el-input
            v-model="visitorForm.visitorName"
            :placeholder="$t('workspace.adminReception.visitorNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.company')" prop="company">
          <el-input
            v-model="visitorForm.company"
            :placeholder="$t('workspace.adminReception.companyPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.purpose')" prop="purpose">
          <el-input
            v-model="visitorForm.purpose"
            :placeholder="$t('workspace.adminReception.purposePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.contactPerson')" prop="contactPerson">
          <el-select
            v-model="visitorForm.contactPerson"
            :placeholder="$t('workspace.adminReception.selectContactPerson')"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.nickname"
              :value="user.nickname"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.visitTime')" prop="visitTime">
          <el-date-picker
            v-model="visitorForm.visitTime"
            type="datetime"
            :placeholder="$t('workspace.adminReception.visitTimePlaceholder')"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.notes')">
          <el-input
            v-model="visitorForm.notes"
            type="textarea"
            :rows="3"
            :placeholder="$t('workspace.adminReception.notesPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancelVisitor">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveVisitor" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 盘点对话框 -->
    <el-dialog
      v-model="showInventoryDialog"
      :title="$t('workspace.adminReception.inventory')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="inventoryFormRef"
        :model="inventoryForm"
        :rules="inventoryRules"
        label-width="120px"
      >
        <el-form-item :label="$t('workspace.adminReception.materialName')">
          <el-input :value="currentInventoryMaterial?.name" disabled />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.currentQuantity')">
          <el-input :value="currentInventoryMaterial?.currentQuantity ?? currentInventoryMaterial?.quantity" disabled />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.actualQuantity')" prop="actualQuantity">
          <el-input-number
            v-model="inventoryForm.actualQuantity"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.notes')">
          <el-input
            v-model="inventoryForm.notes"
            type="textarea"
            :rows="3"
            :placeholder="$t('workspace.adminReception.inventoryNotesPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showInventoryDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveInventory" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加资产对话框 -->
    <el-dialog
      v-model="showAssetDialog"
      :title="editingAsset ? $t('workspace.adminReception.editAsset') : $t('workspace.adminReception.addAsset')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="assetFormRef"
        :model="assetForm"
        :rules="assetRules"
        label-width="120px"
      >
        <el-form-item :label="$t('workspace.adminReception.assetNumber')" prop="assetNumber">
          <el-input
            v-model="assetForm.assetNumber"
            :placeholder="$t('workspace.adminReception.assetNumberPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.assetName')" prop="name">
          <el-input
            v-model="assetForm.name"
            :placeholder="$t('workspace.adminReception.assetNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.assetCategory')" prop="category">
          <el-select
            v-model="assetForm.category"
            :placeholder="$t('workspace.adminReception.selectCategory')"
            style="width: 100%"
          >
            <el-option
              v-for="(label, key) in assetCategories"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.purchaseDate')" prop="purchaseDate">
          <el-date-picker
            v-model="assetForm.purchaseDate"
            type="date"
            :placeholder="$t('workspace.adminReception.purchaseDatePlaceholder')"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.purchasePrice')" prop="purchasePrice">
          <el-input-number
            v-model="assetForm.purchasePrice"
            :min="0"
            :precision="2"
            style="width: 100%"
            :placeholder="$t('workspace.adminReception.purchasePricePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.supplier')" prop="supplier">
          <el-input
            v-model="assetForm.supplier"
            :placeholder="$t('workspace.adminReception.supplierPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.location')" prop="location">
          <el-input
            v-model="assetForm.location"
            :placeholder="$t('workspace.adminReception.locationPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('workspace.adminReception.status')" prop="status">
          <el-select
            v-model="assetForm.status"
            :placeholder="$t('workspace.adminReception.assetSelectStatus')"
            style="width: 100%"
          >
            <el-option
              v-for="(label, key) in assetStatuses"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancelAsset">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveAsset" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Box, User, Search, Refresh } from '@element-plus/icons-vue'
import { getEmployeesGrouped, type Employee } from '../../api/employees'
import { getAllApplications, updateApplicationStatus } from '../../api/material-applications'
import type { MaterialApplication } from '../../api/material-applications'
import { filterData } from '../../utils/search'

interface Material {
  id: number
  name: string
  category: string
  quantity: number
  unit: string
  location: string
  currentQuantity?: number
}

// MaterialRequest interface removed - using MaterialApplication from API instead

interface Visitor {
  id: number
  visitorName: string
  company: string
  purpose: string
  contactPerson: string
  visitTime: string
  status: 'in' | 'out'
  notes?: string
}

interface Asset {
  id: number
  assetNumber: string
  name: string
  category: 'office' | 'activity' | 'electronic' | 'vehicle' | 'furniture' | 'other'
  purchaseDate: string
  purchasePrice: number
  supplier: string
  location: string
  status: 'normal' | 'maintenance' | 'scrapped' | 'lost'
}

const { t } = useI18n()

const activeTab = ref('material')
const materialTab = ref('list')
const showMaterialDialog = ref(false)
const showVisitorDialog = ref(false)
const showInventoryDialog = ref(false)
const showAssetDialog = ref(false)
const editingMaterial = ref<Material | null>(null)
const editingVisitor = ref<Visitor | null>(null)
const editingAsset = ref<Asset | null>(null)
const currentInventoryMaterial = ref<Material | null>(null)
const saving = ref(false)

const materialFormRef = ref<FormInstance>()
const visitorFormRef = ref<FormInstance>()
const inventoryFormRef = ref<FormInstance>()
const assetFormRef = ref<FormInstance>()

// 物料列表（暂时使用模拟数据）
const materials = ref<Material[]>([
  {
    id: 1,
    name: 'A4纸',
    category: '办公用品',
    quantity: 100,
    unit: '包',
    location: '仓库A',
    currentQuantity: 100,
  },
])

const materialRequests = ref<MaterialApplication[]>([])
const loadingApplications = ref(false)
const visitors = ref<Visitor[]>([])
const assets = ref<Asset[]>([])
const allUsers = ref<Employee[]>([])

const materialCategories = ref(['办公用品', '电子设备', '家具', '其他'])

// 来访登记筛选
const visitorSearchText = ref('')
const visitorStatusFilter = ref('')
const visitorDateRange = ref<[string, string] | null>(null)

// 资产登记筛选
const assetSearchText = ref('')
const assetCategoryFilter = ref('')
const assetStatusFilter = ref('')

// 物料筛选
const materialSearchText = ref('')
const materialCategoryFilter = ref('')

// 资产分类和状态
const assetCategories = computed(() => ({
  office: t('workspace.adminReception.assetCategories.office'),
  activity: t('workspace.adminReception.assetCategories.activity'),
  electronic: t('workspace.adminReception.assetCategories.electronic'),
  vehicle: t('workspace.adminReception.assetCategories.vehicle'),
  furniture: t('workspace.adminReception.assetCategories.furniture'),
  other: t('workspace.adminReception.assetCategories.other'),
}))

const assetStatuses = computed(() => ({
  normal: t('workspace.adminReception.assetStatuses.normal'),
  maintenance: t('workspace.adminReception.assetStatuses.maintenance'),
  scrapped: t('workspace.adminReception.assetStatuses.scrapped'),
  lost: t('workspace.adminReception.assetStatuses.lost'),
}))

// 资产统计
const totalAssets = computed(() => assets.value.length)
const totalValue = computed(() => 
  assets.value.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
)
const normalAssets = computed(() => 
  assets.value.filter(a => a.status === 'normal').length
)
const maintenanceAssets = computed(() => 
  assets.value.filter(a => a.status === 'maintenance').length
)

const materialForm = ref({
  name: '',
  category: '',
  quantity: 0,
  unit: '',
  location: '',
})

const visitorForm = ref({
  visitorName: '',
  company: '',
  purpose: '',
  contactPerson: '',
  visitTime: '',
  notes: '',
})

const inventoryForm = ref({
  actualQuantity: 0,
  notes: '',
})

const assetForm = ref({
  assetNumber: '',
  name: '',
  category: 'office' as Asset['category'],
  purchaseDate: '',
  purchasePrice: 0,
  supplier: '',
  location: '',
  status: 'normal' as Asset['status'],
})

const materialRules: FormRules = {
  name: [{ required: true, message: t('workspace.adminReception.materialNameRequired'), trigger: 'blur' }],
  category: [{ required: true, message: t('workspace.adminReception.categoryRequired'), trigger: 'change' }],
  quantity: [{ required: true, message: t('workspace.adminReception.quantityRequired'), trigger: 'blur' }],
  unit: [{ required: true, message: t('workspace.adminReception.unitRequired'), trigger: 'blur' }],
}

const visitorRules: FormRules = {
  visitorName: [{ required: true, message: t('workspace.adminReception.visitorNameRequired'), trigger: 'blur' }],
  company: [{ required: true, message: t('workspace.adminReception.companyRequired'), trigger: 'blur' }],
  purpose: [{ required: true, message: t('workspace.adminReception.purposeRequired'), trigger: 'blur' }],
  contactPerson: [{ required: true, message: t('workspace.adminReception.contactPersonRequired'), trigger: 'change' }],
  visitTime: [{ required: true, message: t('workspace.adminReception.visitTimeRequired'), trigger: 'change' }],
}

const inventoryRules: FormRules = {
  actualQuantity: [{ required: true, message: t('workspace.adminReception.actualQuantityRequired'), trigger: 'blur' }],
}

const assetRules: FormRules = {
  assetNumber: [{ required: true, message: t('workspace.adminReception.assetNumberRequired'), trigger: 'blur' }],
  name: [{ required: true, message: t('workspace.adminReception.assetNameRequired'), trigger: 'blur' }],
  category: [{ required: true, message: t('workspace.adminReception.assetCategoryRequired'), trigger: 'change' }],
}

// 加载用户列表
const loadUsers = async () => {
  try {
    const grouped = await getEmployeesGrouped()
    const users: Employee[] = []
    Object.values(grouped).forEach(employees => {
      employees.forEach(emp => {
        // 排除离职员工和系统管理员
        if (emp.employmentStatus !== 'resigned' && emp.role !== 'super_admin') {
          users.push(emp)
        }
      })
    })
    allUsers.value = users
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 保存物料
const handleSaveMaterial = async () => {
  if (!materialFormRef.value) return
  
  try {
    await materialFormRef.value.validate()
    saving.value = true

    // TODO: 调用后端API
    if (editingMaterial.value) {
      const index = materials.value.findIndex(m => m.id === editingMaterial.value!.id)
      if (index !== -1 && materials.value[index]) {
        const updatedMaterial: Material = {
          id: materials.value[index].id,
          ...materialForm.value,
          currentQuantity: materialForm.value.quantity,
        }
        materials.value[index] = updatedMaterial
      }
    } else {
      materials.value.push({
        id: Date.now(),
        ...materialForm.value,
        currentQuantity: materialForm.value.quantity,
      })
    }

    ElMessage.success(t('common.success'))
    handleCancelMaterial()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 编辑物料
const handleEditMaterial = (material: Material) => {
  editingMaterial.value = material
  materialForm.value = {
    name: material.name,
    category: material.category,
    quantity: material.quantity,
    unit: material.unit,
    location: material.location,
  }
  showMaterialDialog.value = true
}

// 删除物料
const handleDeleteMaterial = async (material: Material) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.adminReception.deleteMaterialConfirm', { name: material.name }),
      t('common.warning'),
      { type: 'warning' }
    )
    
    const index = materials.value.findIndex(m => m.id === material.id)
    if (index !== -1) {
      materials.value.splice(index, 1)
    }
    
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 盘点
const handleInventory = (material: Material) => {
  currentInventoryMaterial.value = material
  inventoryForm.value = {
    actualQuantity: material.currentQuantity || material.quantity,
    notes: '',
  }
  showInventoryDialog.value = true
}

// 保存盘点
const handleSaveInventory = async () => {
  if (!inventoryFormRef.value) return
  
  try {
    await inventoryFormRef.value.validate()
    saving.value = true

    // TODO: 调用后端API
    if (currentInventoryMaterial.value) {
      const index = materials.value.findIndex(m => m.id === currentInventoryMaterial.value!.id)
      if (index !== -1 && materials.value[index]) {
        materials.value[index].currentQuantity = inventoryForm.value.actualQuantity
      }
    }

    ElMessage.success(t('common.success'))
    showInventoryDialog.value = false
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 批准申请
const handleApproveRequest = async (request: MaterialApplication) => {
  try {
    await updateApplicationStatus(request.id, { status: 'approved' })
    ElMessage.success(t('workspace.adminReception.approveSuccess'))
    loadApplications()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || t('common.error'))
  }
}

// 拒绝申请
const handleRejectRequest = async (request: MaterialApplication) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.adminReception.rejectRequestConfirm'),
      t('common.warning'),
      { type: 'warning' }
    )
    
    await updateApplicationStatus(request.id, { status: 'rejected' })
    ElMessage.success(t('workspace.adminReception.rejectSuccess'))
    loadApplications()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 保存来访登记
const handleSaveVisitor = async () => {
  if (!visitorFormRef.value) return
  
  try {
    await visitorFormRef.value.validate()
    saving.value = true

    // TODO: 调用后端API
    if (editingVisitor.value) {
      const index = visitors.value.findIndex(v => v.id === editingVisitor.value!.id)
      if (index !== -1 && visitors.value[index]) {
        const updatedVisitor: Visitor = {
          id: visitors.value[index].id,
          visitorName: visitorForm.value.visitorName,
          company: visitorForm.value.company,
          purpose: visitorForm.value.purpose,
          contactPerson: visitorForm.value.contactPerson,
          visitTime: visitorForm.value.visitTime,
          status: visitors.value[index].status,
          notes: visitorForm.value.notes,
        }
        visitors.value[index] = updatedVisitor
      }
    } else {
      const newVisitor: Visitor = {
        id: Date.now(),
        visitorName: visitorForm.value.visitorName,
        company: visitorForm.value.company,
        purpose: visitorForm.value.purpose,
        contactPerson: visitorForm.value.contactPerson,
        visitTime: visitorForm.value.visitTime,
        status: 'in',
        notes: visitorForm.value.notes,
      }
      visitors.value.push(newVisitor)
    }

    ElMessage.success(t('common.success'))
    handleCancelVisitor()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 编辑来访登记
const handleEditVisitor = (visitor: Visitor) => {
  editingVisitor.value = visitor
  visitorForm.value = {
    visitorName: visitor.visitorName,
    company: visitor.company,
    purpose: visitor.purpose,
    contactPerson: visitor.contactPerson,
    visitTime: visitor.visitTime,
    notes: visitor.notes || '',
  }
  showVisitorDialog.value = true
}

// 签出
const handleVisitorOut = async (visitor: Visitor) => {
  try {
    // TODO: 调用后端API
    visitor.status = 'out'
    ElMessage.success(t('workspace.adminReception.signOutSuccess'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 取消物料
const handleCancelMaterial = () => {
  showMaterialDialog.value = false
  editingMaterial.value = null
  materialFormRef.value?.resetFields()
  materialForm.value = {
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    location: '',
  }
}

// 取消来访登记
const handleCancelVisitor = () => {
  showVisitorDialog.value = false
  editingVisitor.value = null
  visitorFormRef.value?.resetFields()
  visitorForm.value = {
    visitorName: '',
    company: '',
    purpose: '',
    contactPerson: '',
    visitTime: '',
    notes: '',
  }
}

// 获取申请状态类型
const getRequestStatusType = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

// 获取申请状态文本
const getRequestStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: t('workspace.materialApplication.applicationStatuses.pending'),
    approved: t('workspace.materialApplication.applicationStatuses.approved'),
    rejected: t('workspace.materialApplication.applicationStatuses.rejected'),
    processing: t('workspace.materialApplication.applicationStatuses.processing'),
    completed: t('workspace.materialApplication.applicationStatuses.completed'),
  }
  return statusMap[status] || status
}

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 加载申请记录
const loadApplications = async () => {
  try {
    loadingApplications.value = true
    materialRequests.value = await getAllApplications()
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load applications:', error)
    }
    ElMessage.error(error?.response?.data?.message || error?.message || t('common.error'))
  } finally {
    loadingApplications.value = false
  }
}

// 保存资产
const handleSaveAsset = async () => {
  if (!assetFormRef.value) return
  
  try {
    await assetFormRef.value.validate()
    saving.value = true

    // TODO: 调用后端API
    if (editingAsset.value) {
      const index = assets.value.findIndex(a => a.id === editingAsset.value!.id)
      if (index !== -1 && assets.value[index]) {
        const updatedAsset: Asset = {
          id: assets.value[index].id,
          assetNumber: assetForm.value.assetNumber,
          name: assetForm.value.name,
          category: assetForm.value.category,
          purchaseDate: assetForm.value.purchaseDate,
          purchasePrice: assetForm.value.purchasePrice,
          supplier: assetForm.value.supplier,
          location: assetForm.value.location,
          status: assetForm.value.status,
        }
        assets.value[index] = updatedAsset
      }
    } else {
      assets.value.push({
        id: Date.now(),
        ...assetForm.value,
      })
    }

    ElMessage.success(t('common.success'))
    handleCancelAsset()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

// 编辑资产
const handleEditAsset = (asset: Asset) => {
  editingAsset.value = asset
  assetForm.value = {
    assetNumber: asset.assetNumber,
    name: asset.name,
    category: asset.category,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice,
    supplier: asset.supplier,
    location: asset.location,
    status: asset.status,
  }
  showAssetDialog.value = true
}

// 删除资产
const handleDeleteAsset = async (asset: Asset) => {
  try {
    await ElMessageBox.confirm(
      t('workspace.adminReception.deleteAssetConfirm', { name: asset.name }),
      t('common.warning'),
      { type: 'warning' }
    )
    
    const index = assets.value.findIndex(a => a.id === asset.id)
    if (index !== -1) {
      assets.value.splice(index, 1)
    }
    
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || t('common.error'))
    }
  }
}

// 取消资产
const handleCancelAsset = () => {
  showAssetDialog.value = false
  editingAsset.value = null
  assetFormRef.value?.resetFields()
  assetForm.value = {
    assetNumber: '',
    name: '',
    category: 'office',
    purchaseDate: '',
    purchasePrice: 0,
    supplier: '',
    location: '',
    status: 'normal',
  }
}

// 获取资产分类文本
const getAssetCategoryText = (category: string): string => {
  return assetCategories.value[category as keyof typeof assetCategories.value] || category
}

// 获取资产状态类型
const getAssetStatusType = (status: string): string => {
  const map: Record<string, string> = {
    normal: 'success',
    maintenance: 'warning',
    scrapped: 'info',
    lost: 'danger',
  }
  return map[status] || 'info'
}

// 获取资产状态文本
const getAssetStatusText = (status: string): string => {
  return assetStatuses.value[status as keyof typeof assetStatuses.value] || status
}

// 筛选后的来访记录
const filteredVisitors = computed(() => {
  // 使用通用搜索工具函数，确保域内搜索（只搜索来访登记数据）
  let result = filterData(
    visitors.value,
    visitorSearchText.value,
    ['visitorName', 'company', 'purpose', 'contactPerson'], // 只搜索来访登记相关字段
    visitorStatusFilter.value ? { status: visitorStatusFilter.value } : undefined
  )

  // 日期范围筛选（特殊处理）
  if (visitorDateRange.value && visitorDateRange.value.length === 2) {
    const [startDate, endDate] = visitorDateRange.value
    result = result.filter(v => {
      if (!v.visitTime) return false
      const visitDate = v.visitTime.split('T')[0]
      if (!visitDate) return false
      return visitDate >= startDate && visitDate <= endDate
    })
  }

  return result
})

// 筛选后的资产列表
const filteredAssets = computed(() => {
  // 使用通用搜索工具函数，确保域内搜索（只搜索资产数据）
  const filters: Record<string, any> = {}
  if (assetCategoryFilter.value) {
    filters.category = assetCategoryFilter.value
  }
  if (assetStatusFilter.value) {
    filters.status = assetStatusFilter.value
  }

  return filterData(
    assets.value,
    assetSearchText.value,
    ['assetNumber', 'name', 'supplier', 'location'], // 只搜索资产相关字段
    Object.keys(filters).length > 0 ? filters : undefined
  )
})

// 筛选后的物料列表
const filteredMaterials = computed(() => {
  // 使用通用搜索工具函数，确保域内搜索
  return filterData(
    materials.value,
    materialSearchText.value,
    ['name', 'location'], // 只搜索物料名称和位置
    materialCategoryFilter.value ? { category: materialCategoryFilter.value } : undefined
  )
})

// 来访登记筛选处理
const handleVisitorSearch = () => {
  // 筛选逻辑已在computed中实现
}

const handleVisitorFilter = () => {
  // 筛选逻辑已在computed中实现
}

const resetVisitorFilter = () => {
  visitorSearchText.value = ''
  visitorStatusFilter.value = ''
  visitorDateRange.value = null
}

// 资产登记筛选处理
const handleAssetSearch = () => {
  // 筛选逻辑已在computed中实现
}

const handleAssetFilter = () => {
  // 筛选逻辑已在computed中实现
}

const resetAssetFilter = () => {
  assetSearchText.value = ''
  assetCategoryFilter.value = ''
  assetStatusFilter.value = ''
}

// 物料筛选处理
const handleMaterialSearch = () => {
  // 筛选逻辑已在computed中实现
}

const handleMaterialFilter = () => {
  // 筛选逻辑已在computed中实现
}

const resetMaterialFilter = () => {
  materialSearchText.value = ''
  materialCategoryFilter.value = ''
}

onMounted(() => {
  loadUsers()
  loadApplications()
})
</script>

<style scoped lang="scss">
.admin-reception-module {
  .filter-bar {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background: #f5f5f7;
    border-radius: 12px;
    flex-wrap: wrap;
    gap: 12px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      border-color: #e5e5e7;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    :deep(.el-select) {
      .el-input__wrapper {
        border-radius: 10px;
      }
    }

    :deep(.el-date-editor) {
      border-radius: 10px;
    }

    .el-button {
      border-radius: 10px;
      font-weight: 500;
    }
  }

  .reception-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }

    :deep(.el-tabs__item) {
      border-bottom: none !important;
      
      &.is-active {
        background: #e8f4ff;
        border-bottom: none !important;
      }
    }

    :deep(.el-tabs__active-bar) {
      display: none !important;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }
  }

  // 物料管理 tabs 样式 - 与上层 tabs 保持一致
  :deep(.material-tabs) {
    .el-tabs__header {
      margin-bottom: 20px;
      background: #ffffff;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .el-tabs__nav-wrap {
      &::after {
        display: none;
      }
    }

    .el-tabs__item {
      border-radius: 12px;
      padding: 12px 20px;
      margin-right: 8px;
      font-weight: 500;
      color: #86868b;
      transition: all 0.2s ease;
      border-bottom: none !important;

      &:hover {
        color: #007aff;
        background: #f5f5f7;
      }

      &.is-active {
        color: #007aff;
        background: #e8f4ff;
        border-bottom: none !important;
      }
    }

    .el-tabs__active-bar {
      display: none !important;
    }
  }

  .module-card {
    border-radius: 16px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      color: #1d1d1f;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }
}
</style>
