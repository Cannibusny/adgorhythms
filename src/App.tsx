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
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
