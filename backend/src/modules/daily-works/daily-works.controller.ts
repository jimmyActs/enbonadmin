import {
  Controller, // 控制器装饰器
  Get, // GET 路由装饰器
  Post, // POST 路由装饰器
  Put, // PUT 路由装饰器
  Delete, // DELETE 路由装饰器
  Body, // 读取请求体装饰器
  Param, // 读取路由参数装饰器
  Req, // 读取请求对象装饰器
  Query, // 读取查询参数装饰器
  ParseIntPipe, // 整型转换管道
  UnauthorizedException, // 未授权异常
} from '@nestjs/common'; // 从 @nestjs/common 导入依赖
import { JwtService } from '@nestjs/jwt'; // 导入 JwtService 用于解析 token
import { UsersService } from '../users/users.service'; // 导入用户服务
import { DailyWorksService } from './daily-works.service'; // 导入每日工作服务
import { CreateDailyWorkDto } from './dto/create-daily-work.dto'; // 导入 DTO

@Controller('daily-works') // 声明控制器基础路由为 /daily-works
export class DailyWorksController { // 导出 DailyWorksController 控制器类
  constructor(
    private readonly dailyWorksService: DailyWorksService, // 注入每日工作服务
    private readonly usersService: UsersService, // 注入用户服务
    private readonly jwtService: JwtService, // 注入 JWT 服务
  ) {} // 结束构造函数

  /**
   * 从请求头中解析当前登录用户
   */
  private async getUserFromRequest(req: any) { // 私有方法：从请求中解析当前用户
    const token = req.headers.authorization?.replace('Bearer ', ''); // 从 Authorization 头中取出 token
    if (!token) { // 如果没有 token
      return null; // 返回 null
    } // 结束判断
    try { // 捕获解析异常
      const payload = this.jwtService.verify(token); // 验证并解析 JWT
      return await this.usersService.findById(payload.sub); // 通过 payload.sub 查找用户
    } catch { // 解析失败
      return null; // 返回 null
    } // 结束 catch
  } // 结束 getUserFromRequest

  /**
   * 获取某一天的每日工作列表（按当前登录用户）
   */
  @Get() // GET /daily-works
  async getMyDailyWorks(@Req() req: any, @Query('date') date?: string) { // 控制器方法：获取当前用户每日工作
    const user = await this.getUserFromRequest(req); // 解析当前用户
    if (!user) { // 如果未登录
      throw new UnauthorizedException('未登录'); // 抛出未授权异常
    } // 结束判断

    const targetDate = date || new Date().toISOString().split('T')[0]; // 若未传日期则默认使用今天
    const list = await this.dailyWorksService.findByUserAndDate(user.id, targetDate); // 调用服务按用户 + 日期查询
    return list.map(item => ({ // 将实体映射为返回对象
      ...item, // 展开原有字段
      incompleteItems: item.incompleteItems // 解析未完成事项 JSON
        ? (JSON.parse(item.incompleteItems) as string[]) // 有值则解析为数组
        : [], // 否则返回空数组
    })); // 结束 map
  } // 结束 getMyDailyWorks

  /**
   * 创建每日工作
   */
  @Post() // POST /daily-works
  async create(@Body() dto: CreateDailyWorkDto, @Req() req: any) { // 控制器方法：创建每日工作
    const user = await this.getUserFromRequest(req); // 获取当前用户
    if (!user) { // 未登录
      throw new UnauthorizedException('未登录'); // 抛出异常
    } // 结束判断
    return this.dailyWorksService.create(user.id, dto); // 调用服务创建记录
  } // 结束 create

  /**
   * 更新每日工作
   */
  @Put(':id') // PUT /daily-works/:id
  async update(
    @Param('id', ParseIntPipe) id: number, // 路由参数 ID，转换为 number
    @Body() dto: CreateDailyWorkDto, // 请求体验证 DTO
    @Req() req: any, // 请求对象
  ) {
    const user = await this.getUserFromRequest(req); // 获取当前用户
    if (!user) { // 未登录
      throw new UnauthorizedException('未登录'); // 抛出异常
    } // 结束判断
    return this.dailyWorksService.update(user.id, id, dto); // 调用服务更新记录
  } // 结束 update

  /**
   * 删除每日工作
   */
  @Delete(':id') // DELETE /daily-works/:id
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) { // 控制器方法：删除每日工作
    const user = await this.getUserFromRequest(req); // 获取当前用户
    if (!user) { // 未登录
      throw new UnauthorizedException('未登录'); // 抛出异常
    } // 结束判断
    await this.dailyWorksService.remove(user.id, id); // 调用服务删除记录
    return { success: true }; // 返回统一结构
  } // 结束 remove
} // 结束控制器定义



