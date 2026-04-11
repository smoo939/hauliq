import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { analytics } from '@/lib/analytics';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/auth': 'Auth',
  '/role-select': 'Role Select',
  '/shipper': 'Shipper Live',
  '/shipper/create': 'Create Load',
  '/shipper/shipments': 'Shipments',
  '/shipper/history': 'Load History',
  '/shipper/chat': 'Messages',
  '/shipper/profile': 'Profile',
  '/shipper/ratings': 'Ratings',
  '/shipper/notifications': 'Notifications',
  '/shipper/security': 'Security',
  '/shipper/shipping-prefs': 'Shipping Preferences',
  '/shipper/documents': 'Documents',
  '/shipper/help': 'Help & Support',
  '/driver': 'Driver Home',
  '/driver/work': 'Find Work',
  '/driver/active': 'Active Trips',
  '/driver/chat': 'Messages',
  '/driver/profile': 'Profile',
  '/driver/subscription': 'Subscription',
  '/driver/earnings': 'Earnings',
  '/driver/verification': 'Verification Center',
  '/driver/fleet': 'My Fleet',
  '/driver/routes': 'Preferred Routes',
  '/driver/ratings': 'Ratings',
  '/driver/notifications': 'Notifications',
  '/driver/security': 'Security',
  '/driver/help': 'Help & Support',
  '/admin': 'Admin Dashboard',
};

export function usePageTracking() {
  const location = useLocation();
  const { profile } = useAuth();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const page_name = PAGE_NAMES[path] ?? path;

    analytics.pageViewed({
      path,
      page_name,
      role: profile?.role ?? null,
    });
  }, [location.pathname, profile?.role]);
}
