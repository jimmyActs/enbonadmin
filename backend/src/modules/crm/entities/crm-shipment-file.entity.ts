import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 出货文件类型
 */
export enum ShipmentFileType {
  INVOICE = 'invoice',         // 发票/商业发票
  PACKING_LIST = 'packing_list', // 装箱单
  BILL_OF_LADING = 'bill_of_lading', // 提单
  COO = 'coo',                 // 原产地证
  BL = 'bl',                   // B/L 海运单
  QUANTITY_LIST = 'quantity_list', // 数量清单
  MANUAL = 'manual',           // 说明书/用户手册
  FIRMWARE = 'firmware',        // 固件/升级包
  SOFTWARE = 'software',       // 软件/调试工具
  PHOTO = 'photo',             // 出货照片
  VIDEO = 'video',             // 视频
  OTHER = 'other',             // 其他
}

/**
 * 出货文件实体
 * 用于关联每批出货的文档资料，支持通过二维码扫码下载
 */
@Entity('crm_shipment_files')
export class CrmShipmentFile {
  @PrimaryGeneratedColumn()
  id: number;

  // ========== 出货批次信息 ==========
  @Column()
  shipmentCode: string; // 出货批次号（如 SH-20260330-001）

  @Column({ nullable: true })
  shipmentBatch: string; // 出货批次名称（如 "2026年3月第二批"）

  @Column({ type: 'datetime', nullable: true })
  shipmentDate: Date; // 出货日期

  @Column({ nullable: true })
  destinationCountry: string; // 目的地国家

  @Column({ nullable: true })
  destinationPort: string; // 到港/目的港

  // ========== 客户关联 ==========
  @Column({ type: 'integer', nullable: true })
  customerId: number; // 关联客户ID

  @Column({ nullable: true })
  customerName: string; // 客户名称（冗余存储）

  // ========== 文件信息 ==========
  @Column({
    type: 'simple-enum',
    enum: ShipmentFileType,
    default: ShipmentFileType.OTHER,
  })
  fileType: ShipmentFileType;

  @Column()
  fileName: string; // 文件显示名称

  @Column({ nullable: true })
  originalFileName: string; // 原始文件名

  @Column()
  filePath: string; // 文件存储路径（相对路径或绝对路径）

  @Column({ nullable: true })
  fileUrl: string; // 文件访问URL

  @Column({ nullable: true })
  fileSize: number; // 文件大小（字节）

  @Column({ nullable: true })
  mimeType: string; // 文件 MIME 类型

  @Column({ nullable: true })
  version: string; // 版本号（如 "v1.2"）

  @Column({ nullable: true })
  description: string; // 文件说明

  // ========== 二维码 ==========
  @Column({ nullable: true })
  qrCode: string; // 二维码图片路径/URL

  @Column({ nullable: true })
  qrCodeToken: string; // 二维码访问 Token（一次性或有时效的访问令牌）

  // ========== 上传信息 ==========
  @Column({ type: 'integer', nullable: true })
  uploadedBy: number; // 上传人ID

  @Column({ nullable: true })
  uploadedByName: string; // 上传人姓名

  // ========== 产品信息 ==========
  @Column({ nullable: true })
  productModel: string; // 产品型号

  @Column({ nullable: true })
  productName: string; // 产品名称

  @Column({ nullable: true })
  quantity: number; // 出货数量

  // ========== 物流信息 ==========
  @Column({ nullable: true })
  trackingNumber: string; // 运单号

  @Column({ nullable: true })
  shippingMethod: string; // 运输方式（海运/空运/快递）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
