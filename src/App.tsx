/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { IPhoneFrame } from './components/IPhoneFrame';
import { DynamicIsland } from './components/DynamicIsland';
import { FloatingTabBar } from './components/FloatingTabBar';
import { HomeDashboard } from './components/HomeDashboard';
import { FlightFareCalendar } from './components/FlightFareCalendar';
import { StatisticsView } from './components/StatisticsView';
import { WidgetsICloudView } from './components/WidgetsICloudView';
import { QuickEntryModal } from './components/QuickEntryModal';
import { CalendarDaySheet } from './components/CalendarDaySheet';
import { SettingsModal } from './components/SettingsModal';
import { CurrencyPickerModal } from './components/CurrencyPickerModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  return (
    <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden select-none">
      {/* iOS Top Status Bar & Dynamic Island */}
      <DynamicIsland onTap={() => setActiveTab('widgets')} />

      {/* Main Active Screen */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'calendar' && <FlightFareCalendar />}
        {activeTab === 'stats' && <StatisticsView />}
        {activeTab === 'widgets' && <WidgetsICloudView />}
      </main>

      {/* Floating Bottom Tab Bar */}
      <FloatingTabBar />

      {/* Floating Modals and Sheets */}
      <QuickEntryModal />
      <CalendarDaySheet />
      <SettingsModal />
      <CurrencyPickerModal />
      <CategoryManagerModal />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <IPhoneFrame>
        <AppContent />
      </IPhoneFrame>
    </FinanceProvider>
  );
}
