import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DeepPartial } from 'typeorm';
import { HrPerformanceCycle } from './entities/hr-performance-cycle.entity';
import { HrPerformanceIndicator } from './entities/hr-performance-indicator.entity';
import { HrPerformanceTemplate } from './entities/hr-performance-template.entity';
import { HrTemplateIndicator } from './entities/hr-template-indicator.entity';
import { HrPerformanceReview } from './entities/hr-performance-review.entity';
import { HrPip } from './entities/hr-pip.entity';
import { HrPipStep } from './entities/hr-pip-step.entity';
import { HrEmployeeExit } from './entities/hr-employee-exit.entity';
import { HrProbation } from './entities/hr-probation.entity';
import { HrProbationEvaluation } from './entities/hr-probation-evaluation.entity';
import { HrPayrollBudget } from './entities/hr-payroll-budget.entity';
import { HrPayrollAlert } from './entities/hr-payroll-alert.entity';
import { HrTrainingCourse } from './entities/hr-training-course.entity';
import { HrTrainingPlan } from './entities/hr-training-plan.entity';
import { HrTrainingPlanCourse } from './entities/hr-training-plan-course.entity';
import { HrTrainingRecord } from './entities/hr-training-record.entity';
import { HrTrainingEvaluation } from './entities/hr-training-evaluation.entity';
import { User, EmploymentStatus } from '../users/entities/user.entity';

// ==================== 绩效管理 ====================

@Injectable()
export class HrPerformanceService {
  constructor(
    @InjectRepository(HrPerformanceCycle)
    private cycleRepo: Repository<HrPerformanceCycle>,
    @InjectRepository(HrPerformanceIndicator)
    private indicatorRepo: Repository<HrPerformanceIndicator>,
    @InjectRepository(HrPerformanceTemplate)
    private templateRepo: Repository<HrPerformanceTemplate>,
    @InjectRepository(HrTemplateIndicator)
    private templateIndicatorRepo: Repository<HrTemplateIndicator>,
    @InjectRepository(HrPerformanceReview)
    private reviewRepo: Repository<HrPerformanceReview>,
    @InjectRepository(HrPip)
    private pipRepo: Repository<HrPip>,
    @InjectRepository(HrPipStep)
    private pipStepRepo: Repository<HrPipStep>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // 考核周期
  async createCycle(data: Partial<HrPerformanceCycle>): Promise<HrPerformanceCycle> {
    const entity = this.cycleRepo.create(data as any);
    return this.cycleRepo.save(entity) as any;
  }

  async findAllCycles(): Promise<HrPerformanceCycle[]> {
    return this.cycleRepo.find({ order: { periodStart: 'DESC' } });
  }

  async findCycleById(id: number): Promise<HrPerformanceCycle> {
    const cycle = await this.cycleRepo.findOne({ where: { id } });
    if (!cycle) throw new NotFoundException('考核周期不存在');
    return cycle;
  }

  async updateCycle(id: number, data: Partial<HrPerformanceCycle>): Promise<HrPerformanceCycle> {
    const cycle = await this.findCycleById(id);
    Object.assign(cycle, data);
    return this.cycleRepo.save(cycle) as any;
  }

  // 指标库
  async createIndicator(data: Partial<HrPerformanceIndicator>): Promise<HrPerformanceIndicator> {
    const entity = this.indicatorRepo.create(data as any);
    return this.indicatorRepo.save(entity) as any;
  }

  async findAllIndicators(): Promise<HrPerformanceIndicator[]> {
    return this.indicatorRepo.find({ where: { isActive: true } });
  }

  async updateIndicator(id: number, data: Partial<HrPerformanceIndicator>): Promise<HrPerformanceIndicator> {
    const indicator = await this.indicatorRepo.findOne({ where: { id } });
    if (!indicator) throw new NotFoundException('指标不存在');
    Object.assign(indicator, data);
    return this.indicatorRepo.save(indicator) as any;
  }

  // 绩效模板
  async createTemplate(data: Partial<HrPerformanceTemplate>): Promise<HrPerformanceTemplate> {
    const entity = this.templateRepo.create(data as any);
    return this.templateRepo.save(entity) as any;
  }

  async findAllTemplates(): Promise<HrPerformanceTemplate[]> {
    return this.templateRepo.find({ where: { isActive: true } });
  }

  async addTemplateIndicator(templateId: number, indicatorId: number, weight: number, targetValue?: number): Promise<HrTemplateIndicator> {
    const entity = this.templateIndicatorRepo.create({ templateId, indicatorId, weight, targetValue } as any);
    return this.templateIndicatorRepo.save(entity) as any;
  }

  async getTemplateIndicators(templateId: number): Promise<HrTemplateIndicator[]> {
    return this.templateIndicatorRepo.find({ where: { templateId }, relations: ['indicator'] });
  }

  // 绩效评估
  async createReview(data: Partial<HrPerformanceReview>): Promise<HrPerformanceReview> {
    const entity = this.reviewRepo.create(data as any);
    return this.reviewRepo.save(entity) as any;
  }

  async findReviewsByCycle(cycleId: number): Promise<HrPerformanceReview[]> {
    return this.reviewRepo.find({ where: { cycleId, isDeleted: false } });
  }

  async findReviewByEmployee(cycleId: number, employeeId: number): Promise<HrPerformanceReview> {
    const review = await this.reviewRepo.findOne({ where: { cycleId, employeeId, isDeleted: false } });
    if (!review) throw new NotFoundException('绩效记录不存在');
    return review;
  }

  async submitSelfReview(id: number, selfScore: number, selfComment: string): Promise<HrPerformanceReview> {
    const review = await this.reviewRepo.findOne({ where: { id, isDeleted: false } });
    if (!review) throw new NotFoundException('绩效记录不存在');
    review.selfScore = selfScore;
    review.selfComment = selfComment;
    review.selfSubmittedAt = new Date();
    return this.reviewRepo.save(review) as any;
  }

  async submitManagerReview(id: number, managerScore: number, managerComment: string, managerId: number): Promise<HrPerformanceReview> {
    const review = await this.reviewRepo.findOne({ where: { id, isDeleted: false } });
    if (!review) throw new NotFoundException('绩效记录不存在');
    review.managerScore = managerScore;
    review.managerComment = managerComment;
    review.managerId = managerId;
    review.managerSubmittedAt = new Date();
    return this.reviewRepo.save(review) as any;
  }

  async submitHrReview(id: number, hrScore: number, hrComment: string, hrReviewerId: number): Promise<HrPerformanceReview> {
    const review = await this.reviewRepo.findOne({ where: { id, isDeleted: false } });
    if (!review) throw new NotFoundException('绩效记录不存在');
    review.hrScore = hrScore;
    review.hrComment = hrComment;
    review.hrReviewerId = hrReviewerId;
    review.hrSubmittedAt = new Date();
    return this.reviewRepo.save(review) as any;
  }

  async publishReview(id: number): Promise<HrPerformanceReview> {
    const review = await this.reviewRepo.findOne({ where: { id, isDeleted: false } });
    if (!review) throw new NotFoundException('绩效记录不存在');
    review.finalScore = (review.selfScore * 0.3 + review.managerScore * 0.5 + (review.hrScore || review.managerScore) * 0.2);
    // 评级标准：A(90+) B(80-89) C(70-79) D(60-69) E(<60)
    if (review.finalScore >= 90) review.rating = 'A';
    else if (review.finalScore >= 80) review.rating = 'B';
    else if (review.finalScore >= 70) review.rating = 'C';
    else if (review.finalScore >= 60) review.rating = 'D';
    else review.rating = 'E';
    review.isPublished = true;
    review.publishedAt = new Date();
    return this.reviewRepo.save(review) as any;
  }

  async getPerformanceDistribution(cycleId: number): Promise<any> {
    const reviews = await this.reviewRepo.find({ where: { cycleId, isPublished: true, isDeleted: false } });
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    reviews.forEach(r => {
      if (r.rating && distribution.hasOwnProperty(r.rating)) {
        distribution[r.rating as keyof typeof distribution]++;
      }
    });
    const total = reviews.length;
    return {
      distribution,
      percentages: {
        A: total > 0 ? Math.round(distribution.A / total * 100) : 0,
        B: total > 0 ? Math.round(distribution.B / total * 100) : 0,
        C: total > 0 ? Math.round(distribution.C / total * 100) : 0,
        D: total > 0 ? Math.round(distribution.D / total * 100) : 0,
        E: total > 0 ? Math.round(distribution.E / total * 100) : 0,
      },
      total,
    };
  }

  // PIP 管理
  async createPip(data: Partial<HrPip>): Promise<HrPip> {
    const entity = this.pipRepo.create(data as any);
    return this.pipRepo.save(entity) as any;
  }

  async findPipByEmployee(employeeId: number): Promise<HrPip[]> {
    return this.pipRepo.find({ where: { employeeId, isDeleted: false } });
  }

  async findPipById(id: number): Promise<HrPip> {
    const pip = await this.pipRepo.findOne({ where: { id, isDeleted: false } });
    if (!pip) throw new NotFoundException('PIP记录不存在');
    return pip;
  }

  async addPipStep(pipId: number, data: Partial<HrPipStep>): Promise<HrPipStep> {
    const entity = this.pipStepRepo.create({ ...data, pipId } as any);
    return this.pipStepRepo.save(entity) as any;
  }

  async updatePipStep(stepId: number, data: Partial<HrPipStep>): Promise<HrPipStep> {
    const step = await this.pipStepRepo.findOne({ where: { id: stepId, isDeleted: false } });
    if (!step) throw new NotFoundException('PIP步骤不存在');
    Object.assign(step, data);
    return this.pipStepRepo.save(step) as any;
  }

  async getPipSteps(pipId: number): Promise<HrPipStep[]> {
    return this.pipStepRepo.find({ where: { pipId, isDeleted: false } });
  }

  async completePip(id: number, result: string, comment: string): Promise<HrPip> {
    const pip = await this.findPipById(id);
    pip.status = 'COMPLETED';
    pip.finalResult = result;
    pip.finalComment = comment;
    pip.completedAt = new Date();
    return this.pipRepo.save(pip) as any;
  }

  async terminatePip(id: number, comment: string): Promise<HrPip> {
    const pip = await this.findPipById(id);
    pip.status = 'TERMINATED';
    pip.finalResult = 'FAILED';
    pip.finalComment = comment;
    pip.terminatedAt = new Date();
    return this.pipRepo.save(pip) as any;
  }

  // ==================== 潜力评估矩阵 ====================

  async getPotentialMatrix(params: { department?: string; period?: string }): Promise<any> {
    // 获取在职员工
    const queryBuilder = this.userRepo.createQueryBuilder('user')
      .where('user.employmentStatus = :status', { status: 'active' });

    if (params.department) {
      queryBuilder.andWhere('user.department = :department', { department: params.department });
    }

    const users = await queryBuilder.getMany();

    // 获取最新绩效评估数据
    const reviews = await this.reviewRepo.createQueryBuilder('review')
      .orderBy('review.reviewedAt', 'DESC')
      .andWhere('review.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();

    // 员工绩效映射
    const reviewMap = new Map<number, any>();
    reviews.forEach(r => {
      if (!reviewMap.has(r.employeeId)) {
        reviewMap.set(r.employeeId, r);
      }
    });

    // 计算潜力等级（基于入职时间、年龄、绩效趋势等因素模拟）
    const calculatePotential = (user: any, review: any): 'HIGH' | 'MEDIUM' | 'LOW' => {
      const now = new Date();
      const hireDate = user.hireDate ? new Date(user.hireDate) : now;
      const yearsOfService = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      let score = 0;

      // 入职时间越长，潜力评估基准越高（稳定性加分）
      if (yearsOfService >= 3) score += 3;
      else if (yearsOfService >= 1) score += 2;
      else score += 1;

      // 绩效得分
      if (review?.finalScore) {
        if (review.finalScore >= 90) score += 3;
        else if (review.finalScore >= 75) score += 2;
        else if (review.finalScore >= 60) score += 1;
      }

      // 年龄因素（年轻潜力大）
      if (user.age) {
        if (user.age < 30) score += 2;
        else if (user.age < 40) score += 1;
      }

      // 组织角色
      if (user.orgRoleType === 'dept_manager') score += 2;
      else if (user.orgRoleType === 'team_lead') score += 1;

      // 潜力等级
      if (score >= 8) return 'HIGH';
      if (score >= 5) return 'MEDIUM';
      return 'LOW';
    };

    // 九宫格分类计算
    const calculateCategory = (performanceScore: number, potential: string): string => {
      const perfLevel = performanceScore >= 85 ? 'HIGH' : performanceScore >= 70 ? 'MEDIUM' : 'LOW';

      if (potential === 'HIGH' && perfLevel === 'HIGH') return 'STAR';
      if (potential === 'HIGH' && perfLevel === 'MEDIUM') return 'CORE';
      if (potential === 'HIGH' && perfLevel === 'LOW') return 'DEVELOP';
      if (potential === 'MEDIUM' && perfLevel === 'HIGH') return 'BACKBONE';
      if (potential === 'MEDIUM' && perfLevel === 'MEDIUM') return 'STABLE';
      if (potential === 'MEDIUM' && perfLevel === 'LOW') return 'IMPROVE';
      if (potential === 'LOW' && perfLevel === 'HIGH') return 'EXPERT';
      if (potential === 'LOW' && perfLevel === 'MEDIUM') return 'TRADITIONAL';
      return 'RISK';
    };

    const suggestions: Record<string, string> = {
      STAR: '重点培养，赋予更大挑战性任务，参与领导力发展项目',
      CORE: '持续培养，关注职业发展通道，适时晋升',
      BACKBONE: '保持稳定输出，考虑横向发展机会',
      STABLE: '保持现状，关注能力提升机会',
      EXPERT: '发挥专业优势，可担任内部导师角色',
      DEVELOP: '制定个性化培养计划，加强辅导和培训',
      IMPROVE: '设定明确改进目标，定期跟进评估',
      TRADITIONAL: '保持稳定，关注工作满意度',
      RISK: '制定绩效改进计划（PIP），必要时调整岗位',
    };

    // 构建员工潜力数据
    const employees = users.map(user => {
      const review = reviewMap.get(user.id);
      const performanceScore = review?.finalScore || review?.managerScore;
      const potentialLevel = calculatePotential(user, review);
      const category = calculateCategory(performanceScore, potentialLevel);

      return {
        employeeId: user.id,
        employeeName: user.chineseName || user.nickname || user.username,
        department: user.department,
        position: user.position,
        performanceScore: Math.round(performanceScore * 10) / 10,
        potentialLevel,
        category,
        suggestion: suggestions[category],
      };
    });

    // 统计各分类人数
    const stats: Record<string, number> = {};
    employees.forEach(emp => {
      stats[emp.category] = (stats[emp.category] || 0) + 1;
    });

    return { employees, stats };
  }

  // ==================== 绩效热力图 ====================

  async getPerformanceHeatmap(params: { department?: string; period?: string }): Promise<any> {
    // 获取绩效评估数据
    const queryBuilder = this.reviewRepo.createQueryBuilder('review')
      .orderBy('review.reviewedAt', 'DESC');

    if (params.period) {
      queryBuilder.andWhere('review.period = :period', { period: params.period });
    }

    const reviews = await queryBuilder.getMany();

    // 获取员工信息
    const employeeIds = [...new Set(reviews.map(r => r.employeeId))];
    const employees = await this.userRepo.createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: employeeIds.length ? employeeIds : [0] })
      .getMany();

    const userMap = new Map(employees.map(u => [u.id, u]));

    // 获取指标库
    const indicators = await this.indicatorRepo.find();
    const indicatorMap = new Map(indicators.map(i => [i.id, i]));

    // 构建员工绩效数据
    const employeeData = employees.map(user => {
      const userReviews = reviews.filter(r => r.employeeId === user.id);
      const latestReview = userReviews[0];

      // 从实际评估数据解析各指标得分
      const scores: Record<number, number> = {};
      if (latestReview) {
        const indicatorScores = (latestReview as any).indicatorScores;
        if (indicatorScores && typeof indicatorScores === 'object') {
          for (const ind of indicators) {
            if (indicatorScores[ind.id] !== undefined) {
              scores[ind.id] = Math.round(Number(indicatorScores[ind.id]) * 10) / 10;
            }
          }
        }
      }

      const totalScore = latestReview?.finalScore
        ? Math.round(latestReview.finalScore * 10) / 10
        : undefined;

      return {
        employeeId: user.id,
        employeeName: user.chineseName || user.nickname || user.username,
        department: user.department,
        scores,
        totalScore,
      };
    });

    // 统计计算
    const scores = employeeData.map(e => e.totalScore).filter(s => s !== undefined) as number[];
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const topPerformers = scores.filter(s => s >= 85).length;
    const needsAttention = scores.filter(s => s < 65).length;

    return {
      employees: employeeData,
      indicators: indicators.map(i => ({
        id: i.id,
        name: i.name,
        // 使用默认值，maxScore 和 weight 应该从 HrTemplateIndicator 获取
        maxScore: 100,
        weight: i.weightSuggest || 0,
      })),
      stats: {
        avgScore: Math.round(avgScore * 10) / 10,
        topPerformers,
        needsAttention,
        coverageRate: Math.round((scores.length / Math.max(employees.length, 1)) * 100),
      },
    };
  }
}

// ==================== 离职管理 ====================

@Injectable()
export class HrExitService {
  constructor(
    @InjectRepository(HrEmployeeExit)
    private exitRepo: Repository<HrEmployeeExit>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createExit(data: Partial<HrEmployeeExit>): Promise<HrEmployeeExit> {
    const entity = this.exitRepo.create(data as any);
    return this.exitRepo.save(entity) as any;
  }

  async findAllExits(): Promise<HrEmployeeExit[]> {
    return this.exitRepo.find({ order: { exitDate: 'DESC' } });
  }

  async findExitByEmployee(employeeId: number): Promise<HrEmployeeExit[]> {
    return this.exitRepo.find({ where: { employeeId } });
  }

  async updateExit(id: number, data: Partial<HrEmployeeExit>): Promise<HrEmployeeExit> {
    const exit = await this.exitRepo.findOne({ where: { id } });
    if (!exit) throw new NotFoundException('离职记录不存在');
    Object.assign(exit, data);
    return this.exitRepo.save(exit) as any;
  }

  async getExitStats(params: { year?: number; department?: string }): Promise<any> {
    const exits = await this.findAllExits();
    const totalExits = exits.length;

    // 统计公司在职员工总数
    const totalEmployees = await this.userRepo.count({
      where: { employmentStatus: EmploymentStatus.ACTIVE },
    });

    const byMonth: Record<string, number> = {};
    exits.forEach(e => {
      const month = new Date(e.exitDate).toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    const byReason: Record<string, number> = {};
    exits.forEach(e => {
      const reason = e.exitReason || '其他';
      byReason[reason] = (byReason[reason] || 0) + 1;
    });

    const byType: Record<string, number> = {};
    exits.forEach(e => {
      byType[e.exitType] = (byType[e.exitType] || 0) + 1;
    });

    return { totalExits, totalEmployees, byMonth, byReason, byType };
  }
}

// ==================== 试用期管理 ====================

@Injectable()
export class HrProbationService {
  constructor(
    @InjectRepository(HrProbation)
    private probationRepo: Repository<HrProbation>,
    @InjectRepository(HrProbationEvaluation)
    private evaluationRepo: Repository<HrProbationEvaluation>,
  ) {}

  /**
   * 分页查询试用期记录
   */
  async getProbations(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }): Promise<{ data: HrProbation[]; total: number }> {
    const { page = 1, pageSize = 20, status, keyword } = params;
    const qb = this.probationRepo.createQueryBuilder('p')
      .orderBy('p.createdAt', 'DESC');

    if (status) {
      qb.andWhere('p.status = :status', { status });
    }

    if (keyword) {
      qb.andWhere('(p.employeeId LIKE :kw)', { kw: `%${keyword}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  async createProbation(data: Partial<HrProbation>): Promise<HrProbation> {
    const entity = this.probationRepo.create(data as any);
    return this.probationRepo.save(entity) as any;
  }

  async findProbationByEmployee(employeeId: number): Promise<HrProbation[]> {
    return this.probationRepo.find({ where: { employeeId } });
  }

  async findActiveProbation(employeeId: number): Promise<HrProbation | null> {
    return this.probationRepo.findOne({ where: { employeeId, status: 'ACTIVE' } });
  }

  async updateProbation(id: number, data: Partial<HrProbation>): Promise<HrProbation> {
    const probation = await this.probationRepo.findOne({ where: { id } });
    if (!probation) throw new NotFoundException('试用期记录不存在');
    Object.assign(probation, data);
    return this.probationRepo.save(probation) as any;
  }

  async addEvaluation(probationId: number, evaluatorId: number, data: Partial<HrProbationEvaluation>): Promise<HrProbationEvaluation> {
    const entity = this.evaluationRepo.create({ ...data, probationId, evaluatorId } as any);
    return this.evaluationRepo.save(entity) as any;
  }

  async getEvaluations(probationId: number): Promise<HrProbationEvaluation[]> {
    return this.evaluationRepo.find({ where: { probationId } });
  }

  async updateEvaluation(id: number, data: Partial<HrProbationEvaluation>): Promise<HrProbationEvaluation> {
    const evaluation = await this.evaluationRepo.findOne({ where: { id } });
    if (!evaluation) throw new NotFoundException('评估记录不存在');
    Object.assign(evaluation, data);
    return this.evaluationRepo.save(evaluation) as any;
  }

  async addWarning(probationId: number, warning: { type: string; content: string }): Promise<HrProbation> {
    const probation = await this.probationRepo.findOne({ where: { id: probationId } });
    if (!probation) throw new NotFoundException('试用期记录不存在');
    const warnings = probation.warnings || [];
    warnings.push({ date: new Date().toISOString(), ...warning });
    probation.warnings = warnings;
    return this.probationRepo.save(probation) as any;
  }

  async extendProbation(id: number, newEndDate: Date): Promise<HrProbation> {
    const probation = await this.probationRepo.findOne({ where: { id } });
    if (!probation) throw new NotFoundException('试用期记录不存在');
    probation.originalEndDate = probation.endDate;
    probation.endDate = newEndDate;
    probation.status = 'EXTENDED';
    return this.probationRepo.save(probation) as any;
  }

  async confirmProbation(id: number, passed: boolean): Promise<HrProbation> {
    const probation = await this.probationRepo.findOne({ where: { id } });
    if (!probation) throw new NotFoundException('试用期记录不存在');
    probation.status = passed ? 'PASSED' : 'FAILED';
    return this.probationRepo.save(probation) as any;
  }

  async getProbationStats(): Promise<any> {
    const all = await this.probationRepo.find();
    return {
      total: all.length,
      active: all.filter(p => p.status === 'ACTIVE').length,
      passed: all.filter(p => p.status === 'PASSED').length,
      failed: all.filter(p => p.status === 'FAILED').length,
      extended: all.filter(p => p.status === 'EXTENDED').length,
    };
  }
}

// ==================== 薪酬预算管理 ====================

@Injectable()
export class HrPayrollBudgetService {
  constructor(
    @InjectRepository(HrPayrollBudget)
    private budgetRepo: Repository<HrPayrollBudget>,
    @InjectRepository(HrPayrollAlert)
    private alertRepo: Repository<HrPayrollAlert>,
  ) {}

  async createBudget(data: Partial<HrPayrollBudget>): Promise<HrPayrollBudget> {
    const entity = this.budgetRepo.create(data as any);
    return this.budgetRepo.save(entity) as any;
  }

  async findAllBudgets(): Promise<HrPayrollBudget[]> {
    return this.budgetRepo.find({ order: { year: 'DESC', quarter: 'ASC' } });
  }

  async findBudgetByYearQuarter(year: number, quarter?: number, departmentCode?: string): Promise<HrPayrollBudget | null> {
    const where: any = { year };
    if (quarter) where.quarter = quarter;
    if (departmentCode) where.departmentCode = departmentCode;
    return this.budgetRepo.findOne({ where });
  }

  async updateBudget(id: number, data: Partial<HrPayrollBudget>): Promise<HrPayrollBudget> {
    const budget = await this.budgetRepo.findOne({ where: { id } });
    if (!budget) throw new NotFoundException('预算记录不存在');
    Object.assign(budget, data);
    return this.budgetRepo.save(budget) as any;
  }

  async getCostStats(year: number, quarter?: number): Promise<any> {
    const where: any = { year };
    if (quarter) where.quarter = quarter;
    const budgets = await this.budgetRepo.find({ where });
    const byDept: Record<string, any> = {};
    budgets.forEach(b => {
      const dept = b.departmentCode || 'all';
      if (!byDept[dept]) byDept[dept] = { totalBudget: 0, totalActual: 0 };
      byDept[dept].totalBudget += Number(b.totalBudget);
    });
    return { year, quarter, budgets, byDept };
  }

  async createAlert(data: Partial<HrPayrollAlert>): Promise<HrPayrollAlert> {
    const entity = this.alertRepo.create(data as any);
    return this.alertRepo.save(entity) as any;
  }

  async findAlerts(params: { status?: string; year?: number }): Promise<HrPayrollAlert[]> {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.year) where.year = params.year;
    return this.alertRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async resolveAlert(id: number, resolvedBy: number, resolution: string): Promise<HrPayrollAlert> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('预警记录不存在');
    alert.status = 'RESOLVED';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();
    alert.resolution = resolution;
    return this.alertRepo.save(alert) as any;
  }
}

// ==================== 培训管理 ====================

@Injectable()
export class HrTrainingService {
  constructor(
    @InjectRepository(HrTrainingCourse)
    private courseRepo: Repository<HrTrainingCourse>,
    @InjectRepository(HrTrainingPlan)
    private planRepo: Repository<HrTrainingPlan>,
    @InjectRepository(HrTrainingPlanCourse)
    private planCourseRepo: Repository<HrTrainingPlanCourse>,
    @InjectRepository(HrTrainingRecord)
    private recordRepo: Repository<HrTrainingRecord>,
    @InjectRepository(HrTrainingEvaluation)
    private evaluationRepo: Repository<HrTrainingEvaluation>,
  ) {}

  async createCourse(data: Partial<HrTrainingCourse>): Promise<HrTrainingCourse> {
    const entity = this.courseRepo.create(data as any);
    return this.courseRepo.save(entity) as any;
  }

  async findAllCourses(params?: { category?: string; status?: string }): Promise<HrTrainingCourse[]> {
    const where: any = {};
    if (params?.category) where.category = params.category;
    if (params?.status) where.status = params.status;
    return this.courseRepo.find({ where });
  }

  /** 员工自助：获取当前用户可访问的课程（已发布 + 范围匹配） */
  async findMyAvailableCourses(
    userId: number,
    userDepartment: string | null,
    params?: { category?: string },
  ): Promise<HrTrainingCourse[]> {
    const qb = this.courseRepo.createQueryBuilder('course');
    qb.where('course.status = :status', { status: 'PUBLISHED' });
    if (params?.category) {
      qb.andWhere('course.category = :category', { category: params.category });
    }
    qb.andWhere(
      `(
        course.targetDepartments IS NULL
        OR JSONB_ARRAY_LENGTH(course.targetDepartments::jsonb) = 0
        OR course.targetDepartments::jsonb ? 'ALL'
        OR course.targetDepartments::jsonb ? :dept
      )`,
      { dept: userDepartment },
    );
    const courses = await qb.getMany();

    return courses.filter((c) => {
      if (!c.targetUserIds || c.targetUserIds.length === 0) return true;
      return c.targetUserIds.includes(userId);
    });
  }

  async findCourseById(id: number): Promise<HrTrainingCourse> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('课程不存在');
    return course;
  }

  async updateCourse(id: number, data: Partial<HrTrainingCourse>): Promise<HrTrainingCourse> {
    const course = await this.findCourseById(id);
    Object.assign(course, data);
    return this.courseRepo.save(course) as any;
  }

  async publishCourse(id: number): Promise<HrTrainingCourse> {
    return this.updateCourse(id, { status: 'PUBLISHED' });
  }

  async createPlan(data: Partial<HrTrainingPlan>): Promise<HrTrainingPlan> {
    const entity = this.planRepo.create(data as any);
    return this.planRepo.save(entity) as any;
  }

  async findAllPlans(): Promise<HrTrainingPlan[]> {
    return this.planRepo.find({ order: { periodStart: 'DESC' } });
  }

  async addPlanCourse(planId: number, courseId: number, dueDate?: Date): Promise<HrTrainingPlanCourse> {
    const entity = this.planCourseRepo.create({ planId, courseId, dueDate } as any);
    return this.planCourseRepo.save(entity) as any;
  }

  async getPlanCourses(planId: number): Promise<HrTrainingPlanCourse[]> {
    return this.planCourseRepo.find({ where: { planId }, relations: ['course'] });
  }

  async publishPlan(id: number): Promise<HrTrainingPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('培训计划不存在');
    plan.status = 'PUBLISHED';
    return this.planRepo.save(plan) as any;
  }

  async getOrCreateRecord(employeeId: number, courseId: number, planId?: number): Promise<HrTrainingRecord> {
    const existing = await this.recordRepo.findOne({ where: { employeeId, courseId } });
    if (existing) return existing;

    const newRecord = this.recordRepo.create({ employeeId, courseId, planId, status: 'NOT_STARTED', progress: 0, attempts: 0 } as DeepPartial<HrTrainingRecord>);
    const saved = await this.recordRepo.save(newRecord);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateProgress(employeeId: number, courseId: number, progress: number): Promise<HrTrainingRecord> {
    const record = await this.getOrCreateRecord(employeeId, courseId);
    record.progress = Math.min(100, progress);
    if (record.progress > 0 && record.status === 'NOT_STARTED') {
      record.status = 'IN_PROGRESS';
      record.startedAt = new Date();
    }
    if (record.progress >= 100) {
      record.status = 'COMPLETED';
      record.completedAt = new Date();
    }
    return this.recordRepo.save(record) as any;
  }

  async submitExam(employeeId: number, courseId: number, score: number): Promise<HrTrainingRecord> {
    const record = await this.getOrCreateRecord(employeeId, courseId);
    record.attempts++;
    record.score = score;
    if (score > (record.bestScore || 0)) record.bestScore = score;
    const course = await this.findCourseById(courseId);
    if (score >= course.passingScore) {
      record.status = 'COMPLETED';
      record.progress = 100;
      record.completedAt = new Date();
    } else {
      record.status = 'FAILED';
    }
    return this.recordRepo.save(record) as any;
  }

  async getMyRecords(employeeId: number): Promise<HrTrainingRecord[]> {
    return this.recordRepo.find({ where: { employeeId }, relations: ['course', 'plan'] });
  }

  async createEvaluation(recordId: number, evaluatorId: number, data: Partial<HrTrainingEvaluation>): Promise<HrTrainingEvaluation> {
    const entity = this.evaluationRepo.create({ ...data, recordId, evaluatorId } as any);
    return this.evaluationRepo.save(entity) as any;
  }

  async getTrainingStats(planId?: number): Promise<any> {
    const where: any = {};
    if (planId) where.planId = planId;
    const records = await this.recordRepo.find({ where });
    const total = records.length;
    const completed = records.filter(r => r.status === 'COMPLETED').length;
    const avgProgress = total > 0 ? records.reduce((sum, r) => sum + r.progress, 0) / total : 0;
    const scoredRecords = records.filter(r => r.score !== null && r.score !== undefined);
    const avgScore = scoredRecords.length > 0
      ? scoredRecords.reduce((sum, r) => sum + (r.score || 0), 0) / scoredRecords.length
      : 0;
    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round(completed / total * 100) : 0,
      avgProgress: Math.round(avgProgress),
      avgScore: Math.round(avgScore * 10) / 10,
    };
  }

  async getTrainingRoi(): Promise<any> {
    const courses = await this.courseRepo.find({ where: { status: 'PUBLISHED' } });
    const records = await this.recordRepo.find({ relations: ['course'] });
    const totalCost = courses.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
    const totalLearners = new Set(records.map(r => r.employeeId)).size;
    const completedCount = records.filter(r => r.status === 'COMPLETED').length;
    return {
      totalCost,
      totalCourses: courses.length,
      totalLearners,
      completedCount,
      costPerLearner: totalLearners > 0 ? Math.round(totalCost / totalLearners) : 0,
      roi: totalCost > 0 && completedCount > 0 ? Math.round(completedCount / totalCost * 1000) / 10 : 0,
    };
  }
}
