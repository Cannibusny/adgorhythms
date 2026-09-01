import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Target,
  CheckCircle, Clock, BarChart2,
  Users, Award,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { useToast } from '../hooks/useToast';
import type { Client, Revenue } from '../types';

const FINANCIAL_GOALS = [
  { label: 'First Paying Client', target: 1, unit: 'client', month: 1 },
  { label: '$3,000 MRR', target: 3000, unit: '$', month: 3 },
  { label: '$10,000 MRR', target: 10000, unit: '$', month: 6 },
  { label: '$25,000 MRR', target: 25000, unit: '$', month: 12 },
];

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    overdue: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

export default function RevenueTracker() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [projectionClients, setProjectionClients] = useState(3);

  useEffect(() => {
    setClients(storage.getClients());
    setRevenue(storage.getRevenue());
  }, []);

  const activeClients = clients.filter((c) => c.stage === 'active_client');
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthlyValue ?? 0), 0);
  const avgPackage = activeClients.length > 0 ? mrr / activeClients.length : 2500;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);

  const thisMonthRevenue = revenue
    .filter((r) => r.month === currentMonth)
    .reduce((sum, r) => sum + r.amount, 0);
  const lastMonthRevenue = revenue
    .filter((r) => r.month === lastMonth)
    .reduce((sum, r) => sum + r.amount, 0);

  const monthChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  const agency = storage.getAgency();
  const monthlyGoal = agency?.monthlyGoal ?? 10000;
  const goalProgress = Math.min((mrr / monthlyGoal) * 100, 100);

  const projectedMRR = mrr + projectionClients * avgPackage;

  const packageDistribution = ['starter', 'growth', 'scale', 'enterprise'].map((tier) => ({
    tier,
    count: activeClients.filter((c) => c.packageTier === tier).length,
    value: activeClients.filter((c) => c.packageTier === tier).reduce((s, c) => s + (c.monthlyValue ?? 0), 0),
  }));

  const lifetimeByClient = activeClients.map((client) => {
    const total = revenue.filter((r) => r.clientId === client.id).reduce((s, r) => s + r.amount, 0);
    const months = revenue.filter((r) => r.clientId === client.id).length;
    return { client, total, months };
  }).sort((a, b) => b.total - a.total);

  const updatePaymentStatus = (id: string, status: Revenue['status']) => {
    storage.updateRevenue(id, { status, paidDate: status === 'paid' ? new Date().toISOString() : undefined });
    setRevenue(storage.getRevenue());
    addToast('Payment status updated!', 'success');
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">Revenue Tracker</h1>
        <p className="text-gray-500 mt-1 font-medium">Every dollar. Every client. Every month.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div
          className="col-span-3 rounded-2xl p-7 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #6C47FF 100%)' }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#00C896] blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Monthly Recurring Revenue</div>
                <div className="text-5xl font-black text-white">${mrr.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-2">
                  {monthChange >= 0 ? (
                    <div className="flex items-center gap-1 text-[#00C896] text-sm font-bold">
                      <TrendingUp size={14} />
                      +{monthChange.toFixed(1)}% vs last month
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-400 text-sm font-bold">
                      <TrendingDown size={14} />
                      {monthChange.toFixed(1)}% vs last month
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Goal Progress</div>
                <div className="text-2xl font-black text-white">{goalProgress.toFixed(0)}%</div>
                <div className="text-xs text-white/60">of ${monthlyGoal.toLocaleString()}</div>
              </div>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${goalProgress}%`,
                  background: 'linear-gradient(90deg, #00C896, #6C47FF)',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-white/40">$0</span>
              <span className="text-xs text-white/40">${monthlyGoal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
              <DollarSign size={18} className="text-[#00C896]" />
            </div>
            <h3 className="font-black text-[#1A1A2E]">This Month</h3>
          </div>
          <div className="text-3xl font-black text-[#1A1A2E]">${thisMonthRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">collected</div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-xs text-gray-500 font-medium">Last month</div>
            <div className="text-lg font-bold text-gray-400">${lastMonthRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
              <Users size={18} className="text-[#6C47FF]" />
            </div>
            <h3 className="font-black text-[#1A1A2E]">Revenue Projection</h3>
          </div>
          <div className="text-3xl font-black text-[#6C47FF]">${projectedMRR.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">projected MRR</div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-xs text-gray-500 font-medium mb-2">
              Add {projectionClients} more client{projectionClients !== 1 ? 's' : ''}
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={projectionClients}
              onChange={(e) => setProjectionClients(parseInt(e.target.value))}
              className="w-full accent-[#6C47FF]"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>0</span>
              <span>20 clients</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <BarChart2 size={18} className="text-amber-600" />
            </div>
            <h3 className="font-black text-[#1A1A2E]">Package Mix</h3>
          </div>
          <div className="space-y-3">
            {packageDistribution.map(({ tier, count }) => (
              <div key={tier} className="flex items-center gap-3">
                <div className="text-xs text-gray-500 w-16 capitalize">{tier}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6C47FF]"
                    style={{ width: activeClients.length > 0 ? `${(count / activeClients.length) * 100}%` : '0%' }}
                  />
                </div>
                <div className="text-xs font-bold text-[#1A1A2E] w-6 text-right">{count}</div>
              </div>
            ))}
            {activeClients.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No active clients</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-black text-[#1A1A2E]">Revenue by Client</h2>
        </div>
        {activeClients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <DollarSign size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No active clients yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Retained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeClients.map((client) => {
                  const clientRevenue = revenue.find((r) => r.clientId === client.id && r.month === currentMonth);
                  const months = revenue.filter((r) => r.clientId === client.id).length;
                  return (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1A1A2E] text-sm">{client.businessName}</div>
                        <div className="text-xs text-gray-400">{client.ownerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold capitalize text-[#6C47FF]">{client.packageTier}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-[#00C896]">${(client.monthlyValue ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          client.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          client.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {clientRevenue ? (
                          <div className="flex items-center gap-2">
                            <PaymentBadge status={clientRevenue.status} />
                            {clientRevenue.status !== 'paid' && (
                              <button
                                onClick={() => updatePaymentStatus(clientRevenue.id, 'paid')}
                                className="text-xs text-[#00C896] hover:text-emerald-700 font-semibold"
                              >
                                Mark paid
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">
                          {client.startDate ? new Date(client.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-[#1A1A2E]">{months} mo</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Award size={18} className="text-amber-500" />
            <h2 className="font-black text-[#1A1A2E]">Lifetime Value by Client</h2>
          </div>
          <div className="space-y-4">
            {lifetimeByClient.map(({ client, total, months }) => (
              <div key={client.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1A1A2E] truncate">{client.businessName}</div>
                  <div className="text-xs text-gray-400">{months} months</div>
                </div>
                <div className="text-sm font-black text-[#00C896]">${total.toLocaleString()}</div>
              </div>
            ))}
            {lifetimeByClient.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No revenue data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Target size={18} className="text-[#6C47FF]" />
            <h2 className="font-black text-[#1A1A2E]">Financial Milestones</h2>
          </div>
          <div className="space-y-4">
            {FINANCIAL_GOALS.map((goal) => {
              const current = goal.unit === 'client' ? activeClients.length : mrr;
              const progress = Math.min((current / goal.target) * 100, 100);
              const achieved = current >= goal.target;
              return (
                <div key={goal.label} className={`rounded-xl p-4 border ${achieved ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {achieved ? (
                        <CheckCircle size={14} className="text-[#00C896]" />
                      ) : (
                        <Clock size={14} className="text-gray-300" />
                      )}
                      <span className="text-sm font-bold text-[#1A1A2E]">{goal.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">Month {goal.month}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: achieved ? '#00C896' : 'linear-gradient(90deg, #6C47FF, #00C896)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {goal.unit === '$' ? `$${current.toLocaleString()}` : `${current} clients`}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">{progress.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
