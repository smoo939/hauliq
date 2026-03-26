import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PaymentMethods({ onBack }: { onBack: () => void }) {
  const methods = [
    { icon: Smartphone, label: 'EcoCash', description: 'Mobile money payments', status: 'Not linked' },
    { icon: Building, label: 'Bank Transfer', description: 'Direct bank deposit', status: 'Not linked' },
    { icon: CreditCard, label: 'Cash on Delivery', description: 'Pay driver on delivery', status: 'Available' },
  ];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">← Back to Settings</button>
      <h2 className="text-lg font-semibold">Payment Methods</h2>
      <p className="text-xs text-muted-foreground">Manage how you pay for shipments</p>
      {methods.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <m.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{m.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
