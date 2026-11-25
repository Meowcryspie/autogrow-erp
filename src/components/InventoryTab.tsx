import React, { useState } from 'react';
import { Package, Plus, Minus, ShoppingBag, X } from 'lucide-react';
import type { InventoryItem, InventoryCategory, ErpPurchaseOrder } from '../types/erp';

interface InventoryTabProps {
  inventory: InventoryItem[];
  purchaseOrders: ErpPurchaseOrder[];
  onAdjustStock: (sku: string, delta: number) => void;
  onCreateRestockPo: (item: InventoryItem, qty: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory,
  purchaseOrders,
  onAdjustStock,
  onCreateRestockPo
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | InventoryCategory>('ALL');
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);

  const filtered = categoryFilter === 'ALL'
    ? inventory
    : inventory.filter((i) => i.category === categoryFilter);

  const totalInventoryCost = filtered.reduce((sum, i) => sum + i.onHand * i.unitCost, 0);

  const handleOpenRestock = (item: InventoryItem) => {
    setRestockTarget(item);
    setRestockQty(Math.max(10, item.reorderPoint * 2));
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget) return;
    onCreateRestockPo(restockTarget, Math.max(1, restockQty));
    setRestockTarget(null);
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
          <Package size={18} color="#0F172A" />
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Warehouse Stock & Reorder Levels
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B' }}>
              <strong>Ready to Sell</strong> = In Warehouse minus Reserved for Open Orders · Total Stock Value: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>${totalInventoryCost.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'Controllers', 'Dosing Skids', 'Sensory Pods', 'Probes & Spares'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                border: categoryFilter === cat ? '1px solid #0F172A' : '1px solid #E2E8F0',
                backgroundColor: categoryFilter === cat ? '#0F172A' : '#F8FAFC',
                color: categoryFilter === cat ? '#FFFFFF' : '#475569'
              }}
            >
              {cat === 'ALL' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            No inventory items match this filter.{' '}
            <button type="button" onClick={() => setCategoryFilter('ALL')} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
              Show all items
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '11px 16px' }}>Product & SKU</th>
                  <th style={{ padding: '11px 12px' }}>Shelf / Hub</th>
                  <th style={{ padding: '11px 12px', textAlign: 'right' }}>In Warehouse</th>
                  <th style={{ padding: '11px 12px', textAlign: 'right' }}>Reserved</th>
                  <th style={{ padding: '11px 12px', textAlign: 'right' }}>Ready to Sell</th>
                  <th style={{ padding: '11px 12px' }}>Incoming PO</th>
                  <th style={{ padding: '11px 12px' }}>Status</th>
                  <th style={{ padding: '11px 16px', textAlign: 'right' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const available = item.onHand - item.reserved;
                  const isLow = available <= item.reorderPoint;
                  const isCritical = available <= Math.floor(item.reorderPoint / 2);
                  const inboundLines = purchaseOrders
                    .filter((po) => po.status !== 'RECEIVED')
                    .flatMap((po) =>
                      po.lines
                        .filter((l) => l.sku === item.sku)
                        .map((l) => ({ poNumber: po.poNumber, qty: l.qty, eta: po.expectedEta }))
                    );
                  const inboundQty = inboundLines.reduce((s, l) => s + l.qty, 0);

                  return (
                    <tr key={item.sku} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{item.sku}</div>
                        <div style={{ fontSize: '11.5px', color: '#475569' }}>{item.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
                          Cost: ${item.unitCost} · Retail: ${item.unitRetail}
                        </div>
                      </td>
                      <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                        <div>{item.warehouseBin}</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8' }}>{item.entityId}</div>
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{item.onHand}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#64748B' }}>{item.reserved}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: isLow ? '#D97706' : '#059669' }}>
                        {available}
                        <div style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 500 }}>Min {item.reorderPoint}</div>
                      </td>
                      <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontSize: '11px' }}>
                        {inboundQty > 0 ? (
                          <span style={{ color: '#2563EB', fontWeight: 700 }}>
                            +{inboundQty} ({inboundLines[0].poNumber})
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: isCritical ? '#FEF2F2' : isLow ? '#FEF3C7' : '#ECFDF5',
                          color: isCritical ? '#DC2626' : isLow ? '#B45309' : '#065F46',
                          border: `1px solid ${isCritical ? '#FECACA' : isLow ? '#FDE68A' : '#A7F3D0'}`
                        }}>
                          {isCritical ? 'ORDER NOW' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(item.sku, -1)}
                            title="Count down by 1"
                            style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                          >
                            <Minus size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(item.sku, 1)}
                            title="Count up by 1"
                            style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                          >
                            <Plus size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRestock(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 9px',
                              marginLeft: '4px',
                              borderRadius: '5px',
                              border: isLow ? 'none' : '1px solid #CBD5E1',
                              backgroundColor: isLow ? '#0F172A' : '#FFFFFF',
                              color: isLow ? '#34D399' : '#0F172A',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            <ShoppingBag size={11} />
                            <span>Restock</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Restock Modal */}
      {restockTarget && (
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
              <span style={{ fontSize: '14px', fontWeight: 800 }}>Order More Stock ({restockTarget.sku})</span>
              <button type="button" onClick={() => setRestockTarget(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleConfirmRestock} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A' }}>{restockTarget.name}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Supplier: <strong>{restockTarget.supplierName}</strong> · Unit Cost: <strong>${restockTarget.unitCost}</strong>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>Quantity to Order</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>
              <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontWeight: 800 }}>
                Estimated PO Cost: ${(Math.max(1, restockQty) * restockTarget.unitCost).toLocaleString()} USD
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setRestockTarget(null)} style={{ padding: '7px 12px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '7px 14px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>Send Supplier PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
