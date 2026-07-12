import React, { useState } from 'react';
import useOfficeLive from '../hooks/frontend/useOfficeLive';
import Sidebar from './Sidebar';
import Header from './Header';
import StatsCards from './StatsCards';
import FloorPlan from './FloorPlan';
import PowerPanel from './PowerPanel';
import AlertsPanel from './AlertsPanel';

// Sub Pages
import DevicesPage from './DevicesPage';
import AnalyticsPage from './AnalyticsPage';
import AlertsPage from './AlertsPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';

export default function Dashboard() {
  const { devices, roomPower, totalPower, alerts, connected, setDevice } = useOfficeLive();
  const [activeTab, setActiveTab] = useState('dashboard');

  const lastUpdated = totalPower?.as_of || null;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <StatsCards totalPower={totalPower} alerts={alerts} />
            <div className="content-grid">
              <FloorPlan
                devices={devices}
                onToggle={setDevice}
              />
              <div className="right-panel">
                <PowerPanel totalPower={totalPower} roomPower={roomPower} />
                <AlertsPanel alerts={alerts} />
              </div>
            </div>
          </>
        );
      case 'devices':
        return <DevicesPage devices={devices} onToggle={setDevice} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'logout':
        return (
          <div className="sub-page text-center">
            <h3>Logged Out</h3>
            <p>You have successfully logged out of the Smart Office Monitoring System.</p>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveTab('dashboard')}>
              Log Back In
            </button>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        alertCount={alerts.length} 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
      />
      <Header connected={connected} lastUpdated={lastUpdated} />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
