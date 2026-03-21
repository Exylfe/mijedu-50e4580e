import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, Eye, MousePointer, TrendingUp, MapPin, FileText, BarChart3, CheckCircle2, User, Ban, Power, Pencil, Trash2, Package, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import GlassCard from './GlassCard';

interface BrandEntry {
  id: string;
  user_id: string;
  brand_name: string;
  logo_url: string | null;
  is_active: boolean;
  status: string;
  created_at: string;
  // joined from profiles
  nickname?: string;
  tribe?: string;
}

interface BrandApplicant {
  user_id: string;
  nickname: string | null;
  tribe: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_description: string | null;
}

interface BrandReport {
  userId: string;
  brandName: string;
  totalViews: number;
  totalClicks: number;
  whatsappClicks: number;
  websiteClicks: number;
  productCount: number;
  bannerCount: number;
  followerCount: number;
}

const BrandCentreSection = () => {
  const [activeTab, setActiveTab] = useState('owners');
  const [brands, setBrands] = useState<BrandEntry[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<BrandApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<BrandApplicant | null>(null);
  const [approving, setApproving] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BrandReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<BrandEntry | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all brands from brands table
    const { data: brandsData } = await supabase
      .from('brands')
      .select('id, user_id, brand_name, logo_url, is_active, status, created_at')
      .order('created_at', { ascending: false });

    if (brandsData && brandsData.length > 0) {
      // Attach profile info
      const userIds = [...new Set(brandsData.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, tribe')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setBrands(brandsData.map(b => ({
        ...b,
        nickname: profileMap.get(b.user_id)?.nickname || undefined,
        tribe: profileMap.get(b.user_id)?.tribe || undefined,
      })));
    } else {
      setBrands([]);
    }

    // Fetch profiles with brand_name but no brands table entry (pending applicants)
    const { data: profilesWithBrand } = await supabase
      .from('profiles')
      .select('user_id, nickname, tribe, brand_name, brand_logo_url, brand_description')
      .not('brand_name', 'is', null)
      .neq('brand_name', '');

    const brandUserIds = new Set((brandsData || []).map(b => b.user_id));
    setPendingApplicants(
      (profilesWithBrand || []).filter(p => !brandUserIds.has(p.user_id))
    );

    setLoading(false);
  };

  const handleApprove = async (applicant: BrandApplicant) => {
    setApproving(true);
    try {
      // Insert vip_brand role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: applicant.user_id, role: 'vip_brand' as const });
      if (roleError && roleError.code !== '23505') throw roleError;

      // Insert into brands table
      const { error: brandError } = await supabase
        .from('brands')
        .insert({
          user_id: applicant.user_id,
          brand_name: applicant.brand_name || 'Unnamed Brand',
          brand_logo_url: applicant.brand_logo_url,
          logo_url: applicant.brand_logo_url,
          status: 'approved',
        });
      if (brandError) throw brandError;

      // Notify the brand owner
      await supabase.from('notifications').insert({
        user_id: applicant.user_id,
        type: 'brand_approved',
        message: `Your brand "${applicant.brand_name}" has been approved! 🎉`,
      });

      toast.success(`${applicant.brand_name} approved as Brand`);
      setSelectedApplicant(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve brand');
    } finally {
      setApproving(false);
    }
  };

  const handleSuspend = async (brand: BrandEntry) => {
    const { error } = await supabase
      .from('brands')
      .update({ is_active: false, status: 'suspended' })
      .eq('id', brand.id);
    if (error) {
      toast.error('Failed to suspend brand');
    } else {
      toast.success(`${brand.brand_name} suspended`);
      fetchData();
    }
  };

  const handleActivate = async (brand: BrandEntry) => {
    const { error } = await supabase
      .from('brands')
      .update({ is_active: true, status: 'approved' })
      .eq('id', brand.id);
    if (error) {
      toast.error('Failed to activate brand');
    } else {
      toast.success(`${brand.brand_name} activated`);
      fetchData();
    }
  };

  const handleRemove = async (brand: BrandEntry) => {
    if (!confirm(`Remove ${brand.brand_name}? This will delete the brand entry.`)) return;
    
    const { error } = await supabase.from('brands').delete().eq('id', brand.id);
    if (error) {
      toast.error('Failed to remove brand');
    } else {
      // Also remove vip_brand role
      await supabase.from('user_roles').delete().eq('user_id', brand.user_id).eq('role', 'vip_brand');
      toast.success(`${brand.brand_name} removed`);
      fetchData();
    }
  };

  const handleEditOpen = (brand: BrandEntry) => {
    setEditingBrand(brand);
    setEditName(brand.brand_name);
    setEditLogoUrl(brand.logo_url || '');
  };

  const handleEditSave = async () => {
    if (!editingBrand || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('brands')
      .update({ brand_name: editName.trim(), logo_url: editLogoUrl.trim() || null })
      .eq('id', editingBrand.id);
    if (error) {
      toast.error('Failed to update brand');
    } else {
      toast.success('Brand updated');
      setEditingBrand(null);
      fetchData();
    }
    setSaving(false);
  };

  const generateReport = async (brand: BrandEntry) => {
    setGeneratingReport(brand.id);

    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', brand.user_id);

    const productIds = products?.map(p => p.id) || [];
    let totalViews = 0, totalClicks = 0, whatsappClicks = 0, websiteClicks = 0;

    if (productIds.length > 0) {
      const { count: viewCount } = await supabase
        .from('product_views')
        .select('*', { count: 'exact', head: true })
        .in('product_id', productIds);

      const { data: clicks } = await supabase
        .from('product_clicks')
        .select('click_type')
        .in('product_id', productIds);

      totalViews = viewCount || 0;
      totalClicks = clicks?.length || 0;
      whatsappClicks = clicks?.filter(c => c.click_type === 'whatsapp').length || 0;
      websiteClicks = clicks?.filter(c => c.click_type === 'website').length || 0;
    }

    const { count: bannerCount } = await supabase
      .from('banners')
      .select('*', { count: 'exact', head: true })
      .eq('brand_user_id', brand.user_id);

    const { count: followerCount } = await supabase
      .from('entity_follows')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'brand')
      .eq('entity_id', brand.id);

    setSelectedReport({
      userId: brand.user_id,
      brandName: brand.brand_name,
      totalViews,
      totalClicks,
      whatsappClicks,
      websiteClicks,
      productCount: productIds.length,
      bannerCount: bannerCount || 0,
      followerCount: followerCount || 0,
    });
    setGeneratingReport(null);
  };

  const activeBrands = brands.filter(b => b.is_active && b.status === 'approved');
  const suspendedBrands = brands.filter(b => !b.is_active || b.status === 'suspended');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Brand Centre</h2>
            <p className="text-xs text-muted-foreground">
              {activeBrands.length} active · {suspendedBrands.length} suspended · {pendingApplicants.length} pending
            </p>
          </div>
        </div>
      </GlassCard>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="owners" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs">
            <Store className="w-3.5 h-3.5 mr-1" />
            Active ({activeBrands.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs">
            <Users className="w-3.5 h-3.5 mr-1" />
            Requests ({pendingApplicants.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs">
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Active Brands */}
        <TabsContent value="owners" className="mt-4 space-y-3">
          {activeBrands.length === 0 && suspendedBrands.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No brands yet.</p>
            </GlassCard>
          ) : (
            <>
              {activeBrands.map((brand, index) => (
                <motion.div key={brand.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{brand.brand_name}</p>
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">Active</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{brand.nickname} · {brand.tribe || 'No tribe'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditOpen(brand)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => handleSuspend(brand)} title="Suspend">
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => generateReport(brand)} disabled={generatingReport === brand.id} title="Report">
                          {generatingReport === brand.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemove(brand)} title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {/* Suspended Brands */}
              {suspendedBrands.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-muted-foreground px-1 pt-4">Suspended</h3>
                  {suspendedBrands.map((brand, index) => (
                    <motion.div key={brand.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <GlassCard className="p-4 opacity-70">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
                            {brand.logo_url ? (
                              <img src={brand.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{brand.brand_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{brand.nickname}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">Suspended</Badge>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleActivate(brand)}>
                              <Power className="w-3 h-3 mr-1" /> Activate
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemove(brand)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Pending Requests */}
        <TabsContent value="requests" className="mt-4 space-y-3">
          {pendingApplicants.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending brand requests.</p>
            </GlassCard>
          ) : (
            pendingApplicants.map(applicant => (
              <GlassCard key={applicant.user_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{applicant.brand_name || applicant.nickname || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground truncate">{applicant.tribe || 'No tribe'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">Pending</Badge>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedApplicant(applicant)}>
                      <Eye className="w-3 h-3 mr-1" /> Review
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="mt-4 space-y-3">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Generate Individual Reports</h3>
            {brands.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No brands to report on.</p>
            ) : (
              <div className="space-y-2">
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => generateReport(brand)}
                    disabled={generatingReport === brand.id}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">{brand.brand_name}</span>
                      {!brand.is_active && <Badge variant="outline" className="text-[10px]">Suspended</Badge>}
                    </div>
                    {generatingReport === brand.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicant(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Brand Application</DialogTitle>
            <DialogDescription>Review the brand details below.</DialogDescription>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedApplicant.brand_logo_url ? (
                  <img src={selectedApplicant.brand_logo_url} alt="Brand logo" className="w-20 h-20 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Brand Name</p><p className="text-sm font-medium text-foreground">{selectedApplicant.brand_name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Applicant</p><p className="text-sm text-foreground">{selectedApplicant.nickname || 'Anonymous'}</p></div>
                <div><p className="text-xs text-muted-foreground">Tribe</p><p className="text-sm text-foreground">{selectedApplicant.tribe || 'None'}</p></div>
                <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm text-foreground">{selectedApplicant.brand_description || 'No description.'}</p></div>
              </div>
              <Button className="w-full" onClick={() => handleApprove(selectedApplicant)} disabled={approving}>
                {approving ? 'Approving…' : 'Approve as Brand'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Brand Modal */}
      <Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update brand information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Brand Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Logo URL</label>
              <Input value={editLogoUrl} onChange={(e) => setEditLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button className="w-full" onClick={handleEditSave} disabled={saving || !editName.trim()}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={() => setSelectedReport(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedReport.brandName}</h2>
                  <p className="text-xs text-muted-foreground">Performance Report</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Views</span></div>
                  <p className="text-xl font-bold text-foreground">{selectedReport.totalViews.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1"><MousePointer className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Clicks</span></div>
                  <p className="text-xl font-bold text-foreground">{selectedReport.totalClicks.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">WhatsApp</span></div>
                  <p className="text-xl font-bold text-foreground">{selectedReport.whatsappClicks}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Website</span></div>
                  <p className="text-xl font-bold text-foreground">{selectedReport.websiteClicks}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-lg font-bold text-foreground">{selectedReport.productCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground">Billboards</p>
                  <p className="text-lg font-bold text-foreground">{selectedReport.bannerCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground">Followers</p>
                  <p className="text-lg font-bold text-foreground">{selectedReport.followerCount}</p>
                </div>
              </div>
              <Button onClick={() => setSelectedReport(null)} className="w-full">Close Report</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default BrandCentreSection;
