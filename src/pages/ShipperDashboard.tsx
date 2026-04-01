import { useAuth } from '@/hooks/useAuth';
import { Package } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import BottomTabs from '@/components/BottomTabs';
import ShipperLiveView from '@/components/ShipperLiveView';
import ShipperCreateLoad from '@/components/ShipperCreateLoad';
import ShipperShipmentsView from '@/components/ShipperShipmentsView';
import ChatListView from '@/components/ChatListView';
import SettingsView from '@/components/SettingsView';
import { useLoadNotifications } from '@/hooks/useLoadNotifications';

function PageWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="px-4 flex h-14 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-base font-black leading-tight">{title}</h1>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function ShipperDashboard() {
  const { user, profile } = useAuth();
  useLoadNotifications(user?.id, 'shipper');

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route index element={<ShipperLiveView />} />
        <Route path="create" element={<PageWrapper title="Create Load"><main className="px-4 py-4"><ShipperCreateLoad /></main></PageWrapper>} />
        <Route path="shipments" element={<PageWrapper title="Shipments"><main className="px-4 py-4"><ShipperShipmentsView /></main></PageWrapper>} />
        <Route path="chat" element={<PageWrapper title="Messages"><main className="px-4 py-4"><ChatListView /></main></PageWrapper>} />
        <Route path="profile" element={<PageWrapper title="Settings"><main className="px-4 py-4"><SettingsView role="shipper" /></main></PageWrapper>} />
      </Routes>
      <BottomTabs role="shipper" />
    </div>
  );
}
