import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  Phone,
  DollarSign,
  Settings,
  Brain,
  Calendar,
  Copy,
  Target,
  Zap,
  ListOrdered,
  BarChart3,
  Share2,
  PenSquare,
  Clock,
  Inbox,
  Hash,
  Eye,
  Sparkles,
  BookOpen,
  MessageSquare,
  FileTemplate,
  Mail,
  Send,
  TrendingUp,
  PieChart,
  GitBranch,
  Search,
  Link2,
  Shield,
  CalendarDays,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const agencyItems = [
  { to: '/', icon: LayoutDashboard, label: 'Agency Home' },
  { to: '/pipeline', icon: Users, label: 'Client Pipeline' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/discovery', icon: Phone, label: 'Discovery Calls' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
];

const crmItems = [
  { to: '/dashboard', icon: BarChart3, label: 'CRM Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/deals', icon: Target, label: 'Deals Pipeline' },
  { to: '/email-campaigns', icon: Mail, label: 'Email Campaigns' },
  { to: '/sequences', icon: ListOrdered, label: 'Sequences' },
  { to: '/workflows', icon: Zap, label: 'Workflows' },
];

const socialItems = [
  { to: '/social/accounts', icon: Share2, label: 'Social Accounts' },
  { to: '/social/calendar', icon: Calendar, label: 'Content Calendar' },
  { to: '/social/compose', icon: PenSquare, label: 'Compose Post' },
  { to: '/social/scheduled', icon: Clock, label: 'Scheduled Posts' },
  { to: '/social/analytics', icon: BarChart3, label: 'Post Analytics' },
  { to: '/social/inbox', icon: Inbox, label: 'Social Inbox' },
  { to: '/social/hashtags', icon: Hash, label: 'Hashtag Research' },
  { to: '/social/competitors', icon: Eye, label: 'Competitors' },
];

const aiItems = [
  { to: '/ai/generate', icon: Sparkles, label: 'AI Generator' },
  { to: '/ai/library', icon: BookOpen, label: 'Content Library' },
  { to: '/ai/brand-voice', icon: MessageSquare, label: 'Brand Voice' },
  { to: '/ai/templates', icon: FileTemplate, label: 'Templates' },
];

const emailItems = [
  { to: '/email/lists', icon: Users, label: 'Email Lists' },
  { to: '/email/templates', icon: Mail, label: 'Email Templates' },
  { to: '/email/analytics', icon: Send, label: 'Email Analytics' },
];

const analyticsItems = [
  { to: '/analytics', icon: BarChart3, label: 'Overview' },
  { to: '/analytics/traffic', icon: TrendingUp, label: 'Traffic' },
  { to: '/analytics/conversions', icon: PieChart, label: 'Conversions' },
  { to: '/analytics/attribution', icon: GitBranch, label: 'Attribution' },
  { to: '/analytics/revenue', icon: DollarSign, label: 'Revenue' },
];

const seoItems = [
  { to: '/seo/keywords', icon: Search, label: 'Keyword Research' },
  { to: '/seo/backlinks', icon: Link2, label: 'Backlinks' },
  { to: '/seo/audit', icon: Shield, label: 'Site Audit' },
  { to: '/seo/competitors', icon: Eye, label: 'SEO Competitors' },
];

const calendarItems = [
  { to: '/calendar/settings', icon: Settings, label: 'Calendar Settings' },
  { to: '/calendar/widget', icon: Calendar, label: 'Book Meeting' },
  { to: '/calendar/bookings', icon: CalendarDays, label: 'Bookings' },
];

const CALENDLY_URL = 'https://calendly.com/mrsjw136/free-discovery-call-adgorhythms-meeting';

export default function Sidebar() {
  const { addToast } = useToast();

  const copyCalendly = () => {
    navigator.clipboard.writeText(CALENDLY_URL);
    addToast('Calendly link copied!', 'success');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#1A1A2E] flex flex-col z-40 border-r border-white/5">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#6C47FF] to-[#4C2FBF] flex-shrink-0">
          <Brain size={18} className="text-white" />
        </div>
        <div>
          <div
            className="text-base font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #6C47FF 0%, #00C896 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ADgorhythms
          </div>
          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-none mt-0.5">
            AI Marketing OS
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 pt-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Agency</div>
        {agencyItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">CRM & Marketing</div>
        {crmItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Social Media</div>
        {socialItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">AI Content</div>
        {aiItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Email Marketing</div>
        {emailItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Analytics</div>
        {analyticsItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">SEO Tools</div>
        {seoItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Scheduling</div>
        {calendarItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">System</div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-[#6C47FF] text-white shadow-lg shadow-[#6C47FF]/30'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="px-3 py-4 border-t border-white/5 space-y-3">
        <button
          onClick={copyCalendly}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#00C896]/10 hover:bg-[#00C896]/20 text-[#00C896] rounded-xl text-xs font-semibold transition-all duration-150 group"
        >
          <Calendar size={14} />
          <span className="flex-1 text-left truncate">Book Discovery Call</span>
          <Copy size={12} className="opacity-60 group-hover:opacity-100" />
        </button>

        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-white leading-none">Sheridan Williams</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Agency Owner</div>
        </div>
      </div>
    </aside>
  );
}
