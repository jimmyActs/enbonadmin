// 小满CRM模块文本
export default {
  title: '小满CRM',
  subtitle: '实时掌握客户、线索、商机动态，可在完成对接后加载小满数据',
  actions: {
    newLead: '新增线索',
    newCustomer: '新增客户',
    refresh: '刷新数据',
  },
  integration: {
    pendingTitle: '等待接入小满CRM',
    pendingDesc: '完成企业授权后即可自动同步小满 CRM 中的客户、线索、商机等核心数据。',
  },
  summary: {
    customers: '全部客户',
    leads: '线索池',
    deals: '进行中的商机',
    followUps: '今日跟进',
    comparedToLastWeek: '较上周',
  },
  pipeline: {
    title: '销售漏斗',
    desc: '展示各阶段的商机数量与金额，用于监控销售进度。',
    viewDetail: '查看详情',
    deals: '个商机',
    conversion: '转化率',
    days: '天',
    stages: {
      lead: '线索发掘',
      negotiation: '需求沟通',
      proposal: '方案/报价',
      contract: '合同签署',
    },
    status: {
      active: '推进中',
      warning: '需关注',
      focus: '重点攻坚',
    },
  },
  followUp: {
    title: '今日待办与提醒',
    desc: '来自小满CRM的跟进日程与电话提醒。',
    viewAll: '查看全部',
    today: '今日',
    tomorrow: '明日',
    yesterday: '昨日',
    actions: {
      phoneCall: '电话拜访',
      sendProposal: '发送报价方案',
      visit: '上门拜访',
    },
    status: {
      pending: '待跟进',
      inProgress: '进行中',
    },
  },
  customers: {
    title: '重点客户',
    desc: '已纳入跟进的核心客户列表，后续将同步小满 CRM 实际数据。',
    searchPlaceholder: '搜索客户名称、标签等',
    columns: {
      name: '客户名称',
      stage: '当前阶段',
      lastFollowUp: '最近跟进',
      owner: '负责人',
      nextAction: '下一步行动',
      operations: '操作',
    },
    nextActions: {
      sendQuotation: '发送正式报价',
      scheduleDemo: '安排演示',
      firstMeeting: '首次拜访',
    },
  },
  customerStage: {
    lead: '线索阶段',
    negotiation: '沟通阶段',
    proposal: '方案报价',
    contract: '合同推进',
  },
  ai: {
    title: 'AI 智能助手建议',
    desc: '基于历史成交与行业经验给出的行动建议，可在接入后联动小满AI。',
    refresh: '刷新建议',
    tags: {
      followUp: '跟进提醒',
      risk: '风险预警',
      opportunity: '增长机会',
    },
    suggestions: {
      followUp: '建议今天下午与邦德电子进行电话跟进，确认硬件需求规格并推进试用协议。',
      risk: '广州微梦科技的预算审批迟迟未通过，建议同步财务方案或提供分期计划。',
      opportunity: '上海科讯信息对智能客服模块兴趣浓厚，可安排下周技术演示。',
    },
  },
  activities: {
    title: '最近动态',
    desc: '与客户往来的最新记录，未来将与小满CRM的活动记录自动同步。',
    items: {
      callTitle: '完成电话回访',
      callDesc: '与邦德电子复盘上周POC进度，并确认下次会议。',
      contractTitle: '新合同待审批',
      contractDesc: '微梦科技提交了年度合同，请财务确认流程。',
      noteTitle: '跟进备注更新',
      noteDesc: '科讯信息反馈测试结果良好，计划下周付款。',
    },
  },
  common: {
    viewDetail: '查看详情',
    followUp: '立即跟进',
  },
}

