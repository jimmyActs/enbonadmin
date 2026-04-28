import { Controller, Post, Body, Param, Headers } from '@nestjs/common';
import type { WebhookInquiryPayload } from './webhook.service';
import { WebhookService } from './webhook.service';
import { Public } from '../../common/decorators/permissions.decorator';

@Controller('public/crm/inquiry')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * 通过 sourceToken 接收询盘（简单模式，无需签名）
   * 外部渠道直接 POST /public/crm/inquiry/{sourceToken}
   * 示例：官网表单 -> POST /public/crm/inquiry/xxx-uuid-xxx
   */
  @Public()
  @Post(':sourceToken')
  async handleByToken(
    @Param('sourceToken') sourceToken: string,
    @Body() payload: WebhookInquiryPayload,
  ) {
    const source = await this.webhookService.findSourceByToken(sourceToken);
    if (!source) {
      return { success: false, message: 'Invalid or inactive source token' };
    }

    const lead = await this.webhookService.createLeadFromWebhook(source, payload);
    return {
      success: true,
      message: 'Inquiry received',
      leadId: lead.id,
      leadCode: lead.leadCode,
      assigned: !!lead.assignedTo,
    };
  }

  /**
   * 通过 sourceId + HMAC-SHA256 签名接收询盘（安全模式）
   * Headers: X-Webhook-Signature: sha256={hmac_hex}
   */
  @Public()
  @Post('webhook/:sourceId')
  async handleById(
    @Param('sourceId') sourceId: string,
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: WebhookInquiryPayload,
  ) {
    const id = parseInt(sourceId);
    if (isNaN(id)) {
      return { success: false, message: 'Invalid source ID' };
    }

    const source = await this.webhookService.findSourceById(id);
    if (!source) {
      return { success: false, message: 'Invalid or inactive source' };
    }

    // 签名验证（webhookSecret 非空时才验证）
    if (source.webhookSecret) {
      // 用 JSON 字符串做签名验证（与发送端保持一致）
      const payloadStr = JSON.stringify(payload);
      const isValid = this.webhookService.verifySignature(payloadStr, signature, source.webhookSecret);
      if (!isValid) {
        return { success: false, message: 'Invalid signature' };
      }
    }

    const lead = await this.webhookService.createLeadFromWebhook(source, payload);
    return {
      success: true,
      message: 'Inquiry received',
      leadId: lead.id,
      leadCode: lead.leadCode,
      assigned: !!lead.assignedTo,
    };
  }
}
