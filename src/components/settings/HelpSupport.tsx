import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, Mail, MessageSquare, FileText } from 'lucide-react';

export default function HelpSupport({ onBack }: { onBack: () => void }) {
  const items = [
    { icon: FileText, label: 'FAQ', description: 'Frequently asked questions' },
    { icon: MessageSquare, label: 'Live Chat', description: 'Chat with our support team' },
    { icon: Mail, label: 'Email Support', description: 'support@hauliq.com' },
  ];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">← Back to Settings</button>
      <h2 className="text-lg font-semibold">Help & Support</h2>
      {items.map((item) => (
        <Card key={item.label} className="cursor-pointer hover:border-primary/30 transition-all">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
