import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  FileText,
  Users,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  RotateCcw,
  X
} from 'lucide-react';
import type {
  ErpNavTab,
  BusinessEntityId,
  ErpSalesOrder,
  ErpOrderStatus,
  InventoryItem,
  ErpPurchaseOrder,
  ErpInvoice,
  ErpCustomer,
  ErpActivityEvent
} from '../types/erp';
import {
  BUSINESS_ENTITIES,
  INITIAL_ORDERS,
  INITIAL_INVENTORY,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_INVOICES,
  INITIAL_CUSTOMERS,
  INITIAL_ACTIVITIES
} from '../data/mockErpData';
import { OverviewTab } from './OverviewTab';
import { OrdersTab } from './OrdersTab';
import { InventoryTab } from './InventoryTab';
import { ProcurementTab } from './ProcurementTab';
import { FinanceTab } from './FinanceTab';
import { CustomersTab } from './CustomersTab';

const STORAGE_KEY = 'autogrow_erp_ledger_v2';

interface PersistedLedger {
  orders: ErpSalesOrder[];
  inventory: InventoryItem[];
  purchaseOrders: ErpPurchaseOrder[];
  invoices: ErpInvoice[];
  activities: ErpActivityEvent[];
}

function loadLedger(): PersistedLedger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.orders) && Array.isArray(parsed.inventory)) {
        return {
          orders: parsed.orders,
          inventory: parsed.inventory,
          purchaseOrders: parsed.purchaseOrders || INITIAL_PURCHASE_ORDERS,
          invoices: parsed.invoices || INITIAL_INVOICES,
          activities: parsed.activities || INITIAL_ACTIVITIES
        };
      }
    }
  } catch {
    // ignore storage parse failure
  }
  return {
    orders: INITIAL_ORDERS,
    inventory: INITIAL_INVENTORY,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
    invoices: INITIAL_INVOICES,
    activities: INITIAL_ACTIVITIES
  };
}

export const ErpControlCenter: React.FC = () => {
  const [navTab, setNavTab] = useState<ErpNavTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [entityId, setEntityId] = useState<BusinessEntityId>('ALL');
  const [isEntityMenuOpen, setIsEntityMenuOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const initial = loadLedger();
  const [orders, setOrders] = useState<ErpSalesOrder[]>(initial.orders);
  const [inventory, setInventory] = useState<InventoryItem[]>(initial.inventory);
  const [purchaseOrders, setPurchaseOrders] = useState<ErpPurchaseOrder[]>(initial.purchaseOrders);
  const [invoices, setInvoices] = useState<ErpInvoice[]>(initial.invoices);
  const [activities, setActivities] = useState<ErpActivityEvent[]>(initial.activities);

  const [selectedOrder, setSelectedOrder] = useState<ErpSalesOrder | null>(null);
  const [prefilledCustomer, setPrefilledCustomer] = useState<ErpCustomer | null>(null);
  const [focusedInvoiceOrderNum, setFocusedInvoiceOrderNum] = useState<string | null>(null);

  const entityDropdownRef = useRef<HTMLDivElement | null>(null);
  const alertsDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ orders, inventory, purchaseOrders, invoices, activities })
      );
    } catch {
      // ignore quota
    }
  }, [orders, inventory, purchaseOrders, invoices, activities]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setIsEntityMenuOpen(false);
      }
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const logActivity = (category: ErpActivityEvent['category'], message: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setActivities((prev) => [
      { id: `act-${Date.now()}`, timestamp: `Just now · ${hh}:${mm}`, category, message },
      ...prev
    ]);
  };

  const currentEntity = BUSINESS_ENTITIES.find((e) => e.id === entityId) || BUSINESS_ENTITIES[0];

  const q = searchQuery.trim().toLowerCase();
  const scopedOrders = orders.filter(
    (o) =>
      (entityId === 'ALL' || o.entityId === entityId) &&
      (!q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q))
  );
  const scopedInventory = inventory.filter(
    (i) =>
      (entityId === 'ALL' || i.entityId === entityId) &&
      (!q || i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
  );
  const scopedPos = purchaseOrders.filter(
    (po) =>
      (entityId === 'ALL' || po.entityId === entityId) &&
      (!q || po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q))
  );
  const scopedInvoices = invoices.filter(
    (inv) =>
      (entityId === 'ALL' || inv.entityId === entityId) &&
      (!q || inv.invoiceNumber.toLowerCase().includes(q) || inv.customerCompany.toLowerCase().includes(q))
  );
  const scopedCustomers = INITIAL_CUSTOMERS.filter(
    (c) =>
      (entityId === 'ALL' || c.preferredEntity === entityId) &&
      (!q || c.companyName.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q) || c.region.toLowerCase().includes(q))
  );

  // Actionable Alert Items for Bell Notification Center
  const alertItems = [
    ...scopedOrders
      .filter((o) => o.status === 'PENDING')
      .map((o) => ({
        id: `alert-ord-${o.id}`,
        title: `New ${o.source}: ${o.orderNumber}`,
        detail: `${o.companyName} ($${o.totalAmount.toLocaleString()}) awaits stock check`,
        action: () => {
          setSelectedOrder(o);
          setNavTab('orders');
          setIsAlertsOpen(false);
        }
      })),
    ...scopedInventory
      .filter((i) => i.onHand - i.reserved <= i.reorderPoint)
      .map((i) => ({
        id: `alert-inv-${i.sku}`,
        title: `Low Stock: ${i.sku}`,
        detail: `Only ${i.onHand - i.reserved} ready to sell (Min ${i.reorderPoint})`,
        action: () => {
          setNavTab('inventory');
          setIsAlertsOpen(false);
        }
      })),
    ...scopedInvoices
      .filter((inv) => inv.status === 'OVERDUE')
      .map((inv) => ({
        id: `alert-inv-${inv.id}`,
        title: `Overdue Invoice: ${inv.invoiceNumber}`,
        detail: `${inv.customerCompany} owes $${inv.amount.toLocaleString()}`,
        action: () => {
          setFocusedInvoiceOrderNum(inv.orderNumber);
          setNavTab('finance');
          setIsAlertsOpen(false);
        }
      }))
  ];

  // Order Lifecycle Handlers
  const handleAdvanceOrderStatus = (
    orderId: string,
    nextStatus: ErpOrderStatus,
    shippingInfo?: { carrier: string; trackingNumber: string }
  ) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: nextStatus,
              carrier: shippingInfo?.carrier || o.carrier,
              trackingNumber: shippingInfo?.trackingNumber || o.trackingNumber
            }
          : o
      )
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
              carrier: shippingInfo?.carrier || prev.carrier,
              trackingNumber: shippingInfo?.trackingNumber || prev.trackingNumber
            }
          : null
      );
    }

    if (nextStatus === 'ALLOCATED' && target.status === 'PENDING') {
      setInventory((prev) =>
        prev.map((item) => {
          const line = target.lines.find((l) => l.sku === item.sku);
          return line ? { ...item, reserved: item.reserved + line.qty } : item;
        })
      );
      logActivity('inventory', `Reserved stock for ${target.orderNumber} (${target.companyName}).`);
      showToast(`${target.orderNumber} reserved — ready to pack & ship`);
    } else if (nextStatus === 'DISPATCHED' && target.status === 'ALLOCATED') {
      setInventory((prev) =>
        prev.map((item) => {
          const line = target.lines.find((l) => l.sku === item.sku);
          return line
            ? {
                ...item,
                onHand: Math.max(0, item.onHand - line.qty),
                reserved: Math.max(0, item.reserved - line.qty)
              }
            : item;
        })
      );
      const alreadyInvoiced = invoices.some((inv) => inv.orderNumber === target.orderNumber);
      if (!alreadyInvoiced) {
        const invNum = `INV-2026-${String(903 + invoices.length).padStart(4, '0')}`;
        const newInv: ErpInvoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber: invNum,
          orderNumber: target.orderNumber,
          entityId: target.entityId,
          customerCompany: target.companyName,
          customerEmail: target.customerEmail,
          billingAddress: target.shippingAddress,
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          lines: target.lines,
          amount: target.totalAmount,
          status: 'UNPAID'
        };
        setInvoices((prev) => [newInv, ...prev]);
        logActivity('finance', `Shipped ${target.orderNumber} via ${shippingInfo?.carrier || 'Carrier'} and issued ${invNum} ($${target.totalAmount.toLocaleString()}).`);
        showToast(`${target.orderNumber} shipped & ${invNum} created`);
      }
    } else if (nextStatus === 'CANCELLED' && target.status === 'ALLOCATED') {
      setInventory((prev) =>
        prev.map((item) => {
          const line = target.lines.find((l) => l.sku === item.sku);
          return line ? { ...item, reserved: Math.max(0, item.reserved - line.qty) } : item;
        })
      );
      logActivity('order', `Cancelled ${target.orderNumber} and released reserved stock.`);
      showToast(`${target.orderNumber} cancelled & stock returned`);
    } else {
      logActivity('order', `Marked ${target.orderNumber} as ${nextStatus}.`);
      showToast(`${target.orderNumber} marked ${nextStatus}`);
    }
  };

  const handleCreateOrder = (newOrd: Omit<ErpSalesOrder, 'id' | 'orderNumber' | 'createdAt'>) => {
    const seq = 1049 + orders.length;
    const prefix = newOrd.source === 'Web Store' ? 'WEB' : newOrd.source === 'Distributor PO' ? 'DST' : 'B2B';
    const created: ErpSalesOrder = {
      ...newOrd,
      id: `ord-${Date.now()}`,
      orderNumber: `AG-${prefix}-2026-${seq}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOrders((prev) => [created, ...prev]);
    logActivity('order', `Created ${created.source} order ${created.orderNumber} ($${created.totalAmount.toLocaleString()}) for ${created.companyName}.`);
    showToast(`Created order ${created.orderNumber}`);
  };

  const handleAdjustStock = (sku: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, onHand: Math.max(0, item.onHand + delta) } : item
      )
    );
  };

  const handleCreatePo = (po: Omit<ErpPurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => {
    const num = `PO-2026-${String(410 + purchaseOrders.length).padStart(4, '0')}`;
    const created: ErpPurchaseOrder = {
      ...po,
      id: `po-${Date.now()}`,
      poNumber: num,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPurchaseOrders((prev) => [created, ...prev]);
    logActivity('procurement', `Issued ${num} ($${po.totalCost.toLocaleString()}) to ${po.supplierName}.`);
    showToast(`Sent ${num} to ${po.supplierName}`);
  };

  const handleMarkPoInTransit = (poId: string) => {
    const targetPo = purchaseOrders.find((p) => p.id === poId);
    if (!targetPo) return;
    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? { ...p, status: 'IN_TRANSIT' } : p)));
    logActivity('procurement', `${targetPo.poNumber} marked as shipped by ${targetPo.supplierName}.`);
    showToast(`${targetPo.poNumber} is now On The Way`);
  };

  const handleReceivePo = (poId: string) => {
    const targetPo = purchaseOrders.find((p) => p.id === poId);
    if (!targetPo || targetPo.status === 'RECEIVED') return;

    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'RECEIVED' } : p))
    );
    setInventory((prev) =>
      prev.map((item) => {
        const line = targetPo.lines.find((l) => l.sku === item.sku);
        return line ? { ...item, onHand: item.onHand + line.qty } : item;
      })
    );
    logActivity('inventory', `Received ${targetPo.poNumber}: added ${targetPo.lines.map((l) => `${l.qty}× ${l.sku}`).join(', ')} to warehouse.`);
    showToast(`Received ${targetPo.poNumber} — warehouse stock updated`);
  };

  const handleMarkInvoicePaid = (invoiceId: string, method: NonNullable<ErpInvoice['paymentMethod']> = 'Bank Wire') => {
    const inv = invoices.find((i) => i.id === invoiceId);
    setInvoices((prev) =>
      prev.map((item) =>
        item.id === invoiceId
          ? {
              ...item,
              status: 'PAID',
              paymentMethod: method,
              paidDate: new Date().toISOString().split('T')[0]
            }
          : item
      )
    );
    if (inv) {
      logActivity('finance', `Recorded ${method} payment of $${inv.amount.toLocaleString()} for ${inv.invoiceNumber}.`);
    }
    showToast(`Payment recorded via ${method}`);
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOrders(INITIAL_ORDERS);
    setInventory(INITIAL_INVENTORY);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setInvoices(INITIAL_INVOICES);
    setActivities(INITIAL_ACTIVITIES);
    setSelectedOrder(null);
    showToast('Demo data reset to starting state');
  };

  const navItems: { id: ErpNavTab; label: string; badge?: number; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Daily Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'orders', label: 'Orders & Shipping', badge: scopedOrders.filter((o) => o.status === 'PENDING' || o.status === 'ALLOCATED').length, icon: <ShoppingCart size={16} /> },
    { id: 'customers', label: 'Customers & Growers', icon: <Users size={16} /> },
    { id: 'inventory', label: 'Warehouse Stock', badge: scopedInventory.filter((i) => i.onHand - i.reserved <= i.reorderPoint).length, icon: <Package size={16} /> },
    { id: 'procurement', label: 'Supplier Orders (PO)', icon: <Truck size={16} /> },
    { id: 'finance', label: 'Invoices & Payments', badge: scopedInvoices.filter((i) => i.status !== 'PAID').length, icon: <FileText size={16} /> }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex' }}>
      {/* Collapsible Left ERP Sidebar */}
      <aside style={{
        width: isSidebarOpen ? '260px' : '64px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid #1E293B',
        flexShrink: 0,
        minHeight: '100vh',
        zIndex: 60
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarOpen ? 'space-between' : 'center',
          height: '61px'
        }}>
          {isSidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#0F172A',
                fontSize: '16px'
              }}>
                A
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Autogrow ERP
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace' }}>
                  ENTERPRISE SUITE
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#0F172A',
              fontSize: '16px'
            }}>
              A
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', display: 'flex' }}
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <div style={{ padding: isSidebarOpen ? '16px 12px' : '16px 8px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
          {isSidebarOpen && (
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', padding: '0 8px 6px', letterSpacing: '0.05em' }}>
              BUSINESS MODULES
            </div>
          )}
          {navItems.map((item) => {
            const isActive = navTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`erp-nav-${item.id}`}
                onClick={() => setNavTab(item.id)}
                title={!isSidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarOpen ? 'space-between' : 'center',
                  width: '100%',
                  padding: isSidebarOpen ? '9px 12px' : '9px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: isActive ? '#34D399' : '#94A3B8',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.icon}
                  {isSidebarOpen && <span>{item.label}</span>}
                </span>
                {isSidebarOpen && typeof item.badge === 'number' && item.badge > 0 && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? '#10B981' : '#1E293B',
                    color: isActive ? '#0F172A' : '#E2E8F0'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: isSidebarOpen ? '16px' : '12px 6px', borderTop: '1px solid #1E293B', backgroundColor: '#0B1120' }}>
          {isSidebarOpen ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF' }}>STANDALONE ERP</span>
                <span style={{ fontSize: '9px', fontWeight: 800, fontFamily: 'monospace', color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '1px 5px', borderRadius: '4px' }}>
                  READY
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '10px' }}>
                Changes save automatically on this device
              </div>
              <button
                type="button"
                onClick={handleResetDemo}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} color="#10B981" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResetDemo}
              title="Reset Demo Data"
              style={{ width: '100%', padding: '8px', backgroundColor: '#1E293B', border: 'none', borderRadius: '6px', color: '#10B981', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Bar with Search + Interactive Bell Action Center */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F1F5F9',
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            width: '340px'
          }}>
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Find order, customer, SKU, or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#0F172A', outline: 'none', width: '100%' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <div ref={alertsDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                data-testid="erp-bell-btn"
                onClick={() => setIsAlertsOpen((p) => !p)}
                title={`${alertItems.length} action reminders`}
                style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: isAlertsOpen ? '#0F172A' : '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Bell size={16} color={isAlertsOpen ? '#FFFFFF' : '#475569'} />
                {alertItems.length > 0 && (
                  <div style={{ position: 'absolute', top: '5px', right: '5px', width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#F59E0B', border: '2px solid #FFFFFF' }} />
                )}
              </button>

              {isAlertsOpen && (
                <div
                  data-testid="erp-alerts-popover"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '340px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 16px 32px -8px rgba(15, 23, 42, 0.2)',
                    zIndex: 90,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '10px 14px', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Action Center ({alertItems.length})</span>
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>Click item to open</span>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {alertItems.length === 0 ? (
                      <div style={{ padding: '18px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                        All caught up — no pending alerts.
                      </div>
                    ) : (
                      alertItems.map((al, i) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={al.action}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            border: 'none',
                            borderTop: i > 0 ? '1px solid #F1F5F9' : 'none',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>{al.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{al.detail}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#475569' }}>
              AG
            </div>
          </div>
        </header>

        {/* Entity Switcher Sub-Bar */}
        <section style={{
          padding: '16px 24px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div ref={entityDropdownRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '21px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>
                {currentEntity.name}
              </h1>
              <button
                type="button"
                onClick={() => setIsEntityMenuOpen((p) => !p)}
                title="Switch Operating Region"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  backgroundColor: isEntityMenuOpen ? '#0F172A' : '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: isEntityMenuOpen ? '#FFFFFF' : '#0F172A'
                }}
              >
                <ChevronDown size={16} style={{ transform: isEntityMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
              {currentEntity.region} · Hub {currentEntity.warehouseCode} · All amounts in {currentEntity.currency}
            </p>

            {isEntityMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '40px',
                left: 0,
                minWidth: '330px',
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                boxShadow: '0 16px 32px -8px rgba(15, 23, 42, 0.18)',
                padding: '6px',
                zIndex: 80
              }}>
                {BUSINESS_ENTITIES.map((ent) => {
                  const isSel = ent.id === entityId;
                  return (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() => {
                        setEntityId(ent.id);
                        setIsEntityMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '9px 12px',
                        borderRadius: '7px',
                        border: 'none',
                        backgroundColor: isSel ? '#F1F5F9' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>{ent.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{ent.region}</div>
                      </div>
                      {isSel && <Check size={14} color="#10B981" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast && (
              <span style={{ padding: '6px 12px', borderRadius: '7px', backgroundColor: '#10B981', color: '#FFFFFF', fontSize: '11.5px', fontWeight: 700 }}>
                {toast}
              </span>
            )}
            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, padding: '6px 10px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '7px', color: '#475569' }}>
              Standalone Mode (Not Linked Yet)
            </span>
          </div>
        </section>

        {/* Main ERP Body */}
        <main style={{ flex: 1, padding: '24px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          {navTab === 'overview' && (
            <OverviewTab
              entityName={currentEntity.name}
              orders={scopedOrders}
              inventory={scopedInventory}
              purchaseOrders={scopedPos}
              invoices={scopedInvoices}
              activities={activities}
              onNavigateTab={setNavTab}
              onInspectOrder={(ord) => {
                setSelectedOrder(ord);
                setNavTab('orders');
              }}
            />
          )}

          {navTab === 'orders' && (
            <OrdersTab
              orders={scopedOrders}
              inventory={inventory}
              customers={INITIAL_CUSTOMERS}
              prefilledCustomer={prefilledCustomer}
              onClearPrefilledCustomer={() => setPrefilledCustomer(null)}
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              onAdvanceStatus={handleAdvanceOrderStatus}
              onCreateOrder={handleCreateOrder}
              onViewLinkedInvoice={(orderNum) => {
                setSelectedOrder(null);
                setFocusedInvoiceOrderNum(orderNum);
                setNavTab('finance');
              }}
            />
          )}

          {navTab === 'customers' && (
            <CustomersTab
              customers={scopedCustomers}
              orders={orders}
              invoices={invoices}
              onCreateOrderForCustomer={(cust) => {
                setPrefilledCustomer(cust);
                setNavTab('orders');
              }}
            />
          )}

          {navTab === 'inventory' && (
            <InventoryTab
              inventory={scopedInventory}
              purchaseOrders={purchaseOrders}
              onAdjustStock={handleAdjustStock}
              onCreateRestockPo={(item, restockQuantity) => {
                handleCreatePo({
                  entityId: item.entityId,
                  supplierName: item.supplierName,
                  status: 'ORDERED',
                  expectedEta: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  lines: [{ sku: item.sku, name: item.name, qty: restockQuantity, unitCost: item.unitCost }],
                  totalCost: restockQuantity * item.unitCost
                });
              }}
            />
          )}

          {navTab === 'procurement' && (
            <ProcurementTab
              purchaseOrders={scopedPos}
              inventory={inventory}
              onMarkInTransit={handleMarkPoInTransit}
              onReceivePo={handleReceivePo}
              onCreatePo={handleCreatePo}
            />
          )}

          {navTab === 'finance' && (
            <FinanceTab
              invoices={scopedInvoices}
              purchaseOrders={scopedPos}
              focusedOrderNumber={focusedInvoiceOrderNum}
              onClearFocusedOrder={() => setFocusedInvoiceOrderNum(null)}
              onMarkPaid={handleMarkInvoicePaid}
            />
          )}
        </main>
      </div>
    </div>
  );
};
