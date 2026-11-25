import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  PackageCheck,
  Building2,
  Clock,
  ChevronRight
} from 'lucide-react';
import type {
  ErpSalesOrder,
  InventoryItem,
  ErpPurchaseOrder,
  ErpInvoice,
  ErpNavTab,
  ErpActivityEvent
} from '../types/erp';
import { MONTHLY_CASHFLOW_SERIES } from '../data/mockErpData';

interface OverviewTabProps {
  entityName: string;
  orders: ErpSalesOrder[];
  inventory: InventoryItem[];
  purchaseOrders: ErpPurchaseOrder[];
  invoices: ErpInvoice[];
  activities: ErpActivityEvent[];
  onNavigateTab: (tab: ErpNavTab) => void;
  onInspectOrder: (order: ErpSalesOrder) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  entityName,
  orders,
  inventory,
  purchaseOrders,
  invoices,
  activities,
  onNavigateTab,
  onInspectOrder
}) => {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(MONTHLY_CASHFLOW_SERIES.length - 1);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const allocatedOrders = orders.filter((o) => o.status === 'ALLOCATED');
  const shippedOrders = orders.filter((o) => o.status === 'DISPATCHED');
  const totalOrderValue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const lowStockItems = inventory.filter((item) => item.onHand - item.reserved <= item.reorderPoint);
  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'PAID');
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const openPos = purchaseOrders.filter((po) => po.status !== 'RECEIVED');

  const channels = ['Web Store', 'Commercial Quote', 'Distributor PO'] as const;
  const channelStats = channels.map((source) => {
    const matching = orders.filter((o) => o.source === source && o.status !== 'CANCELLED');
    const amount = matching.reduce((sum, o) => sum + o.totalAmount, 0);
    return { source, count: matching.length, amount };
  });

  const activeMonth = MONTHLY_CASHFLOW_SERIES[selectedMonthIdx] || MONTHLY_CASHFLOW_SERIES[MONTHLY_CASHFLOW_SERIES.length - 1];
  const maxRevenue = Math.max(...MONTHLY_CASHFLOW_SERIES.map((m) => m.revenue), 1);
  const activeProfit = activeMonth.revenue - activeMonth.cogs;

  const workflowSteps: {
    step: string;
    title: string;
    countLabel: string;
    hint: string;
    highlight: boolean;
    targetTab: ErpNavTab;
  }[] = [
    {
      step: '1',
      title: 'Incoming Orders',
      countLabel: `${pendingOrders.length} Need Review`,
      hint: 'Check stock & reserve items',
      highlight: pendingOrders.length > 0,
      targetTab: 'orders'
    },
    {
      step: '2',
      title: 'Pack & Ship',
      countLabel: `${allocatedOrders.length} Ready to Ship`,
      hint: 'Add tracking & ship parcel',
      highlight: allocatedOrders.length > 0,
      targetTab: 'orders'
    },
    {
      step: '3',
      title: 'Invoices & Payment',
      countLabel: `${unpaidInvoices.length} Unpaid ($${unpaidTotal.toLocaleString()})`,
      hint: 'Send invoice & mark paid',
      highlight: unpaidInvoices.some((i) => i.status === 'OVERDUE'),
      targetTab: 'finance'
    },
    {
      step: '4',
      title: 'Check Low Stock',
      countLabel: `${lowStockItems.length} Running Low`,
      hint: 'Restock low probes & pods',
      highlight: lowStockItems.length > 0,
      targetTab: 'inventory'
    },
    {
      step: '5',
      title: 'Supplier Deliveries',
      countLabel: `${openPos.length} Incoming POs`,
      hint: 'Receive stock into warehouse',
      highlight: openPos.length > 0,
      targetTab: 'procurement'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* A-to-Z Guided Daily Operations Bar */}
      <div
        data-testid="erp-workflow-guide"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '10px',
          padding: '14px 18px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>
            Daily A-to-Z Operations Workflow — Click any step to jump straight in
          </div>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            {shippedOrders.length} orders currently in transit to growers
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '8px' }}>
          {workflowSteps.map((ws) => (
            <button
              key={ws.step}
              type="button"
              onClick={() => onNavigateTab(ws.targetTab)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                border: ws.highlight ? '1px solid #10B981' : '1px solid #E2E8F0',
                backgroundColor: ws.highlight ? '#F0FDF4' : '#F8FAFC',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '1px 6px', borderRadius: '4px' }}>
                  STEP {ws.step}
                </span>
                <ChevronRight size={13} color="#64748B" />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{ws.title}</div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: ws.highlight ? '#059669' : '#475569', fontFamily: 'monospace' }}>
                {ws.countLabel}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>{ws.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Hairline Executive KPI Cells */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            <TrendingUp size={12} color="#10B981" />
            <span>Total Sales Orders</span>
          </div>
          <div data-testid="erp-kpi-order-book" style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            ${totalOrderValue.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            Across {orders.length} orders · {entityName}
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            <ShoppingCart size={12} color="#2563EB" />
            <span>To Pack & Ship</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            {pendingOrders.length + allocatedOrders.length} Orders
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {pendingOrders.length} awaiting check · {allocatedOrders.length} ready to ship
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            <AlertTriangle size={12} color="#D97706" />
            <span>Low Stock Warnings</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: lowStockItems.length > 0 ? '#D97706' : '#10B981', marginTop: '4px' }}>
            {lowStockItems.length} Items
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {openPos.length} supplier restock shipments on the way
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            <FileText size={12} color="#0F172A" />
            <span>Unpaid Customer Bills</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            ${unpaidTotal.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {unpaidInvoices.length} open invoices awaiting customer payment
          </div>
        </div>
      </div>

      {/* Asymmetric Split: Channel Mix & Low Stock Watch (1.05fr) | Sales & Fulfillment Queue (1.95fr) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.05fr) minmax(440px, 1.95fr)',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* Left: Channel Mix & Warehouse Health */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={15} color="#0F172A" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                Where Orders Come From
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              Open Orders <ArrowUpRight size={12} />
            </button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {channelStats.map((ch) => {
              const sharePct = totalOrderValue > 0 ? Math.round((ch.amount / totalOrderValue) * 100) : 0;
              return (
                <div key={ch.source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{ch.source}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#059669' }}>
                      ${ch.amount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', marginBottom: '5px' }}>
                    <span>{ch.count} orders</span>
                    <span>{sharePct}% of sales</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${sharePct}%`,
                      height: '100%',
                      backgroundColor: ch.source === 'Web Store' ? '#10B981' : ch.source === 'Commercial Quote' ? '#0F172A' : '#2563EB',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              );
            })}

            {/* Low-Stock Alert Strip */}
            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Items Running Low
                </span>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}
                >
                  Manage Stock →
                </button>
              </div>
              {lowStockItems.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                  All hardware items have healthy warehouse stock.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {lowStockItems.slice(0, 3).map((item) => {
                    const available = item.onHand - item.reserved;
                    return (
                      <div
                        key={item.sku}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{item.sku}</div>
                          <div style={{ color: '#92400E', fontSize: '10.5px' }}>Min threshold: {item.reorderPoint} units</div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#B45309' }}>
                          {available} left
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Monthly Sales & Profit + Orders Needing Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                  Monthly Sales & Gross Profit ({activeMonth.month} 2026)
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  Click any month bar to inspect sales, hardware cost, and profit margin
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontFamily: 'monospace', fontSize: '11.5px' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Sales: </span>
                  <strong style={{ color: '#059669' }}>${activeMonth.revenue.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Cost: </span>
                  <strong style={{ color: '#0F172A' }}>${activeMonth.cogs.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Profit: </span>
                  <strong style={{ color: '#2563EB' }}>
                    ${activeProfit.toLocaleString()} ({Math.round((activeProfit / activeMonth.revenue) * 100)}%)
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', alignItems: 'flex-end', height: '110px', paddingTop: '10px', borderBottom: '1px solid #E2E8F0' }}>
              {MONTHLY_CASHFLOW_SERIES.map((m, idx) => {
                const revH = Math.max(18, Math.round((m.revenue / maxRevenue) * 100));
                const cogsH = Math.max(10, Math.round((m.cogs / maxRevenue) * 100));
                const isSelected = idx === selectedMonthIdx;
                return (
                  <button
                    key={m.month}
                    type="button"
                    onClick={() => setSelectedMonthIdx(idx)}
                    style={{
                      background: isSelected ? '#F8FAFC' : 'transparent',
                      border: isSelected ? '1px solid #CBD5E1' : '1px solid transparent',
                      borderBottom: 'none',
                      borderRadius: '6px 6px 0 0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '6px 8px 0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '78px', width: '100%' }}>
                      <div style={{ flex: 1, height: `${revH}%`, backgroundColor: isSelected ? '#10B981' : '#34D399', borderRadius: '3px 3px 0 0' }} />
                      <div style={{ flex: 1, height: `${cogsH}%`, backgroundColor: '#0F172A', borderRadius: '3px 3px 0 0', opacity: isSelected ? 1 : 0.7 }} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginTop: '5px', textAlign: 'center', fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>
              {MONTHLY_CASHFLOW_SERIES.map((m, idx) => (
                <span key={m.month} style={{ fontWeight: idx === selectedMonthIdx ? 800 : 500, color: idx === selectedMonthIdx ? '#0F172A' : '#64748B' }}>
                  {m.month} ({m.orders})
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.3fr) minmax(240px, 1fr)', gap: '16px' }}>
            {/* Actionable Orders Queue */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <PackageCheck size={14} color="#0F172A" />
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>Orders Waiting for Action</span>
                </div>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>Click to process</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {pendingOrders.length + allocatedOrders.length === 0 ? (
                  <div style={{ padding: '18px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                    All active orders have been shipped.
                  </div>
                ) : (
                  [...pendingOrders, ...allocatedOrders].map((ord, idx) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => onInspectOrder(ord)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        border: 'none',
                        borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>{ord.orderNumber}</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: ord.source === 'Web Store' ? '#ECFDF5' : '#EFF6FF', color: ord.source === 'Web Store' ? '#065F46' : '#1E40AF' }}>
                            {ord.source}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ord.companyName}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>${ord.totalAmount.toLocaleString()}</div>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: ord.status === 'PENDING' ? '#FEF3C7' : '#DBEAFE',
                          color: ord.status === 'PENDING' ? '#B45309' : '#1D4ED8'
                        }}>
                          {ord.status === 'PENDING' ? '1. NEW ORDER' : '2. READY TO SHIP'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Clock size={14} color="#0F172A" />
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>Recent ERP Activity</span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '210px', overflowY: 'auto' }}>
                {activities.slice(0, 6).map((act) => (
                  <div key={act.id} style={{ borderLeft: '2px solid #CBD5E1', paddingLeft: '10px' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B' }}>{act.timestamp}</div>
                    <div style={{ fontSize: '11.5px', color: '#0F172A', lineHeight: 1.4 }}>{act.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
