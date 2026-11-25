import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  FileText,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  RotateCcw
} from 'lucide-react';
import type {
  ErpNavTab,
  BusinessEntityId,
  ErpSalesOrder,
  ErpOrderStatus,
  InventoryItem,
  ErpPurchaseOrder,
  ErpInvoice
} from '../types/erp';
import {
  BUSINESS_ENTITIES,
  INITIAL_ORDERS,
  INITIAL_INVENTORY,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_INVOICES
} from '../data/mockErpData';
import { OverviewTab } from './OverviewTab';
import { OrdersTab } from './OrdersTab';
import { InventoryTab } from './InventoryTab';
import { ProcurementTab } from './ProcurementTab';
import { FinanceTab } from './FinanceTab';

const STORAGE_KEY = 'autogrow_erp_ledger_v1';

interface PersistedLedger {
  orders: ErpSalesOrder[];
  inventory: InventoryItem[];
  purchaseOrders: ErpPurchaseOrder[];
  invoices: ErpInvoice[];
}

function loadLedger(): PersistedLedger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.orders) && Array.isArray(parsed.inventory)) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted local storage
  }
  return {
    orders: INITIAL_ORDERS,
    inventory: INITIAL_INVENTORY,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
    invoices: INITIAL_INVOICES
  };
}

export const ErpControlCenter: React.FC = () => {
  const [navTab, setNavTab] = useState<ErpNavTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [entityId, setEntityId] = useState<BusinessEntityId>('ALL');
  const [isEntityMenuOpen, setIsEntityMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const initial = loadLedger();
  const [orders, setOrders] = useState<ErpSalesOrder[]>(initial.orders);
  const [inventory, setInventory] = useState<InventoryItem[]>(initial.inventory);
  const [purchaseOrders, setPurchaseOrders] = useState<ErpPurchaseOrder[]>(initial.purchaseOrders);
  const [invoices, setInvoices] = useState<ErpInvoice[]>(initial.invoices);
  const [selectedOrder, setSelectedOrder] = useState<ErpSalesOrder | null>(null);

  const entityDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ orders, inventory, purchaseOrders, invoices })
      );
    } catch {
      // ignore quota limits
    }
  }, [orders, inventory, purchaseOrders, invoices]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setIsEntityMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const currentEntity = BUSINESS_ENTITIES.find((e) => e.id === entityId) || BUSINESS_ENTITIES[0];

  // Scope records by active business entity & search query
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

  const lowStockCount = scopedInventory.filter((i) => i.onHand - i.reserved <= i.reorderPoint).length;

  // Order Lifecycle Handlers (syncs inventory + invoices cleanly)
  const handleAdvanceOrderStatus = (orderId: string, nextStatus: ErpOrderStatus) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    if (nextStatus === 'ALLOCATED' && target.status === 'PENDING') {
      setInventory((prev) =>
        prev.map((item) => {
          const line = target.lines.find((l) => l.sku === item.sku);
          return line ? { ...item, reserved: item.reserved + line.qty } : item;
        })
      );
      showToast(`${target.orderNumber} allocated & stock reserved`);
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
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          amount: target.totalAmount,
          status: 'UNPAID'
        };
        setInvoices((prev) => [newInv, ...prev]);
        showToast(`${target.orderNumber} dispatched & ${invNum} issued`);
      }
    } else if (nextStatus === 'CANCELLED' && target.status === 'ALLOCATED') {
      setInventory((prev) =>
        prev.map((item) => {
          const line = target.lines.find((l) => l.sku === item.sku);
          return line ? { ...item, reserved: Math.max(0, item.reserved - line.qty) } : item;
        })
      );
      showToast(`${target.orderNumber} cancelled & stock released`);
    } else {
      showToast(`${target.orderNumber} updated to ${nextStatus}`);
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
    showToast(`Issued ${num} to ${po.supplierName}`);
  };

  const handleQuickRestockPo = (item: InventoryItem) => {
    const orderQty = Math.max(10, item.reorderPoint * 2);
    handleCreatePo({
      entityId: item.entityId,
      supplierName: item.supplierName,
      status: 'ORDERED',
      expectedEta: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      lines: [{ sku: item.sku, name: item.name, qty: orderQty, unitCost: item.unitCost }],
      totalCost: orderQty * item.unitCost
    });
    setNavTab('procurement');
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
    showToast(`Received ${targetPo.poNumber} — warehouse stock updated`);
  };

  const handleMarkInvoicePaid = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'PAID' } : inv))
    );
    showToast('Invoice reconciled as PAID');
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOrders(INITIAL_ORDERS);
    setInventory(INITIAL_INVENTORY);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setInvoices(INITIAL_INVOICES);
    setSelectedOrder(null);
    showToast('ERP demo ledger reset to baseline');
  };

  const navItems: { id: ErpNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Executive Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'orders', label: 'Sales & Web Orders', icon: <ShoppingCart size={16} /> },
    { id: 'inventory', label: 'Warehouse Inventory', icon: <Package size={16} /> },
    { id: 'procurement', label: 'Procurement & POs', icon: <Truck size={16} /> },
    { id: 'finance', label: 'Invoices & Finance', icon: <FileText size={16} /> }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex' }}>
      {/* 1. Collapsible Left ERP Sidebar (Exact SCADA Visual System) */}
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

        <div style={{ padding: isSidebarOpen ? '16px 12px' : '16px 8px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {isSidebarOpen && (
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', padding: '0 8px 6px', letterSpacing: '0.05em' }}>
              ERP MODULES
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
                  gap: '10px',
                  width: '100%',
                  padding: isSidebarOpen ? '9px 12px' : '9px',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: isActive ? '#34D399' : '#94A3B8',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer'
                }}
              >
                <div>{item.icon}</div>
                {isSidebarOpen && <span>{item.label}</span>}
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
                Decoupled Ledger · Local Persist
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
                <span>Reset Demo Ledger</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResetDemo}
              title="Reset Demo Ledger"
              style={{ width: '100%', padding: '8px', backgroundColor: '#1E293B', border: 'none', borderRadius: '6px', color: '#10B981', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Bar */}
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
            padding: '7px 16px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            width: '320px'
          }}>
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search order #, SKU, supplier, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#0F172A', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setNavTab('inventory')}
              title={`${lowStockCount} low-stock SKU alerts`}
              style={{ position: 'relative', width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Bell size={16} color="#475569" />
              {lowStockCount > 0 && (
                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B', border: '2px solid #FFFFFF' }} />
              )}
            </button>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#475569' }}>
              AG
            </div>
          </div>
        </header>

        {/* Entity Switcher Hero Sub-Bar */}
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
                title="Switch Business Entity"
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
              {currentEntity.region} · Warehouse {currentEntity.warehouseCode} · Currency {currentEntity.currency}
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
              UNLINKED SANDBOX
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
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              onAdvanceStatus={handleAdvanceOrderStatus}
              onCreateOrder={handleCreateOrder}
            />
          )}

          {navTab === 'inventory' && (
            <InventoryTab
              inventory={scopedInventory}
              onAdjustStock={handleAdjustStock}
              onQuickCreatePo={handleQuickRestockPo}
            />
          )}

          {navTab === 'procurement' && (
            <ProcurementTab
              purchaseOrders={scopedPos}
              inventory={inventory}
              onReceivePo={handleReceivePo}
              onCreatePo={handleCreatePo}
            />
          )}

          {navTab === 'finance' && (
            <FinanceTab
              invoices={scopedInvoices}
              onMarkPaid={handleMarkInvoicePaid}
            />
          )}
        </main>
      </div>
    </div>
  );
};
