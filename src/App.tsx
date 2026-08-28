import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HoneycombBackground } from './components/HoneycombBackground';
import { HealthBoxesScreen } from './components/HealthBoxesScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AppProvider, useApp } from './context/AppContext';

function AppContent() {
  return (
    <HoneycombBackground>
      <div className="flex-1 flex flex-col">
        <HealthBoxesScreen onBack={() => {}} />
      </div>

      {/* Global Admin Dashboard Modal */}
      <AdminDashboard />
    </HoneycombBackground>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

