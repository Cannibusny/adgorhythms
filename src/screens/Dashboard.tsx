import { useState, useEffect } from 'react';
import {
  Users, FileText, DollarSign, TrendingUp, Phone,
  Target, CheckSquare, Square, ArrowRight, Circle,
  Zap, Trophy, Activity as ActivityIcon, ChevronRight,
} from 'lucide-react';
import { storage, generateId } from '../lib/storage';
import { useToast } from '../hooks/useToast';
import type { Client, Activity, Task } from '../types';

const STAGE_LABELS: Record<string, string> = {
  prospects: 'Prospects',
  outreach_sent: 'Outreach Sent',
  discovery_call: 'Discovery Call',
  proposal_sent: 'Proposal Sent',
  active_client: 'Active Client',
  completed: 'Completed',
};

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-black text-[#1A1A2E]">{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-[#00C896] font-semibold mt-1">{sub}</div>}
    </div>
  );
}

function HealthDot({ health }: { health: string }) {
  const colors: Record<string, string> = {
    good: 'bg-emerald-400',
    warning: 'bg-amber-400',
    bad: 'bg-red-400',
  };
  return <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${colors[health] ?? colors.good}`} />;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

export default function Dashboard() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const agency = storage.getAgency();
  const monthlyGoal = agency?.monthlyGoal ?? 10000;

  useEffect(() => {
    setClients(storage.getClients());
    setTasks(storage.getTasks());
    setActivity(storage.getActivity());
  }, []);

  const activeClients = clients.filter((c) => c.stage === 'active_client');
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthlyValue ?? 0), 0);
  const proposalsSent = clients.filter((c) => c.stage === 'proposal_sent').length;
  const pipelineValue = clients
    .filter((c) => !['active_client', 'completed'].includes(c.stage))
    .reduce((sum, c) => sum + (c.budget ?? 0), 0);
  const discoveryCalls = clients.filter((c) => c.stage === 'discovery_call').length;
  const goalProgress = Math.min((mrr / monthlyGoal) * 100, 100);
  const avgPackage = activeClients.length > 0 ? mrr / activeClients.length : 2500;
  const clientsNeeded = Math.max(0, Math.ceil((monthlyGoal - mrr) / avgPackage));

  const hotProspects = clients.filter((c) =>
    ['discovery_call', 'proposal_sent'].includes(c.stage)
  );

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    storage.setTasks(updated);
    const task = updated.find((t) => t.id === id);
    if (task?.completed) {
      addToast('Task completed!', 'success');
      storage.addActivity({
        id: generateId(),
        action: 'Task Completed',
        description: task.text,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const clientHealth = (client: Client) => {
    if (client.status === 'paused') return 'warning';
    if (client.status === 'cancelled') return 'bad';
    return 'good';
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E] tracking-tight">
            ADgorhythms Command Center
          </h1>
          <p className="text-gray-500 mt-1 font-medium">AI-Powered Marketing That Never Sleeps</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #4C2FBF 60%, #1A1A2E 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-12 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-24 w-48 h-48 rounded-full bg-[#00C896] blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-[#00C896]" />
            <span className="text-[#00C896] text-xs font-bold uppercase tracking-widest">
              Daily Motivation
            </span>
          </div>
          <p className="text-white text-xl font-bold leading-relaxed max-w-2xl">
            Every business in the Hudson Valley needs what you built.{' '}
            <span className="text-[#00C896]">Go get them.</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          label="Active Clients"
          value={activeClients.length}
          icon={Users}
          color="bg-[#6C47FF]"
          sub={activeClients.length > 0 ? `${activeClients.length} paying` : 'Get your first!'}
        />
        <MetricCard
          label="Proposals Sent"
          value={proposalsSent}
          icon={FileText}
          color="bg-blue-500"
          sub={proposalsSent > 0 ? 'Follow up today' : 'Send one now'}
        />
        <MetricCard
          label="Monthly Recurring Revenue"
          value={`$${mrr.toLocaleString()}`}
          icon={DollarSign}
          color="bg-[#00C896]"
          sub={`${((mrr / monthlyGoal) * 100).toFixed(0)}% of $${monthlyGoal.toLocaleString()} goal`}
        />
        <MetricCard
          label="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-amber-500"
          sub="Potential MRR"
        />
        <MetricCard
          label="Discovery Calls Booked"
          value={discoveryCalls}
          icon={Phone}
          color="bg-[#FF6B35]"
          sub="Upcoming calls"
        />
      </div>

      <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C47FF] to-[#4C2FBF] flex items-center justify-center">
              <Target size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1A1A2E]">Path to $10,000 MRR</h2>
              <p className="text-xs text-gray-500">Your milestone tracker</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#6C47FF]">${mrr.toLocaleString()}</div>
            <div className="text-xs text-gray-500">of ${monthlyGoal.toLocaleString()}/mo goal</div>
          </div>
        </div>

        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${goalProgress}%`,
              background: 'linear-gradient(90deg, #6C47FF 0%, #00C896 100%)',
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#F8F7FF] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-medium">Current Clients</div>
            <div className="text-xl font-black text-[#1A1A2E] mt-1">{activeClients.length}</div>
            <div className="text-xs text-[#6C47FF] mt-0.5">
              avg ${avgPackage.toLocaleString()}/mo
            </div>
          </div>
          <div className="bg-[#F8F7FF] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-medium">Clients Needed</div>
            <div className="text-xl font-black text-[#FF6B35] mt-1">{clientsNeeded}</div>
            <div className="text-xs text-gray-500 mt-0.5">to hit goal</div>
          </div>
          <div className="bg-[#F8F7FF] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-medium">Gap to Close</div>
            <div className="text-xl font-black text-[#1A1A2E] mt-1">
              ${Math.max(0, monthlyGoal - mrr).toLocaleString()}
            </div>
            <div className="text-xs text-[#00C896] mt-0.5">remaining</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-[#1A1A2E]">Active Client Status</h2>
              <span className="text-xs bg-[#6C47FF]/10 text-[#6C47FF] font-semibold px-2.5 py-1 rounded-full">
                {activeClients.length} clients
              </span>
            </div>
            {activeClients.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Users size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No active clients yet</p>
                <p className="text-gray-300 text-xs mt-1">Close your first deal to see it here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeClients.map((client) => (
                  <div key={client.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                    <HealthDot health={clientHealth(client)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#1A1A2E] text-sm">{client.businessName}</div>
                      <div className="text-xs text-gray-500">
                        {client.businessType} •{' '}
                        <span className="capitalize">{client.packageTier} package</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black text-[#00C896]">
                        ${(client.monthlyValue ?? 0).toLocaleString()}/mo
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{client.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-[#1A1A2E]">Hot Prospects</h2>
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                {hotProspects.length} in progress
              </span>
            </div>
            {hotProspects.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <TrendingUp size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No hot prospects yet</p>
                <p className="text-gray-300 text-xs mt-1">Move leads to Discovery Call or Proposal stages</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {hotProspects.map((client) => (
                  <div key={client.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#1A1A2E] text-sm">{client.businessName}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              client.stage === 'proposal_sent'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {STAGE_LABELS[client.stage]}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{client.businessType} • {client.ownerName}</div>
                        {client.notes && (
                          <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{client.notes}</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-[#1A1A2E]">
                          ${(client.budget ?? 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">est. value</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-black text-[#1A1A2E]">This Week's Actions</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {tasks.filter((t) => t.completed).length}/{tasks.length} completed
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full px-6 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {task.completed ? (
                      <CheckSquare size={16} className="text-[#00C896]" />
                    ) : (
                      <Square size={16} className="text-gray-300" />
                    )}
                  </div>
                  <span
                    className={`text-sm leading-snug ${
                      task.completed ? 'line-through text-gray-300' : 'text-[#1A1A2E] font-medium'
                    }`}
                  >
                    {task.text}
                  </span>
                  {task.priority === 'high' && !task.completed && (
                    <span className="flex-shrink-0 ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] inline-block" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-black text-[#1A1A2E]">Pipeline Health</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              {Object.entries(STAGE_LABELS).map(([stage, label]) => {
                const count = clients.filter((c) => c.stage === stage).length;
                const max = Math.max(...Object.keys(STAGE_LABELS).map((s) => clients.filter((c) => c.stage === s).length), 1);
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 w-28 flex-shrink-0 text-right">{label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6C47FF] to-[#00C896] transition-all duration-500"
                        style={{ width: max > 0 ? `${(count / max) * 100}%` : '0%' }}
                      />
                    </div>
                    <div className="text-xs font-bold text-[#1A1A2E] w-4 text-right">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="font-black text-[#1A1A2E]">Recent Wins</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {activity
              .filter((a) => ['Client Signed', 'Milestone Hit', 'Proposal Accepted'].includes(a.action))
              .slice(0, 4)
              .map((a) => (
                <div key={a.id} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Trophy size={14} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1A1A2E] truncate">{a.description}</div>
                    <div className="text-xs text-gray-400">{timeAgo(a.timestamp)}</div>
                  </div>
                </div>
              ))}
            {activity.filter((a) => ['Client Signed', 'Milestone Hit'].includes(a.action)).length === 0 && (
              <div className="px-6 py-8 text-center">
                <Trophy size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Your wins will show up here</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <ActivityIcon size={16} className="text-[#6C47FF]" />
            <h2 className="font-black text-[#1A1A2E]">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {activity.slice(0, 5).map((a) => (
              <div key={a.id} className="px-6 py-3.5 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6C47FF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#1A1A2E] truncate">{a.description}</div>
                  <div className="text-xs text-gray-400">{a.action} • {timeAgo(a.timestamp)}</div>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="px-6 py-8 text-center">
                <Circle size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
