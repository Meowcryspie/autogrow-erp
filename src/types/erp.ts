export type ErpNavTab = 'overview' | 'orders' | 'inventory' | 'procurement' | 'finance' | 'customers';

export type BusinessEntityId = 'ALL' | 'NZ-HQ' | 'MY-OPS';

export interface BusinessEntity {
  id: BusinessEntityId;
  name: string;
  region: string;
  currency: 'USD' | 'NZD' | 'MYR';
  warehouseCode: string;
}

export type OrderSource = 'Web Store' | 'Commercial Quote' | 'Distributor PO';
export type ErpOrderStatus = 'PENDING' | 'ALLOCATED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface ErpOrderLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ErpSalesOrder {
  id: string;
  orderNumber: string;
  entityId: Exclude<BusinessEntityId, 'ALL'>;
  source: OrderSource;
  customerName: string;
  companyName: string;
  customerEmail: string;
  shippingAddress: string;
  voltageSpec: '240VAC 50Hz' | '110VAC 60Hz' | '24VAC / Low Voltage';
  status: ErpOrderStatus;
  createdAt: string;
  expectedShipDate: string;
  carrier?: string;
  trackingNumber?: string;
  lines: ErpOrderLine[];
  totalAmount: number;
  notes?: string;
}

export type InventoryCategory = 'Controllers' | 'Dosing Skids' | 'Sensory Pods' | 'Probes & Spares';

export interface InventoryItem {
  sku: string;
  name: string;
  category: InventoryCategory;
  entityId: Exclude<BusinessEntityId, 'ALL'>;
  warehouseBin: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  unitCost: number;
  unitRetail: number;
  supplierName: string;
}

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'IN_TRANSIT' | 'RECEIVED';

export interface PurchaseOrderLine {
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
}

export interface ErpPurchaseOrder {
  id: string;
  poNumber: string;
  entityId: Exclude<BusinessEntityId, 'ALL'>;
  supplierName: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  expectedEta: string;
  lines: PurchaseOrderLine[];
  totalCost: number;
}

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE';

export interface ErpInvoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  entityId: Exclude<BusinessEntityId, 'ALL'>;
  customerCompany: string;
  customerEmail?: string;
  billingAddress?: string;
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: 'Bank Wire' | 'Credit Card' | 'Commercial Net-14';
  lines?: ErpOrderLine[];
  amount: number;
  status: InvoiceStatus;
}

export interface ErpCustomer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  region: string;
  shippingAddress: string;
  preferredEntity: Exclude<BusinessEntityId, 'ALL'>;
  voltageSpec: ErpSalesOrder['voltageSpec'];
  accountTier: 'Commercial Grower' | 'Enterprise Multi-Site' | 'Authorized Distributor';
}

export interface ErpActivityEvent {
  id: string;
  timestamp: string;
  category: 'order' | 'inventory' | 'procurement' | 'finance';
  message: string;
}
