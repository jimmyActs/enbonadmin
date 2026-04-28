import api from './config'

// ========== 枚举类型 ==========

export type CrmStatus = 'new' | 'contacting' | 'negotiating' | 'closed' | 'lost'
export type CrmDealStatus = 'pending' | 'quoted' | 'ordered' | 'delivered' | 'completed'
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'proposal' | 'negotiating' | 'won' | 'lost' | 'converted' | 'invalid'
export type LeadSource = 'official_website' | 'exhibition' | 'referral' | 'social_media' | 'cold_call' | 'website' | 'partner' | 'other'
export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent'
export type PoolReason = 'no_activity_30_days' | 'owner_resigned' | 'manual_release' | 'duplicate_release' | 'supervisor_release'
export type TargetPeriod = 'monthly' | 'quarterly' | 'yearly'
export type TargetStatus = 'draft' | 'submitted' | 'confirmed' | 'rejected' | 'archived'
export type EmailDirection = 'inbound' | 'outbound'
export type ShipmentFileType = 'invoice' | 'packing_list' | 'bill_of_lading' | 'coo' | 'bl' | 'quantity_list' | 'manual' | 'firmware' | 'software' | 'photo' | 'video' | 'other'
export type WebsiteType = 'official' | 'b2b_portal' | 'alibaba' | 'made_in_china' | 'facebook' | 'linkedin' | 'instagram' | 'other'

// ========== 客户类型 ==========

export interface CrmCustomer {
  id: number
  customerCode: string
  customerName: string
  companyName?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  linkedInUrl?: string | null
  facebookUrl?: string | null
  whatsapp?: string | null
  instagramUrl?: string | null
  content?: string | null
  inquirySource?: string | null
  inquiryDate?: string | null
  communicationResult?: string | null
  status: CrmStatus
  dealStatus: CrmDealStatus
  products?: string | null
  shipment?: string | null
  afterSales: boolean
  estimatedRevenue?: number | null
  actualRevenue?: number | null
  starRating: number
  tags?: string | null
  ownerId?: number | null
  ownerName?: string | null  // 后端自动解析的负责人姓名
  ownerAssignedAt?: string | null
  lastMaintainAt?: string | null
  lastContact?: string | null
  isInPool: boolean
  poolReason?: PoolReason | null
  poolTime?: string | null
  createdBy?: number | null
  leadId?: number | null
  notes?: string | null
  rejectReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface CrmCustomerListResponse {
  data: CrmCustomer[]
  total: number
  page: number
  pageSize: number
}

export interface CrmCustomerQuery {
  page?: number
  pageSize?: number
  country?: string
  status?: CrmStatus
  dealStatus?: CrmDealStatus
  ownerId?: number
  keyword?: string
  starRating?: number
  inquirySource?: string
  noContactDays?: number
  selfOnly?: boolean
}

// ========== 商机类型 ==========

export interface CrmLead {
  id: number
  leadCode: string
  contactName: string
  companyName?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  source: LeadSource
  sourceDetail?: string | null
  inquiryContent?: string | null
  priority: LeadPriority
  assignedTo?: number | null
  assignedToName?: string | null  // 后端自动解析的负责人姓名
  assignedAt?: string | null
  createdBy?: number | null
  status: LeadStatus
  convertedCustomerId?: number | null
  convertedAt?: string | null
  lostReason?: string | null
  lostAt?: string | null
  lastFollowUpAt?: string | null
  notes?: string | null
  website?: string | null
  websiteId?: number | null
  isInPool: boolean
  poolReason?: string | null
  poolTime?: string | null
  createdAt: string
  updatedAt: string
}

export interface CrmLeadListResponse {
  data: CrmLead[]
  total: number
  page: number
  pageSize: number
}

export interface CrmLeadQuery {
  page?: number
  pageSize?: number
  status?: LeadStatus
  source?: LeadSource
  assignedTo?: number
  keyword?: string
  country?: string
}

// ========== 邮件类型 ==========

export interface CrmEmail {
  id: number
  messageId: string
  subject?: string | null
  snippet?: string | null
  fromEmail: string
  fromName?: string | null
  toRecipients?: string | null
  ccRecipients?: string | null
  bodyHtml?: string | null
  bodyText?: string | null
  bodyPreview?: string | null
  attachments?: string | null
  hasAttachments?: boolean | null
  customerId?: number | null
  ownerId?: number | null
  direction: EmailDirection
  importance: string
  isRead?: boolean | null
  isStarred?: boolean | null
  isArchived?: boolean | null
  tags?: string | null
  conversationId?: string | null
  emailDate?: string | null
  createdAt: string
  updatedAt: string
}

// ========== 销售目标类型 ==========

export interface CrmSalesTarget {
  id: number
  targetCode: string
  title: string
  salesId?: number | null
  salesName?: string | null
  period: TargetPeriod
  year: number
  quarter?: number | null
  month?: number | null
  targetAmount: number
  achievedAmount: number
  targetRevenue: number
  achievedRevenue: number
  completionRate: number
  status: TargetStatus
  reviewedBy?: number | null
  reviewedAt?: string | null
  reviewComment?: string | null
  createdBy?: number | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CrmTargetQuery {
  page?: number
  pageSize?: number
  salesId?: number
  period?: TargetPeriod
  year?: number
  quarter?: number
  month?: number
  status?: TargetStatus
}

// ========== 出货文件类型 ==========

export interface CrmShipmentFile {
  id: number
  shipmentCode: string
  shipmentBatch?: string | null
  shipmentDate?: string | null
  destinationCountry?: string | null
  destinationPort?: string | null
  customerId?: number | null
  customerName?: string | null
  fileType: ShipmentFileType
  fileName: string
  originalFileName?: string | null
  filePath: string
  fileUrl?: string | null
  fileSize?: number | null
  mimeType?: string | null
  version?: string | null
  description?: string | null
  qrCode?: string | null
  qrCodeToken?: string | null
  uploadedBy?: number | null
  uploadedByName?: string | null
  productModel?: string | null
  productName?: string | null
  quantity?: number | null
  trackingNumber?: string | null
  shippingMethod?: string | null
  createdAt: string
  updatedAt: string
}

// ========== 询盘来源类型 ==========

export interface CrmInquirySource {
  id: number
  name: string
  websiteType: WebsiteType
  websiteUrl?: string | null
  logo?: string | null
  apiEndpoint?: string | null
  apiKey?: string | null
  webhookUrl?: string | null
  webhookSecret?: string | null
  isActive: boolean
  autoFetch: boolean
  fetchIntervalMinutes?: number | null
  defaultCountry?: string | null
  assignedDepartment?: string | null
  assignedToUserId?: number | null
  autoAssignEnabled?: boolean | null
  totalInquiries: number
  pendingInquiries: number
  lastFetchAt?: string | null
  lastInquiryAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// ========== 统计类型 ==========

export interface CrmSummaryStats {
  totalCustomers: number
  privateCustomers: number
  poolCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  overdueNoContact: number
  closedDeals: number
  totalRevenue: number
}

export interface CrmPipelineStat {
  status: CrmStatus
  count: number
}

export interface CrmCountryStat {
  country: string
  count: number
}

export interface CrmOwnerStat {
  ownerId: number | null
  ownerName: string
  totalCount: number
  closedCount: number
  totalRevenue: number
}

export interface CrmLeadStat {
  total: number
  newLeads: number
  qualified: number
  won: number
}

export interface CrmTargetStat {
  salesId: number
  salesName: string
  totalTargetRevenue: number
  totalAchievedRevenue: number
  totalTargetAmount: number
  totalAchievedAmount: number
  revenueCompletionRate: number
  amountCompletionRate: number
}

// ========== 查重结果类型 ==========

export interface DuplicateCheckResult {
  id: number
  customerCode: string
  customerName: string
  companyName?: string | null
  country?: string | null
  status: CrmStatus
  starRating: number
  ownerId?: number | null
  createdAt: string
  similarity: number
}

// ========== API 函数 ==========

// ----- 客户 -----

export const getCrmCustomers = (params?: CrmCustomerQuery): Promise<CrmCustomerListResponse> => {
  return api.get('/crm/customers', { params })
}

export const getCrmCustomer = (id: number): Promise<CrmCustomer> => {
  return api.get(`/crm/customers/${id}`)
}

export const createCrmCustomer = (data: Partial<CrmCustomer>): Promise<CrmCustomer> => {
  return api.post('/crm/customers', data)
}

export const updateCrmCustomer = (id: number, data: Partial<CrmCustomer>): Promise<CrmCustomer> => {
  return api.put(`/crm/customers/${id}`, data)
}

export const deleteCrmCustomer = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/customers/${id}`)
}

export const checkCrmDuplicate = (params: { name?: string; companyName?: string; country?: string; content?: string }): Promise<DuplicateCheckResult[]> => {
  return api.post('/crm/customers/check-duplicate', params)
}

// ----- 公海 -----

export const getCrmPool = (params?: Omit<CrmCustomerQuery, 'isInPool'>): Promise<CrmCustomerListResponse> => {
  return api.get('/crm/pool', { params })
}

export const claimCrmFromPool = (id: number): Promise<CrmCustomer> => {
  return api.post(`/crm/pool/${id}/claim`)
}

export const releaseCrmToPool = (id: number, reason: PoolReason): Promise<CrmCustomer> => {
  return api.post(`/crm/pool/${id}/release`, { reason })
}

// ----- 客户批量操作 -----
export interface BatchResult { success: number; failed: number }

export const batchAssignOwner = (ids: number[], ownerId: number): Promise<BatchResult> => {
  return api.post('/crm/customers/batch-assign-owner', { ids, ownerId })
}

export const batchReleaseToPool = (ids: number[], reason: PoolReason): Promise<BatchResult> => {
  return api.post('/crm/customers/batch-release', { ids, reason })
}

export const batchDeleteCustomers = (ids: number[]): Promise<BatchResult> => {
  return api.post('/crm/customers/batch-delete', { ids })
}

export interface ChangelogEntry {
  id: number
  customerId: number
  action: 'create' | 'update' | 'assign_owner' | 'release_to_pool' | 'claim_from_pool' | 'delete'
  field: string | null
  oldValue: string | null
  newValue: string | null
  summary: string | null
  operatorId: number | null
  operatorName: string | null
  ipAddress: string | null
  createdAt: string
}

export interface ChangelogResponse {
  data: ChangelogEntry[]
  total: number
}

export const getCustomerChangelog = (customerId: number, page = 1, pageSize = 20): Promise<ChangelogResponse> => {
  return api.get(`/crm/customers/${customerId}/changelog`, { params: { page, pageSize } })
}

// ----- 商机 -----

export const getCrmLeads = (params?: CrmLeadQuery): Promise<CrmLeadListResponse> => {
  return api.get('/crm/leads', { params })
}

export const getCrmLead = (id: number): Promise<CrmLead> => {
  return api.get(`/crm/leads/${id}`)
}

export const createCrmLead = (data: Partial<CrmLead>): Promise<CrmLead> => {
  return api.post('/crm/leads', data)
}

export const updateCrmLead = (id: number, data: Partial<CrmLead>): Promise<CrmLead> => {
  return api.put(`/crm/leads/${id}`, data)
}

export const deleteCrmLead = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/leads/${id}`)
}

export const convertCrmLead = (id: number, customerData?: Partial<CrmCustomer>): Promise<CrmCustomer> => {
  return api.post(`/crm/leads/${id}/convert`, customerData || {})
}

// ----- 待分配询盘 -----

export const getCrmPendingLeads = (params?: {
  page?: number; pageSize?: number; keyword?: string; source?: string; country?: string
}): Promise<CrmLeadListResponse> => {
  return api.get('/crm/leads/pending', { params })
}

export const assignCrmLead = (id: number, assignedTo: number | null): Promise<CrmLead> => {
  return api.post(`/crm/leads/${id}/assign`, { assignedTo })
}

// ----- 线索公海池 -----

export const getCrmLeadPool = (params?: {
  page?: number; pageSize?: number; keyword?: string; source?: string; country?: string; priority?: string
}): Promise<{ data: CrmLead[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/lead-pool', { params })
}

export const claimCrmLeadFromPool = (id: number): Promise<CrmLead> => {
  return api.post(`/crm/lead-pool/${id}/claim`)
}

export const releaseCrmLeadToPool = (id: number, reason: string): Promise<CrmLead> => {
  return api.post(`/crm/lead-pool/${id}/release`, { reason })
}

export const autoAssignCrmLeadPool = (): Promise<{ assigned: number; remaining: number }> => {
  return api.post('/crm/lead-pool/auto-assign')
}

// ----- 邮件 -----

export const getCrmEmails = (params?: {
  page?: number; pageSize?: number; customerId?: number; ownerId?: number; direction?: EmailDirection; keyword?: string; unreadOnly?: boolean
}): Promise<{ data: CrmEmail[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/emails', { params })
}

export const createCrmEmail = (data: Partial<CrmEmail>): Promise<CrmEmail> => {
  return api.post('/crm/emails', data)
}

export const sendCrmEmail = (data: { to: string; cc?: string; subject: string; body: string; attachments?: { filename: string; size: number; url: string }[] }): Promise<CrmEmail> => {
  return api.post('/crm/emails/send', data)
}

export const saveCrmEmailDraft = (data: {
  direction?: string
  subject?: string
  bodyText?: string
  toEmail?: string
  ccRecipients?: string
  isDraft?: boolean
}): Promise<CrmEmail> => {
  return api.post('/crm/emails', data)
}

export const markEmailRead = (id: number): Promise<void> => {
  return api.post(`/crm/emails/${id}/read`)
}

export const updateCrmEmail = (id: number, data: Partial<CrmEmail>): Promise<CrmEmail> => {
  return api.put(`/crm/emails/${id}`, data)
}

export const deleteCrmEmail = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/emails/${id}`)
}

// ----- 销售目标 -----

export const getCrmTargets = (params?: CrmTargetQuery): Promise<{ data: CrmSalesTarget[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/targets', { params })
}

export const createCrmTarget = (data: Partial<CrmSalesTarget>): Promise<CrmSalesTarget> => {
  return api.post('/crm/targets', data)
}

export const updateCrmTarget = (id: number, data: Partial<CrmSalesTarget>): Promise<CrmSalesTarget> => {
  return api.put(`/crm/targets/${id}`, data)
}

export const reviewCrmTarget = (id: number, status: TargetStatus, comment?: string): Promise<CrmSalesTarget> => {
  return api.post(`/crm/targets/${id}/review`, { status, comment })
}

export const deleteCrmTarget = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/targets/${id}`)
}

// ----- 出货文件 -----

export const getCrmShipmentFiles = (params?: {
  page?: number; pageSize?: number; customerId?: number; shipmentCode?: string; keyword?: string
}): Promise<{ data: CrmShipmentFile[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/shipment-files', { params })
}

export const createCrmShipmentFile = (data: Partial<CrmShipmentFile>): Promise<CrmShipmentFile> => {
  return api.post('/crm/shipment-files', data)
}

export const updateCrmShipmentFile = (id: number, data: Partial<CrmShipmentFile>): Promise<CrmShipmentFile> => {
  return api.put(`/crm/shipment-files/${id}`, data)
}

export const deleteCrmShipmentFile = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/shipment-files/${id}`)
}

export const getCrmShipmentFilesByToken = (token: string): Promise<CrmShipmentFile[]> => {
  return api.get(`/crm/shipment-files/qr/${token}`)
}

// ----- 询盘来源 -----

export const getCrmInquirySources = (): Promise<CrmInquirySource[]> => {
  return api.get('/crm/inquiry-sources')
}

export const createCrmInquirySource = (data: Partial<CrmInquirySource>): Promise<CrmInquirySource> => {
  return api.post('/crm/inquiry-sources', data)
}

export const updateCrmInquirySource = (id: number, data: Partial<CrmInquirySource>): Promise<CrmInquirySource> => {
  return api.put(`/crm/inquiry-sources/${id}`, data)
}

export const deleteCrmInquirySource = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/inquiry-sources/${id}`)
}

export const importCrmInquiries = (sourceId: number, inquiries: Partial<CrmLead>[]): Promise<{ imported: number; leads: CrmLead[] }> => {
  return api.post(`/crm/inquiry-sources/${sourceId}/import`, { inquiries })
}

// ----- 统计 -----

export const getCrmSummary = (): Promise<CrmSummaryStats> => {
  return api.get('/crm/stats/summary')
}

export const getCrmPipeline = (): Promise<CrmPipelineStat[]> => {
  return api.get('/crm/stats/pipeline')
}

export const getCrmCountryStats = (): Promise<CrmCountryStat[]> => {
  return api.get('/crm/stats/countries')
}

export const getCrmOwnerStats = (params?: { department?: string }): Promise<CrmOwnerStat[]> => {
  return api.get('/crm/stats/owners', { params })
}

export const getCrmLeadStats = (): Promise<CrmLeadStat> => {
  return api.get('/crm/stats/leads')
}

export const getCrmTargetStats = (params?: { year?: number; salesId?: number }): Promise<CrmTargetStat[]> => {
  return api.get('/crm/stats/targets', { params })
}

// ========== 统计分析 ==========

export type TrendPeriod = 'day' | 'week' | 'month'

export interface CrmChannelConversion {
  channel: string
  channelName: string
  totalLeads: number
  convertedCustomers: number
  conversionRate: number
}

export interface CrmWebsiteConversion {
  websiteId: number
  websiteName: string
  websiteType: string
  channelName: string
  totalLeads: number
  convertedCustomers: number
  conversionRate: number
}

export interface CrmTrendItem {
  period: string
  leads: number
  customers: number
}

export const getCrmChannelConversion = (): Promise<CrmChannelConversion[]> => {
  return api.get('/crm/stats/channels')
}

export const getCrmWebsiteConversion = (): Promise<CrmWebsiteConversion[]> => {
  return api.get('/crm/stats/websites')
}

export const getCrmTrends = (params?: { period?: TrendPeriod; range?: number }): Promise<CrmTrendItem[]> => {
  return api.get('/crm/stats/trends', { params })
}

// ----- 团队看板 -----

export interface TeamKpi {
  totalCustomers: number
  totalLeads: number
  closedDeals: number
  totalRevenue: number
  newThisMonth: number
  memberCount: number
}

export interface TeamMember {
  ownerId: number
  ownerName: string
  totalCustomers: number
  closedDeals: number
  totalRevenue: number
  newThisMonth: number
}

export interface SelectableMember {
  id: number
  nickname?: string
  username: string
  department?: string
  position?: string
}

export interface TeamFunnelItem {
  status: string
  label: string
  count: number
}

export interface TeamViewParams {
  viewScope?: 'self' | 'department' | 'user'
  targetUserId?: number
  department?: string
}

export const getCrmTeamKpi = (params?: TeamViewParams): Promise<TeamKpi> => {
  return api.get('/crm/team-kpi', { params })
}

export const getCrmTeamMembers = (params?: TeamViewParams): Promise<TeamMember[]> => {
  return api.get('/crm/team/members', { params })
}

export const getCrmTeamFunnel = (params?: TeamViewParams): Promise<TeamFunnelItem[]> => {
  return api.get('/crm/team/funnel', { params })
}

export const getCrmSelectableMembers = (): Promise<SelectableMember[]> => {
  return api.get('/crm/team/members/selectable')
}

// ========== 报价单 ==========

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quotation {
  id: number
  quotationNumber: string
  customerId?: number | null
  customerName: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: QuotationStatus
  quotationDate: string
  validUntil?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface QuotationQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: QuotationStatus
}

export const getQuotations = (params?: QuotationQuery): Promise<{ data: Quotation[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/quotations', { params })
}

export const getQuotation = (id: number): Promise<Quotation> => {
  return api.get(`/crm/quotations/${id}`)
}

export const createQuotation = (data: Partial<Quotation>): Promise<Quotation> => {
  return api.post('/crm/quotations', data)
}

export const updateQuotation = (id: number, data: Partial<Quotation>): Promise<Quotation> => {
  return api.put(`/crm/quotations/${id}`, data)
}

export const deleteQuotation = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/quotations/${id}`)
}

// ========== 报价进展跟踪 ==========

export type QuotationTrackType = 'STATUS_CHANGE' | 'VIEW' | 'COMMENT' | 'REVISION' | 'APPROVAL' | 'EMAIL' | 'REMINDER'

export interface QuotationTrack {
  id: number
  quotationId: number
  trackType: QuotationTrackType
  title?: string | null
  description?: string | null
  fromStatus?: string | null
  toStatus?: string | null
  attachments?: string[] | null
  operatorId?: number | null
  extraData?: Record<string, any> | null
  createdAt: string
}

export interface QuotationVersion {
  id: number
  quotationId: number
  version: number
  snapshot: Record<string, any>
  changeSummary?: string | null
  createdBy: number
  createdAt: string
}

export const getQuotationTracks = (quotationId: number): Promise<QuotationTrack[]> => {
  return api.get(`/crm/quotations/${quotationId}/tracks`)
}

export const addQuotationTrack = (
  quotationId: number,
  data: {
    trackType: QuotationTrackType
    title?: string
    description?: string
    fromStatus?: string
    toStatus?: string
    attachments?: string[]
    extraData?: Record<string, any>
  }
): Promise<QuotationTrack> => {
  return api.post(`/crm/quotations/${quotationId}/tracks`, data)
}

export const getQuotationVersions = (quotationId: number): Promise<QuotationVersion[]> => {
  return api.get(`/crm/quotations/${quotationId}/versions`)
}

export const createQuotationVersion = (
  quotationId: number,
  changeSummary?: string
): Promise<QuotationVersion> => {
  return api.post(`/crm/quotations/${quotationId}/versions`, { changeSummary })
}

// ========== 销售目标（内存存储）==========

export interface SalesTarget {
  id: number
  period: TargetPeriod
  date: string
  targetAmount: number
  actualAmount: number
  completionRate: number
  targetCustomers: number
  actualCustomers: number
  description?: string | null
  createdAt: string
  updatedAt: string
}

export interface SalesTargetQuery {
  page?: number
  pageSize?: number
  period?: TargetPeriod
}

export const getSalesTargets = (params?: SalesTargetQuery): Promise<{ data: CrmSalesTarget[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/targets', { params })
}

export const getSalesTarget = (id: number): Promise<SalesTarget> => {
  return api.get(`/crm/targets/${id}`)
}

export const createSalesTarget = (data: Partial<CrmSalesTarget>): Promise<CrmSalesTarget> => {
  return api.post('/crm/targets', data)
}

export const updateSalesTarget = (id: number, data: Partial<CrmSalesTarget>): Promise<CrmSalesTarget> => {
  return api.put(`/crm/targets/${id}`, data)
}

export const deleteSalesTarget = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/targets/${id}`)
}

// ========== 销售复盘 ==========

export type ReviewPeriod = 'monthly' | 'quarterly' | 'yearly'

export interface SalesReview {
  id: number
  period: ReviewPeriod
  date: string
  summary: string
  achievements: string
  challenges: string
  improvements: string
  createdBy?: number
  createdAt: string
  updatedAt: string
}

export const getReviews = (params?: {
  page?: number
  pageSize?: number
  period?: ReviewPeriod
  keyword?: string
}): Promise<{ data: SalesReview[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/reviews', { params })
}

export const getReview = (id: number): Promise<SalesReview> => {
  return api.get(`/crm/reviews/${id}`)
}

export const updateReview = (id: number, data: Partial<{
  period: ReviewPeriod
  date: string
  summary: string
  achievements: string
  challenges: string
  improvements: string
}>): Promise<SalesReview> => {
  return api.put(`/crm/reviews/${id}`, data)
}

export const deleteReview = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/reviews/${id}`)
}

export interface ReviewSyncResult {
  targetId: number
  targetTitle: string
  achievedAmount: number
  achievedRevenue: number
  completionRate: number
}

export const createReview = (data: {
  period: ReviewPeriod
  date: string
  summary: string
  achievements?: string
  challenges?: string
  improvements?: string
}): Promise<{ review: SalesReview; syncResult?: ReviewSyncResult }> => {
  return api.post('/crm/reviews', data)
}

// ========== 导入/导出 ==========

export interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

/** 商机批量导入（Excel） */
export const importCrmLeads = (file: File): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/import/crm/leads/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 商机导入模板下载 */
export const downloadCrmLeadsTemplate = (): Promise<{ buffer: string; filename: string }> => {
  return api.get('/import/crm/leads/template')
}

/** 询盘来源批量导入（Excel） */
export const importCrmInquirySources = (file: File): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/import/crm/inquiry-sources/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 询盘来源导入模板下载 */
export const downloadInquirySourcesTemplate = (): Promise<{ buffer: string; filename: string }> => {
  return api.get('/import/crm/inquiry-sources/template')
}

// ========== 回收站 ==========

export interface RecycleBinItem extends CrmCustomer {
  deletedAt: string
}

export const getRecycleBin = (params?: {
  page?: number
  pageSize?: number
  keyword?: string
}): Promise<{ data: RecycleBinItem[]; total: number; page: number; pageSize: number }> => {
  return api.get('/crm/customers/recycle-bin', { params })
}

export const restoreCustomer = (id: number): Promise<{ success: boolean }> => {
  return api.post(`/crm/customers/${id}/restore`)
}

export const batchRestoreCustomers = (ids: number[]): Promise<{ success: number; failed: number }> => {
  return api.post('/crm/customers/batch-restore', { ids })
}

export const permanentDeleteCustomer = (id: number): Promise<{ success: boolean }> => {
  return api.delete(`/crm/customers/${id}/permanent`)
}

export const batchPermanentDelete = (ids: number[]): Promise<{ success: number; failed: number }> => {
  return api.post('/crm/customers/batch-permanent-delete', { ids })
}
