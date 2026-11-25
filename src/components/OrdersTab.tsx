import React, { useState } from 'react';
import { Plus, Eye, PackageCheck, Truck, CheckCircle2, XCircle, X } from 'lucide-react';
import type { ErpSalesOrder, ErpOrderStatus, OrderSource, InventoryItem, BusinessEntityId } from '../types/erp';

interface OrdersTabProps {
  orders: ErpSalesOrder[];
  inventory: InventoryItem[];
  selectedOrder: ErpSalesOrder | null;
  onSelectOrder: (order: ErpSalesOrder | null) => void;
  onAdvanceStatus: (orderId: string, nextStatus: ErpOrderStatus) => void;
  onCreateOrder: (newOrder: Omit<ErpSalesOrder, 'id' | 'orderNumber' | 'createdAt'>) => void;
}

const STATUS_BADGE: Record<ErpOrderStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  ALLOCATED: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  DISPATCHED: { bg: '#EFF6FF', text: '#0369A1', border: '#BAE6FD' },
  COMPLETED: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  CANCELLED: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  inventory,
  selectedOrder,
  onSelectOrder,
  onAdvanceStatus,
  onCreateOrder
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | ErpOrderStatus>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Order Form State
  const [companyName, setCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [source, setSource] = useState<OrderSource>('Web Store');
  const [entityId, setEntityId] = useState<Exclude<BusinessEntityId, 'ALL'>>('MY-OPS');
  const [voltageSpec, setVoltageSpec] = useState<ErpSalesOrder['voltageSpec']>('240VAC 50Hz');
  const [selectedSku, setSelectedSku] = useState<string>(inventory[0]?.sku || 'MGC-Pro');
  const [qty, setQty] = useState<number>(2);

  const visibleOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const skuItem = inventory.find((i) => i.sku === selectedSku) || inventory[0];
    if (!companyName.trim() || !customerName.trim() || !skuItem) return;

    const cleanQty = Math.max(1, Number(qty) || 1);
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
      lines: [{ sku: skuItem.sku, name: skuItem.name, qty: cleanQty, unitPrice: skuItem.unitRetail }],
      totalAmount: cleanQty * skuItem.unitRetail,
      notes: `Entered manually via ERP (${source}).`
    });
    setCompanyName('');
    setCustomerName('');
    setCustomerEmail('');
    setShippingAddress('');
    setIsNewModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Filter Strip */}
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
            Sales Orders & Fulfillment Pipeline
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B' }}>
            Consolidated intake from Web Store checkouts, Commercial Quotes, and Distributor Purchase Orders.
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
              {st}
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '11px 16px' }}>Order #</th>
                <th style={{ padding: '11px 14px' }}>Source / Entity</th>
                <th style={{ padding: '11px 14px' }}>Customer / Facility</th>
                <th style={{ padding: '11px 14px' }}>Line Items</th>
                <th style={{ padding: '11px 14px' }}>Status</th>
                <th style={{ padding: '11px 14px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((ord) => {
                const badge = STATUS_BADGE[ord.status];
                return (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                      <div>{ord.orderNumber}</div>
                      <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>{ord.createdAt}</div>
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
                        {ord.status}
                      </span>
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
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Fulfillment Modal */}
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
            maxWidth: '620px',
            width: '100%',
            border: '1px solid #CBD5E1',
            overflow: 'hidden',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '16px 20px',
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
                onClick={() => onSelectOrder(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Contact</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedOrder.customerName}</div>
                  <div style={{ color: '#64748B' }}>{selectedOrder.customerEmail}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Shipping Destination</div>
                  <div style={{ color: '#0F172A', fontSize: '11.5px' }}>{selectedOrder.shippingAddress}</div>
                </div>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', fontSize: '10.5px', color: '#475569' }}>
                      <th style={{ padding: '8px 12px' }}>SKU</th>
                      <th style={{ padding: '8px 12px' }}>Hardware Description</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.lines.map((line) => (
                      <tr key={line.sku} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 800 }}>{line.sku}</td>
                        <td style={{ padding: '9px 12px' }}>{line.name}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{line.qty}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                          ${(line.qty * line.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                  Order Total: ${selectedOrder.totalAmount.toLocaleString()} USD
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      type="button"
                      data-testid="erp-allocate-order-btn"
                      onClick={() => onAdvanceStatus(selectedOrder.id, 'ALLOCATED')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <PackageCheck size={14} />
                      <span>Allocate Stock</span>
                    </button>
                  )}
                  {selectedOrder.status === 'ALLOCATED' && (
                    <button
                      type="button"
                      data-testid="erp-dispatch-order-btn"
                      onClick={() => onAdvanceStatus(selectedOrder.id, 'DISPATCHED')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <Truck size={14} color="#34D399" />
                      <span>Dispatch & Issue Invoice</span>
                    </button>
                  )}
                  {selectedOrder.status === 'DISPATCHED' && (
                    <button
                      type="button"
                      onClick={() => onAdvanceStatus(selectedOrder.id, 'COMPLETED')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Completed</span>
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

      {/* New Sales Order Modal */}
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
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', maxWidth: '480px', width: '100%', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800 }}>Create Sales Order</span>
              <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmitOrder} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Company / Grower Estate *</label>
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
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Shipping Address</label>
                <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Facility loading bay address" style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Channel</label>
                  <select value={source} onChange={(e) => setSource(e.target.value as OrderSource)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    <option value="Web Store">Web Store</option>
                    <option value="Commercial Quote">Commercial Quote</option>
                    <option value="Distributor PO">Distributor PO</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Fulfillment Hub</label>
                  <select value={entityId} onChange={(e) => setEntityId(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    <option value="MY-OPS">MY-OPS (KUL)</option>
                    <option value="NZ-HQ">NZ-HQ (AKL)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Voltage</label>
                  <select value={voltageSpec} onChange={(e) => setVoltageSpec(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    <option value="240VAC 50Hz">240VAC 50Hz</option>
                    <option value="110VAC 60Hz">110VAC 60Hz</option>
                    <option value="24VAC / Low Voltage">24VAC</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Hardware SKU</label>
                  <select value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    {inventory.map((i) => (
                      <option key={i.sku} value={i.sku}>{i.sku} — {i.name} (${i.unitRetail})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '3px' }}>Qty</label>
                  <input type="number" min={1} max={100} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ padding: '7px 12px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '7px 14px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Create Sales Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
