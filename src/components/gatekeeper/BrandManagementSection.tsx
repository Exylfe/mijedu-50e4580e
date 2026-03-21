import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, Eye, Store, User } from 'lucide-react';
import GlassCard from './GlassCard';

interface BrandApplicant {
  user_id: string;
  nickname: string | null;
  tribe: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_description: string | null;
}

const BrandManagementSection = () => {
  const [applicants, setApplicants] = useState<BrandApplicant[]>([]);
  const [approvedBrands, setApprovedBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<BrandApplicant | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch profiles that have brand_name filled in
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, tribe, brand_name, brand_logo_url, brand_description')
      .not('brand_name', 'is', null)
      .neq('brand_name', '');

    // Fetch existing vip_brand roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'vip_brand');

    const approvedIds = (roles || []).map(r => r.user_id);
    setApprovedBrands(approvedIds);
    setApplicants(profiles || []);
    setLoading(false);
  };

  const handleApprove = async (applicant: BrandApplicant) => {
    setApproving(true);
    try {
      // 1. Insert vip_brand role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: applicant.user_id, role: 'vip_brand' as const });

      if (roleError) throw roleError;

      // 2. Insert into brands table
      const { error: brandError } = await supabase
        .from('brands')
        .insert({
          user_id: applicant.user_id,
          brand_name: applicant.brand_name || 'Unnamed Brand',
          logo_url: applicant.brand_logo_url,
        });

      if (brandError) throw brandError;

      toast({
        title: 'Brand Approved',
        description: `${applicant.brand_name} has been promoted to VIP Brand.`,
      });

      setApprovedBrands(prev => [...prev, applicant.user_id]);
      setSelectedApplicant(null);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve brand.',
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  };

  const pending = applicants.filter(a => !approvedBrands.includes(a.user_id));
  const approved = applicants.filter(a => approvedBrands.includes(a.user_id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Brand Management</h2>
            <p className="text-xs text-muted-foreground">
              {pending.length} pending · {approved.length} approved
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-1">Pending Requests</h3>
          {pending.map(applicant => (
            <GlassCard key={applicant.user_id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {applicant.nickname || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{applicant.tribe || 'No tribe'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">
                    Pending
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setSelectedApplicant(applicant)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Approved Brands */}
      {approved.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-1">Approved Brands</h3>
          {approved.map(applicant => (
            <GlassCard key={applicant.user_id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    {applicant.brand_logo_url ? (
                      <img src={applicant.brand_logo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <Store className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{applicant.brand_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{applicant.nickname || 'Anonymous'}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {pending.length === 0 && approved.length === 0 && (
        <GlassCard className="p-8 text-center">
          <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No brand applications yet.</p>
        </GlassCard>
      )}

      {/* Approval Modal */}
      <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicant(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Brand Application</DialogTitle>
            <DialogDescription>Review the brand details below.</DialogDescription>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4">
              {/* Logo */}
              <div className="flex justify-center">
                {selectedApplicant.brand_logo_url ? (
                  <img
                    src={selectedApplicant.brand_logo_url}
                    alt="Brand logo"
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Brand Name</p>
                  <p className="text-sm font-medium text-foreground">{selectedApplicant.brand_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Applicant</p>
                  <p className="text-sm text-foreground">{selectedApplicant.nickname || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tribe</p>
                  <p className="text-sm text-foreground">{selectedApplicant.tribe || 'None'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="text-sm text-foreground">{selectedApplicant.brand_description || 'No description provided.'}</p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => handleApprove(selectedApplicant)}
                disabled={approving}
              >
                {approving ? 'Approving…' : 'Approve as Brand'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandManagementSection;
