// Xiaoman CRM module texts
export default {
  title: 'Xiaoman CRM',
  subtitle: 'Stay on top of customers, leads and deals. Real data will appear after connecting to Xiaoman APIs.',
  actions: {
    newLead: 'New Lead',
    newCustomer: 'New Customer',
    refresh: 'Refresh',
  },
  integration: {
    pendingTitle: 'Waiting for Xiaoman CRM Integration',
    pendingDesc: 'Once the enterprise authorization is completed, customers, leads and deal data will sync from Xiaoman CRM automatically.',
  },
  summary: {
    customers: 'Customers',
    leads: 'Leads',
    deals: 'Active Deals',
    followUps: 'Today’s Follow-ups',
    comparedToLastWeek: 'vs last week',
  },
  pipeline: {
    title: 'Sales Pipeline',
    desc: 'Snapshot of deals across each stage to help monitor progress.',
    viewDetail: 'View Detail',
    deals: 'deals',
    conversion: 'Conversion',
    days: 'days',
    stages: {
      lead: 'Lead Capture',
      negotiation: 'Qualification',
      proposal: 'Proposal',
      contract: 'Contract',
    },
    status: {
      active: 'Healthy',
      warning: 'Needs Attention',
      focus: 'Key Focus',
    },
  },
  followUp: {
    title: 'Follow-up Reminders',
    desc: 'Upcoming calls and tasks from Xiaoman CRM. Real tasks will show after integration.',
    viewAll: 'View all',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    actions: {
      phoneCall: 'Phone Call',
      sendProposal: 'Send Proposal',
      visit: 'On-site Visit',
    },
    status: {
      pending: 'Pending',
      inProgress: 'In Progress',
    },
  },
  customers: {
    title: 'Key Customers',
    desc: 'Preview of strategic accounts. Actual data will sync from Xiaoman CRM later.',
    searchPlaceholder: 'Search by customer name, tag…',
    columns: {
      name: 'Customer',
      stage: 'Stage',
      lastFollowUp: 'Last Follow-up',
      owner: 'Owner',
      nextAction: 'Next Action',
      operations: 'Operations',
    },
    nextActions: {
      sendQuotation: 'Send quotation',
      scheduleDemo: 'Schedule demo',
      firstMeeting: 'Arrange first meeting',
    },
  },
  customerStage: {
    lead: 'Lead Stage',
    negotiation: 'Negotiation',
    proposal: 'Proposal',
    contract: 'Contract',
  },
  ai: {
    title: 'AI Insights',
    desc: 'Smart suggestions generated from selling patterns. Will cooperate with Xiaoman AI afterwards.',
    refresh: 'Refresh',
    tags: {
      followUp: 'Follow-up',
      risk: 'Risk Alert',
      opportunity: 'Opportunity',
    },
    suggestions: {
      followUp: 'Plan a follow-up call with Bond Electronics this afternoon to confirm hardware requirements and push the PoC.',
      risk: 'Budget approval for Weimeng Tech is pending; consider offering flexible payment terms.',
      opportunity: 'Kexun Info is interested in the AI service module – schedule a technical demo next week.',
    },
  },
  activities: {
    title: 'Recent Activities',
    desc: 'Latest interactions. After integration this list will sync directly from Xiaoman CRM.',
    items: {
      callTitle: 'Completed phone call',
      callDesc: 'Checked in with Bond Electronics on PoC progress and scheduled the next meeting.',
      contractTitle: 'Contract pending approval',
      contractDesc: 'Annual contract from Weimeng Tech awaiting finance approval.',
      noteTitle: 'Follow-up note added',
      noteDesc: 'Kexun Info reported good test results and plans to proceed next week.',
    },
  },
  common: {
    viewDetail: 'View Detail',
    followUp: 'Follow up',
  },
}

