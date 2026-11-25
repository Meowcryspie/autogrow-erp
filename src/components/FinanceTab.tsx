import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Eye, Printer, X } from 'lucide-react';
import type { ErpInvoice, ErpPurchaseOrder } from '../types/erp';

interface FinanceTabProps {
  invoices: ErpInvoice[];
  purchaseOrders: ErpPurchaseOrder[];
  focusedOrderNumber: string | null;
  onClearFocusedOrder: () => void;
  onMarkPaid: (invoiceId: string, method: NonNullable<ErpInvoice['paymentMethod']>) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  invoices,
  purchaseOrders,
  focusedOrderNumber,
  onClearFocusedOrder,
  onMarkPaid
}) => {
  const [ledgerMode, setLedgerMode] = useState<'receivables' | 'payables'>('receivables');
  const [previewInvoice, setPreviewInvoice] = useState<ErpInvoice | null>(null);
  const [payMethod, setPayMethod] = useState<NonNullable<ErpInvoice['paymentMethod']>>('Bank Wire');

  useEffect(() => {
    if (focusedOrderNumber) {
      const match = invoices.find((i) => i.orderNumber === focusedOrderNumber);
      if (match) {
        setLedgerMode('receivables');
        setPreviewInvoice(match);
      }
      onClearFocusedOrder();
    }
  }, [focusedOrderNumber, invoices, onClearFocusedOrder]);

  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const totalOpen = invoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);
  const overdueTotal = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0);
  const totalSupplierBills = purchaseOrders.reduce((s, p) => s + p.totalCost, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Plain-English Money In / Money Out KPI Strip */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Money Collected (Paid)</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#059669', marginTop: '4px' }}>
            ${totalPaid.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Awaiting Customer Payment</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            ${totalOpen.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Overdue Invoices</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: overdueTotal > 0 ? '#DC2626' : '#64748B', marginTop: '4px' }}>
            ${overdueTotal.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Supplier Bills (Money Out)</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#475569', marginTop: '4px' }}>
            ${totalSupplierBills.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Customer Invoices vs Supplier Bills */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#0F172A" />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              {ledgerMode === 'receivables' ? 'Customer Invoices (Money In)' : 'Supplier Purchase Bills (Money Out)'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setLedgerMode('receivables')}
              style={{
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                border: ledgerMode === 'receivables' ? '1px solid #0F172A' : '1px solid #CBD5E1',
                backgroundColor: ledgerMode === 'receivables' ? '#0F172A' : '#FFFFFF',
                color: ledgerMode === 'receivables' ? '#FFFFFF' : '#475569'
              }}
            >
              Customer Invoices ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setLedgerMode('payables')}
              style={{
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                border: ledgerMode === 'payables' ? '1px solid #0F172A' : '1px solid #CBD5E1',
                backgroundColor: ledgerMode === 'payables' ? '#0F172A' : '#FFFFFF',
                color: ledgerMode === 'payables' ? '#FFFFFF' : '#475569'
              }}
            >
              Supplier Bills ({purchaseOrders.length})
            </button>
          </div>
        </div>

        {ledgerMode === 'receivables' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '11px 16px' }}>Invoice #</th>
                  <th style={{ padding: '11px 14px' }}>Order Ref</th>
                  <th style={{ padding: '11px 14px' }}>Customer Company</th>
                  <th style={{ padding: '11px 14px' }}>Issued → Due</th>
                  <th style={{ padding: '11px 14px' }}>Status</th>
                  <th style={{ padding: '11px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '11px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#2563EB', fontWeight: 700 }}>
                      {inv.orderNumber}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                      {inv.customerCompany}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                      {inv.issuedDate} → {inv.dueDate}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: inv.status === 'PAID' ? '#ECFDF5' : inv.status === 'OVERDUE' ? '#FEF2F2' : '#FEF3C7',
                        color: inv.status === 'PAID' ? '#065F46' : inv.status === 'OVERDUE' ? '#DC2626' : '#B45309',
                        border: '1px solid #CBD5E1'
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>
                      ${inv.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          data-testid={`erp-view-invoice-${inv.id}`}
                          onClick={() => setPreviewInvoice(inv)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 9px',
                            backgroundColor: '#FFFFFF',
                            color: '#0F172A',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        {inv.status !== 'PAID' && (
                          <button
                            type="button"
                            data-testid={`erp-mark-paid-${inv.id}`}
                            onClick={() => onMarkPaid(inv.id, 'Bank Wire')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              backgroundColor: '#0F172A',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            <CheckCircle2 size={12} color="#34D399" />
                            <span>Mark Paid</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '11px 16px' }}>PO Reference</th>
                  <th style={{ padding: '11px 14px' }}>Supplier</th>
                  <th style={{ padding: '11px 14px' }}>Goods Status</th>
                  <th style={{ padding: '11px 14px' }}>Order Date</th>
                  <th style={{ padding: '11px 16px', textAlign: 'right' }}>Bill Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800 }}>{po.poNumber}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>{po.supplierName}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px' }}>{po.status}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748B' }}>{po.createdAt}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>${po.totalCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Preview & Payment Modal */}
      {previewInvoice && (
        <div
          data-testid="erp-invoice-preview-modal"
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
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', maxWidth: '580px', width: '100%', border: '1px solid #CBD5E1', overflow: 'hidden', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '14px 20px', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace' }}>
                  TAX INVOICE · {previewInvoice.invoiceNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Autogrow Systems Ltd · Linked to {previewInvoice.orderNumber}
                </div>
              </div>
              <button type="button" onClick={() => setPreviewInvoice(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Bill To</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>{previewInvoice.customerCompany}</div>
                  {previewInvoice.billingAddress && <div style={{ color: '#64748B', fontSize: '11px' }}>{previewInvoice.billingAddress}</div>}
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Issued: {previewInvoice.issuedDate}</div>
                  <div style={{ fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>Due: {previewInvoice.dueDate}</div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: previewInvoice.status === 'PAID' ? '#ECFDF5' : '#FEF3C7',
                    color: previewInvoice.status === 'PAID' ? '#065F46' : '#B45309'
                  }}>
                    {previewInvoice.status}
                  </span>
                </div>
              </div>

              {previewInvoice.lines && previewInvoice.lines.length > 0 && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', fontSize: '10.5px', color: '#475569' }}>
                        <th style={{ padding: '8px 12px' }}>SKU</th>
                        <th style={{ padding: '8px 12px' }}>Item</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewInvoice.lines.map((l) => (
                        <tr key={l.sku} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700 }}>{l.sku}</td>
                          <td style={{ padding: '8px 12px' }}>{l.name}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{l.qty}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>${(l.qty * l.unitPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                    Amount Due: ${previewInvoice.amount.toLocaleString()} USD
                  </div>
                  {previewInvoice.status === 'PAID' && (
                    <div style={{ fontSize: '11px', color: '#059669' }}>
                      Paid via {previewInvoice.paymentMethod || 'Bank Wire'} {previewInvoice.paidDate ? `on ${previewInvoice.paidDate}` : ''}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 11px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Printer size={13} />
                    <span>Print / PDF</span>
                  </button>

                  {previewInvoice.status !== 'PAID' && (
                    <>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as any)}
                        style={{ padding: '7px 8px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '11.5px' }}
                      >
                        <option value="Bank Wire">Bank Wire</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Commercial Net-14">Commercial Net-14</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          onMarkPaid(previewInvoice.id, payMethod);
                          setPreviewInvoice((prev) => (prev ? { ...prev, status: 'PAID', paymentMethod: payMethod } : null));
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 13px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Record Payment</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
