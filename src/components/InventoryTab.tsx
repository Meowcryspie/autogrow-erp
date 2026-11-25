import React, { useState } from 'react';
import { Package, Plus, Minus, ShoppingBag } from 'lucide-react';
import type { InventoryItem, InventoryCategory } from '../types/erp';

interface InventoryTabProps {
  inventory: InventoryItem[];
  onAdjustStock: (sku: string, delta: number) => void;
  onQuickCreatePo: (item: InventoryItem) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory,
  onAdjustStock,
  onQuickCreatePo
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | InventoryCategory>('ALL');

  const filtered = categoryFilter === 'ALL'
    ? inventory
    : inventory.filter((i) => i.category === categoryFilter);

  const totalInventoryCost = filtered.reduce((sum, i) => sum + i.onHand * i.unitCost, 0);

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
              Warehouse Inventory & Hardware Stock Ledger
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B' }}>
              {filtered.length} SKUs tracked · Stock Valuation (Cost): <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>${totalInventoryCost.toLocaleString()}</strong>
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
              {cat}
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '11px 16px' }}>SKU / Hardware Item</th>
                <th style={{ padding: '11px 12px' }}>Bin Location</th>
                <th style={{ padding: '11px 12px', textAlign: 'right' }}>On Hand</th>
                <th style={{ padding: '11px 12px', textAlign: 'right' }}>Reserved</th>
                <th style={{ padding: '11px 12px', textAlign: 'right' }}>Available</th>
                <th style={{ padding: '11px 12px', textAlign: 'right' }}>Cost / Retail</th>
                <th style={{ padding: '11px 12px' }}>Stock Health</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>Controls</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const available = item.onHand - item.reserved;
                const isLow = available <= item.reorderPoint;
                const isCritical = available <= Math.floor(item.reorderPoint / 2);

                return (
                  <tr key={item.sku} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{item.sku}</div>
                      <div style={{ fontSize: '11.5px', color: '#475569' }}>{item.name}</div>
                    </td>
                    <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                      <div>{item.warehouseBin}</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>{item.entityId}</div>
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{item.onHand}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#64748B' }}>{item.reserved}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: isLow ? '#D97706' : '#059669' }}>
                      {available}
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>
                      <span style={{ color: '#64748B' }}>${item.unitCost}</span> / <strong>${item.unitRetail}</strong>
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
                        {isCritical ? 'CRITICAL' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.sku, -1)}
                          title="Decrement stock count"
                          style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                        >
                          <Minus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.sku, 1)}
                          title="Increment stock count"
                          style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                        >
                          <Plus size={11} />
                        </button>
                        {isLow && (
                          <button
                            type="button"
                            onClick={() => onQuickCreatePo(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              marginLeft: '4px',
                              borderRadius: '5px',
                              border: 'none',
                              backgroundColor: '#0F172A',
                              color: '#34D399',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            <ShoppingBag size={11} />
                            <span>Restock PO</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
