import { useState, useEffect } from 'react';
import { Store, Plus, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { logError } from '@/utils/errorLogger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SHOP_DRAFT_KEY = 'mijedu_shop_draft';

interface ShopRequestFormProps {
  existingShop?: { id: string; shop_name: string; status: string } | null;
  onSuccess?: () => void;
}

const ShopRequestForm = ({ existingShop, onSuccess }: ShopRequestFormProps) => {
  const { user } = useAuth();
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Restore draft
  useEffect(() => {
    try {
      const draft = localStorage.getItem(SHOP_DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.shopName) setShopName(d.shopName);
        if (d.description) setDescription(d.description);
      }
    } catch { /* ignore */ }
  }, []);

  // Save draft on change
  useEffect(() => {
    localStorage.setItem(SHOP_DRAFT_KEY, JSON.stringify({ shopName, description }));
  }, [shopName, description]);

  const clearDraft = () => localStorage.removeItem(SHOP_DRAFT_KEY);

  const handleSubmit = async () => {
    if (!user || !shopName.trim()) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('student_shops')
        .insert({
          user_id: user.id,
          shop_name: shopName.trim(),
          description: description.trim() || null,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a shop request');
        } else {
          toast.error('Failed to submit request. Please try again.');
          await logError('shop_request', error.message, { user_id: user.id });
        }
      } else {
        // Notify super admins
        const { data: admins } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'super_admin');
        if (admins) {
          await Promise.all(admins.map(a =>
            supabase.from('notifications').insert({
              user_id: a.user_id,
              actor_id: user.id,
              type: 'shop_request',
              message: `New shop request: "${shopName.trim()}"`,
            })
          ));
        }
        toast.success('Shop request submitted! A super admin will review it.');
        setShopName('');
        setDescription('');
        clearDraft();
        setDialogOpen(false);
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error('Something went wrong. Please try again.');
      await logError('shop_request_exception', err.message);
    }
    setIsSubmitting(false);
  };

  const handleWithdraw = async () => {
    if (!existingShop || !user) return;
    if (!confirm('Withdraw your shop request? You can submit a new one later.')) return;
    setIsWithdrawing(true);

    try {
      const { error } = await supabase
        .from('student_shops')
        .delete()
        .eq('id', existingShop.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to withdraw request');
        await logError('shop_withdraw', error.message);
      } else {
        toast.success('Shop request withdrawn');
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error('Something went wrong');
      await logError('shop_withdraw_exception', err.message);
    }
    setIsWithdrawing(false);
  };

  if (existingShop) {
    const statusDisplay = {
      approved: '✅ Approved',
      pending: '⏳ Pending Review',
      pending_approval: '⏳ Pending Review',
      denied: '❌ Denied — you can submit a new request',
    }[existingShop.status] || existingShop.status;

    const canWithdraw = existingShop.status === 'pending' || existingShop.status === 'pending_approval';
    const canResubmit = existingShop.status === 'denied';

    return (
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-foreground">{existingShop.shop_name}</p>
            <p className="text-xs text-muted-foreground">{statusDisplay}</p>
          </div>
        </div>
        {canWithdraw && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            {isWithdrawing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            Withdraw Request
          </Button>
        )}
        {canResubmit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-3 h-3 mr-1" /> Submit New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  New Shop Request
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Shop Name</label>
                  <Input placeholder="e.g., Trendy Threads" value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={50} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description (optional)</label>
                  <Textarea placeholder="What will you sell?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="min-h-[80px]" />
                </div>
                <Button onClick={handleSubmit} disabled={!shopName.trim() || isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Request a Student Shop
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Request a Shop
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Shop Name</label>
            <Input placeholder="e.g., Trendy Threads" value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={50} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description (optional)</label>
            <Textarea placeholder="What will you sell?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="min-h-[80px]" />
          </div>
          <Button onClick={handleSubmit} disabled={!shopName.trim() || isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopRequestForm;
