import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MineGuardProvider } from './context/MineGuardContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { ToastContainer } from './components/ToastContainer';
import { ScenarioSimulatorModal } from './components/ScenarioSimulatorModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { MineZones } from './pages/MineZones';
import { ZoneDetails } from './pages/ZoneDetails';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';
import { Devices } from './pages/Devices';
import { Settings } from './pages/Settings';

const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mine-bg text-mine-textPrimary flex flex-col font-sans">
      {/* Statutory Advisory Disclaimer Banner */}
      <DisclaimerBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Top Header */}
          <Header
            onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            onOpenScenarioModal={() => setScenarioModalOpen(true)}
          />

          {/* Page Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/zones" element={<MineZones />} />
              <Route path="/zones/:id" element={<ZoneDetails />} />
              <Route path="/live" element={<LiveMonitoring />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Floating Real-time Toast Notifications */}
      <ToastContainer />

      {/* Scenario Simulator Modal for Evaluator / Live Demonstration */}
      <ScenarioSimulatorModal
        isOpen={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <MineGuardProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </MineGuardProvider>
  );
}
