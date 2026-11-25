import React from 'react';
import { Users, Plus, MapPin, Mail, Phone } from 'lucide-react';
import type { ErpCustomer, ErpSalesOrder, ErpInvoice } from '../types/erp';

interface CustomersTabProps {
  customers: ErpCustomer[];
  orders: ErpSalesOrder[];
  invoices: ErpInvoice[];
  onCreateOrderForCustomer: (customer: ErpCustomer) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  orders,
  invoices,
  onCreateOrderForCustomer
}) => {
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
          <Users size={18} color="#0F172A" />
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
              Grower Accounts & Commercial Customers
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B' }}>
              Customer shipping details, facility voltage specs, lifetime order totals, and unpaid balances.
            </p>
          </div>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
          {customers.length} ACCOUNTS
        </span>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '10.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '11px 16px' }}>Grower / Company</th>
                <th style={{ padding: '11px 14px' }}>Primary Contact</th>
                <th style={{ padding: '11px 14px' }}>Region & Voltage</th>
                <th style={{ padding: '11px 14px', textAlign: 'right' }}>Orders / Lifetime Spend</th>
                <th style={{ padding: '11px 14px', textAlign: 'right' }}>Open Balance</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => {
                const custOrders = orders.filter((o) => o.companyName === cust.companyName && o.status !== 'CANCELLED');
                const lifetimeSpend = custOrders.reduce((s, o) => s + o.totalAmount, 0);
                const openBal = invoices
                  .filter((inv) => inv.customerCompany === cust.companyName && inv.status !== 'PAID')
                  .reduce((s, inv) => s + inv.amount, 0);

                return (
                  <tr key={cust.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{cust.companyName}</div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1' }}>
                        {cust.accountTier}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{cust.contactName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
                        <Mail size={10} />
                        <span>{cust.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#94A3B8' }}>
                        <Phone size={10} />
                        <span>{cust.phone}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#0F172A', fontWeight: 600 }}>
                        <MapPin size={11} color="#10B981" />
                        <span>{cust.region}</span>
                      </div>
                      <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#64748B', marginTop: '2px' }}>
                        {cust.preferredEntity} · {cust.voltageSpec}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>${lifetimeSpend.toLocaleString()}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>{custOrders.length} active orders</div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: openBal > 0 ? '#D97706' : '#059669' }}>
                      ${openBal.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        data-testid={`erp-customer-new-order-${cust.id}`}
                        onClick={() => onCreateOrderForCustomer(cust)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 11px',
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} color="#34D399" />
                        <span>New Order</span>
                      </button>
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
