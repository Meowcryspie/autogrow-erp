import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import type { ErpInvoice } from '../types/erp';

interface FinanceTabProps {
  invoices: ErpInvoice[];
  onMarkPaid: (invoiceId: string) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ invoices, onMarkPaid }) => {
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const totalOpen = invoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);
  const overdueTotal = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Collected AR (Paid)</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#059669', marginTop: '4px' }}>
            ${totalPaid.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Open Receivables</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: '4px' }}>
            ${totalOpen.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Overdue Balance</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: overdueTotal > 0 ? '#DC2626' : '#64748B', marginTop: '4px' }}>
            ${overdueTotal.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="#0F172A" />
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
            Accounts Receivable & Sales Invoices
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '11px 16px' }}>Invoice #</th>
                <th style={{ padding: '11px 14px' }}>Linked Order</th>
                <th style={{ padding: '11px 14px' }}>Customer Company</th>
                <th style={{ padding: '11px 14px' }}>Issued / Due</th>
                <th style={{ padding: '11px 14px' }}>Status</th>
                <th style={{ padding: '11px 14px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>Reconcile</th>
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
                    {inv.status !== 'PAID' ? (
                      <button
                        type="button"
                        data-testid={`erp-mark-paid-${inv.id}`}
                        onClick={() => onMarkPaid(inv.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
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
                    ) : (
                      <span style={{ fontSize: '11px', color: '#059669', fontFamily: 'monospace', fontWeight: 700 }}>Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
