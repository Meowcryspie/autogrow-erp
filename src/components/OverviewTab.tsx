import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  PackageCheck,
  Building2
} from 'lucide-react';
import type {
  ErpSalesOrder,
  InventoryItem,
  ErpPurchaseOrder,
  ErpInvoice,
  ErpNavTab
} from '../types/erp';
import { MONTHLY_CASHFLOW_SERIES } from '../data/mockErpData';

interface OverviewTabProps {
  entityName: string;
  orders: ErpSalesOrder[];
  inventory: InventoryItem[];
  purchaseOrders: ErpPurchaseOrder[];
  invoices: ErpInvoice[];
  onNavigateTab: (tab: ErpNavTab) => void;
  onInspectOrder: (order: ErpSalesOrder) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  entityName,
  orders,
  inventory,
  purchaseOrders,
  invoices,
  onNavigateTab,
  onInspectOrder
}) => {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(MONTHLY_CASHFLOW_SERIES.length - 1);

  const openOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'ALLOCATED');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <span>Active Order Book</span>
          </div>
          <div data-testid="erp-kpi-order-book" style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            ${totalOrderValue.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {orders.length} orders tracked across {entityName}
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            <ShoppingCart size={12} color="#2563EB" />
            <span>Fulfillment Queue</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            {openOrders.length} Open
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            Pending pick, bench QA, or dispatch allocation
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            <AlertTriangle size={12} color="#D97706" />
            <span>Reorder Alerts</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: lowStockItems.length > 0 ? '#D97706' : '#10B981', marginTop: '4px' }}>
            {lowStockItems.length} SKUs
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {openPos.length} inbound supplier POs in pipeline
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            <FileText size={12} color="#0F172A" />
            <span>Outstanding AR</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            ${unpaidTotal.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {unpaidInvoices.length} unpaid / overdue customer invoices
          </div>
        </div>
      </div>

      {/* Asymmetric Split: Channel & Warehouse Health (1.1fr) | Revenue vs COGS + Action Queue (1.9fr) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(440px, 1.9fr)',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* Left: Channel Mix & Hub Breakdown */}
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
                Order Intake by Channel
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              View Queue <ArrowUpRight size={12} />
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
                    <span>{sharePct}% share</span>
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
                  Warehouse Reorder Watch
                </span>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}
                >
                  Open Stock →
                </button>
              </div>
              {lowStockItems.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                  All SKUs above safety reorder threshold.
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
                          <div style={{ color: '#92400E', fontSize: '10.5px' }}>{item.warehouseBin} · Min {item.reorderPoint}</div>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#B45309' }}>
                          {available} avail
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Monthly Cashflow & Active Fulfillment Action Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Monthly Cashflow Analytics */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                  6-Month Revenue vs. COGS Summary ({activeMonth.month} 2026)
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  Click any month column to inspect gross margin & order count
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontFamily: 'monospace', fontSize: '11.5px' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Rev: </span>
                  <strong style={{ color: '#059669' }}>${activeMonth.revenue.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>COGS: </span>
                  <strong style={{ color: '#0F172A' }}>${activeMonth.cogs.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Margin: </span>
                  <strong style={{ color: '#2563EB' }}>
                    {Math.round(((activeMonth.revenue - activeMonth.cogs) / activeMonth.revenue) * 100)}%
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', alignItems: 'flex-end', height: '120px', paddingTop: '10px', borderBottom: '1px solid #E2E8F0' }}>
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
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '84px', width: '100%' }}>
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

          {/* Pending & Allocated Orders Ready for Action */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={15} color="#0F172A" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                  Orders Awaiting ERP Action
                </span>
              </div>
              <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#64748B' }}>
                Click an order to allocate or dispatch
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {openOrders.length === 0 ? (
                <div style={{ padding: '18px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                  All active orders have been dispatched.
                </div>
              ) : (
                openOrders.map((ord, idx) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => onInspectOrder(ord)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '11px 16px',
                      border: 'none',
                      borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                          {ord.orderNumber}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: ord.source === 'Web Store' ? '#ECFDF5' : '#EFF6FF',
                          color: ord.source === 'Web Store' ? '#065F46' : '#1E40AF',
                          border: '1px solid #CBD5E1'
                        }}>
                          {ord.source}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {ord.companyName} · {ord.lines.length} line items · Ship by {ord.expectedShipDate}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                        ${ord.totalAmount.toLocaleString()}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: ord.status === 'PENDING' ? '#FEF3C7' : '#DBEAFE',
                        color: ord.status === 'PENDING' ? '#B45309' : '#1D4ED8'
                      }}>
                        {ord.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
