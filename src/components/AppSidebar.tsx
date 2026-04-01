import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  User, LogOut, Shield, Truck, CreditCard, Star,
  Moon, Sun, ArrowLeftRight, Settings, HelpCircle,
  Menu, DollarSign, FileText, Bell, MapPin, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppSidebarProps {
  role: 'shipper' | 'driver';
}

export default function AppSidebar({ role }: AppSidebarProps) {
  const { user, profile, signOut, setRole } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleSwitchRole = async () => {
    const newRole = role === 'driver' ? 'shipper' : 'driver';
    setSwitching(true);
    try {
      await setRole(newRole);
      toast.success(`Switched to ${newRole === 'driver' ? 'Carrier' : 'Shipper'} mode`);
      setOpen(false);
      navigate(newRole === 'driver' ? '/driver' : '/shipper', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch role');
    } finally {
      setSwitching(false);
    }
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const menuItems = role === 'driver'
    ? [
        { icon: User, label: 'Profile', path: '/driver/profile' },
        { icon: CreditCard, label: 'Subscription', path: '/driver/profile?section=payments' },
        { icon: DollarSign, label: 'Earnings', path: '/driver/profile?section=history' },
        { icon: Shield, label: 'Verification', path: '/driver/profile?section=verification' },
        { icon: Truck, label: 'My Fleet', path: '/driver/profile?section=fleet' },
        { icon: Star, label: 'Ratings', path: '/driver/profile?section=ratings' },
        { icon: MapPin, label: 'Preferred Routes', path: '/driver/profile?section=routes' },
        { icon: Bell, label: 'Notifications', path: '/driver/profile?section=notifications' },
        { icon: Settings, label: 'Settings', path: '/driver/profile?section=security' },
        { icon: HelpCircle, label: 'Help & Support', path: '/driver/profile?section=help' },
      ]
    : [
        { icon: User, label: 'Profile', path: '/shipper/profile' },
        { icon: CreditCard, label: 'Payment Methods', path: '/shipper/profile?section=payments' },
        { icon: DollarSign, label: 'Billing', path: '/shipper/profile?section=history' },
        { icon: FileText, label: 'Documents', path: '/shipper/profile?section=documents' },
        { icon: Star, label: 'Carrier Ratings', path: '/shipper/profile?section=ratings' },
        { icon: Bell, label: 'Notifications', path: '/shipper/profile?section=notifications' },
        { icon: Settings, label: 'Settings', path: '/shipper/profile?section=security' },
        { icon: HelpCircle, label: 'Help & Support', path: '/shipper/profile?section=help' },
      ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-lg">
          <Menu className="h-4 w-4 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Profile header */}
          <div className="p-5 pb-3">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-sm font-bold truncate">
                    {profile?.full_name || 'User'}
                  </SheetTitle>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <Badge variant="outline" className="capitalize text-[10px] mt-1">
                    {role === 'driver' ? 'Carrier' : 'Shipper'}
                  </Badge>
                </div>
              </div>
            </SheetHeader>
          </div>

          <Separator />

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => go(item.path)}
                className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              </button>
            ))}
          </div>

          <Separator />

          {/* Bottom actions */}
          <div className="p-4 space-y-2">
            {/* Theme toggle */}
            <div className="flex items-center justify-between px-1 py-2">
              <div className="flex items-center gap-2">
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Dark Mode</span>
              </div>
              <Switch
                checked={resolvedTheme === 'dark'}
                onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')}
              />
            </div>

            {/* Switch role */}
            <button
              onClick={handleSwitchRole}
              disabled={switching}
              className="flex items-center gap-3 w-full px-1 py-2 text-left hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Switch to {role === 'driver' ? 'Shipper' : 'Carrier'}
              </span>
              {switching && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent ml-auto" />
              )}
            </button>

            {/* Sign out */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
