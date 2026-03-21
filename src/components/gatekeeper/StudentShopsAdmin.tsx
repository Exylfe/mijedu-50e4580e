import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, CheckCircle2, Clock, XCircle, Search, Ban, Power, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { logError } from '@/utils/errorLogger';
import GlassCard from '@/components/gatekeeper/GlassCard';

interface StudentShop {
  id: string;
  user_id: string;
  shop_name: string;
  description: string | null;
  is_active: boolean;
  status: string;
  created_at: string;
  nickname?: string;
  tribe?: string;
  productCount?: number;
}

interface StudentShopsAdminProps {
  onRefresh?: () => void;
}

const StudentShopsAdmin = ({ onRefresh }: StudentShopsAdminProps) => {
  const [shops, setShops] = useState<StudentShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');

  const fetchShops = async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_shops').select('*').order('created_at', { ascending: false });
      if (filter === 'pending') query = query.or('status.eq.pending,status.eq.pending_approval');
      if (filter === 'approved') query = query.eq('status', 'approved');
      if (filter === 'suspended') query = query.eq('status', 'suspended');

      const { data, error } = await query;
      if (error || !data) { setShops([]); setLoading(false); return; }

      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, nickname, tribe').in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const { data: products } = await supabase.from('products').select('user_id').in('user_id', userIds);
      const productCounts = new Map<string, number>();
      (products || []).forEach(p => { productCounts.set(p.user_id, (productCounts.get(p.user_id) || 0) + 1); });

      setShops(data.map(s => ({
        ...s,
        nickname: profileMap.get(s.user_id)?.nickname || undefined,
        tribe: profileMap.get(s.user_id)?.tribe || undefined,
        productCount: productCounts.get(s.user_id) || 0,
      })));
    } catch (err: any) {
      await logError('fetch_shops', err.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, [filter]);

  const handleApprove = async (shop: StudentShop) => {
    try {
      const { error } = await supabase
        .from('student_shops')
        .update({ status: 'approved', is_active: true })
        .eq('id', shop.id);
      if (error) { toast.error('Failed to approve shop'); return; }

      await supabase.from('notifications').insert({
        user_id: shop.user_id,
        type: 'shop_approved',
        message: `Your shop "${shop.shop_name}" has been approved! 🎉 You can now list products in Bwalo.`,
      });
      toast.success(`${shop.shop_name} approved!`);
      fetchShops();
      onRefresh?.();
    } catch (err: any) {
      toast.error('Something went wrong');
      await logError('shop_approve', err.message);
    }
  };

  const handleDeny = async (shop: StudentShop) => {
    try {
      const { error } = await supabase
        .from('student_shops')
        .update({ status: 'denied', is_active: false })
        .eq('id', shop.id);
      if (error) { toast.error('Failed to deny shop'); return; }

      await supabase.from('notifications').insert({
        user_id: shop.user_id,
        type: 'shop_denied',
        message: `Your shop request "${shop.shop_name}" was not approved. You can submit a new request anytime.`,
      });
      toast.success(`${shop.shop_name} denied`);
      fetchShops();
      onRefresh?.();
    } catch (err: any) {
      toast.error('Something went wrong');
      await logError('shop_deny', err.message);
    }
  };

  const handleSuspend = async (shop: StudentShop) => {
    try {
      const { error } = await supabase
        .from('student_shops')
        .update({ status: 'suspended', is_active: false })
        .eq('id', shop.id);
      if (error) { toast.error('Failed to suspend shop'); return; }
      toast.success(`${shop.shop_name} suspended`);
      fetchShops();
      onRefresh?.();
    } catch (err: any) {
      await logError('shop_suspend', err.message);
    }
  };

  const handleActivate = async (shop: StudentShop) => {
    try {
      const { error } = await supabase
        .from('student_shops')
        .update({ status: 'approved', is_active: true })
        .eq('id', shop.id);
      if (error) { toast.error('Failed to activate shop'); return; }
      toast.success(`${shop.shop_name} activated`);
      fetchShops();
      onRefresh?.();
    } catch (err: any) {
      await logError('shop_activate', err.message);
    }
  };

  const filtered = shops.filter(s =>
    !search || s.shop_name.toLowerCase().includes(search.toLowerCase()) || s.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = shops.filter(s => s.status === 'pending' || s.status === 'pending_approval').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
      case 'pending_approval': return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'suspended': return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'denied': return <Badge className="bg-muted text-muted-foreground border-muted text-[10px]"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Student Shops
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium">
              {pendingCount} pending
            </span>
          )}
        </h3>
      </div>

      <GlassCard className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search shops or owners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-transparent border-0 focus-visible:ring-0" />
        </div>
      </GlassCard>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'suspended'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No shops found</p>
          <p className="text-sm text-muted-foreground">Student shop requests will appear here</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((shop, i) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard hover className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{shop.shop_name}</p>
                      <p className="text-xs text-muted-foreground">{shop.nickname || 'Unknown'} · {shop.tribe || 'No tribe'}</p>
                      {shop.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{shop.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {getStatusBadge(shop.status)}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Package className="w-3 h-3" /> {shop.productCount} products
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(shop.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {(shop.status === 'pending' || shop.status === 'pending_approval') && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleDeny(shop)} className="h-7 px-2 text-xs">Deny</Button>
                        <Button size="sm" onClick={() => handleApprove(shop)} className="h-7 px-2 text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90">Approve</Button>
                      </>
                    )}
                    {shop.status === 'approved' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-600" onClick={() => handleSuspend(shop)} title="Suspend">
                        <Ban className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {shop.status === 'suspended' && (
                      <Button size="sm" variant="outline" onClick={() => handleActivate(shop)} className="h-7 px-2 text-xs">
                        <Power className="w-3 h-3 mr-1" /> Activate
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentShopsAdmin;
