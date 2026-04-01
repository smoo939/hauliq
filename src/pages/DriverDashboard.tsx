import { useAuth } from '@/hooks/useAuth';
import { Routes, Route } from 'react-router-dom';
import BottomTabs from '@/components/BottomTabs';
import DriverHomeView from '@/components/DriverHomeView';
import DriverWorkView from '@/components/driver/DriverWorkView';
import DriverActiveView from '@/components/driver/DriverActiveView';
import ChatListView from '@/components/ChatListView';
import SettingsView from '@/components/SettingsView';
import { useLoadNotifications } from '@/hooks/useLoadNotifications';
import { Truck } from 'lucide-react';

function PageWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="px-4 flex h-14 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-base font-black leading-tight">{title}</h1>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();
  useLoadNotifications(user?.id, 'driver');

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route index element={<DriverHomeView />} />
        <Route path="work" element={<PageWrapper title="Work"><DriverWorkView /></PageWrapper>} />
        <Route path="active" element={<PageWrapper title="Active Trips"><DriverActiveView /></PageWrapper>} />
        <Route path="chat" element={<PageWrapper title="Messages"><main className="px-4 py-4"><ChatListView /></main></PageWrapper>} />
        <Route path="profile" element={<PageWrapper title="Settings"><main className="px-4 py-4"><SettingsView role="driver" /></main></PageWrapper>} />
      </Routes>
      <BottomTabs role="driver" />
    </div>
  );
}
