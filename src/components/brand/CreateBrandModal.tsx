import { useState, useEffect } from 'react';
import { Crown, Search, Plus, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface CreateBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExistingUser {
  user_id: string;
  nickname: string;
  tribe: string;
}

const CreateBrandModal = ({ isOpen, onClose, onSuccess }: CreateBrandModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'select' | 'create'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<ExistingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ExistingUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    brand_name: '',
    brand_description: '',
    brand_logo_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    // Get users who are NOT already vip_brands
    const { data: brandRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'vip_brand');

    const brandUserIds = brandRoles?.map(r => r.user_id) || [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, tribe')
      .order('nickname');

    if (profiles) {
      setUsers(profiles.filter(p => !brandUserIds.includes(p.user_id)));
    }
  };

  const filteredUsers = users.filter(u => 
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.tribe.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateBrand = async () => {
    if (!selectedUser || !form.brand_name) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    // Add vip_brand role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: selectedUser.user_id,
        role: 'vip_brand'
      });

    if (roleError) {
      toast({ title: 'Error adding brand role', description: roleError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Update profile with brand info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        brand_name: form.brand_name,
        brand_description: form.brand_description || null,
        brand_logo_url: form.brand_logo_url || null
      })
      .eq('user_id', selectedUser.user_id);

    if (profileError) {
      toast({ title: 'Error updating profile', description: profileError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    toast({ title: 'Brand account created!', description: `${form.brand_name} is now a VIP Brand partner` });
    resetAndClose();
    onSuccess();
  };

  const resetAndClose = () => {
    setStep('select');
    setSearchQuery('');
    setSelectedUser(null);
    setForm({ brand_name: '', brand_description: '', brand_logo_url: '' });
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Create Brand Partner Account
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Search for a user to convert</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search by nickname or tribe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredUsers.slice(0, 10).map((user) => (
                <Card 
                  key={user.user_id}
                  onClick={() => setSelectedUser(user)}
                  className={`cursor-pointer transition-all ${
                    selectedUser?.user_id === user.user_id 
                      ? 'bg-amber-500/20 border-amber-500/50' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{user.nickname}</p>
                      <p className="text-slate-400 text-xs">{user.tribe}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-slate-400 py-4">No users found</p>
              )}
            </div>

            <Button
              onClick={() => setStep('create')}
              disabled={!selectedUser}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
            >
              Continue with {selectedUser?.nickname || 'selected user'}
            </Button>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-4 mt-4">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400">Creating brand for:</p>
              <p className="text-white font-medium">{selectedUser?.nickname}</p>
            </div>

            <div>
              <Label className="text-slate-300">Brand Name *</Label>
              <Input
                placeholder="e.g., TNM Malawi"
                value={form.brand_name}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Brand Description</Label>
              <Textarea
                placeholder="About the brand..."
                value={form.brand_description}
                onChange={(e) => setForm({ ...form, brand_description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Logo URL</Label>
              <Input
                placeholder="https://..."
                value={form.brand_logo_url}
                onChange={(e) => setForm({ ...form, brand_logo_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateBrand}
                disabled={isLoading || !form.brand_name}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" /> Create Brand
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateBrandModal;
