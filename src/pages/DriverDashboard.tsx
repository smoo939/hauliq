import { useAuth } from '@/hooks/useAuth';
import { Truck } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import BottomTabs from '@/components/BottomTabs';
import DriverHomeView from '@/components/DriverHomeView';
import DriverLoadsView from '@/components/DriverLoadsView';
import ChatListView from '@/components/ChatListView';
import SettingsView from '@/components/SettingsView';
import { useLoadNotifications } from '@/hooks/useLoadNotifications';

export default function DriverDashboard() {
  const { user, profile } = useAuth();
  useLoadNotifications(user?.id, 'driver');

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="px-4 flex h-14 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-black leading-tight">Hauliq</h1>
            <p className="text-[11px] text-muted-foreground">{profile?.full_name || 'Driver'}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        <Routes>
          <Route index element={<DriverHomeView />} />
          <Route path="loads" element={<DriverLoadsView />} />
          <Route path="chat" element={<ChatListView />} />
          <Route path="profile" element={<SettingsView role="driver" />} />
        </Routes>
      </main>

      <BottomTabs role="driver" />
    </div>
  );
}
