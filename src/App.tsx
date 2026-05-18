import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import Layout from './components/layout/Layout';
import Dashboard from './screens/Dashboard';
import ClientPipeline from './screens/ClientPipeline';
import ProposalBuilder from './screens/ProposalBuilder';
import CampaignManager from './screens/CampaignManager';
import DiscoveryCallPrep from './screens/DiscoveryCallPrep';
import RevenueTracker from './screens/RevenueTracker';
import Settings from './screens/Settings';
import ContactsPage from './screens/crm/ContactsPage';
import ContactDetailPage from './screens/crm/ContactDetailPage';
import DealsPipelinePage from './screens/crm/DealsPipelinePage';
import DealDetailPage from './screens/crm/DealDetailPage';
import CampaignsPage from './screens/crm/CampaignsPage';
import SequencesPage from './screens/crm/SequencesPage';
import WorkflowsPage from './screens/crm/WorkflowsPage';
import CRMDashboardPage from './screens/crm/CRMDashboardPage';
import SocialAccountsPage from './screens/social/SocialAccountsPage';
import ContentCalendarPage from './screens/social/ContentCalendarPage';
import PostComposerPage from './screens/social/PostComposerPage';
import ScheduledPostsPage from './screens/social/ScheduledPostsPage';
import PostAnalyticsPage from './screens/social/PostAnalyticsPage';
import SocialInboxPage from './screens/social/SocialInboxPage';
import HashtagResearchPage from './screens/social/HashtagResearchPage';
import CompetitorTrackingPage from './screens/social/CompetitorTrackingPage';
import AIGeneratorPage from './screens/ai/AIGeneratorPage';
import ContentLibraryPage from './screens/ai/ContentLibraryPage';
import BrandVoicePage from './screens/ai/BrandVoicePage';
import ContentTemplatesPage from './screens/ai/ContentTemplatesPage';
import { useEffect } from 'react';
import { storage } from './lib/storage';
import {
  DEFAULT_AGENCY,
  SAMPLE_CLIENTS,
  SAMPLE_CAMPAIGNS,
  SAMPLE_REVENUE,
  SAMPLE_CALLS,
  SAMPLE_ACTIVITY,
  SAMPLE_TASKS,
} from './data/sampleData';

function DataInitializer() {
  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.setAgency(DEFAULT_AGENCY);
      storage.setClients(SAMPLE_CLIENTS);
      storage.setCampaigns(SAMPLE_CAMPAIGNS);
      storage.setRevenue(SAMPLE_REVENUE);
      storage.setCalls(SAMPLE_CALLS);
      SAMPLE_ACTIVITY.forEach((a) => storage.addActivity(a));
      storage.setTasks(SAMPLE_TASKS);
      storage.markInitialized();
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <DataInitializer />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/pipeline" element={<ClientPipeline />} />
            <Route path="/proposals" element={<ProposalBuilder />} />
            <Route path="/campaigns" element={<CampaignManager />} />
            <Route path="/discovery" element={<DiscoveryCallPrep />} />
            <Route path="/revenue" element={<RevenueTracker />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dashboard" element={<CRMDashboardPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/deals" element={<DealsPipelinePage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/email-campaigns" element={<CampaignsPage />} />
            <Route path="/sequences" element={<SequencesPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/social/accounts" element={<SocialAccountsPage />} />
            <Route path="/social/calendar" element={<ContentCalendarPage />} />
            <Route path="/social/compose" element={<PostComposerPage />} />
            <Route path="/social/scheduled" element={<ScheduledPostsPage />} />
            <Route path="/social/analytics" element={<PostAnalyticsPage />} />
            <Route path="/social/inbox" element={<SocialInboxPage />} />
            <Route path="/social/hashtags" element={<HashtagResearchPage />} />
            <Route path="/social/competitors" element={<CompetitorTrackingPage />} />
            <Route path="/ai/generate" element={<AIGeneratorPage />} />
            <Route path="/ai/library" element={<ContentLibraryPage />} />
            <Route path="/ai/brand-voice" element={<BrandVoicePage />} />
            <Route path="/ai/templates" element={<ContentTemplatesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
