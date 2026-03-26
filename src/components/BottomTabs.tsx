import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Truck, MessageCircle, Settings, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Tab {
  path: string;
  label: string;
  icon: React.ElementType;
}

export default function BottomTabs({ role }: { role: 'shipper' | 'driver' }) {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: Tab[] = role === 'shipper'
    ? [
        { path: '/shipper', label: 'Loads', icon: Package },
        { path: '/shipper/map', label: 'Map', icon: Map },
        { path: '/shipper/chat', label: 'Chat', icon: MessageCircle },
        { path: '/shipper/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { path: '/driver', label: 'Loads', icon: Package },
        { path: '/driver/map', label: 'Map', icon: Map },
        { path: '/driver/chat', label: 'Chat', icon: MessageCircle },
        { path: '/driver/settings', label: 'Settings', icon: Settings },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-8 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
