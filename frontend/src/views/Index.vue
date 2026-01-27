<template>
  <div class="index-container page-content-enter">
    <!-- 欢迎标语板块 -->
    <div class="welcome-section fade-in-up">
      <div class="welcome-content">
        <!-- 个人信息卡片 -->
        <div class="user-profile-card fade-in-card">
          <div class="profile-avatar-wrapper">
            <el-avatar 
              :size="72" 
              :src="userProfile.avatar ? getAvatarUrl(userProfile.avatar) : ''"
              class="profile-avatar"
            >
              {{ (userProfile.nickname || userProfile.username || 'U').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="status-indicator" :class="getStatusClass(userProfile.workStatus)">
              <div class="status-dot"></div>
            </div>
          </div>
          <div class="profile-info">
            <div class="profile-name-section">
              <h2 class="profile-name">
                {{ getDisplayName() }}
              </h2>
              <el-tag 
                v-if="userProfile.workStatus" 
                :type="getStatusTagType(userProfile.workStatus)" 
                size="small" 
                class="status-tag"
              >
                <el-icon class="status-icon"><component :is="getStatusIcon(userProfile.workStatus)" /></el-icon>
                {{ getStatusText(userProfile.workStatus) }}
              </el-tag>
            </div>
            <p class="profile-username" v-if="userProfile.username">@{{ userProfile.username }}</p>
            <p class="profile-mood" v-if="userProfile.mood">{{ userProfile.mood }}</p>
            <div class="profile-meta" v-if="userProfile.department || userProfile.position">
              <span v-if="userProfile.department" class="meta-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ getDepartmentName(userProfile.department) }}
              </span>
              <span v-if="userProfile.position" class="meta-item">
                <el-icon><Briefcase /></el-icon>
                {{ getPositionName(userProfile.position) }}
              </span>
            </div>
          </div>
        </div>
        
        <h1 class="welcome-greeting">
          {{ welcomeGreeting }}，{{ userName }}
        </h1>
        <p class="welcome-encouragement" v-if="welcomeEncouragement">{{ welcomeEncouragement }}</p>
        
        <!-- 快速链接板块 -->
        <div class="quick-links">
          <div 
            class="quick-link-wrapper" 
            v-for="(link, index) in quickLinks" 
            :key="link.key"
            :class="`fade-in-delay-${index + 1}`"
          >
            <div 
              class="quick-link-item" 
              :class="{ 'is-expanded': expandedLinks[link.key] }"
              @click="toggleQuickLink(link)"
            >
              <div class="quick-link-icon" :style="{ backgroundColor: link.color }">
                <el-icon :size="24">
                  <List v-if="link.key === 'todo'" />
                  <Bell v-else-if="link.key === 'notice'" />
                  <Document v-else-if="link.key === 'announcement'" />
                  <ChatLineRound v-else-if="link.key === 'ai'" />
                </el-icon>
              </div>
              <div class="quick-link-content">
                <div class="quick-link-title">{{ link.title }}</div>
                <div class="quick-link-desc">{{ link.desc }}</div>
              </div>
            <div class="quick-link-badge" v-if="link.count !== undefined && link.count !== null">
              {{ link.count }}
            </div>
              <el-icon 
                class="quick-link-arrow" 
                :class="{ 'is-expanded': expandedLinks[link.key] }"
              >
                <ArrowDown v-if="expandedLinks[link.key]" />
                <ArrowRight v-else />
              </el-icon>
            </div>
            
            <!-- 展开的内容区域 -->
            <transition name="slide-down">
              <div class="quick-link-dropdown" v-if="expandedLinks[link.key]">
                <div class="dropdown-content">
                  <!-- 待办事项 -->
                  <template v-if="link.key === 'todo'">
                    <div class="dropdown-header-actions">
                      <el-button 
                        type="text" 
                        size="small" 
                        @click="markAllTodosRead"
                        :disabled="unreadTodosCount === 0"
                      >
                        {{ $t('index.markAllRead') }}
                      </el-button>
                    </div>
                    <div 
                      class="dropdown-item todo-item" 
                      :class="{ 'is-read': todo.read }"
                      v-for="todo in todos" 
                      :key="todo.id"
                    >
                      <div class="todo-content">
                        <el-checkbox v-model="todo.completed" @change="handleTodoChange(todo)">
                          <span :class="{ 'completed': todo.completed }">{{ todo.title }}</span>
                        </el-checkbox>
                        <div class="dropdown-meta">
                          <span class="dropdown-source" :class="getSourceClass(todo.source)" v-if="todo.source">
                            <el-icon v-if="todo.source === 'self'"><User /></el-icon>
                            <el-icon v-else-if="todo.source === 'boss'"><Star /></el-icon>
                            <el-icon v-else><Notification /></el-icon>
                            {{ getSourceText(todo.source, todo.sourceName) }}
                          </span>
                          <span class="dropdown-time">{{ todo.deadline }}</span>
                        </div>
                      </div>
                      <el-button 
                        v-if="!todo.read"
                        type="text" 
                        size="small" 
                        class="read-btn"
                        @click.stop="markTodoRead(todo)"
                      >
                        {{ $t('index.markRead') }}
                      </el-button>
                    </div>
                    <div class="dropdown-empty" v-if="todos.length === 0">
                      {{ $t('common.noData') }}
                    </div>
                  </template>
                  
                  <!-- 通知消息 -->
                  <template v-if="link.key === 'notice'">
                    <div class="dropdown-header-actions">
                      <el-button 
                        type="text" 
                        size="small" 
                        @click="markAllNoticesRead"
                        :disabled="unreadNoticesCount === 0"
                      >
                        {{ $t('index.markAllRead') }}
                      </el-button>
                    </div>
                    <div 
                      class="dropdown-item notice-item" 
                      :class="{ 'is-read': notice.read }"
                      v-for="notice in notices" 
                      :key="notice.id"
                    >
                      <el-tag :type="notice.type" size="small">{{ notice.category }}</el-tag>
                      <div class="notice-content" @click="viewDetail(notice)" style="cursor: pointer; flex: 1;">
                        <span class="dropdown-title">{{ notice.title }}</span>
                        <div class="dropdown-meta">
                          <span class="dropdown-source" :class="getSourceClass(notice.source)">
                            <el-icon v-if="notice.source === 'self'"><User /></el-icon>
                            <el-icon v-else-if="notice.source === 'boss'"><Star /></el-icon>
                            <el-icon v-else><Notification /></el-icon>
                            {{ getSourceText(notice.source, notice.sourceName) }}
                          </span>
                          <span class="dropdown-time">{{ notice.time }}</span>
                        </div>
                      </div>
                      <el-button 
                        v-if="!notice.read"
                        type="text" 
                        size="small" 
                        class="read-btn"
                        @click.stop="markNoticeRead(notice)"
                      >
                        {{ $t('index.markRead') }}
                      </el-button>
                    </div>
                    <div class="dropdown-empty" v-if="notices.length === 0">
                      {{ $t('common.noData') }}
                    </div>
                  </template>
                  
                  <!-- 公司公告 -->
                  <template v-if="link.key === 'announcement'">
                    <div class="dropdown-header-actions">
                      <el-button 
                        type="text" 
                        size="small" 
                        @click="markAllAnnouncementsRead"
                        :disabled="unreadAnnouncementsCount === 0"
                      >
                        {{ $t('index.markAllRead') }}
                      </el-button>
                    </div>
                    <div 
                      class="dropdown-item announcement-item" 
                      :class="{ 'is-read': announcement.read }"
                      v-for="announcement in announcements" 
                      :key="announcement.id"
                    >
                      <el-link 
                        type="primary" 
                        :underline="false" 
                        @click="viewDetail(announcement)"
                        style="cursor: pointer; flex: 1;"
                      >
                        {{ announcement.title }}
                      </el-link>
                      <span class="dropdown-time">{{ announcement.date }}</span>
                      <el-button 
                        v-if="!announcement.read"
                        type="text" 
                        size="small" 
                        class="read-btn"
                        @click.stop="markAnnouncementRead(announcement)"
                      >
                        {{ $t('index.markRead') }}
                      </el-button>
                    </div>
                    <div class="dropdown-empty" v-if="announcements.length === 0">
                      {{ $t('common.noData') }}
                    </div>
                  </template>
                  
                  <!-- AI助手 -->
                  <template v-if="link.key === 'ai'">
                    <div class="dropdown-ai">
                      <p>{{ $t('index.quickLinks.aiComingSoon') }}</p>
                    </div>
                  </template>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- 横幅内容板块 - 首页大 Banner（只展示，不在首页编辑） -->
    <div class="motivation-banner" :style="getBannerStyle()">
      <div class="banner-content">
        <transition name="fade" mode="out-in">
          <div v-if="currentMotivation.text" key="motivation" class="motivation-content">
            <el-icon class="quote-icon"><ChatDotRound /></el-icon>
            <p class="motivation-text" :style="getTextStyle(currentMotivation)">{{ currentMotivation.text }}</p>
            <p class="motivation-author" v-if="currentMotivation.author" :style="getAuthorStyle(currentMotivation)">{{ currentMotivation.author }}</p>
          </div>
          <div v-else key="loading" class="motivation-content">
            <el-icon class="quote-icon"><ChatDotRound /></el-icon>
            <p class="motivation-text">{{ $t('index.loading') }}</p>
          </div>
        </transition>
      </div>
    </div>

    <!-- 全球时区 + 人民币汇率 仪表盘（新设计） -->
    <div class="global-time-exchange fade-in-delay-4">
      <!-- 全球时区标题行（保持与其他卡片相同的 header 风格：图标 + 标题） -->
      <div class="gte-section-header">
        <div class="card-header">
          <el-icon><Clock /></el-icon>
          <span>GLOBAL TIMES / {{ $t('index.globalTimezones') }}</span>
        </div>
      </div>
      <!-- 全球时区卡片网格 -->
      <div class="gte-dashboard-grid">
        <!-- 东京 -->
        <div class="gte-time-card">
          <div class="gte-info-title">
            <h3>TOKYO</h3>
            <span class="gte-sub-tag">Japan · 日本 (UTC+9)</span>
          </div>
          <div class="gte-main-data">
            {{ getClockTimeDisplay(timeCardConfigs[0].clockIndex) }}
          </div>
          <div class="gte-date-sub gte-sub-tag">
            {{ formatDateForTimezone(timeCardConfigs[0].timeZone) }}
          </div>
          <div class="gte-bottom-status">
            <span
              class="gte-status-dot"
              :class="getWorkStatus(timeCardConfigs[0].timeZone).dotClass"
            ></span>
            <span class="gte-status-text">
              {{ getWorkStatus(timeCardConfigs[0].timeZone).label }}
            </span>
          </div>
          <!-- 东京建筑装饰图标 -->
          <svg
            class="gte-landmark-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          >
            <path d="M4 7h16M4 11h16M6 7v14M18 7v14M2 21h20M7 4l2-2h6l2 2" />
          </svg>
        </div>

        <!-- 迪拜 -->
        <div class="gte-time-card">
          <div class="gte-info-title">
            <h3>DUBAI</h3>
            <span class="gte-sub-tag">UAE · 阿联酋 (UTC+4)</span>
          </div>
          <div class="gte-main-data">
            {{ getClockTimeDisplay(timeCardConfigs[1].clockIndex) }}
          </div>
          <div class="gte-date-sub gte-sub-tag">
            {{ formatDateForTimezone(timeCardConfigs[1].timeZone) }}
          </div>
          <div class="gte-bottom-status">
            <span
              class="gte-status-dot"
              :class="getWorkStatus(timeCardConfigs[1].timeZone).dotClass"
            ></span>
            <span class="gte-status-text">
              {{ getWorkStatus(timeCardConfigs[1].timeZone).label }}
            </span>
          </div>
          <!-- 迪拜塔装饰图标 -->
          <svg
            class="gte-landmark-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          >
            <path d="M12 2v20M9 22h6M10 15h4M11 10h2M8 22l4-18 4 18" />
          </svg>
        </div>

        <!-- 柏林 -->
        <div class="gte-time-card">
          <div class="gte-info-title">
            <h3>BERLIN</h3>
            <span class="gte-sub-tag">Germany · 德国 (UTC+1)</span>
          </div>
          <div class="gte-main-data">
            {{ getClockTimeDisplay(timeCardConfigs[2].clockIndex) }}
          </div>
          <div class="gte-date-sub gte-sub-tag">
            {{ formatDateForTimezone(timeCardConfigs[2].timeZone) }}
          </div>
          <div class="gte-bottom-status">
            <span
              class="gte-status-dot"
              :class="getWorkStatus(timeCardConfigs[2].timeZone).dotClass"
            ></span>
            <span class="gte-status-text">
              {{ getWorkStatus(timeCardConfigs[2].timeZone).label }}
            </span>
          </div>
          <!-- 柏林地标装饰图标 -->
          <svg
            class="gte-landmark-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          >
            <path d="M3 21h18M4 7h16M4 7v14M20 7v14M8 7v14M16 7v14M12 7v14M2 7l2-3h16l2 3" />
          </svg>
        </div>

        <!-- 纽约 -->
        <div class="gte-time-card">
          <div class="gte-info-title">
            <h3>NEW YORK</h3>
            <span class="gte-sub-tag">USA · 美国 (UTC-5)</span>
          </div>
          <div class="gte-main-data">
            {{ getClockTimeDisplay(timeCardConfigs[3].clockIndex) }}
          </div>
          <div class="gte-date-sub gte-sub-tag">
            {{ formatDateForTimezone(timeCardConfigs[3].timeZone) }}
          </div>
          <div class="gte-bottom-status">
            <span
              class="gte-status-dot"
              :class="getWorkStatus(timeCardConfigs[3].timeZone).dotClass"
            ></span>
            <span class="gte-status-text">
              {{ getWorkStatus(timeCardConfigs[3].timeZone).label }}
            </span>
          </div>
          <!-- 纽约自由女神装饰图标 -->
          <svg
            class="gte-landmark-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          >
            <path d="M12 2l1 4h4l-3 2 1 4-3-2-3 2 1-4-3-2h4l1-4zM8 22h8v-8l-4-2-4 2v8z" />
          </svg>
        </div>
      </div>

      <!-- 人民币汇率标题行（与其他卡片一致的 header） -->
      <div class="gte-section-header gte-section-header-rates">
        <div class="card-header">
          <el-icon><TrendCharts /></el-icon>
          <span>CURRENCY EXCHANGE / {{ $t('index.exchangeRates') }} (CNY)</span>
        </div>
        <span class="gte-update-time" v-if="lastUpdateTime">
          {{ $t('index.lastUpdateTime') }}: {{ formatUpdateTime(lastUpdateTime) }}
        </span>
      </div>

      <!-- 人民币汇率卡片网格 -->
      <div class="gte-dashboard-grid gte-rates-grid">
        <div class="gte-rate-card" v-for="rate in exchangeRates" :key="rate.currency">
          <div class="gte-info-title">
            <h3>{{ rate.currency }} / CNY</h3>
            <span class="gte-sub-tag">
              <!-- 简单的中文描述，根据币种显示 -->
              <span v-if="rate.currency === 'USD'">美元 兑 人民币</span>
              <span v-else-if="rate.currency === 'EUR'">欧元 兑 人民币</span>
              <span v-else-if="rate.currency === 'GBP'">英镑 兑 人民币</span>
              <span v-else-if="rate.currency === 'JPY'">百日元 兑 人民币</span>
              <span v-else>{{ rate.currency }} 兑 人民币</span>
            </span>
          </div>
          <div class="gte-main-data">
            {{ typeof rate.rate === 'number' ? rate.rate.toFixed(4) : rate.rate }}
            <span class="gte-unit">CNY</span>
          </div>
          <div class="gte-bottom-status">
            <span class="gte-sub-tag">ExchangeRate-API · 实时汇率</span>
          </div>
          <div class="gte-currency-symbol">
            {{ getCurrencySymbol(rate.currency) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑横幅内容对话框 -->
    <el-dialog
      v-model="showEditMotivationDialog"
      :title="$t('index.editMotivations')"
      width="900px"
      :close-on-click-modal="false"
      class="edit-banner-dialog"
    >
      <div class="edit-content-section">
        <div class="section-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ $t('index.motivationHint') }}</span>
        </div>
            <div class="edit-motivation-list">
              <div class="motivation-item" v-for="(motivation, index) in editableMotivations" :key="`motivation-${motivation.id || 'new'}-${index}`">
                <div class="item-header">
                  <span class="item-index">#{{ index + 1 }}</span>
                  <div class="item-controls">
                    <span class="enabled-label">{{ motivation.enabled ? '已启用' : '已禁用' }}</span>
                    <el-switch v-model="motivation.enabled" size="small" />
                    <el-button type="danger" text size="small" @click="handleDeleteMotivation(motivation, index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="motivation-form">
                  <div class="form-field">
                    <label class="field-label">{{ $t('index.motivationText') }}</label>
                    <el-input
                      v-model="motivation.text"
                      type="textarea"
                      :rows="4"
                      :placeholder="$t('index.motivationText')"
                      class="modern-input"
                    />
                  </div>
                  <div class="form-field">
                    <label class="field-label">{{ $t('index.motivationAuthor') }}</label>
                    <el-input
                      v-model="motivation.author"
                      :placeholder="$t('index.motivationAuthor')"
                      class="modern-input"
                    />
                  </div>
                  <div class="form-field-row">
                    <div class="form-field" style="flex: 1; margin-right: 12px;">
                      <label class="field-label">{{ $t('index.textColor') }}</label>
                      <el-color-picker
                        v-model="motivation.textColor"
                        :predefine="['#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa07a', '#98d8c8']"
                        class="modern-input"
                      />
                    </div>
                    <div class="form-field" style="flex: 1;">
                      <label class="field-label">{{ $t('index.fontSize') }}</label>
                      <el-input-number
                        v-model="motivation.fontSize"
                        :min="12"
                        :max="72"
                        :step="2"
                        controls-position="right"
                        class="modern-input"
                        style="width: 100%;"
                      />
                    </div>
                  </div>
                  <div class="form-field">
                    <label class="field-label">{{ $t('index.backgroundImage') }}</label>
                    <div class="background-image-section">
                      <div class="banner-preview-small">
                        <img 
                          :src="getBannerImageUrl(motivation.backgroundImage || '')" 
                          alt="Banner" 
                          v-if="motivation.backgroundImage" 
                          @error="handleImageError"
                          style="width: 100%; height: 100%; object-fit: contain; display: block;"
                        />
                        <div v-else class="banner-placeholder-small">
                          <el-icon><Picture /></el-icon>
                          <span>暂无图片</span>
                        </div>
                      </div>
                      <div class="banner-form-small">
                        <div style="display: flex; gap: 8px; align-items: flex-start;">
                          <el-upload
                            :action="uploadAction"
                            :headers="uploadHeaders"
                            :on-success="(response: any) => handleUploadSuccess(response, motivation)"
                            :on-error="handleUploadError"
                            :before-upload="beforeUpload"
                            :show-file-list="false"
                            accept="image/*"
                            style="flex-shrink: 0;"
                          >
                            <template #default>
                              <el-button type="primary" :icon="Upload" size="default">{{ $t('index.uploadImage') }}</el-button>
                            </template>
                          </el-upload>
                          <el-input
                            v-model="motivation.backgroundImage"
                            :placeholder="$t('index.bannerImageUrl')"
                            class="modern-input"
                            style="flex: 1;"
                          />
                        </div>
                        <div class="hint-text" style="margin-top: 8px; font-size: 12px; color: #86868b;">
                          {{ $t('index.bannerImageHint') }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <el-button type="primary" @click="handleAddMotivation" class="add-button" :icon="Plus">
                {{ $t('index.addMotivation') }}
              </el-button>
            </div>
          </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditMotivationDialog = false" size="large">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSaveMotivations" :loading="savingMotivations" size="large">
            {{ $t('common.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑汇率对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="$t('index.editExchangeRates')"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="edit-rates-form">
        <div class="edit-rate-item" v-for="rate in editableRates" :key="rate.currency">
          <div class="rate-info">
            <div class="currency-header-small">
              <div class="currency-icon-small" :class="`currency-${rate.currency.toLowerCase()}`">
                <span class="currency-symbol-small">{{ getCurrencySymbol(rate.currency) }}</span>
              </div>
              <span class="currency-name">{{ rate.currency }}</span>
            </div>
            <el-input-number
              v-model="rate.rate"
              :precision="4"
              :step="0.0001"
              :min="0.0001"
              controls-position="right"
              style="width: 200px"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showEditDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveRates" :loading="savingRates">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 - 新闻/公告风格 -->
    <el-dialog
      v-model="showDetailDialog"
      width="800px"
      :close-on-click-modal="false"
      class="detail-dialog"
      align-center
      :show-close="false"
    >
      <div v-if="detailItem" class="announcement-container">
        <!-- 头部区域 -->
        <div class="announcement-header">
          <div class="header-top">
            <el-tag :type="detailItem?.type" size="small" class="category-badge">
              {{ detailItem?.category || getTypeLabel(detailItem?.type) }}
            </el-tag>
            <el-button 
              text 
              circle 
              class="close-button"
              @click="showDetailDialog = false"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <h1 class="announcement-title">{{ detailItem.title }}</h1>
          <div class="announcement-meta">
            <div class="meta-item">
              <el-icon class="meta-icon"><User /></el-icon>
              <span class="meta-label">{{ $t('index.detail.publisher') }}：</span>
              <span class="meta-value">{{ detailItem.isSystem !== false ? $t('index.detail.system') : (detailItem.sourceName || $t('index.detail.system')) }}</span>
            </div>
            <div class="meta-divider">|</div>
            <div class="meta-item">
              <el-icon class="meta-icon"><Clock /></el-icon>
              <span class="meta-label">{{ $t('index.detail.publishTime') }}：</span>
              <span class="meta-value">{{ formatFullDateTime(detailItem.publishTime || detailItem.date) }}</span>
            </div>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider-line"></div>

        <!-- 正文内容区域 -->
        <div class="announcement-body">
          <div class="content-wrapper">
            <div class="content-text">{{ detailItem.content || detailItem.title || '-' }}</div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="announcement-footer">
          <el-button type="primary" @click="showDetailDialog = false" class="close-button-primary">
            {{ $t('common.close') }}
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 通知和待办 -->
    <div class="bottom-section fade-in-delay-6">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="notice-card">
            <template #header>
              <div class="card-header">
                <el-icon><Bell /></el-icon>
                <span>{{ $t('index.latestNotices') }}</span>
              </div>
            </template>
            <div class="notice-list">
              <div 
                class="notice-item" 
                v-for="notice in notices" 
                :key="notice.id"
                @click="viewDetail(notice)"
                style="cursor: pointer;"
              >
                <el-tag :type="notice.type" size="small">{{ notice.category }}</el-tag>
                <span class="notice-title">{{ notice.title }}</span>
                <span class="notice-time">{{ notice.time }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="todo-card fade-in-delay-7">
            <template #header>
              <div class="card-header">
                <el-icon><List /></el-icon>
                <span>{{ $t('index.todoList') }}</span>
              </div>
            </template>
            <div class="todo-list">
              <div class="todo-item" v-for="todo in todos" :key="todo.id">
                <el-checkbox v-model="todo.completed">{{ todo.title }}</el-checkbox>
                <span class="todo-time">{{ todo.deadline }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 公司通告和新闻 -->
    <div class="news-section fade-in-delay-8">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="news-card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>{{ $t('index.companyAnnouncements') }}</span>
              </div>
            </template>
            <div class="news-list">
              <div 
                class="news-item" 
                v-for="announcement in announcements" 
                :key="announcement.id"
                @click="viewDetail(announcement)"
                style="cursor: pointer;"
              >
                <el-link type="primary" :underline="false">
                  {{ announcement.title }}
                </el-link>
                <span class="news-time">{{ announcement.date }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="news-card">
            <template #header>
              <div class="card-header">
                <el-icon><Reading /></el-icon>
                <span>{{ $t('index.industryNews') }}</span>
              </div>
            </template>
            <div class="news-list">
              <div class="news-item" v-for="news in industryNews" :key="news.id">
                <el-link type="primary" :underline="false" @click="viewDetail(news)">
                  {{ news.title }}
                </el-link>
                <span class="news-time">{{ news.date }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLocale } from '../i18n'
import {
  ChatDotRound,
  Clock,
  TrendCharts,
  ArrowDown,
  Bell,
  List,
  Document,
  Reading,
  ArrowRight,
  ChatLineRound,
  Notification,
  User,
  Star,
  Edit,
  Close,
  Plus,
  Delete,
  InfoFilled,
  Picture,
  Upload,
  OfficeBuilding,
  Briefcase,
  CircleCheck,
  CircleClose,
  VideoCamera,
  Promotion,
  Sunny,
  SwitchButton,
  Location as LocationIcon
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'
import { getProfile, getAvatarUrl, type UserProfile } from '../api/users'
import { getMyTodos, type Reminder } from '../api/reminders'
import { getActiveAnnouncements, markAnnouncementAsRead, markAllAnnouncementsAsRead, type Announcement } from '../api/announcements'
import { getExchangeRates, updateExchangeRatesBatch, type ExchangeRate, type UpdateExchangeRateDto } from '../api/exchange-rates'
import {
  getEnabledMotivations,
  getMotivations,
  createMotivation,
  updateMotivation as updateMotivationAPI,
  deleteMotivation,
  type Motivation
} from '../api/motivations'
import api from '../api/config'

const { t, locale } = useI18n()
const userStore = useUserStore()

// 获取用户名
const userName = computed(() => userStore.userName)

// 计算当前用户是否为超级管理员
const isSuperAdmin = computed(() => {
  return userStore.userInfo?.role === 'super_admin'
})

// 汇率相关状态
const exchangeRates = ref<ExchangeRate[]>([])
const lastUpdateTime = ref<string | null>(null)
const showEditDialog = ref(false)
const editableRates = ref<Array<{ currency: string; rate: number }>>([])
const savingRates = ref(false)

// 欢迎标语 - 根据时间获取
const getTimeGreeting = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return t('index.greetings.morning')
  } else if (hour >= 12 && hour < 18) {
    return t('index.greetings.afternoon')
  } else if (hour >= 18 && hour < 22) {
    return t('index.greetings.evening')
  } else {
    return t('index.greetings.night')
  }
}

const welcomeGreeting = computed(() => getTimeGreeting())

// 欢迎鼓励语
const encouragements = computed(() => {
  try {
    const result = t('index.greetings.encouragement', { returnObjects: true })
    if (Array.isArray(result)) {
      return result as string[]
    }
    // 如果返回的不是数组，返回默认值
    return []
  } catch (error) {
    // 静默失败，返回默认值
    console.warn('无法加载鼓励语:', error)
    return []
  }
})
const welcomeEncouragement = computed(() => {
  const items = encouragements.value
  if (items && items.length > 0) {
    return items[Math.floor(Math.random() * items.length)]
  }
  return ''
})

// 未读通知数量
const unreadNoticesCount = computed(() => {
  if (!noticesData.value || !Array.isArray(noticesData.value)) {
    return 0
  }
  return noticesData.value.filter((n: any) => !n.read).length
})

// 未读待办数量（未完成且未读）
const unreadTodosCount = computed(() => {
  if (!todosData.value || !Array.isArray(todosData.value)) {
    return 0
  }
  return todosData.value.filter((t: any) => !t.completed && !t.read).length
})

// 未读公告数量
const unreadAnnouncementsCount = computed(() => {
  if (!announcements.value || !Array.isArray(announcements.value)) {
    return 0
  }
  return announcements.value.filter((a: any) => !a.read).length
})

// 快速链接数据 - 需要确保todos等数据已初始化
const quickLinks = computed(() => {
  const todoCount = unreadTodosCount.value
  const noticeCount = unreadNoticesCount.value
  const announcementCount = unreadAnnouncementsCount.value

  return [
    {
      key: 'todo',
      title: t('index.quickLinks.todo'),
      desc: t('index.quickLinks.todoDesc'),
      icon: 'List',
      color: '#409eff',
      count: todoCount, // 显示实际数量，包括0
      route: '/todo'
    },
    {
      key: 'notice',
      title: t('index.quickLinks.notice'),
      desc: t('index.quickLinks.noticeDesc'),
      icon: 'Bell',
      color: '#f56c6c',
      count: noticeCount, // 显示实际数量，包括0
      route: '/notices'
    },
    {
      key: 'announcement',
      title: t('index.quickLinks.announcement'),
      desc: t('index.quickLinks.announcementDesc'),
      icon: 'Document',
      color: '#67c23a',
      count: announcementCount, // 显示实际数量，包括0
      route: '/announcements'
    },
    {
      key: 'ai',
      title: t('index.quickLinks.ai'),
      desc: t('index.quickLinks.aiDesc'),
      icon: 'ChatLineRound',
      color: '#e6a23c',
      count: 0,
      route: '/ai-assistant'
    }
  ]
})


// 横幅内容相关状态（整合了文本和背景图片）
const motivationsData = ref<Motivation[]>([])
const currentMotivation = ref<Partial<Motivation>>({})
const currentMotivationIndex = ref(0)
let motivationTimer: number | null = null

// 编辑对话框相关
const showEditMotivationDialog = ref(false)
const editableMotivations = ref<Array<Motivation & { _isNew?: boolean }>>([])
const savingMotivations = ref(false)

// 用户个人信息
const userProfile = ref<UserProfile>({
  id: 0,
  username: '',
  nickname: '',
  role: '',
})

// 展开的快速链接
const expandedLinks = ref<Record<string, boolean>>({})

// 切换快速链接展开/收起
const toggleQuickLink = (link: any) => {
  expandedLinks.value[link.key] = !expandedLinks.value[link.key]
}

// 处理待办事项变化
const handleTodoChange = async (todo: any) => {
  try {
    const { markReminderAsCompleted } = await import('../api/reminders')
    
    if (todo.completed) {
      // 标记为已完成
      await markReminderAsCompleted(todo.id)
      todo.read = true // 完成时自动标记为已读
    }
    console.log('待办事项状态变化:', todo)
  } catch (error: any) {
    // 如果API调用失败，恢复复选框状态
    todo.completed = !todo.completed
    ElMessage.error(error.message || t('common.error'))
  }
}

// 标记通知为已读（独立于公告的已读状态）
const markNoticeRead = async (notice: any) => {
  const noticeItem = noticesData.value.find(n => n.id === notice.id)
  if (noticeItem) {
    noticeItem.read = true
    noticeReadStatus.value[notice.id] = true
    saveNoticeReadStatus()
  }
}

// 标记所有通知为已读（独立于公告的已读状态）
const markAllNoticesRead = () => {
  noticesData.value.forEach((notice: any) => {
    notice.read = true
    noticeReadStatus.value[notice.id] = true
  })
  saveNoticeReadStatus()
  ElMessage.success(t('common.success'))
}

// 标记待办为已读
const markTodoRead = async (todo: any) => {
  try {
    const { markReminderAsRead } = await import('../api/reminders')
    await markReminderAsRead(todo.id)
    const todoItem = todosData.value.find(t => t.id === todo.id)
    if (todoItem) {
      todoItem.read = true
    }
    ElMessage.success(t('index.markReadSuccess'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 标记所有待办为已读
const markAllTodosRead = async () => {
  try {
    // 批量标记所有未读的待办为已读
    const unreadTodos = todosData.value.filter(t => !t.read)
    const { markReminderAsRead } = await import('../api/reminders')
    await Promise.all(unreadTodos.map(todo => markReminderAsRead(todo.id)))
    
    todosData.value.forEach((todo: any) => {
      todo.read = true
    })
    ElMessage.success(t('index.markAllReadSuccess'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 标记公告为已读（只影响公司公告卡片，不影响通知消息）
const markAnnouncementRead = async (announcement: any) => {
  try {
    await markAnnouncementAsRead(announcement.id)
    const announcementItem = announcementsData.value.find(a => a.id === announcement.id)
    if (announcementItem) {
      (announcementItem as any).isRead = true
    }
    // 重新加载数据（但不影响通知消息的已读状态）
    await loadNoticesAndAnnouncements()
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 标记所有公告为已读（只影响公司公告卡片，不影响通知消息）
const markAllAnnouncementsRead = async () => {
  try {
    // 获取所有未读的公告ID（只从公司公告卡片中获取）
    const unreadAnnouncementIds = announcements.value
      .filter((a: any) => !a.read)
      .map((a: any) => a.id)
    
    if (unreadAnnouncementIds.length === 0) {
      return
    }
    
    await markAllAnnouncementsAsRead(unreadAnnouncementIds)
    
    // 更新本地状态（只更新公司公告卡片的状态）
    announcementsData.value.forEach((announcement: any) => {
      if (unreadAnnouncementIds.includes(announcement.id)) {
        announcement.isRead = true
      }
    })
    
    // 重新加载数据以更新UI（但不影响通知消息的已读状态）
    await loadNoticesAndAnnouncements()
    ElMessage.success(t('common.success'))
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 获取通知来源文本
const getSourceText = (source: string, sourceName?: string) => {
  if (source === 'self') {
    return t('index.noticeSource.self')
  } else if (source === 'boss') {
    // 如果sourceName为空，只返回"（领导）"，否则返回"姓名（领导）"
    return sourceName ? `${sourceName}${t('index.noticeSource.boss')}` : t('index.noticeSource.boss')
  } else if (source === 'system') {
    return t('index.noticeSource.system')
  } else {
    return sourceName || t('index.noticeSource.other')
  }
}

// 获取通知来源样式类
const getSourceClass = (source: string) => {
  return {
    'source-self': source === 'self',
    'source-boss': source === 'boss',
    'source-system': source === 'system'
  }
}

// 格式化时间显示
const formatTime = (timeKey: string, timeValue: number) => {
  if (timeKey === 'hoursAgo') {
    if (timeValue === 0) {
      return t('index.time.justNow')
    }
    return t('index.time.hoursAgo', { n: timeValue })
  } else if (timeKey === 'daysAgo') {
    if (timeValue === 0) {
      return t('index.time.today')
    }
    return t('index.time.daysAgo', { n: timeValue })
  } else if (timeKey === 'justNow') {
    return t('index.time.justNow')
  }
  return ''
}

// 加载名言数据
const loadMotivations = async () => {
  try {
    const data = await getEnabledMotivations()
    motivationsData.value = data
    
    // 清除旧的定时器
    if (motivationTimer) {
      clearInterval(motivationTimer)
      motivationTimer = null
    }
    
    if (data.length > 0) {
      // 重置索引
      currentMotivationIndex.value = 0
      // 立即显示第一条
      updateMotivation()
      
      // 根据数量决定是否轮播
      if (data.length > 1) {
        motivationTimer = setInterval(() => {
          updateMotivation()
        }, 8000)
        console.log('名言轮播已启动，数量:', data.length)
      } else {
        console.log('只有一条名言，不启动轮播')
      }
    } else {
      currentMotivation.value = {}
      currentMotivationIndex.value = 0
    }
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('加载名言失败（不影响其他功能）:', error)
    }
    // 使用默认值
    motivationsData.value = []
    currentMotivation.value = {}
    currentMotivationIndex.value = 0
  }
}



// 获取文字样式
const getTextStyle = (motivation: Partial<Motivation>) => {
  const style: any = {}
  if (motivation.textColor) {
    style.color = motivation.textColor
  }
  if (motivation.fontSize) {
    style.fontSize = `${motivation.fontSize}px`
  }
  return style
}

// 获取作者样式
const getAuthorStyle = (motivation: Partial<Motivation>) => {
  const style: any = {}
  if (motivation.textColor) {
    style.color = motivation.textColor
    style.opacity = 0.85
  }
  if (motivation.fontSize) {
    // 作者字体比正文小一些
    style.fontSize = `${Math.max(14, (motivation.fontSize || 28) * 0.65)}px`
  }
  return style
}

// 更新当前显示的横幅内容（智能轮播：只有一条时不轮播）
const updateMotivation = () => {
  if (motivationsData.value.length === 0) {
    currentMotivation.value = {}
    return
  }
  
  // 如果只有一条，不轮播，直接显示
  if (motivationsData.value.length === 1) {
    const item = motivationsData.value[0]
    if (item) {
      currentMotivation.value = item
    }
    return
  }
  
  // 多条时自动轮播
  if (motivationsData.value.length > 1) {
    currentMotivationIndex.value = (currentMotivationIndex.value + 1) % motivationsData.value.length
    const selected = motivationsData.value[currentMotivationIndex.value]
    if (selected) {
      currentMotivation.value = selected
      if (import.meta.env.DEV) {
        console.log('轮播切换到第', currentMotivationIndex.value + 1, '条，共', motivationsData.value.length, '条')
      }
    }
  }
}

// 解析后端API基础地址
const resolveApiBaseOrigin = () => {
  const baseURL = api.defaults.baseURL
  if (baseURL) {
    try {
      const parsed = new URL(baseURL, window.location.origin)
      const pathname = parsed.pathname.replace(/\/api$/, '')
      return `${parsed.protocol}//${parsed.host}${pathname}`.replace(/\/$/, '')
    } catch (error) {
      console.warn('解析 baseURL 失败，使用 window.location.origin 作为兜底', error)
    }
  }
  return window.location.origin.replace(/\/$/, '')
}

const apiBaseOrigin = resolveApiBaseOrigin()

// 获取Banner图片URL（处理本地和网络URL）
const getBannerImageUrl = (url: string) => {
  if (!url) return ''
  
  url = url.trim()
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  if (url.startsWith('/api/')) {
    return `${apiBaseOrigin}${url}`
  }
  
  if (url.startsWith('/')) {
    return `${apiBaseOrigin}${url}`
  }
  
  return `${apiBaseOrigin}/api/motivations/banner-images/serve/${encodeURIComponent(url)}`
}

// 获取Banner样式（从当前Motivation获取背景图片）
const getBannerStyle = () => {
  const bgImage = currentMotivation.value?.backgroundImage
  if (bgImage) {
    const imageUrl = getBannerImageUrl(bgImage)
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}

// 上传相关
const uploadAction = computed(() => {
  return `${apiBaseOrigin}/api/motivations/banner-images/upload`
})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

const beforeUpload = (file: File) => {
  const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error(t('common.imageTypeLimit'))
    return false
  }
  if (!isLt10M) {
    ElMessage.error(t('common.imageSizeLimit'))
    return false
  }
  return true
}

const handleUploadSuccess = (response: any, motivation: any) => {
  if (import.meta.env.DEV) {
    console.log('上传成功响应:', response)
  }
  if (response && response.url) {
    motivation.backgroundImage = response.url
    ElMessage.success(t('common.uploadSuccess'))
  } else if (response && response.data && response.data.url) {
    // 处理可能的响应包装
    motivation.backgroundImage = response.data.url
    ElMessage.success(t('common.uploadSuccess'))
  } else {
    if (import.meta.env.DEV) {
      console.warn('上传响应格式异常:', response)
    }
    ElMessage.warning(t('common.uploadSuccessButNoUrl'))
  }
}

const handleUploadError = (error: any) => {
  if (import.meta.env.DEV) {
    console.error('上传失败:', error)
  }
  ElMessage.error(t('common.operationFailed'))
}

const handleImageError = (event: any) => {
  const failedUrl = event.target.src
  console.warn('图片加载失败:', failedUrl)
  
  // 如果是网络图片，尝试添加代理或显示错误提示
  if (failedUrl.startsWith('http://') || failedUrl.startsWith('https://')) {
    console.warn('网络图片加载失败，可能的原因：')
    console.warn('1. 图片URL不存在或已失效')
    console.warn('2. 服务器CORS策略阻止了跨域访问')
    console.warn('3. 网络连接问题')
    console.warn('建议：使用本地上传功能或检查图片URL是否有效')
  }
  
  // 可以在这里设置一个默认图片或显示错误提示
  // event.target.style.display = 'none'
}

// 打开编辑对话框
const handleOpenEditMotivationDialog = async () => {
  try {
    // 获取所有数据（包括未启用的），用于编辑
    const motivations = await getMotivations()
    editableMotivations.value = motivations.map(m => ({ ...m }))
    showEditMotivationDialog.value = true
  } catch (error: any) {
    ElMessage.error(error.message || t('common.error'))
  }
}

// 添加名言
const handleAddMotivation = () => {
  editableMotivations.value.push({
    id: 0,
    text: '',
    author: '',
    textColor: '#ffffff',
    fontSize: 28,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _isNew: true
  })
}


// 删除名言
const handleDeleteMotivation = async (motivation: Motivation & { _isNew?: boolean }, index: number) => {
  try {
    // 确认删除
    await ElMessageBox.confirm(
      t('index.deleteMotivationConfirmMessage'),
      t('index.deleteMotivationConfirmTitle'),
      {
        type: 'warning',
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel')
      }
    )

    if (motivation._isNew) {
      // 如果是新添加的（未保存的），直接从数组中移除
      editableMotivations.value.splice(index, 1)
      ElMessage.success(t('common.deleteSuccess'))
    } else {
      // 如果是已保存的，先调用API删除，成功后再从数组中移除
      await deleteMotivation(motivation.id)
      // 使用 findIndex 确保删除正确的项（防止索引变化导致的问题）
      const actualIndex = editableMotivations.value.findIndex(m => m.id === motivation.id)
      if (actualIndex !== -1) {
        editableMotivations.value.splice(actualIndex, 1)
      }
      ElMessage.success(t('common.deleteSuccess'))
    }
  } catch (error: any) {
    // 用户取消删除或删除失败
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || t('common.error'))
    }
  }
}


// 保存横幅内容
const handleSaveMotivations = async () => {
  try {
    savingMotivations.value = true
    
    // 验证并保存横幅内容（包含文本和背景图片）
    for (const motivation of editableMotivations.value) {
      if (!motivation.text || !motivation.text.trim()) {
        ElMessage.warning(t('index.motivationTextRequired'))
        return
      }
      
      if (motivation._isNew) {
        await createMotivation({
          text: motivation.text.trim(),
          author: motivation.author?.trim() || '',
          textColor: motivation.textColor || '#ffffff',
          fontSize: motivation.fontSize || 28,
          backgroundImage: motivation.backgroundImage?.trim() || '',
          enabled: motivation.enabled !== false
        })
      } else {
        await updateMotivationAPI(motivation.id, {
          text: motivation.text.trim(),
          author: motivation.author?.trim() || '',
          textColor: motivation.textColor || '#ffffff',
          fontSize: motivation.fontSize || 28,
          backgroundImage: motivation.backgroundImage?.trim() || '',
          enabled: motivation.enabled !== false
        })
      }
    }
    
    ElMessage.success(t('common.saveSuccess') || '保存成功')
    showEditMotivationDialog.value = false
    
    // 重新加载数据（会自动处理轮播逻辑）
    await loadMotivations()
    
    // 确保轮播定时器正确设置
    await nextTick()
    if (motivationsData.value.length > 1 && !motivationTimer) {
      motivationTimer = setInterval(updateMotivation, 8000)
      console.log('启动横幅内容轮播定时器，数量:', motivationsData.value.length)
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || error?.response?.data?.error || t('common.error')
    ElMessage.error(errorMessage)
  } finally {
    savingMotivations.value = false
  }
}

// 时钟配置（使用 IANA timezone，自动处理夏令时）
interface ClockConfig {
  name: string
  timezone: string
}

const getClockConfigs = (): ClockConfig[] => [
  { name: t('index.tokyo'), timezone: 'Asia/Tokyo' },
  { name: t('index.newYork'), timezone: 'America/New_York' },
  { name: t('index.dubai'), timezone: 'Asia/Dubai' },
  { name: t('index.berlin'), timezone: 'Europe/Berlin' },
]

type ClockState = ClockConfig & { time: string }

const clocks = reactive<ClockState[]>(
  getClockConfigs().map(config => ({
    ...config,
    time: '00:00:00',
  }))
)

const clockRefs = ref<(HTMLElement | null)[]>([])
let clockTimer: number | null = null

type ClockDom = {
  hourHand: HTMLElement
  minuteHand: HTMLElement
  secondHand: HTMLElement
}

const clockDoms: Array<ClockDom | null> = []

// 设置时钟引用的函数
const setClockRef = (el: HTMLElement | null, index: number) => {
  if (!el) return
  clockRefs.value[index] = el
}

// 获取货币符号/图标
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥'
  }
  return symbols[currency] || currency
}

// 加载汇率数据（完全由后端负责从第三方接口同步，这里只调后端 API）
const loadExchangeRates = async () => {
  try {
    const rates = await getExchangeRates() // 调用后端 /exchange-rates
    exchangeRates.value = rates // 更新本地状态
    
    if (rates.length === 0) { // 如果后端也没有数据，使用默认值兜底
      const defaultRates: ExchangeRate[] = [
        { id: 0, currency: 'USD', rate: 7.1220, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 0, currency: 'EUR', rate: 7.8912, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 0, currency: 'GBP', rate: 9.1230, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 0, currency: 'JPY', rate: 0.0489, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ] // 结束默认值数组
      exchangeRates.value = defaultRates // 使用默认值
      lastUpdateTime.value = new Date().toISOString() // 更新时间
    } else {
      // 根据后端返回数据计算出最近的更新时间
      const latestUpdate = rates.reduce((latest, rate) => {
        const rateTime = new Date(rate.updatedAt).getTime()
        const latestTime = latest ? new Date(latest.updatedAt).getTime() : 0
        return rateTime > latestTime ? rate : latest
      }, null as ExchangeRate | null)
      
      if (latestUpdate) {
        lastUpdateTime.value = latestUpdate.updatedAt
      }
    }
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.warn('从后端加载汇率失败（使用默认值兜底，不影响其他功能）:', error)
    }
    const fallbackRates: ExchangeRate[] = [
      { id: 0, currency: 'USD', rate: 7.1220, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 0, currency: 'EUR', rate: 7.8912, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 0, currency: 'GBP', rate: 9.1230, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 0, currency: 'JPY', rate: 0.0489, change: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ] // 结束 fallback 数组
    exchangeRates.value = fallbackRates
    lastUpdateTime.value = new Date().toISOString()
  }
}

// 格式化更新时间
const formatUpdateTime = (timeStr: string): string => {
  const time = new Date(timeStr)
  const year = time.getFullYear()
  const month = String(time.getMonth() + 1).padStart(2, '0')
  const day = String(time.getDate()).padStart(2, '0')
  const hours = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  
  return `${year}年${month}月${day}日${hours}点${minutes}分`
}

// 打开编辑对话框
const handleOpenEditDialog = () => {
  // 如果已有汇率数据，使用现有数据；否则使用默认值
  if (exchangeRates.value && exchangeRates.value.length > 0) {
    editableRates.value = exchangeRates.value.map(rate => ({
      currency: rate.currency,
      rate: typeof rate.rate === 'number' ? rate.rate : parseFloat(rate.rate as any)
    }))
  } else {
    // 如果没有数据，使用默认货币列表
    const defaultCurrencies = ['USD', 'EUR', 'GBP', 'JPY']
    editableRates.value = defaultCurrencies.map(currency => ({
      currency: currency,
      rate: 0
    }))
  }
  showEditDialog.value = true
}

// 保存汇率
const handleSaveRates = async () => {
  try {
    savingRates.value = true
    
    const updates: UpdateExchangeRateDto[] = editableRates.value.map(rate => ({
      currency: rate.currency,
      rate: rate.rate
    }))
    
    await updateExchangeRatesBatch(updates)
    
    ElMessage.success(t('common.success'))
    showEditDialog.value = false
    
    // 重新加载汇率
    await loadExchangeRates()
  } catch (error: any) {
    console.error('保存汇率失败:', error)
    ElMessage.error(error.message || t('common.error'))
  } finally {
    savingRates.value = false
  }
}

// 通知数据 - 从后端API获取（公告和提醒）
const noticesData = ref<any[]>([])
const announcementsData = ref<Announcement[]>([])
// 待办事项数据 - 从后端API获取
const todosData = ref<any[]>([])

// 通知消息的已读状态（独立存储，与公司公告的已读状态分离）
const noticeReadStatus = ref<Record<string, boolean>>({})

// 从localStorage加载通知已读状态
const loadNoticeReadStatus = () => {
  try {
    const saved = localStorage.getItem('noticeReadStatus')
    if (saved) {
      noticeReadStatus.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载通知已读状态失败:', error)
  }
}

// 保存通知已读状态到localStorage
const saveNoticeReadStatus = () => {
  try {
    localStorage.setItem('noticeReadStatus', JSON.stringify(noticeReadStatus.value))
  } catch (error) {
    console.error('保存通知已读状态失败:', error)
  }
}

// 加载通知和公告
const loadNoticesAndAnnouncements = async () => {
  try {
    // 加载公告/通知
    const announcements = await getActiveAnnouncements()
    announcementsData.value = announcements
    
    // 转换为通知格式（通知消息中的公告使用独立的已读状态，不依赖后端）
    const noticeItems = announcements.map((ann: Announcement) => {
      const noticeId = `ann-${ann.id}`
      // 如果是admin发布的，显示为"系统"
      const isSystem = ann.isSystem || false
      return {
        id: noticeId,
        category: ann.type === 'announcement' ? t('index.noticeCategory.announcement') : t('index.noticeCategory.notice'),
        type: ann.type === 'announcement' ? 'success' : 'info',
        title: ann.title,
        timeKey: 'daysAgo',
        timeValue: getDaysAgo(ann.publishTime),
        source: isSystem ? 'system' : 'system', // admin发布的都显示为"系统"
        sourceName: '',
        read: noticeReadStatus.value[noticeId] || false, // 使用独立的通知已读状态
        content: ann.content,
        publishTime: ann.publishTime,
        creatorId: ann.creatorId,
        isSystem: ann.isSystem || false,
        announcementId: ann.id,
      }
    })
    
    // 加载提醒（已到时间的提醒会显示在通知中）
    const reminders = await getMyTodos()
    const dueReminders = reminders.filter((r: Reminder) => {
      const reminderTime = new Date(r.reminderTime)
      const now = new Date()
      // 显示所有已到期的未完成提醒（不需要等待isNotified）
      return reminderTime <= now && !r.isCompleted
    })
    
    const reminderNotices = dueReminders.map((reminder: Reminder) => ({
      id: `reminder-${reminder.id}`,
      category: t('index.noticeCategory.reminder'),
      type: 'warning',
      title: reminder.content,
      timeKey: 'hoursAgo',
      timeValue: getHoursAgo(reminder.reminderTime),
      source: 'boss',
      sourceName: '', // TODO: 从creatorId获取创建者名称
      read: reminder.isRead,
      content: reminder.content,
      publishTime: reminder.reminderTime,
      reminderId: reminder.id,
    }))
    
    noticesData.value = [...noticeItems, ...reminderNotices]
  } catch (error: any) {
    // 静默失败，不显示错误消息，避免影响用户体验
    // 只在开发环境记录错误
    if (import.meta.env.DEV) {
      console.warn('加载通知和公告失败（不影响其他功能）:', error)
    }
    // 使用空数组，确保页面可以正常显示
    noticesData.value = []
    announcementsData.value = []
  }
}

// 获取几天前
const getDaysAgo = (timeStr: string): number => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// 获取几小时前
const getHoursAgo = (timeStr: string): number => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  return Math.floor(diff / (1000 * 60 * 60))
}

// 通知数据 - 格式化时间显示
const notices = computed(() => {
  if (!noticesData.value || !Array.isArray(noticesData.value)) {
    return []
  }
  return noticesData.value.map(notice => ({
    ...notice,
    time: formatTime(notice.timeKey, notice.timeValue)
  }))
})

// 待办事项数据 - 从后端API获取（已在上面定义）
// todosData 已在 loadTodos 函数中定义为 ref

// 加载待办事项（从后端API）
const loadTodos = async () => {
  try {
    const reminders = await getMyTodos()
    // 只显示未完成的提醒作为待办事项
    const incompleteReminders = reminders.filter((r: Reminder) => !r.isCompleted)
    // 转换为首页显示格式
    todosData.value = incompleteReminders.map((reminder: Reminder) => ({
      id: reminder.id,
      title: reminder.content,
      completed: reminder.isCompleted,
      deadline: formatReminderTime(reminder.reminderTime),
      deadlineKey: getDeadlineKey(reminder.reminderTime),
      source: 'boss', // 提醒来自其他用户
      sourceName: '', // TODO: 从creatorId获取创建者名称
      read: reminder.isRead,
      memo: reminder.memo,
      reminderTime: reminder.reminderTime,
    }))
  } catch (error: any) {
    // 静默失败，不显示错误消息，避免影响用户体验
    // 只在开发环境记录错误
    if (import.meta.env.DEV) {
      console.warn('加载待办事项失败（不影响其他功能）:', error)
    }
    // 如果API失败，使用空数组，确保页面可以正常显示
    todosData.value = []
  }
}

// 格式化提醒时间
const formatReminderTime = (timeStr: string): string => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = time.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return t('index.time.today')
  } else if (days === 1) {
    return t('index.time.tomorrow')
  } else if (days > 1 && days <= 7) {
    return t('index.time.thisWeek')
  } else {
    return time.toLocaleDateString(locale.value)
  }
}

// 获取截止时间key
const getDeadlineKey = (timeStr: string): string => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = time.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days > 1 && days <= 7) return 'thisWeek'
  return 'later'
}

// 待办事项 - 格式化截止时间显示
const todos = computed(() => {
  return todosData.value.map(todo => ({
    ...todo,
    deadline: todo.deadline || t(`index.time.${todo.deadlineKey}`)
  }))
})

// 公司通告 - 从后端API获取（只展示类型为 "announcement" 的记录）
const announcements = computed(() => {
  if (!announcementsData.value || !Array.isArray(announcementsData.value)) {
    return []
  }
  return announcementsData.value
    .filter(ann => ann.type === 'announcement')
    .map(ann => ({
      id: ann.id,
      title: ann.title,
      date: formatDateTime(ann.publishTime),
      read: (ann as any).isRead || false, // 使用后端返回的已读状态
      type: ann.type,
      content: ann.content,
      publishTime: ann.publishTime,
      creatorId: ann.creatorId,
      isSystem: ann.isSystem || false,
    }))
})

// 行业新闻 - 从公告表中过滤类型为 "industry_news" 的记录
const industryNews = computed(() => {
  if (!announcementsData.value || !Array.isArray(announcementsData.value)) {
    return []
  }
  return announcementsData.value
    .filter(ann => ann.type === 'industry_news')
    .map(ann => ({
      id: ann.id,
      title: ann.title,
      date: formatDateTime(ann.publishTime),
      type: ann.type,
      content: ann.content,
      publishTime: ann.publishTime,
      creatorId: ann.creatorId,
      isSystem: ann.isSystem || false,
    }))
})

const getClockParts = (timeZone: string) => { // 获取指定时区的时分秒
  const fmt = new Intl.DateTimeFormat('en-GB', { // 使用 24 小时制格式化器
    timeZone, // 目标时区
    hour: '2-digit', // 小时两位
    minute: '2-digit', // 分钟两位
    second: '2-digit', // 秒两位
    hourCycle: 'h23', // 24 小时制
  }) // 结束 Intl.DateTimeFormat

  const raw = fmt.format(new Date()) // 得到形如 "13:05:09" 的字符串
  const [hh, mm, ss] = raw.split(':') // 拆分成时分秒字符串
  const h = Number(hh ?? 0) // 小时数值
  const m = Number(mm ?? 0) // 分钟数值
  const s = Number(ss ?? 0) // 秒数值
  return { h, m, s } // 返回一个对象方便使用
} // 结束 getClockParts

const formatClockTime = (timeZone: string) => { // 按当前语言格式化指定时区的时间
  const currentLocale = getLocale() // 获取当前语言
  const localeCode = currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US' // 中英文之间切换
  return new Intl.DateTimeFormat(localeCode, { // 使用本地化格式化器
    timeZone, // 指定时区
    hour: '2-digit', // 小时两位
    minute: '2-digit', // 分钟两位
    second: '2-digit', // 秒两位
    hourCycle: 'h23', // 24 小时制
  }).format(new Date()) // 返回格式化后的时间字符串
} // 结束 formatClockTime

// 首页全球时区卡片的配置：与 UI 中 TOKYO / DUBAI / BERLIN / NEW YORK 一一对应
const timeCardConfigs = [ // 定义一个数组，描述每张时区卡片
  { key: 'tokyo', clockIndex: 0, timeZone: 'Asia/Tokyo' }, // 东京，对应 clocks 数组的第 0 项
  { key: 'dubai', clockIndex: 2, timeZone: 'Asia/Dubai' }, // 迪拜，对应 clocks 数组的第 2 项
  { key: 'berlin', clockIndex: 3, timeZone: 'Europe/Berlin' }, // 柏林，对应 clocks 数组的第 3 项
  { key: 'newyork', clockIndex: 1, timeZone: 'America/New_York' }, // 纽约，对应 clocks 数组的第 1 项
] as const // 使用只读断言，避免被意外修改

const getClockTimeDisplay = (clockIndex: number): string => { // 根据 clocks 下标获取用于展示的时间
  const clock = clocks[clockIndex] // 取出对应的时钟对象
  if (!clock || !clock.time) { // 如果数据还没准备好
    return '--:--' // 显示占位符
  } // 结束判断
  return clock.time.slice(0, 5) // 仅保留“时:分”，去掉秒
} // 结束 getClockTimeDisplay

const formatDateForTimezone = (timeZone: string): string => { // 格式化指定时区的日期（用于卡片副标题）
  return new Intl.DateTimeFormat('en-US', { // 使用英文简写风格
    timeZone, // 目标时区
    month: 'short', // 月份简写，例如 Jan
    day: 'numeric', // 日期数值
    weekday: 'short', // 星期简写，例如 Mon
  }).format(new Date()) // 返回类似 "Jan 22, Wed" 的字符串
} // 结束 formatDateForTimezone

const getWorkStatus = (timeZone: string) => { // 计算某个时区当前是否处于工作时间
  const { h } = getClockParts(timeZone) // 获取该时区当前小时
  const isWorking = h >= 9 && h < 18 // 简单认为 9:00-18:00 为上班时间
  return { // 返回给模板使用的描述对象
    isWorking, // 布尔值，是否在工作时间
    label: isWorking ? 'Working' : 'Off-duty', // 展示文本（与设计稿一致）
    dotClass: isWorking ? 'gte-status-dot-online' : 'gte-status-dot-offline', // 对应的小圆点样式类名
  } // 结束返回对象
} // 结束 getWorkStatus

// 创建时钟（只负责渲染 DOM，更新由统一定时器完成）
const renderClock = (container: HTMLElement, cityName: string, index: number) => {
  const clockHTML = `
    <div class="clock" aria-label="${cityName}">
      <div class="clock-face">
        <div class="clock-ring"></div>
        <div class="hand hour-hand"></div>
        <div class="hand minute-hand"></div>
        <div class="hand second-hand"></div>
        <div class="center-dot"></div>
      </div>
    </div>
  `
  container.innerHTML = clockHTML

  const hourHand = container.querySelector('.hour-hand') as HTMLElement | null
  const minuteHand = container.querySelector('.minute-hand') as HTMLElement | null
  const secondHand = container.querySelector('.second-hand') as HTMLElement | null

  if (!hourHand || !minuteHand || !secondHand) {
    clockDoms[index] = null
    return
  }

  clockDoms[index] = { hourHand, minuteHand, secondHand }
}

// 更新时钟（统一 1 个定时器，降低开销；同时使用 timezone 处理 DST）
const updateClocks = () => {
  const configs = getClockConfigs()

  clocks.forEach((clock, index) => {
    const cfg = configs[index]
    if (cfg) {
      clock.name = cfg.name
      clock.timezone = cfg.timezone
    }

    // 数字时间
    clock.time = formatClockTime(clock.timezone)

    // 指针时间
    const dom = clockDoms[index]
    if (!dom) return

    const { h, m, s } = getClockParts(clock.timezone)
    const hour12 = h % 12
    const hourAngle = hour12 * 30 + m * 0.5
    const minuteAngle = m * 6 + s * 0.1
    const secondAngle = s * 6

    dom.hourHand.style.transform = `translateX(-50%) rotate(${hourAngle}deg)`
    dom.minuteHand.style.transform = `translateX(-50%) rotate(${minuteAngle}deg)`
    dom.secondHand.style.transform = `translateX(-50%) rotate(${secondAngle}deg)`
  })
}

// 详情弹窗
const showDetailDialog = ref(false)
const detailItem = ref<any>(null)

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    // 判断是否是今天
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return `${hours}:${minutes}`
    }
    
    // 判断是否是今年
    if (year === today.getFullYear()) {
      return `${month}-${day} ${hours}:${minutes}`
    }
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    return dateStr
  }
}

// 格式化完整日期时间（用于详情弹窗）
const formatFullDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    return dateStr
  }
}

// 获取类型标签文本
const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    announcement: t('hr.announcement.announcement'),
    notice: t('hr.announcement.notice'),
    industry_news: t('hr.announcement.industryNews'),
    event: t('hr.announcement.event'),
  }
  return map[type] || type
}

// 查看详情
const viewDetail = (item: any) => {
  // 如果是公告或通知，从原始数据中获取完整信息
  if (item.announcementId) {
    const announcement = announcementsData.value.find(a => a.id === item.announcementId)
    if (announcement) {
      detailItem.value = {
        ...announcement,
        category: item.category,
        type: item.type,
      }
    } else {
      detailItem.value = item
    }
  } else if (item.reminderId) {
    // 如果是提醒，直接使用item数据
    detailItem.value = {
      ...item,
      type: item.type,
    }
  } else {
    // 其他情况，直接使用item
    detailItem.value = item
  }

  showDetailDialog.value = true

  // 打开详情时，自动滚动到弹窗所在位置，避免用户手动上下翻找
  nextTick(() => {
    // 先尝试滚动到对话框外层容器（Element Plus 渲染在 body 下）
    const wrapper = document.querySelector('.el-dialog__wrapper.detail-dialog') as HTMLElement | null
    if (wrapper?.scrollIntoView) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // 兜底：直接滚动到弹窗本身
    const dialog = document.querySelector('.el-dialog.detail-dialog') as HTMLElement | null
    if (dialog?.scrollIntoView) {
      dialog.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// 实时更新相关
let refreshTimer: number | null = null
const lastAnnouncementUpdateTime = ref<string | null>(null)

// 检查新公告
const checkNewAnnouncements = async () => {
  try {
    const announcements = await getActiveAnnouncements()
    
    if (announcements.length === 0) {
      // 如果没有公告，更新记录
      lastAnnouncementUpdateTime.value = null
      return
    }
    
    // 找到最新的更新时间
    const latestUpdateTime = announcements.reduce((latest, ann) => {
      const updateTime = ann.updatedAt || ann.createdAt || ann.publishTime
      if (!latest || !updateTime) return latest || updateTime
      return new Date(updateTime) > new Date(latest) ? updateTime : latest
    }, null as string | null)
    
    // 如果有新的更新时间，说明有更新
    if (latestUpdateTime && latestUpdateTime !== lastAnnouncementUpdateTime.value) {
      const previousCount = announcementsData.value.length
      
      // 重新加载公告和通知
      await loadNoticesAndAnnouncements()
      
      // 检查是否有新公告（数量增加）
      const newCount = announcementsData.value.length - previousCount
      if (newCount > 0) {
        ElMessage.success({
          message: t('index.newAnnouncements', { n: newCount }),
          duration: 3000,
          showClose: true,
        })
      }
      
      lastAnnouncementUpdateTime.value = latestUpdateTime
    } else if (latestUpdateTime) {
      // 更新时间相同，但检查是否有ID变化（可能是状态变化）
      const currentIds = new Set(announcements.map(a => a.id))
      const previousIds = new Set(announcementsData.value.map(a => a.id))
      
      if (currentIds.size !== previousIds.size || 
          [...currentIds].some(id => !previousIds.has(id))) {
        await loadNoticesAndAnnouncements()
      }
    }
  } catch (error: any) {
    // 静默失败，不影响其他功能
    if (import.meta.env.DEV) {
      console.warn('检查新公告失败（不影响其他功能）:', error)
    }
  }
}

// 加载用户个人信息（从API获取最新数据，确保与个人设置同步）
const loadUserProfile = async () => {
  try {
    const profile = await getProfile()
    // 确保获取到完整的最新数据，包括工作状态、签名等
    userProfile.value = {
      ...profile,
      workStatus: profile.workStatus || 'available', // 确保有工作状态
      mood: profile.mood || '',
      chineseName: profile.chineseName || '',
      englishName: profile.englishName || '',
      country: profile.country || '',
      city: profile.city || '',
      department: profile.department || userStore.userInfo?.department || undefined,
      position: profile.position || '',
    }
  } catch (error: any) {
    // 静默失败，使用store中的基本信息
    if (userStore.userInfo) {
      userProfile.value = {
        id: userStore.userInfo.id || 0,
        username: userStore.userInfo.username || '',
        nickname: userStore.userInfo.nickname || '',
        role: userStore.userInfo.role || '',
        department: userStore.userInfo.department || undefined,
        workStatus: 'available', // 默认状态
      }
    }
    if (import.meta.env.DEV) {
      console.warn('加载用户信息失败（不影响其他功能）:', error)
    }
  }
}

// 获取显示名称（优先显示中文名或英文名，否则显示昵称或用户名）
const getDisplayName = () => {
  if (userProfile.value.chineseName) return userProfile.value.chineseName
  if (userProfile.value.englishName) return userProfile.value.englishName
  if (userProfile.value.nickname) return userProfile.value.nickname
  return userProfile.value.username || '用户'
}

// 出差/驻外目的地编码 -> 中英双语标签
const destinationLabelMap: Record<string, string> = {
  china: '中国 / China',
  japan: '日本 / Japan',
  korea: '韩国 / Korea',
  india: '印度 / India',
  bangladesh: '孟加拉国 / Bangladesh',
  turkey: '土耳其 / Turkey',
  'saudi-arabia': '沙特阿拉伯 / Saudi Arabia',
  uae: '阿联酋 / United Arab Emirates',
  iran: '伊朗 / Iran',
  indonesia: '印尼 / Indonesia',
  philippines: '菲律宾 / Philippines',
  malaysia: '马来西亚 / Malaysia',
  vietnam: '越南 / Vietnam',
  thailand: '泰国 / Thailand',
  usa: '美国 / United States',
  uk: '英国 / United Kingdom',
  germany: '德国 / Germany',
  france: '法国 / France',
  spain: '西班牙 / Spain',
  italy: '意大利 / Italy',
  russia: '俄罗斯 / Russia',
  australia: '澳大利亚 / Australia',
  canada: '加拿大 / Canada',
}

// 获取工作状态文本
const getStatusText = (status?: string) => {
  if (!status) return '空闲'
  const statusMap: Record<string, string> = {
    available: t('profile.workStatus.available') || '空闲',
    busy: t('profile.workStatus.busy') || '忙碌',
    away: t('profile.workStatus.away') || '离开',
    overseas: t('profile.workStatus.overseas') || '驻外',
    leave: t('profile.workStatus.leave') || '请假',
    meeting: t('profile.workStatus.meeting') || '会议中',
    offline: t('profile.workStatus.offline') || '离线',
  }
  // 处理带目的地的状态（如 'away:japan'、'overseas:uae'）
  if (status.includes(':')) {
    const [baseStatus, codeRaw] = status.split(':')
    const baseText = baseStatus ? (statusMap[baseStatus] || baseStatus) : status
    const code = (codeRaw || '').trim()
    const destText = code ? (destinationLabelMap[code] || code) : ''
    return destText ? `${baseText} · ${destText}` : baseText
  }
  return statusMap[status] || status
}

// 获取工作状态图标
const workStatusConfigs = [
  { value: 'available', icon: CircleCheck, color: '#67c23a', tagType: 'success' },
  { value: 'busy', icon: CircleClose, color: '#f56c6c', tagType: 'danger' },
  { value: 'away', icon: Promotion, color: '#409eff', tagType: 'warning' },
  // 使用 Location 图标时，显式引用 Element Plus 的图标组件，避免与浏览器全局 Location 冲突
  { value: 'overseas', icon: LocationIcon, color: '#409eff', tagType: 'primary' },
  { value: 'leave', icon: Sunny, color: '#e6a23c', tagType: 'info' },
  { value: 'meeting', icon: VideoCamera, color: '#909399', tagType: 'primary' },
  { value: 'offline', icon: SwitchButton, color: '#606266', tagType: 'info' }
]

const getStatusConfig = (status?: string) => {
  const defaultConfig = workStatusConfigs[0] ?? { value: 'available', icon: CircleCheck, color: '#67c23a', tagType: 'success' }
  if (!status) return defaultConfig
  const baseStatus = status.includes(':') ? status.split(':')[0] : status
  return workStatusConfigs.find(item => item.value === baseStatus) ?? defaultConfig
}

const getStatusIcon = (status?: string) => {
  return getStatusConfig(status).icon
}

// 获取工作状态标签类型
const getStatusTagType = (status?: string) => {
  return getStatusConfig(status).tagType
}

// 获取状态类名（用于状态指示器）
const getStatusClass = (status?: string) => {
  const config = getStatusConfig(status)
  return `status-${config.value}`
}

// 获取部门名称
const getDepartmentName = (dept: string) => {
  const deptMap: Record<string, { zh: string; en: string }> = {
    planning: { zh: '品牌管理中心', en: 'Brand Management Center' },
    sales: { zh: '销售部', en: 'Sales' },
    tech: { zh: '技术部', en: 'Tech' },
    finance: { zh: '财务部', en: 'Finance' },
    hr: { zh: '人力资源部', en: 'Human Resources' },
    domestic: { zh: '内贸部', en: 'Domestic' },
    management: { zh: '总经办', en: 'Management' },
  }
  const deptInfo = deptMap[dept]
  if (!deptInfo) return dept
  return locale.value === 'en-US' ? deptInfo.en : deptInfo.zh
}

// 获取职位名称：支持职位编码 -> 多语言名称，兼容旧数据直接显示
const getPositionName = (position?: string | null): string => {
  if (!position) return ''
  const positionMap: Record<string, { zh: string; en: string }> = {
    recruitment_specialist: { zh: '招聘专员', en: 'Recruitment Specialist' },
    admin_specialist: { zh: '行政专员', en: 'Administrative Specialist' },
    front_desk_receptionist: { zh: '行政前台', en: 'Front Desk Receptionist' },
    director: { zh: '总监', en: 'Director' },
    sales: { zh: '销售', en: 'Sales' },
    supervisor: { zh: '主管', en: 'Supervisor' },
    graphic_designer: { zh: '平面设计师', en: 'Graphic Designer' },
    design_assistant: { zh: '设计助理', en: 'Design Assistant' },
    frontend_engineer: { zh: '前端开发工程师', en: 'Front-end Developer' },
    after_sales_engineer: { zh: '售后工程师', en: 'After-sales Engineer' },
    quality_specialist: { zh: '品质', en: 'Quality Specialist' },
    purchasing_specialist: { zh: '采购', en: 'Purchasing Specialist' },
    accountant_cashier: { zh: '会计出纳', en: 'Accountant & Cashier' },
    finance_specialist: { zh: '财务专员', en: 'Finance Specialist' },
    ceo: { zh: 'CEO', en: 'CEO' },
    chairman: { zh: '董事长', en: 'Chairman' },
    deputy_general_manager: { zh: '副总经理', en: 'Deputy General Manager' },
    special_shape_bu_gm: { zh: '异形事业部总经理', en: 'GM of Special-shaped Business Unit' },
    new_media_operator: { zh: '新媒体运营', en: 'New Media Operator' },
    copywriter: { zh: '文案专员', en: 'Copywriter' },
    modeling_3d_artist: { zh: '3D建模渲染师', en: '3D Modeling & Rendering Artist' },
    merchandiser: { zh: '跟单', en: 'Merchandiser' },
  }
  const info = positionMap[position]
  if (!info) return position
  return locale.value === 'en-US' ? info.en : info.zh
}

onMounted(async () => {
  // 等待一下确保i18n数据已加载
  await nextTick()
  
  // 加载用户个人信息
  await loadUserProfile()
  
  // 加载通知已读状态（从localStorage）
  loadNoticeReadStatus()
  
  // 从后端API加载数据 - 使用 Promise.allSettled 确保一个失败不影响其他
  await Promise.allSettled([
    loadTodos(),
    loadNoticesAndAnnouncements(),
    loadExchangeRates(),
    loadMotivations(),
  ])
  
  // 初始化最后更新时间
  if (announcementsData.value.length > 0) {
    const latestUpdate = announcementsData.value.reduce((latest, ann) => {
      const updateTime = ann.updatedAt || ann.createdAt || ann.publishTime
      if (!latest || !updateTime) return latest || updateTime
      return new Date(updateTime) > new Date(latest) ? updateTime : latest
    }, null as string | null)
    lastAnnouncementUpdateTime.value = latestUpdate
  }
  
  // 启动实时更新 - 每20秒检查一次新公告
  refreshTimer = setInterval(() => {
    checkNewAnnouncements()
  }, 20000) // 20秒检查一次
  
  // 监听用户信息更新事件（当个人设置更新时触发）
  profileUpdateHandler = () => {
    loadUserProfile()
  }
  window.addEventListener('profile-updated', profileUpdateHandler)
  
  // 注意：轮播定时器已在 loadMotivations 中设置，这里不需要重复设置

  // 等待DOM渲染完成后再初始化时钟
  await nextTick()
  
  // 初始化时钟 DOM（只渲染一次）
  clockRefs.value.forEach((ref, index) => {
    const clock = clocks[index]
    if (!ref || !clock) return
    renderClock(ref, clock.name, index)
  })

  // 统一更新（1 个定时器）
  updateClocks()
  clockTimer = window.setInterval(updateClocks, 1000)
})

// 保存事件处理函数引用，以便在卸载时移除
let profileUpdateHandler: (() => void) | null = null

onBeforeUnmount(() => {
  if (motivationTimer) {
    clearInterval(motivationTimer)
    motivationTimer = null
  }
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
  
  // 清理实时更新定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  // 移除用户信息更新事件监听
  if (profileUpdateHandler) {
    window.removeEventListener('profile-updated', profileUpdateHandler)
    profileUpdateHandler = null
  }
})
</script>

<style scoped lang="scss">
.index-container {
  .welcome-section {
    margin-bottom: 24px;
    padding: 32px 40px;
    background: #ffffff;
    border: 1px solid #e5e5e7;
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .welcome-content {
      // 个人信息卡片样式
      .user-profile-card {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        padding: 24px;
        margin-bottom: 32px;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        border: 1px solid #e5e5e7;
        border-radius: 16px;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .profile-avatar-wrapper {
          position: relative;
          flex-shrink: 0;

          .profile-avatar {
            border: 3px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .status-indicator {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 20px;
            height: 20px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            .status-dot {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              border: 2px solid #ffffff;
            }

            &.status-available .status-dot {
              background: #67c23a;
            }

            &.status-busy .status-dot {
              background: #f56c6c;
            }

            &.status-away .status-dot {
              background: #e6a23c;
            }

            &.status-leave .status-dot {
              background: #409eff;
            }

            &.status-meeting .status-dot {
              background: #409eff;
            }

            &.status-offline .status-dot {
              background: #909399;
            }
          }
        }

        .profile-info {
          flex: 1;
          min-width: 0;

          .profile-name-section {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            flex-wrap: wrap;

            .profile-name {
              font-size: 24px;
              font-weight: 600;
              margin: 0;
              color: #1d1d1f;
              letter-spacing: -0.01em;
              line-height: 1.3;
            }

            .status-tag {
              border-radius: 12px;
              padding: 4px 12px;
              font-size: 12px;
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 4px;
              border: none;

              .status-icon {
                font-size: 12px;
              }
            }
          }

          .profile-username {
            font-size: 14px;
            color: #86868b;
            margin: 0 0 8px 0;
            font-weight: 400;
          }

          .profile-mood {
            font-size: 15px;
            color: #515154;
            margin: 0 0 12px 0;
            line-height: 1.5;
            font-style: italic;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 8px;
            border-left: 3px solid #409eff;
          }

          .profile-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;

            .meta-item {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              color: #86868b;
              padding: 4px 10px;
              background: rgba(0, 0, 0, 0.02);
              border-radius: 8px;

              .el-icon {
                font-size: 14px;
                color: #409eff;
              }
            }
          }
        }
      }

      .welcome-greeting {
        font-size: 32px;
        font-weight: 600;
        margin: 0 0 8px 0;
        letter-spacing: -0.02em;
        color: #1d1d1f;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        line-height: 1.2;
      }

      .welcome-encouragement {
        font-size: 16px;
        font-weight: 400;
        margin: 0 0 24px 0;
        color: #86868b;
        letter-spacing: -0.01em;
        font-style: normal;
      }

      .quick-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-top: 20px;

        .quick-link-item {
          display: flex;
          align-items: center;
          padding: 16px;
          background: #f5f5f7;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border: 1px solid transparent;

          &:hover {
            background: #e8e8ed;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .quick-link-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            margin-right: 16px;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .quick-link-content {
            flex: 1;
            min-width: 0;

            .quick-link-title {
              font-size: 15px;
              font-weight: 600;
              color: #1d1d1f;
              margin-bottom: 4px;
              letter-spacing: -0.01em;
            }

            .quick-link-desc {
              font-size: 13px;
              color: #86868b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              letter-spacing: -0.01em;
            }
          }

          .quick-link-badge {
            position: absolute;
            top: 12px;
            right: 40px;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            background: #ff3b30;
            color: #fff;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            box-shadow: 0 2px 4px rgba(255, 59, 48, 0.3);
          }

          .quick-link-arrow {
            color: #c0c4cc;
            font-size: 18px;
            margin-left: 8px;
            flex-shrink: 0;
            transition: transform 0.3s ease;

            &.is-expanded {
              transform: rotate(0deg);
            }
          }

          &:hover .quick-link-arrow:not(.is-expanded) {
            transform: translateX(4px);
            color: #409eff;
          }

          &.is-expanded {
            border-color: #e4e7ed;
            background: #f0f2f5;
          }
        }

        .quick-link-dropdown {
          margin-top: 8px;
          background: #fff;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 10;
          position: relative;

          .dropdown-content {
            padding: 12px;
            max-height: 400px;
            overflow-y: auto;

            .dropdown-item {
              display: flex;
              align-items: flex-start;
              padding: 12px;
              border-bottom: 1px solid #f0f2f5;
              cursor: pointer;
              transition: background-color 0.2s;

              &:last-child {
                border-bottom: none;
              }

              &:hover {
                background-color: #f8f9fa;
              }

              &.todo-item {
                flex-direction: row;
                align-items: flex-start;
                justify-content: space-between;

                .todo-content {
                  flex: 1;
                  min-width: 0;

                  .el-checkbox {
                    width: 100%;
                    margin-bottom: 8px;

                    span.completed {
                      text-decoration: line-through;
                      color: #909399;
                    }
                  }
                }
              }

              &.notice-item {
                flex-direction: row;
                align-items: flex-start;
                justify-content: space-between;
                
                .notice-content {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  min-width: 0;
                  margin-right: 8px;
                }
              }

              &.announcement-item {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                
                .el-link {
                  flex: 1;
                  margin-right: 8px;
                }
              }

              .el-checkbox {
                flex: 1;
                margin-right: 12px;
                margin-bottom: 4px;

                span.completed {
                  text-decoration: line-through;
                  color: #909399;
                }
              }

              .dropdown-title {
                flex: 1;
                margin-left: 12px;
                color: #333;
                font-size: 14px;
                margin-bottom: 4px;
              }

              .dropdown-meta {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                margin-left: 12px;
                margin-top: 4px;
              }

              .dropdown-source {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #909399;

                .el-icon {
                  font-size: 14px;
                }

                &.source-self {
                  color: #409eff;
                }

                &.source-boss {
                  color: #e6a23c;
                  font-weight: 500;
                }

                &.source-system {
                  color: #909399;
                }
              }

              .dropdown-time {
                font-size: 12px;
                color: #909399;
                margin-left: auto;
              }

              .el-link {
                flex: 1;
              }

              .el-tag {
                margin-right: 8px;
              }
            }

            .dropdown-empty {
              padding: 20px;
              text-align: center;
              color: #909399;
              font-size: 14px;
            }

            .dropdown-header-actions {
              padding: 8px 12px;
              border-bottom: 1px solid #f0f2f5;
              text-align: right;
              z-index: 10;
              position: relative;
              
              .el-button {
                padding: 4px 8px;
                font-size: 12px;
                color: #409eff;
                cursor: pointer;
                z-index: 10;
                position: relative;
                
                &:hover:not(:disabled) {
                  color: #66b1ff;
                }
                
                &:disabled {
                  color: #c0c4cc;
                  cursor: not-allowed;
                }
              }
            }

            .read-btn {
              margin-left: 8px;
              padding: 4px 8px;
              font-size: 12px;
              color: #909399;
              flex-shrink: 0;
              z-index: 10;
              position: relative;
              cursor: pointer;
              
              &:hover {
                color: #409eff;
              }
            }

            .is-read {
              opacity: 0.6;
              
              .dropdown-title {
                color: #909399;
              }
            }

            .dropdown-ai {
              padding: 20px;
              text-align: center;
              color: #666;

              p {
                margin: 0;
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }

  // 展开动画
  .slide-down-enter-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .slide-down-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .slide-down-enter-from {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .slide-down-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .slide-down-enter-to {
    max-height: 500px;
    opacity: 1;
  }

  .slide-down-leave-from {
    max-height: 500px;
    opacity: 1;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }


  // 大Banner样式
  .motivation-banner {
    position: relative;
    width: 100%;
    min-height: 420px;
    height: 80vh;
    margin-bottom: 32px;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transition: background-image 1s ease-in-out;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    .banner-content {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-start;
      padding: 48px 64px;

      .motivation-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        max-width: 720px;
        text-align: left;
        padding: 24px 32px;
        background: rgba(0, 0, 0, 0.55);
        border-radius: 16px;
        backdrop-filter: blur(6px);

        .quote-icon {
          font-size: 36px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 16px;
          opacity: 0.9;
        }

        .motivation-text {
          font-size: 26px;
          color: #ffffff;
          font-weight: 500;
          text-align: left;
          margin: 0 0 12px 0;
          line-height: 1.5;
          letter-spacing: 0.02em;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          word-break: break-word;
          white-space: pre-wrap;
        }

        .motivation-author {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.85);
          align-self: flex-end;
          margin-top: 8px;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }

  // 编辑对话框样式 - 现代简约扁平
  :deep(.edit-banner-dialog) {
    .el-dialog {
      border-radius: 16px;
      overflow: hidden;
    }

    .el-dialog__header {
      padding: 24px 28px 0;
      border-bottom: none;
    }

    .el-dialog__body {
      padding: 0 28px 28px;
    }

    .el-dialog__footer {
      padding: 20px 28px;
      border-top: 1px solid #f0f2f5;
      background: #fafbfc;
    }

    .banner-edit-tabs {
      .el-tabs__header {
        margin: 0 0 24px;
        border-bottom: 1px solid #f0f2f5;
      }

      .el-tabs__nav {
        border: none;
      }

      .el-tabs__item {
        padding: 12px 24px;
        font-size: 15px;
        font-weight: 500;
        color: #86868b;
        border: none;
        transition: all 0.2s;

        &.is-active {
          color: #007aff;
          font-weight: 600;
        }

        &:hover {
          color: #1d1d1f;
        }
      }

      .el-tabs__active-bar {
        height: 2px;
        background: #007aff;
      }
    }

    .edit-content-section {
      .section-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        margin-bottom: 20px;
        background: #f0f7ff;
        border-radius: 10px;
        border-left: 3px solid #007aff;
        font-size: 13px;
        color: #007aff;

        .el-icon {
          font-size: 16px;
        }
      }
    }

    .edit-motivation-list {
      .motivation-item {
        margin-bottom: 16px;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #f0f2f5;
        border-radius: 12px;
        transition: all 0.2s;

        &:hover {
          border-color: #d1d9e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f2f5;

          .item-index {
            font-size: 13px;
            font-weight: 600;
            color: #86868b;
            background: #f5f5f7;
            padding: 4px 10px;
            border-radius: 6px;
          }

          .item-controls {
            display: flex;
            align-items: center;
            gap: 12px;

            .enabled-label {
              font-size: 13px;
              color: #86868b;
            }

            .el-button {
              padding: 6px;
              min-height: auto;
            }
          }
        }

        .motivation-form {
          .form-field {
            margin-bottom: 16px;

            &:last-child {
              margin-bottom: 0;
            }

            .field-label {
              display: block;
              font-size: 13px;
              font-weight: 600;
              color: #1d1d1f;
              margin-bottom: 8px;
            }

            .modern-input {
              :deep(.el-input__wrapper) {
                border-radius: 8px;
                border: 1px solid #e5e5e7;
                box-shadow: none;
                transition: all 0.2s;

                &:hover {
                  border-color: #d1d9e0;
                }

                &.is-focus {
                  border-color: #007aff;
                  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
                }
              }

              :deep(.el-textarea__inner) {
                border-radius: 8px;
                border: 1px solid #e5e5e7;
                box-shadow: none;
                transition: all 0.2s;

                &:hover {
                  border-color: #d1d9e0;
                }

                &:focus {
                  border-color: #007aff;
                  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
                }
              }
            }
          }
        }
      }

      .add-button {
        width: 100%;
        height: 44px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 500;
        margin-top: 8px;
        border: 1px dashed #d1d9e0;
        background: #fafbfc;
        color: #007aff;
        transition: all 0.2s;

        &:hover {
          background: #f0f7ff;
          border-color: #007aff;
        }
      }
    }

    .edit-banner-list {
      .banner-item {
        margin-bottom: 16px;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #f0f2f5;
        border-radius: 12px;
        transition: all 0.2s;

        &:hover {
          border-color: #d1d9e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f2f5;

          .item-index {
            font-size: 13px;
            font-weight: 600;
            color: #86868b;
            background: #f5f5f7;
            padding: 4px 10px;
            border-radius: 6px;
          }

          .item-controls {
            display: flex;
            align-items: center;
            gap: 12px;

            .enabled-label {
              font-size: 13px;
              color: #86868b;
            }

            .el-button {
              padding: 6px;
              min-height: auto;
            }
          }
        }

        .background-image-section {
          display: flex;
          gap: 16px;
          align-items: flex-start;

          .banner-preview-small {
            width: 200px;
            height: 150px;
            border-radius: 8px;
            overflow: hidden !important;
            background: #f5f5f7;
            flex-shrink: 0;
            border: 1px solid #e5e5e7;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-sizing: border-box;

            :deep(img) {
              width: 100% !important;
              height: 100% !important;
              object-fit: contain !important;
              display: block !important;
            }

            .banner-placeholder-small {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 6px;
              color: #86868b;
              font-size: 12px;
              position: absolute;
              top: 0;
              left: 0;

              .el-icon {
                font-size: 24px;
                opacity: 0.5;
              }
            }
          }

          .banner-form-small {
            flex: 1;
          }
        }
      }

  .add-button {
        width: 100%;
        height: 44px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 500;
        margin-top: 8px;
        border: 1px dashed #d1d9e0;
        background: #fafbfc;
        color: #007aff;
        transition: all 0.2s;

        &:hover {
          background: #f0f7ff;
          border-color: #007aff;
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      .el-button {
        min-width: 100px;
        border-radius: 10px;
      }
    }
  }

  /* 新的全球时区 + 人民币汇率 仪表盘（浅色风格） */
  .global-time-exchange {
    margin-top: 24px; /* 与上方 Banner 留出间距 */
    margin-bottom: 32px; /* 与下面“最新通知”等卡片拉开距离，避免视觉拥挤 */
    padding: 24px 28px 28px; /* 内边距 */
    border-radius: 22px; /* 圆角 */
    border: 1px solid #e5e5e7; /* 浅灰色描边 */
    background: #ffffff; /* 纯白背景，与整体主题统一 */
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); /* 柔和阴影 */

    .gte-section-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .card-header {
        /* 复用全局 card-header 基础样式，再稍微软一点 */
        gap: 8px;

        span {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      }
    }

    .gte-section-header-rates {
      margin-top: 28px; /* 时区与汇率模块之间的间距 */
    }

    .gte-update-time {
      font-size: 12px;
      color: #6b7280;
    }

    .gte-dashboard-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
      width: 100%;
    }

    .gte-rates-grid {
      margin-top: 8px;
    }

    .gte-time-card,
    .gte-rate-card {
      position: relative;
      background: linear-gradient(145deg, #ffffff, #f9fafb);
      border-radius: 20px;
      border: 1px solid rgba(15, 23, 42, 0.06);
      padding: 18px 18px 20px;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
    }

    .gte-time-card:hover,
    .gte-rate-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
      border-color: rgba(37, 99, 235, 0.35);
    }

    .gte-info-title {
      display: flex;
      flex-direction: column;
      gap: 2px;
      position: relative;
      z-index: 2;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.1em;
        color: #0f172a;
      }
    }

    .gte-sub-tag {
      font-size: 12px;
      color: #6b7280;
    }

    .gte-main-data {
      margin-top: 16px;
      font-size: 26px; /* 略微减小字号，避免整屏都是大号黑色数字 */
      font-weight: 600; /* 比 700 稍微轻一点 */
      letter-spacing: 0.06em; /* 收紧一点字距，让视觉更柔和 */
      font-variant-numeric: tabular-nums;
      color: #111827;
      position: relative;
      z-index: 2;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .gte-unit {
      font-size: 14px;
      color: #9ca3af;
      font-weight: 400;
    }

    .gte-date-sub {
      margin-top: 4px;
      position: relative;
      z-index: 2;
    }

    .gte-bottom-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 4px 12px;
      background: rgba(15, 23, 42, 0.04);
      border-radius: 999px;
      font-size: 11px;
      color: #4b5563;
      position: relative;
      z-index: 2;
    }

    .gte-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
    }

    .gte-status-dot-online {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
    }

    .gte-status-dot-offline {
      background: #9ca3af;
    }

    .gte-landmark-icon {
      position: absolute;
      right: -10px;
      bottom: -10px;
      width: 110px;
      height: 110px;
      opacity: 0.12;
      color: #2563eb;
      pointer-events: none;
    }

    .gte-currency-symbol {
      position: absolute;
      right: -4px;
      bottom: -16px;
      font-size: 70px;
      font-weight: 800;
      opacity: 0.06;
      color: #111827;
      pointer-events: none;
    }

    @media (max-width: 1200px) {
      .gte-dashboard-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      padding: 18px 16px 20px;

      .gte-dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  }

  // 淡入淡出动画
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1d1d1f;
    letter-spacing: -0.01em;
  }

  .clocks-card {
    /* 旧全球时区时钟卡片已移除，仅保留占位样式以防止其它地方仍引用该类名 */
  }

  .exchange-card {
    margin-bottom: 24px;
    border-radius: 20px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    background: #ffffff;

    .exchange-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      .exchange-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 20px;
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid #f0f2f5;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #007aff, #5ac8fa);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          border-color: #e5e5e7;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          transform: translateY(-4px);

          &::before {
            opacity: 1;
          }
        }

        .currency-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;

          .currency-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 600;
            transition: all 0.3s ease;
            
            &.currency-usd {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
            }
            
            &.currency-eur {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: #ffffff;
            }
            
            &.currency-gbp {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: #ffffff;
            }
            
            &.currency-jpy {
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
              color: #ffffff;
            }

            .currency-symbol {
              font-size: 24px;
              line-height: 1;
            }
          }

          .currency {
            font-size: 13px;
            font-weight: 600;
            color: #86868b;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0;
          }
        }

        .rate {
          font-size: 32px;
          color: #1d1d1f;
          margin-bottom: 12px;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
          line-height: 1;
        }

        .change {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.02);

          &.up {
            color: #ff3b30;
            background: rgba(255, 59, 48, 0.08);
          }

          &.down {
            color: #34c759;
            background: rgba(52, 199, 89, 0.08);
          }

          .arrow-up,
          .arrow-down {
            font-size: 14px;
            font-weight: 700;
          }
        }
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .edit-rates-btn {
        margin-left: auto;
        padding: 4px 8px;
        font-size: 13px;
        color: #409eff;
        
        &:hover {
          color: #66b1ff;
        }
      }
    }

    .exchange-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f0f2f5;
      text-align: center;

      .update-time-text {
        font-size: 12px;
        color: #86868b;
        letter-spacing: 0.01em;
        margin-bottom: 8px;
      }

      .disclaimer-text {
        font-size: 12px;
        color: #86868b;
        letter-spacing: 0.01em;
        font-style: italic;
      }
    }

    .edit-rates-form {
      .edit-rate-item {
        padding: 16px 0;
        border-bottom: 1px solid #f0f2f5;

        &:last-child {
          border-bottom: none;
        }

        .rate-info {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .currency-header-small {
            display: flex;
            align-items: center;
            gap: 12px;

            .currency-icon-small {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: 600;
              
              &.currency-usd {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
              }
              
              &.currency-eur {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: #ffffff;
              }
              
              &.currency-gbp {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: #ffffff;
              }
              
              &.currency-jpy {
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                color: #ffffff;
              }

              .currency-symbol-small {
                font-size: 18px;
                line-height: 1;
              }
            }

            .currency-name {
              font-size: 15px;
              font-weight: 600;
              color: #1d1d1f;
            }
          }
        }
      }
    }
  }

  .bottom-section,
  .news-section {
    margin-bottom: 24px;

    .notice-card,
    .todo-card,
    .news-card {
      height: 100%;
      border-radius: 20px;
      border: 1px solid #e5e5e7;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      background: #ffffff;
    }

    .notice-list,
    .todo-list,
    .news-list {
      .notice-item,
      .todo-item,
      .news-item {
        display: flex;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid #f5f5f7;
        transition: background-color 0.2s ease;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background-color: #f5f5f7;
          margin: 0 -12px;
          padding: 14px 12px;
          border-radius: 12px;
        }

        .notice-title,
        .todo-item .el-checkbox {
          flex: 1;
          margin-left: 12px;
        }

        .news-item {
          .el-link {
            flex: 1;
          }
        }

        .notice-time,
        .todo-time,
        .news-time {
          font-size: 12px;
          color: #999;
          margin-left: 12px;
        }
      }

      .todo-item {
        .el-checkbox {
          margin-left: 0;
        }
      }
    }
  }
}

@media (max-width: 1400px) {
  .clocks-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 24px;
  }
}

@media (max-width: 1200px) {
  .clocks-grid,
  .exchange-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 20px;
  }
  
  .clocks-card {
    .clocks-grid {
      .clock-item {
        .clock-container {
          max-width: 340px;
          min-width: 240px;
        }
        
        .clock-info {
          max-width: 340px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .clocks-grid,
  .exchange-grid {
    grid-template-columns: 1fr !important;
    gap: 20px;
  }
  
  .clocks-card {
    .clocks-grid {
      .clock-item {
        .clock-container {
          max-width: 100%;
          min-width: 250px;
        }
        
        .clock-info {
          max-width: 100%;
        }
      }
    }
  }

  .bottom-section,
  .news-section {
    :deep(.el-col) {
      margin-bottom: 20px;
    }
  }
}

@media (max-width: 480px) {
  .clocks-card {
    .clocks-grid {
      .clock-item {
        .clock-container {
          min-width: 200px;
        }
      }
    }
  }

  // 详情弹窗样式 - 新闻/公告风格，层次分明
  :deep(.detail-dialog) {
    border-radius: 16px !important;
    overflow: hidden !important;

    .el-dialog {
      border-radius: 16px !important;
      overflow: hidden !important;
    }

    .el-dialog__header {
      display: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .el-dialog__body {
      padding: 0 !important;
      margin: 0 !important;
    }

    .el-dialog__footer {
      display: none !important;
    }

    .announcement-container {
      background: #ffffff !important;
      min-height: 400px;
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    // 头部区域
    .announcement-header {
      padding: 32px 40px 24px !important;
      background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%) !important;
      width: 100%;
      box-sizing: border-box;

      .header-top {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 20px !important;
        width: 100%;

        .category-badge {
          font-size: 13px !important;
          font-weight: 600 !important;
          padding: 6px 14px !important;
          border-radius: 20px !important;
          border: none !important;
          margin: 0 !important;
        }

        .close-button {
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          margin: 0 !important;
          color: #86868b !important;
          transition: all 0.2s;
          flex-shrink: 0;

          &:hover {
            color: #1d1d1f !important;
            background: #f0f2f5 !important;
          }
        }
      }

      .announcement-title {
        font-size: 28px !important;
        font-weight: 700 !important;
        line-height: 1.4 !important;
        color: #1d1d1f !important;
        margin: 0 0 20px 0 !important;
        padding: 0 !important;
        letter-spacing: -0.01em !important;
        word-wrap: break-word !important;
        width: 100%;
        box-sizing: border-box;
      }

      .announcement-meta {
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
        font-size: 14px !important;
        color: #515154 !important;
        width: 100%;
        flex-wrap: wrap;

        .meta-item {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          margin: 0 !important;
          padding: 0 !important;

          .meta-icon {
            font-size: 16px !important;
            color: #86868b !important;
            flex-shrink: 0;
          }

          .meta-label {
            color: #86868b !important;
            font-weight: 400 !important;
            white-space: nowrap;
          }

          .meta-value {
            color: #1d1d1f !important;
            font-weight: 500 !important;
            white-space: nowrap;
          }
        }

        .meta-divider {
          color: #d1d1d6 !important;
          font-weight: 300 !important;
          margin: 0 !important;
        }
      }
    }

    // 分隔线
    .divider-line {
      height: 1px !important;
      background: linear-gradient(to right, transparent 0%, #e5e5e7 20%, #e5e5e7 80%, transparent 100%) !important;
      margin: 0 40px !important;
      border: none !important;
      padding: 0 !important;
    }

    // 正文内容区域
    .announcement-body {
      padding: 32px 40px !important;
      flex: 1;
      width: 100%;
      box-sizing: border-box;

      .content-wrapper {
        max-width: 100%;
        width: 100%;

        .content-text {
          font-size: 16px !important;
          line-height: 1.85 !important;
          color: #1d1d1f !important;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          letter-spacing: 0.01em !important;
          font-weight: 400 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          
          // 段落样式
          p {
            margin: 0 0 16px 0 !important;
            
            &:last-child {
              margin-bottom: 0 !important;
            }
          }

          // 列表样式
          ul, ol {
            margin: 16px 0 !important;
            padding-left: 24px !important;
            
            li {
              margin: 8px 0 !important;
            }
          }

          // 标题样式
          h1, h2, h3, h4, h5, h6 {
            margin: 24px 0 16px 0 !important;
            font-weight: 600 !important;
            
            &:first-child {
              margin-top: 0 !important;
            }
          }

          h2 {
            font-size: 22px !important;
          }

          h3 {
            font-size: 20px !important;
          }

          h4 {
            font-size: 18px !important;
          }
        }
      }
    }

    // 底部操作区
    .announcement-footer {
      padding: 20px 40px 32px !important;
      display: flex !important;
      justify-content: center !important;
      border-top: 1px solid #f0f2f5 !important;
      background: #fafbfc !important;
      width: 100%;
      box-sizing: border-box;
      margin: 0 !important;

      .close-button-primary {
        min-width: 140px !important;
        height: 44px !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        border-radius: 8px !important;
        padding: 0 32px !important;
      }
    }
  }
}

// 全局样式 - Element Plus dialog渲染在body外，需要全局样式
</style>

<style lang="scss">
.el-dialog__wrapper.detail-dialog {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.el-dialog.detail-dialog {
  // 固定在整个屏幕中心，而不是跟随某个 section
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
  max-width: calc(100vw - 80px) !important;
  width: 800px !important;
  border-radius: 16px !important;
  overflow: hidden !important;

  .el-dialog__header {
    display: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .el-dialog__body {
    padding: 0 !important;
    margin: 0 !important;
  }

  .el-dialog__footer {
    display: none !important;
  }

  .announcement-container {
    background: #ffffff !important;
    min-height: 400px;
    width: 100%;
    display: flex !important;
    flex-direction: column !important;
  }

  // 头部区域
  .announcement-header {
    padding: 32px 40px 24px !important;
    background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%) !important;
    width: 100%;
    box-sizing: border-box;

    .header-top {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-bottom: 20px !important;
      width: 100%;

      .category-badge {
        font-size: 13px !important;
        font-weight: 600 !important;
        padding: 6px 14px !important;
        border-radius: 20px !important;
        border: none !important;
        margin: 0 !important;
      }

      .close-button {
        width: 32px !important;
        height: 32px !important;
        padding: 0 !important;
        margin: 0 !important;
        color: #86868b !important;
        transition: all 0.2s;
        flex-shrink: 0;

        &:hover {
          color: #1d1d1f !important;
          background: #f0f2f5 !important;
        }
      }
    }

    .announcement-title {
      font-size: 28px !important;
      font-weight: 700 !important;
      line-height: 1.4 !important;
      color: #1d1d1f !important;
      margin: 0 0 20px 0 !important;
      padding: 0 !important;
      letter-spacing: -0.01em !important;
      word-wrap: break-word !important;
      width: 100%;
      box-sizing: border-box;
    }

    .announcement-meta {
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      font-size: 14px !important;
      color: #515154 !important;
      width: 100%;
      flex-wrap: wrap;

      .meta-item {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        margin: 0 !important;
        padding: 0 !important;

        .meta-icon {
          font-size: 16px !important;
          color: #86868b !important;
          flex-shrink: 0;
        }

        .meta-label {
          color: #86868b !important;
          font-weight: 400 !important;
          white-space: nowrap;
        }

        .meta-value {
          color: #1d1d1f !important;
          font-weight: 500 !important;
          white-space: nowrap;
        }
      }

      .meta-divider {
        color: #d1d1d6 !important;
        font-weight: 300 !important;
        margin: 0 !important;
      }
    }
  }

  // 分隔线
  .divider-line {
    height: 1px !important;
    background: linear-gradient(to right, transparent 0%, #e5e5e7 20%, #e5e5e7 80%, transparent 100%) !important;
    margin: 0 40px !important;
    border: none !important;
    padding: 0 !important;
  }

  // 正文内容区域
  .announcement-body {
    padding: 32px 40px !important;
    flex: 1;
    width: 100%;
    box-sizing: border-box;

    .content-wrapper {
      max-width: 100%;
      width: 100%;

      .content-text {
        font-size: 16px !important;
        line-height: 1.85 !important;
        color: #1d1d1f !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        letter-spacing: 0.01em !important;
        font-weight: 400 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100%;
        
        p {
          margin: 0 0 16px 0 !important;
          
          &:last-child {
            margin-bottom: 0 !important;
          }
        }

        ul, ol {
          margin: 16px 0 !important;
          padding-left: 24px !important;
          
          li {
            margin: 8px 0 !important;
          }
        }

        h1, h2, h3, h4, h5, h6 {
          margin: 24px 0 16px 0 !important;
          font-weight: 600 !important;
          
          &:first-child {
            margin-top: 0 !important;
          }
        }

        h2 {
          font-size: 22px !important;
        }

        h3 {
          font-size: 20px !important;
        }

        h4 {
          font-size: 18px !important;
        }
      }
    }
  }

  // 底部操作区
  .announcement-footer {
    padding: 20px 40px 32px !important;
    display: flex !important;
    justify-content: center !important;
    border-top: 1px solid #f0f2f5 !important;
    background: #fafbfc !important;
    width: 100%;
    box-sizing: border-box;
    margin: 0 !important;

    .close-button-primary {
      min-width: 140px !important;
      height: 44px !important;
      font-size: 15px !important;
      font-weight: 500 !important;
      border-radius: 8px !important;
      padding: 0 32px !important;
    }
  }
}
</style>

