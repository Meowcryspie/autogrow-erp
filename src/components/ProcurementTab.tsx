import React, { useState } from 'react';
import { Truck, CheckCircle2, Plus, X } from 'lucide-react';
import type { ErpPurchaseOrder, InventoryItem, BusinessEntityId } from '../types/erp';

interface ProcurementTabProps {
  purchaseOrders: ErpPurchaseOrder[];
  inventory: InventoryItem[];
  onReceivePo: (poId: string) => void;
  onCreatePo: (po: Omit<ErpPurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => void;
}

export const ProcurementTab: React.FC<ProcurementTabProps> = ({
  purchaseOrders,
  inventory,
  onReceivePo,
  onCreatePo
}) => {
  const [isNewPoOpen, setIsNewPoOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState(inventory[0]?.sku || 'EC-SENSE-PLUS');
  const [qty, setQty] = useState(20);
  const [entityId, setEntityId] = useState<Exclude<BusinessEntityId, 'ALL'>>('NZ-HQ');

  const handleSubmitPo = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find((i) => i.sku === selectedSku) || inventory[0];
    if (!item) return;
    const cleanQty = Math.max(1, Number(qty) || 1);

    onCreatePo({
      entityId,
      supplierName: item.supplierName,
      status: 'ORDERED',
      expectedEta: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      lines: [{ sku: item.sku, name: item.name, qty: cleanQty, unitCost: item.unitCost }],
      totalCost: cleanQty * item.unitCost
    });
    setIsNewPoOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Truck size={18} color="#0F172A" />
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Procurement & Supplier Purchase Orders
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B' }}>
              Track inbound hardware components from PCB assembly & probe manufacturers. Receiving goods automatically replenishes stock.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewPoOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 13px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <Plus size={14} color="#34D399" />
          <span>New Purchase Order</span>
        </button>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '11px 16px' }}>PO Number</th>
                <th style={{ padding: '11px 14px' }}>Supplier</th>
                <th style={{ padding: '11px 14px' }}>Inbound Items</th>
                <th style={{ padding: '11px 14px' }}>Expected ETA</th>
                <th style={{ padding: '11px 14px' }}>Status</th>
                <th style={{ padding: '11px 14px', textAlign: 'right' }}>Total Cost</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>Receiving</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                    <div>{po.poNumber}</div>
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 500 }}>{po.entityId}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>{po.supplierName}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#334155' }}>
                    {po.lines.map((l) => `${l.qty}× ${l.sku}`).join(', ')}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>{po.expectedEta}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: po.status === 'RECEIVED' ? '#ECFDF5' : po.status === 'IN_TRANSIT' ? '#DBEAFE' : '#FEF3C7',
                      color: po.status === 'RECEIVED' ? '#065F46' : po.status === 'IN_TRANSIT' ? '#1D4ED8' : '#B45309',
                      border: '1px solid #CBD5E1'
                    }}>
                      {po.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>
                    ${po.totalCost.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {po.status !== 'RECEIVED' ? (
                      <button
                        type="button"
                        data-testid={`erp-receive-po-${po.id}`}
                        onClick={() => onReceivePo(po.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>Receive Goods</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>Stocked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isNewPoOpen && (
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
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', maxWidth: '420px', width: '100%', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800 }}>Issue Supplier Purchase Order</span>
              <button type="button" onClick={() => setIsNewPoOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmitPo} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>SKU to Replenish</label>
                <select value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                  {inventory.map((i) => (
                    <option key={i.sku} value={i.sku}>{i.sku} — {i.supplierName} (${i.unitCost}/unit)</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>Quantity</label>
                  <input type="number" min={1} max={500} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>Receiving Hub</label>
                  <select value={entityId} onChange={(e) => setEntityId(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                    <option value="NZ-HQ">NZ-HQ (AKL)</option>
                    <option value="MY-OPS">MY-OPS (KUL)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsNewPoOpen(false)} style={{ padding: '7px 12px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '7px 14px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Issue Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
