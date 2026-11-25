import React, { useState, useEffect } from 'react';
import { Plus, Eye, PackageCheck, Truck, CheckCircle2, XCircle, X, Trash2, FileText, AlertTriangle } from 'lucide-react';
import type { ErpSalesOrder, ErpOrderStatus, OrderSource, InventoryItem, BusinessEntityId, ErpOrderLine, ErpCustomer } from '../types/erp';

interface OrdersTabProps {
  orders: ErpSalesOrder[];
  inventory: InventoryItem[];
  customers: ErpCustomer[];
  prefilledCustomer: ErpCustomer | null;
  onClearPrefilledCustomer: () => void;
  selectedOrder: ErpSalesOrder | null;
  onSelectOrder: (order: ErpSalesOrder | null) => void;
  onAdvanceStatus: (orderId: string, nextStatus: ErpOrderStatus, shippingInfo?: { carrier: string; trackingNumber: string }) => void;
  onCreateOrder: (newOrder: Omit<ErpSalesOrder, 'id' | 'orderNumber' | 'createdAt'>) => void;
  onViewLinkedInvoice: (orderNumber: string) => void;
}

const STATUS_META: Record<ErpOrderStatus, { label: string; bg: string; text: string; border: string }> = {
  PENDING: { label: '1. New Order', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  ALLOCATED: { label: '2. Stock Reserved', bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  DISPATCHED: { label: '3. Shipped & Invoiced', bg: '#EFF6FF', text: '#0369A1', border: '#BAE6FD' },
  COMPLETED: { label: '4. Completed', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  CANCELLED: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  inventory,
  customers,
  prefilledCustomer,
  onClearPrefilledCustomer,
  selectedOrder,
  onSelectOrder,
  onAdvanceStatus,
  onCreateOrder,
  onViewLinkedInvoice
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | ErpOrderStatus>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Carrier/Tracking form state when dispatching an ALLOCATED order
  const [carrierInput, setCarrierInput] = useState('DHL Air Express');
  const [trackingInput, setTrackingInput] = useState('');

  // Multi-item Order Builder State
  const [companyName, setCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [source, setSource] = useState<OrderSource>('Web Store');
  const [entityId, setEntityId] = useState<Exclude<BusinessEntityId, 'ALL'>>('MY-OPS');
  const [voltageSpec, setVoltageSpec] = useState<ErpSalesOrder['voltageSpec']>('240VAC 50Hz');
  const [draftLines, setDraftLines] = useState<ErpOrderLine[]>(() => [
    {
      sku: inventory[0]?.sku || 'MGC-Pro',
      name: inventory[0]?.name || 'MultiGrow Commercial Master Controller (16-Ch)',
      qty: 1,
      unitPrice: inventory[0]?.unitRetail || 2950
    }
  ]);

  useEffect(() => {
    if (prefilledCustomer) {
      setCompanyName(prefilledCustomer.companyName);
      setCustomerName(prefilledCustomer.contactName);
      setCustomerEmail(prefilledCustomer.email);
      setShippingAddress(prefilledCustomer.shippingAddress);
      setEntityId(prefilledCustomer.preferredEntity);
      setVoltageSpec(prefilledCustomer.voltageSpec);
      setSource('Commercial Quote');
      setIsNewModalOpen(true);
      onClearPrefilledCustomer();
    }
  }, [prefilledCustomer, onClearPrefilledCustomer]);

  useEffect(() => {
    if (selectedOrder) {
      setCarrierInput(selectedOrder.carrier || (selectedOrder.entityId === 'MY-OPS' ? 'DHL Air Express' : 'Mainfreight NZ'));
      setTrackingInput(selectedOrder.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 899999)}`);
    }
  }, [selectedOrder?.id]);

  const visibleOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const handleSelectExistingCustomer = (custId: string) => {
    const found = customers.find((c) => c.id === custId);
    if (!found) return;
    setCompanyName(found.companyName);
    setCustomerName(found.contactName);
    setCustomerEmail(found.email);
    setShippingAddress(found.shippingAddress);
    setEntityId(found.preferredEntity);
    setVoltageSpec(found.voltageSpec);
  };

  const handleAddDraftLine = () => {
    const unused = inventory.find((i) => !draftLines.some((d) => d.sku === i.sku)) || inventory[0];
    if (!unused) return;
    setDraftLines((prev) => [
      ...prev,
      { sku: unused.sku, name: unused.name, qty: 1, unitPrice: unused.unitRetail }
    ]);
  };

  const handleUpdateDraftLine = (idx: number, sku: string, qtyVal: number) => {
    const item = inventory.find((i) => i.sku === sku);
    if (!item) return;
    setDraftLines((prev) =>
      prev.map((line, i) =>
        i === idx
          ? { sku: item.sku, name: item.name, qty: Math.max(1, qtyVal), unitPrice: item.unitRetail }
          : line
      )
    );
  };

  const handleRemoveDraftLine = (idx: number) => {
    if (draftLines.length <= 1) return;
    setDraftLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const draftTotal = draftLines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !customerName.trim() || draftLines.length === 0) return;

    onCreateOrder({
      entityId,
      source,
      customerName: customerName.trim(),
      companyName: companyName.trim(),
      customerEmail: customerEmail.trim() || 'orders@grower.example',
      shippingAddress: shippingAddress.trim() || 'Commercial Glasshouse Site',
      voltageSpec,
      status: 'PENDING',
      expectedShipDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      lines: draftLines,
      totalAmount: draftTotal,
      notes: `Entered via ERP Multi-Item Builder (${source}).`
    });
    setCompanyName('');
    setCustomerName('');
    setCustomerEmail('');
    setShippingAddress('');
    setIsNewModalOpen(false);
  };

  const getStepIndex = (status: ErpOrderStatus): number => {
    if (status === 'PENDING') return 1;
    if (status === 'ALLOCATED') return 2;
    if (status === 'DISPATCHED') return 3;
    if (status === 'COMPLETED') return 4;
    return 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Friendly Filter Strip */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Sales & Web Store Order Pipeline
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B' }}>
            Step-by-step fulfillment: 1. Review Order → 2. Reserve Warehouse Stock → 3. Ship & Auto-Create Invoice → 4. Complete.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'PENDING', 'ALLOCATED', 'DISPATCHED', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                border: statusFilter === st ? '1px solid #0F172A' : '1px solid #E2E8F0',
                backgroundColor: statusFilter === st ? '#0F172A' : '#F8FAFC',
                color: statusFilter === st ? '#FFFFFF' : '#475569'
              }}
            >
              {st === 'ALL' ? 'All Orders' : STATUS_META[st].label}
            </button>
          ))}

          <button
            type="button"
            data-testid="erp-new-order-btn"
            onClick={() => setIsNewModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        {visibleOrders.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            No orders match the current filter.{' '}
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Show all orders
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '11px 16px' }}>Order # & Date</th>
                  <th style={{ padding: '11px 14px' }}>Channel & Hub</th>
                  <th style={{ padding: '11px 14px' }}>Customer / Grower</th>
                  <th style={{ padding: '11px 14px' }}>Ordered Hardware</th>
                  <th style={{ padding: '11px 14px' }}>Stage</th>
                  <th style={{ padding: '11px 14px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '11px 16px', textAlign: 'right' }}>Manage</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((ord) => {
                  const badge = STATUS_META[ord.status];
                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                        <div>{ord.orderNumber}</div>
                        <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>Ship target: {ord.expectedShipDate}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: ord.source === 'Web Store' ? '#ECFDF5' : '#EFF6FF',
                          color: ord.source === 'Web Store' ? '#065F46' : '#1E40AF',
                          border: '1px solid #CBD5E1'
                        }}>
                          {ord.source}
                        </span>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', marginTop: '3px' }}>
                          {ord.entityId} · {ord.voltageSpec}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{ord.companyName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{ord.customerName}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#334155' }}>
                        {ord.lines.map((l) => `${l.qty}× ${l.sku}`).join(', ')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                        {ord.trackingNumber && (
                          <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace', marginTop: '3px' }}>
                            {ord.carrier}: {ord.trackingNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                        ${ord.totalAmount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          data-testid={`erp-inspect-order-${ord.id}`}
                          onClick={() => onSelectOrder(ord)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#0F172A',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={12} />
                          <span>Open Order</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Visual A-to-Z Stepper Modal */}
      {selectedOrder && (
        <div
          data-testid="erp-order-detail-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '20px'
          }}
        >
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '680px',
            width: '100%',
            border: '1px solid #CBD5E1',
            overflow: 'hidden',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '15px 20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace' }}>
                  {selectedOrder.orderNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {selectedOrder.companyName} · {selectedOrder.source} · {selectedOrder.voltageSpec}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close Order Details"
                onClick={() => onSelectOrder(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              {/* Visual 4-Step Progress Stepper */}
              {selectedOrder.status !== 'CANCELLED' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { idx: 1, title: '1. Received' },
                    { idx: 2, title: '2. Stock Reserved' },
                    { idx: 3, title: '3. Shipped' },
                    { idx: 4, title: '4. Completed' }
                  ].map((st) => {
                    const currentStep = getStepIndex(selectedOrder.status);
                    const done = currentStep >= st.idx;
                    return (
                      <div
                        key={st.idx}
                        style={{
                          padding: '7px 8px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: done ? '#ECFDF5' : '#F8FAFC',
                          color: done ? '#065F46' : '#64748B',
                          border: `1px solid ${done ? '#10B981' : '#E2E8F0'}`
                        }}
                      >
                        {st.title}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer Contact</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedOrder.customerName}</div>
                  <div style={{ color: '#64748B' }}>{selectedOrder.customerEmail}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Delivery Address</div>
                  <div style={{ color: '#0F172A', fontSize: '11.5px' }}>{selectedOrder.shippingAddress}</div>
                </div>
              </div>

              {/* Line Items with Live Warehouse Stock Check */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', fontSize: '10.5px', color: '#475569' }}>
                      <th style={{ padding: '8px 12px' }}>SKU</th>
                      <th style={{ padding: '8px 12px' }}>Item</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 10px' }}>Warehouse Check</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.lines.map((line) => {
                      const invItem = inventory.find((i) => i.sku === line.sku);
                      const avail = invItem ? invItem.onHand - invItem.reserved : 0;
                      const enough = selectedOrder.status !== 'PENDING' || avail >= line.qty;

                      return (
                        <tr key={line.sku} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 800 }}>{line.sku}</td>
                          <td style={{ padding: '9px 12px' }}>{line.name}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{line.qty}</td>
                          <td style={{ padding: '9px 10px' }}>
                            {selectedOrder.status === 'PENDING' ? (
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: enough ? '#059669' : '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                {!enough && <AlertTriangle size={11} />}
                                {enough ? `In Stock (${avail} ready)` : `Low (${avail} ready)`}
                              </span>
                            ) : (
                              <span style={{ fontSize: '10.5px', color: '#475569', fontFamily: 'monospace' }}>
                                {selectedOrder.status === 'ALLOCATED' ? 'Reserved' : 'Fulfilled'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                            ${(line.qty * line.unitPrice).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Carrier & Tracking Entry when Ready to Ship */}
              {selectedOrder.status === 'ALLOCATED' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#1E40AF', marginBottom: '3px' }}>Shipping Carrier</label>
                    <input value={carrierInput} onChange={(e) => setCarrierInput(e.target.value)} style={{ width: '100%', padding: '6px 9px', border: '1px solid #93C5FD', borderRadius: '6px', backgroundColor: '#FFFFFF' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#1E40AF', marginBottom: '3px' }}>Tracking Number</label>
                    <input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} style={{ width: '100%', padding: '6px 9px', border: '1px solid #93C5FD', borderRadius: '6px', backgroundColor: '#FFFFFF', fontFamily: 'monospace' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                  Total: ${selectedOrder.totalAmount.toLocaleString()} USD
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      type="button"
                      data-testid="erp-allocate-order-btn"
                      onClick={() => onAdvanceStatus(selectedOrder.id, 'ALLOCATED')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <PackageCheck size={14} />
                      <span>Step 2: Reserve Stock</span>
                    </button>
                  )}
                  {selectedOrder.status === 'ALLOCATED' && (
                    <button
                      type="button"
                      data-testid="erp-dispatch-order-btn"
                      onClick={() =>
                        onAdvanceStatus(selectedOrder.id, 'DISPATCHED', {
                          carrier: carrierInput.trim() || 'DHL Air Express',
                          trackingNumber: trackingInput.trim() || `TRK-${Date.now().toString().slice(-6)}`
                        })
                      }
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <Truck size={14} color="#34D399" />
                      <span>Step 3: Ship & Create Invoice</span>
                    </button>
                  )}
                  {(selectedOrder.status === 'DISPATCHED' || selectedOrder.status === 'COMPLETED') && (
                    <button
                      type="button"
                      onClick={() => onViewLinkedInvoice(selectedOrder.orderNumber)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 12px', backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <FileText size={13} color="#2563EB" />
                      <span>View Invoice</span>
                    </button>
                  )}
                  {selectedOrder.status === 'DISPATCHED' && (
                    <button
                      type="button"
                      onClick={() => onAdvanceStatus(selectedOrder.id, 'COMPLETED')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Step 4: Mark Delivered</span>
                    </button>
                  )}
                  {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'ALLOCATED') && (
                    <button
                      type="button"
                      onClick={() => onAdvanceStatus(selectedOrder.id, 'CANCELLED')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <XCircle size={14} />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Item Sales Order Builder Modal */}
      {isNewModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', maxWidth: '580px', width: '100%', border: '1px solid #CBD5E1', overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800 }}>Create New Order</span>
              <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmitOrder} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', overflowY: 'auto' }}>
              {/* Quick Fill From Existing Customer */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '9px 10px', borderRadius: '7px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                  Quick-Fill Existing Customer (optional)
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="">-- Choose a saved customer account --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.contactName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Company / Grower Name *</label>
                <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Pahang Berry Bay Sdn Bhd" style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Contact Person *</label>
                  <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Site Engineer" style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Email</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="ops@farm.com" style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Delivery Address</label>
                <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Facility loading bay address" style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Order Source</label>
                  <select value={source} onChange={(e) => setSource(e.target.value as OrderSource)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    <option value="Web Store">Web Store</option>
                    <option value="Commercial Quote">Commercial Quote</option>
                    <option value="Distributor PO">Distributor PO</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Ship From Hub</label>
                  <select value={entityId} onChange={(e) => setEntityId(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    <option value="MY-OPS">MY-OPS (KUL)</option>
                    <option value="NZ-HQ">NZ-HQ (AKL)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Facility Voltage</label>
                  <select value={voltageSpec} onChange={(e) => setVoltageSpec(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    <option value="240VAC 50Hz">240VAC 50Hz</option>
                    <option value="110VAC 60Hz">110VAC 60Hz</option>
                    <option value="24VAC / Low Voltage">24VAC</option>
                  </select>
                </div>
              </div>

              {/* Multi-Item Lines */}
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>Order Items ({draftLines.length})</span>
                  <button
                    type="button"
                    onClick={handleAddDraftLine}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 8px', backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus size={11} color="#34D399" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {draftLines.map((line, idx) => {
                    const invItem = inventory.find((i) => i.sku === line.sku);
                    const avail = invItem ? invItem.onHand - invItem.reserved : 0;
                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 72px auto', gap: '6px', alignItems: 'center' }}>
                        <select
                          value={line.sku}
                          onChange={(e) => handleUpdateDraftLine(idx, e.target.value, line.qty)}
                          style={{ width: '100%', padding: '7px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '11.5px' }}
                        >
                          {inventory.map((i) => (
                            <option key={i.sku} value={i.sku}>
                              {i.sku} — ${i.unitRetail} ({i.onHand - i.reserved} ready)
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={line.qty}
                          onChange={(e) => handleUpdateDraftLine(idx, line.sku, Number(e.target.value))}
                          style={{ width: '100%', padding: '7px', border: `1px solid ${line.qty > avail ? '#F59E0B' : '#CBD5E1'}`, borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}
                        />
                        <button
                          type="button"
                          disabled={draftLines.length <= 1}
                          onClick={() => handleRemoveDraftLine(idx)}
                          style={{ padding: '6px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: draftLines.length <= 1 ? 'not-allowed' : 'pointer', opacity: draftLines.length <= 1 ? 0.4 : 1 }}
                        >
                          <Trash2 size={13} color="#DC2626" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                  Order Total: ${draftTotal.toLocaleString()} USD
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ padding: '7px 12px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '7px 14px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Create Order</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
