import {
  Controller, // 控制器装饰器
  Get, // GET 路由装饰器
  Post, // POST 路由装饰器
  Put, // PUT 路由装饰器
  Delete, // DELETE 路由装饰器
  Body, // 读取请求体装饰器
  Param, // 读取路由参数装饰器
  Req, // 读取请求对象装饰器
  ParseIntPipe, // 整型转换管道
  UnauthorizedException, // 未授权异常
} from '@nestjs/common'; // 从 @nestjs/common 导入依赖
import { JwtService } from '@nestjs/jwt'; // 导入 JwtService 用于解析 token
import { UsersService } from '../users/users.service'; // 导入用户服务，用于根据 token 找用户
import { MemosService } from './memos.service'; // 导入备忘录服务
import { CreateMemoDto } from './dto/create-memo.dto'; // 导入创建 DTO

@Controller('memos') // 声明控制器的基础路由为 /memos
export class MemosController { // 导出 MemosController 控制器类
  constructor(
    private readonly memosService: MemosService, // 注入备忘录服务
    private readonly usersService: UsersService, // 注入用户服务
    private readonly jwtService: JwtService, // 注入 JWT 服务
  ) {}

  /**
   * 从请求头中解析当前登录用户
   */
  private async getUserFromRequest(req: any) { // 私有方法：从请求中获取用户
    const token = req.headers.authorization?.replace('Bearer ', ''); // 从 Authorization 头里取出 token
    if (!token) { // 如果没有 token
      return null; // 返回 null
    } // 结束判断
    try { // 捕获解析异常
      const payload = this.jwtService.verify(token); // 验证并解析 JWT
      return await this.usersService.findById(payload.sub); // 通过 payload.sub 查找用户
    } catch { // 如果解析失败
      return null; // 返回 null
    } // 结束 catch
  }

  /**
   * 获取当前用户的所有备忘录
   */
  @Get() // GET /memos
  async getMyMemos(@Req() req: any) { // 控制器方法：获取当前用户备忘录
    const user = await this.getUserFromRequest(req); // 解析当前用户
    if (!user) { // 如果未登录
      throw new UnauthorizedException('未登录'); // 抛出未授权异常
    } // 结束判断
    return this.memosService.findAllByUser(user.id); // 调用服务按用户 ID 查询
  }

  /**
   * 创建备忘录
   */
  @Post() // POST /memos
  async create(@Body() dto: CreateMemoDto, @Req() req: any) { // 控制器方法：创建备忘录
    const user = await this.getUserFromRequest(req); // 获取当前用户
    if (!user) { // 未登录
      throw new UnauthorizedException('未登录'); // 抛出异常
    } // 结束判断
    return this.memosService.create(user.id, dto); // 调用服务创建记录
  }

  /**
   * 更新备忘录
   */
  @Put(':id') // PUT /memos/:id
  async update(
    @Param('id', ParseIntPipe) id: number, // 路由参数 ID，转换为 number
    @Body() dto: CreateMemoDto, // 请求体验证 DTO
    @Req() req: any, // 请求对象
  ) {
    const user = await this.getUserFromRequest(req); // 获取当前用户
    if (!user) { // 未登录
      throw new UnauthorizedException('未登录'); // 抛出异常
    } // 结束判断
    return this.memosService.update(user.id, id, dto); // 调用服务更新记录
  }

  /**
   * 删除备忘录
   */
  @Delete(':id') // DELETE /memos/:id
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) { // 控制器方法：删除备忘录
    const user = await this.getUserFromRequest(req); // 获取当前用户
    if (!user) { // 未登录
      throw new UnauthorizedException('未登录'); // 抛出异常
    } // 结束判断
    await this.memosService.remove(user.id, id); // 调用服务删除记录
    return { success: true }; // 返回统一结构
  }
}


