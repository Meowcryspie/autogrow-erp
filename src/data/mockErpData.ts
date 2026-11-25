import type {
  BusinessEntity,
  ErpSalesOrder,
  InventoryItem,
  ErpPurchaseOrder,
  ErpInvoice
} from '../types/erp';

export const BUSINESS_ENTITIES: BusinessEntity[] = [
  {
    id: 'ALL',
    name: 'Autogrow Global Consolidated',
    region: 'NZ Manufacturing + MY Distribution',
    currency: 'USD',
    warehouseCode: 'ALL-WH'
  },
  {
    id: 'NZ-HQ',
    name: 'Autogrow New Zealand HQ',
    region: 'Albany, Auckland · Manufacturing & Assembly',
    currency: 'USD',
    warehouseCode: 'AKL-HUB-01'
  },
  {
    id: 'MY-OPS',
    name: 'Autogrow Asia-Pacific Fulfillment',
    region: 'Kuala Lumpur & Cameron Highlands Hub',
    currency: 'USD',
    warehouseCode: 'KUL-HUB-02'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    sku: 'MGC-Pro',
    name: 'MultiGrow Commercial Master Controller (16-Ch)',
    category: 'Controllers',
    entityId: 'NZ-HQ',
    warehouseBin: 'AKL-A01-R2',
    onHand: 18,
    reserved: 4,
    reorderPoint: 10,
    unitCost: 1480,
    unitRetail: 2950,
    supplierName: 'Auckland PCB Assembly Ltd'
  },
  {
    sku: 'SGF-100',
    name: 'SatuGrow FertiX Inline Dosing Skid (10-100 m³/hr)',
    category: 'Dosing Skids',
    entityId: 'NZ-HQ',
    warehouseBin: 'AKL-H04-BAY1',
    onHand: 4,
    reserved: 1,
    reorderPoint: 3,
    unitCost: 4250,
    unitRetail: 7850,
    supplierName: 'Waitemata Stainless Fab'
  },
  {
    sku: 'IDC-4',
    name: 'IntelliDose 8-Channel Automated Dosing System',
    category: 'Controllers',
    entityId: 'MY-OPS',
    warehouseBin: 'KUL-B02-R1',
    onHand: 22,
    reserved: 6,
    reorderPoint: 12,
    unitCost: 790,
    unitRetail: 1650,
    supplierName: 'Auckland PCB Assembly Ltd'
  },
  {
    sku: 'ICC-2',
    name: 'IntelliClimate CEA Environmental Controller',
    category: 'Controllers',
    entityId: 'NZ-HQ',
    warehouseBin: 'AKL-A02-R4',
    onHand: 14,
    reserved: 2,
    reorderPoint: 8,
    unitCost: 720,
    unitRetail: 1490,
    supplierName: 'Auckland PCB Assembly Ltd'
  },
  {
    sku: 'EPS-CANOPY-POD',
    name: 'EnviroSensor Pro Fan-Aspirated Canopy Pod',
    category: 'Sensory Pods',
    entityId: 'MY-OPS',
    warehouseBin: 'KUL-C01-R3',
    onHand: 9,
    reserved: 5,
    reorderPoint: 12,
    unitCost: 295,
    unitRetail: 650,
    supplierName: 'Sensortechnik GmbH'
  },
  {
    sku: 'WCS-PROBE-316L',
    name: 'WCS-Pro Multi-Depth Substrate Moisture/EC Probe',
    category: 'Sensory Pods',
    entityId: 'MY-OPS',
    warehouseBin: 'KUL-C02-R1',
    onHand: 31,
    reserved: 8,
    reorderPoint: 15,
    unitCost: 195,
    unitRetail: 420,
    supplierName: 'Sensortechnik GmbH'
  },
  {
    sku: 'EC-SENSE-PLUS',
    name: 'EC Sense Plus Toroidal Conductivity Sensor',
    category: 'Probes & Spares',
    entityId: 'NZ-HQ',
    warehouseBin: 'AKL-P01-BIN3',
    onHand: 7,
    reserved: 3,
    reorderPoint: 14,
    unitCost: 140,
    unitRetail: 340,
    supplierName: 'Sensortechnik GmbH'
  },
  {
    sku: 'PH-SENSE-PLUS',
    name: 'pH Sense Plus Industrial Glass Body Probe',
    category: 'Probes & Spares',
    entityId: 'MY-OPS',
    warehouseBin: 'KUL-P01-BIN4',
    onHand: 19,
    reserved: 4,
    reorderPoint: 15,
    unitCost: 118,
    unitRetail: 285,
    supplierName: 'Sensortechnik GmbH'
  },
  {
    sku: 'PUMP-HEAD-8X',
    name: 'IntelliDose Peristaltic Pump Head Replacement Kit',
    category: 'Probes & Spares',
    entityId: 'MY-OPS',
    warehouseBin: 'KUL-P03-BIN2',
    onHand: 42,
    reserved: 4,
    reorderPoint: 20,
    unitCost: 82,
    unitRetail: 195,
    supplierName: 'Watson-Marlow Fluid Tech'
  },
  {
    sku: 'CAL-TWIN-500',
    name: 'pH 4.01 & 7.00 Twin Calibration Fluids (500ml)',
    category: 'Probes & Spares',
    entityId: 'MY-OPS',
    warehouseBin: 'KUL-CHM-01',
    onHand: 85,
    reserved: 10,
    reorderPoint: 30,
    unitCost: 14,
    unitRetail: 45,
    supplierName: 'Pacific Lab Reagents'
  }
];

export const INITIAL_ORDERS: ErpSalesOrder[] = [
  {
    id: 'ord-1048',
    orderNumber: 'AG-WEB-2026-1048',
    entityId: 'MY-OPS',
    source: 'Web Store',
    customerName: 'Amirul Hakim',
    companyName: 'Highlands Commercial Glasshouses Sdn Bhd',
    customerEmail: 'ops@highlandsglasshouse.my',
    shippingAddress: 'Lot 48 Tanah Rata Ridge, Cameron Highlands, 39000 Pahang',
    voltageSpec: '240VAC 50Hz',
    status: 'PENDING',
    createdAt: '2026-11-25',
    expectedShipDate: '2026-11-27',
    lines: [
      { sku: 'IDC-4', name: 'IntelliDose 8-Channel Automated Dosing System', qty: 2, unitPrice: 1650 },
      { sku: 'EPS-CANOPY-POD', name: 'EnviroSensor Pro Fan-Aspirated Canopy Pod', qty: 4, unitPrice: 650 },
      { sku: 'CAL-TWIN-500', name: 'pH 4.01 & 7.00 Twin Calibration Fluids (500ml)', qty: 6, unitPrice: 45 }
    ],
    totalAmount: 6170,
    notes: 'Incoming web checkout order queued for Cameron Highlands Bay 03 expansion.'
  },
  {
    id: 'ord-1047',
    orderNumber: 'AG-B2B-2026-1047',
    entityId: 'NZ-HQ',
    source: 'Commercial Quote',
    customerName: 'Callum McKenzie',
    companyName: 'Waikato Vine & Berry Growers Ltd',
    customerEmail: 'procurement@waikatogrowers.co.nz',
    shippingAddress: '112 Hydroponic Way, Hamilton 3204, New Zealand',
    voltageSpec: '240VAC 50Hz',
    status: 'ALLOCATED',
    createdAt: '2026-11-23',
    expectedShipDate: '2026-11-26',
    lines: [
      { sku: 'MGC-Pro', name: 'MultiGrow Commercial Master Controller (16-Ch)', qty: 2, unitPrice: 2950 },
      { sku: 'SGF-100', name: 'SatuGrow FertiX Inline Dosing Skid (10-100 m³/hr)', qty: 1, unitPrice: 7850 },
      { sku: 'EC-SENSE-PLUS', name: 'EC Sense Plus Toroidal Conductivity Sensor', qty: 3, unitPrice: 340 }
    ],
    totalAmount: 14770,
    notes: 'Stock reserved at AKL-HUB-01; factory bench test passed.'
  },
  {
    id: 'ord-1046',
    orderNumber: 'AG-WEB-2026-1046',
    entityId: 'MY-OPS',
    source: 'Web Store',
    customerName: 'Nurul Ain Razak',
    companyName: 'Kundasang Alpine Nursery',
    customerEmail: 'nursery@kinabalugreens.my',
    shippingAddress: 'KM 8 Jalan Kundasang-Ranau, 89308 Sabah',
    voltageSpec: '240VAC 50Hz',
    status: 'DISPATCHED',
    createdAt: '2026-11-20',
    expectedShipDate: '2026-11-22',
    lines: [
      { sku: 'WCS-PROBE-316L', name: 'WCS-Pro Multi-Depth Substrate Moisture/EC Probe', qty: 6, unitPrice: 420 },
      { sku: 'PH-SENSE-PLUS', name: 'pH Sense Plus Industrial Glass Body Probe', qty: 4, unitPrice: 285 }
    ],
    totalAmount: 3660,
    notes: 'DHL Air Express tracking #MY-88492011.'
  },
  {
    id: 'ord-1045',
    orderNumber: 'AG-DST-2026-1045',
    entityId: 'NZ-HQ',
    source: 'Distributor PO',
    customerName: 'Elena Vance',
    companyName: 'Pacific Hydroponic Supply Co.',
    customerEmail: 'orders@pacifichydro.com',
    shippingAddress: '450 Harbor Blvd, Tauranga 3110, New Zealand',
    voltageSpec: '110VAC 60Hz',
    status: 'COMPLETED',
    createdAt: '2026-11-12',
    expectedShipDate: '2026-11-15',
    lines: [
      { sku: 'ICC-2', name: 'IntelliClimate CEA Environmental Controller', qty: 4, unitPrice: 1490 },
      { sku: 'PUMP-HEAD-8X', name: 'IntelliDose Peristaltic Pump Head Replacement Kit', qty: 10, unitPrice: 195 }
    ],
    totalAmount: 7910,
    notes: 'Quarterly distributor restock completed and settled.'
  }
];

export const INITIAL_PURCHASE_ORDERS: ErpPurchaseOrder[] = [
  {
    id: 'po-409',
    poNumber: 'PO-2026-0409',
    entityId: 'NZ-HQ',
    supplierName: 'Sensortechnik GmbH',
    status: 'IN_TRANSIT',
    createdAt: '2026-11-16',
    expectedEta: '2026-11-28',
    lines: [
      { sku: 'EC-SENSE-PLUS', name: 'EC Sense Plus Toroidal Conductivity Sensor', qty: 25, unitCost: 140 },
      { sku: 'EPS-CANOPY-POD', name: 'EnviroSensor Pro Fan-Aspirated Canopy Pod', qty: 20, unitCost: 295 }
    ],
    totalCost: 9400
  },
  {
    id: 'po-408',
    poNumber: 'PO-2026-0408',
    entityId: 'NZ-HQ',
    supplierName: 'Auckland PCB Assembly Ltd',
    status: 'ORDERED',
    createdAt: '2026-11-18',
    expectedEta: '2026-12-03',
    lines: [
      { sku: 'MGC-Pro', name: 'MultiGrow Commercial Master Controller (16-Ch)', qty: 15, unitCost: 1480 }
    ],
    totalCost: 22200
  },
  {
    id: 'po-407',
    poNumber: 'PO-2026-0407',
    entityId: 'MY-OPS',
    supplierName: 'Watson-Marlow Fluid Tech',
    status: 'RECEIVED',
    createdAt: '2026-11-05',
    expectedEta: '2026-11-14',
    lines: [
      { sku: 'PUMP-HEAD-8X', name: 'IntelliDose Peristaltic Pump Head Replacement Kit', qty: 30, unitCost: 82 }
    ],
    totalCost: 2460
  }
];

export const INITIAL_INVOICES: ErpInvoice[] = [
  {
    id: 'inv-901',
    invoiceNumber: 'INV-2026-0901',
    orderNumber: 'AG-DST-2026-1045',
    entityId: 'NZ-HQ',
    customerCompany: 'Pacific Hydroponic Supply Co.',
    issuedDate: '2026-11-15',
    dueDate: '2026-11-30',
    amount: 7910,
    status: 'PAID'
  },
  {
    id: 'inv-902',
    invoiceNumber: 'INV-2026-0902',
    orderNumber: 'AG-WEB-2026-1046',
    entityId: 'MY-OPS',
    customerCompany: 'Kundasang Alpine Nursery',
    issuedDate: '2026-11-22',
    dueDate: '2026-12-06',
    amount: 3660,
    status: 'UNPAID'
  },
  {
    id: 'inv-899',
    invoiceNumber: 'INV-2026-0899',
    orderNumber: 'AG-B2B-2026-1039',
    entityId: 'NZ-HQ',
    customerCompany: 'Southern Cross Glasshouses Ltd',
    issuedDate: '2026-10-20',
    dueDate: '2026-11-19',
    amount: 11420,
    status: 'OVERDUE'
  }
];

export const MONTHLY_CASHFLOW_SERIES = [
  { month: 'Jun', revenue: 42800, cogs: 21900, orders: 14 },
  { month: 'Jul', revenue: 49200, cogs: 24600, orders: 17 },
  { month: 'Aug', revenue: 53400, cogs: 27100, orders: 19 },
  { month: 'Sep', revenue: 61900, cogs: 30200, orders: 22 },
  { month: 'Oct', revenue: 58300, cogs: 28900, orders: 20 },
  { month: 'Nov', revenue: 68450, cogs: 33400, orders: 25 }
];
