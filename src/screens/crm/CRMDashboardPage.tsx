import { useState, useEffect } from 'react';
import {
  Users, DollarSign, Mail, Zap, TrendingUp, BarChart3,
  Activity, Target, Calendar,
  Star,
} from 'lucide-react';
import { contactsApi, dealsApi, campaignsApi, sequencesApi, workflowsApi } from '../../lib/api';
import type { Contact, Deal, EmailCampaign, DealForecast } from '../../types/crm';

export default function CRMDashboardPage() {
  const [stats, setStats] = useState({
    contactCount: 0,
    dealCount: 0,
    campaignCount: 0,
    sequenceCount: 0,
    workflowCount: 0,
    totalPipeline: 0,
    weightedPipeline: 0,
    avgOpenRate: 0,
  });
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [topContacts, setTopContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [forecast, setForecast] = useState<DealForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [contactsRes, dealsRes, campaignsRes, sequencesRes, workflowsRes, forecastRes] = await Promise.allSettled([
        contactsApi.list({ limit: '50', sort_by: 'created_at', sort_order: 'desc' }),
        dealsApi.list(),
        campaignsApi.list(),
        sequencesApi.list(),
        workflowsApi.list(),
        dealsApi.forecast(),
      ]);

      const contacts = contactsRes.status === 'fulfilled' ? contactsRes.value : { data: [], total: 0 };
      const dealsData = dealsRes.status === 'fulfilled' ? dealsRes.value : { data: [], total: 0 };
      const campaignsData = campaignsRes.status === 'fulfilled' ? campaignsRes.value : { data: [], total: 0 };
      const sequencesData = sequencesRes.status === 'fulfilled' ? sequencesRes.value : { data: [], total: 0 };
      const workflowsData = workflowsRes.status === 'fulfilled' ? workflowsRes.value : { data: [], total: 0 };
      const forecastData = forecastRes.status === 'fulfilled' ? forecastRes.value : null;

      setRecentContacts(contacts.data.slice(0, 5));
      setTopContacts([...contacts.data].sort((a, b) => b.lead_score - a.lead_score).slice(0, 5));
      setDeals(dealsData.data);
      setCampaigns(campaignsData.data);
      setForecast(forecastData);

      const sentCampaigns = campaignsData.data.filter((c: EmailCampaign) => c.recipient_count > 0);
      const avgOpen = sentCampaigns.length > 0
        ? sentCampaigns.reduce((s: number, c: EmailCampaign) => s + (c.opened_count / c.recipient_count) * 100, 0) / sentCampaigns.length
        : 0;

      setStats({
        contactCount: contacts.total,
        dealCount: dealsData.total,
        campaignCount: campaignsData.total,
        sequenceCount: sequencesData.total,
        workflowCount: workflowsData.total,
        totalPipeline: forecastData?.totalPipeline || 0,
        weightedPipeline: forecastData?.weightedPipeline || 0,
        avgOpenRate: Math.round(avgOpen),
      });
    } catch {
      // Dashboard loads gracefully if API is down
    } finally {
      setLoading(false);
    }
  };

  const stageCounts = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].map(stage => ({
    stage,
    count: deals.filter(d => d.stage === stage).length,
    total: deals.filter(d => d.stage === stage).reduce((s, d) => s + (Number(d.amount) || 0), 0),
  }));

  const maxStageCount = Math.max(...stageCounts.map(s => s.count), 1);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#6C47FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your marketing automation command center</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Contacts', value: stats.contactCount, color: 'from-[#6C47FF] to-[#4C2FBF]', iconBg: 'bg-[#6C47FF]/10 text-[#6C47FF]' },
          { icon: DollarSign, label: 'Pipeline Value', value: `$${stats.totalPipeline.toLocaleString()}`, color: 'from-emerald-500 to-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600' },
          { icon: TrendingUp, label: 'Weighted Pipeline', value: `$${stats.weightedPipeline.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-50 text-blue-600' },
          { icon: Mail, label: 'Avg Open Rate', value: `${stats.avgOpenRate}%`, color: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-50 text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500">{stat.label}</div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> Deals by Stage
          </h3>
          <div className="space-y-3">
            {stageCounts.map(sc => (
              <div key={sc.stage}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 capitalize">{sc.stage.replace('_', ' ')}</span>
                  <span className="font-medium text-gray-900">{sc.count} · ${sc.total.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${sc.stage === 'closed_won' ? 'bg-emerald-500' : sc.stage === 'closed_lost' ? 'bg-red-400' : 'bg-[#6C47FF]'}`}
                    style={{ width: `${(sc.count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Forecast */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Target size={16} /> Sales Forecast
          </h3>
          {forecast && forecast.byMonth.length > 0 ? (
            <div className="space-y-3">
              {forecast.byMonth.slice(0, 6).map(month => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">${month.weighted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-gray-500">{month.count} deals</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No forecast data yet. Add deals with expected close dates.
            </div>
          )}
        </div>

        {/* Email Campaign Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Mail size={16} /> Campaign Performance
          </h3>
          {campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map(campaign => {
                const openRate = campaign.recipient_count > 0 ? ((campaign.opened_count / campaign.recipient_count) * 100).toFixed(1) : '0';
                return (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-500">{campaign.recipient_count} recipients</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${campaign.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{campaign.status}</span>
                      <span className="text-sm font-bold text-[#6C47FF]">{openRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No campaigns yet.</div>
          )}
        </div>

        {/* Active Automation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Zap size={16} /> Active Automation
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-[#6C47FF]/5 to-[#6C47FF]/10 rounded-xl">
              <Activity size={24} className="mx-auto text-[#6C47FF] mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.sequenceCount}</div>
              <div className="text-xs text-gray-500">Active Sequences</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl">
              <Zap size={24} className="mx-auto text-emerald-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.workflowCount}</div>
              <div className="text-xs text-gray-500">Workflows</div>
            </div>
          </div>
        </div>

        {/* Top Contacts by Lead Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Star size={16} /> Top Contacts by Lead Score
          </h3>
          {topContacts.length > 0 ? (
            <div className="space-y-2">
              {topContacts.map((contact, i) => (
                <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-7 h-7 rounded-full bg-[#6C47FF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{contact.company || contact.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6C47FF] rounded-full" style={{ width: `${contact.lead_score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#6C47FF] w-6 text-right">{contact.lead_score}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No contacts yet.</div>
          )}
        </div>

        {/* Recent Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Users size={16} /> Recently Added Contacts
          </h3>
          {recentContacts.length > 0 ? (
            <div className="space-y-2">
              {recentContacts.map(contact => (
                <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C47FF] to-[#4C2FBF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email}
                    </div>
                    <div className="text-xs text-gray-500">{contact.lifecycle_stage}</div>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(contact.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No contacts yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
