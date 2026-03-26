import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Moon, Sun, User, LogOut, Shield, Truck, FileText,
  ChevronRight, Bell, Lock, HelpCircle, Info, History,
  MapPin, CreditCard, Star, Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadHistoryView from './LoadHistoryView';
import NotificationsSettings from './settings/NotificationsSettings';
import SecuritySettings from './settings/SecuritySettings';
import PreferredRoutes from './settings/PreferredRoutes';
import RatingsView from './settings/RatingsView';
import ShippingPreferences from './settings/ShippingPreferences';
import PaymentMethods from './settings/PaymentMethods';
import HelpSupport from './settings/HelpSupport';
import AboutView from './settings/AboutView';

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon: Icon, label, description, onClick, trailing, danger }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3.5 rounded-lg text-left transition-colors hover:bg-muted/50 active:bg-muted ${danger ? 'text-destructive' : ''}`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${danger ? 'bg-destructive/10' : 'bg-muted'}`}>
        <Icon className={`h-4.5 w-4.5 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {trailing || <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </button>
  );
}

export default function SettingsView({ role }: { role: 'shipper' | 'driver' }) {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const back = () => setActiveSection(null);

  // Sub-section routing
  switch (activeSection) {
    case 'history':
      return (
        <div className="space-y-4">
          <button onClick={back} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">← Back to Settings</button>
          <h2 className="text-lg font-semibold">Load History</h2>
          <p className="text-xs text-muted-foreground">All your completed deliveries</p>
          <LoadHistoryView role={role} />
        </div>
      );
    case 'fleet':
      return <FleetManagement onBack={back} />;
    case 'verification':
      return <VerificationCenter onBack={back} />;
    case 'documents':
      return <DocumentVault onBack={back} />;
    case 'notifications':
      return <NotificationsSettings onBack={back} />;
    case 'security':
      return <SecuritySettings onBack={back} />;
    case 'routes':
      return <PreferredRoutes onBack={back} />;
    case 'ratings':
      return <RatingsView onBack={back} role={role} />;
    case 'shipping-prefs':
      return <ShippingPreferences onBack={back} />;
    case 'payments':
      return <PaymentMethods onBack={back} />;
    case 'help':
      return <HelpSupport onBack={back} />;
    case 'about':
      return <AboutView onBack={back} />;
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{profile?.full_name || 'User'}</h3>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize text-xs">
                    {role === 'driver' ? 'Carrier' : 'Shipper'}
                  </Badge>
                  {profile?.verified && (
                    <Badge variant="outline" className="text-xs text-success border-success/30">Verified</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardContent className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3.5 pt-2 pb-1">Appearance</p>
            <SettingItem
              icon={resolvedTheme === 'dark' ? Moon : Sun}
              label="Dark Mode"
              description={resolvedTheme === 'dark' ? 'Currently dark' : 'Currently light'}
              trailing={
                <Switch checked={resolvedTheme === 'dark'} onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')} />
              }
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Role-specific sections */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3.5 pt-2 pb-1">
              {role === 'driver' ? 'Carrier Tools' : 'Shipper Tools'}
            </p>
            <SettingItem icon={History} label="Load History" description="View all completed deliveries" onClick={() => setActiveSection('history')} />
            {role === 'driver' ? (
              <>
                <SettingItem icon={Truck} label="My Fleet" description="Vehicles, trailers & capacity" onClick={() => setActiveSection('fleet')} />
                <SettingItem icon={Shield} label="Verification Center" description="ZIMRA, GIT & operator licenses" onClick={() => setActiveSection('verification')} />
                <SettingItem icon={FileText} label="Document Vault" description="POD uploads & delivery receipts" onClick={() => setActiveSection('documents')} />
                <SettingItem icon={MapPin} label="Preferred Routes" description="Set your common corridors" onClick={() => setActiveSection('routes')} />
                <SettingItem icon={Star} label="Ratings & Reviews" description="Your performance score" onClick={() => setActiveSection('ratings')} />
              </>
            ) : (
              <>
                <SettingItem icon={Package} label="Shipping Preferences" description="Default load types & equipment" onClick={() => setActiveSection('shipping-prefs')} />
                <SettingItem icon={CreditCard} label="Payment Methods" description="EcoCash, bank transfer & cash" onClick={() => setActiveSection('payments')} />
                <SettingItem icon={FileText} label="Document Vault" description="POD downloads & invoices" onClick={() => setActiveSection('documents')} />
                <SettingItem icon={Star} label="Carrier Ratings" description="Rate your carriers" onClick={() => setActiveSection('ratings')} />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardContent className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3.5 pt-2 pb-1">Account</p>
            <SettingItem icon={Bell} label="Notifications" description="Push & SMS preferences" onClick={() => setActiveSection('notifications')} />
            <SettingItem icon={Lock} label="Security" description="Password & 2FA" onClick={() => setActiveSection('security')} />
            <SettingItem icon={HelpCircle} label="Help & Support" onClick={() => setActiveSection('help')} />
            <SettingItem icon={Info} label="About Hauliq" description="v1.0.0" onClick={() => setActiveSection('about')} />
          </CardContent>
        </Card>
      </motion.div>

      <Button variant="destructive" className="w-full" onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}

// Sub-sections kept inline for fleet/verification/documents
function FleetManagement({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">← Back to Settings</button>
      <h2 className="text-lg font-semibold">My Fleet</h2>
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Truck className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No vehicles registered</p>
            <p className="text-xs text-muted-foreground mt-1">Add your trucks, trailers, and fleet details</p>
            <Button className="mt-4" size="sm">Add Vehicle</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VerificationCenter({ onBack }: { onBack: () => void }) {
  const documents = [
    { name: 'ZIMRA Tax Clearance', status: 'pending', type: 'tax' },
    { name: 'GIT Insurance Certificate', status: 'pending', type: 'insurance' },
    { name: 'Vehicle Fitness Certificate', status: 'pending', type: 'fitness' },
    { name: 'Operators License', status: 'pending', type: 'license' },
  ];
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">← Back to Settings</button>
      <h2 className="text-lg font-semibold">Verification Center</h2>
      <p className="text-xs text-muted-foreground">Upload required documents for ZIMRA and insurance verification</p>
      {documents.map((doc, i) => (
        <motion.div key={doc.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <Badge variant="outline" className="text-xs mt-0.5 text-warning border-warning/30">{doc.status}</Badge>
                </div>
              </div>
              <Button size="sm" variant="outline">Upload</Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function DocumentVault({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">← Back to Settings</button>
      <h2 className="text-lg font-semibold">Document Vault</h2>
      <p className="text-xs text-muted-foreground">Securely store and manage Proof of Delivery (POD) and other logistics documents</p>
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No documents yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload PODs and delivery receipts for your completed loads</p>
            <Button className="mt-4" size="sm">Upload Document</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
