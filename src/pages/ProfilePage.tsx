import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Settings, MapPin, Link as LinkIcon, MessageCircle, Calendar, 
  Store, ShoppingBag, ExternalLink, Eye, MousePointer, Crown, 
  ShieldCheck, Building2, TrendingUp, Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PostCard from '@/components/PostCard';
import BottomNav from '@/components/BottomNav';
import RoleBadge from '@/components/RoleBadge';
import AcademicLevelBadge from '@/components/AcademicLevelBadge';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDistanceToNow } from 'date-fns';
import DigitalIDCard from '@/components/DigitalIDCard';
import IDCardViewer from '@/components/IDCardViewer';
import StudentPointsCard from '@/components/points/StudentPointsCard';

interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  tribe: string;
  tribe_type: string;
  is_verified: boolean;
  avatar_url: string | null;
  bio: string | null;
  academic_level: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_description: string | null;
  social_links: Record<string, string> | null;
  whatsapp_number: string | null;
  website_url: string | null;
  created_at: string;
}

interface PostWithProfile {
  id: string;
  content: string;
  fire_count: number;
  report_count: number;
  is_hidden: boolean;
  created_at: string;
  user_id: string;
  visibility?: string;
  target_tribe?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  profiles: {
    nickname: string;
    tribe: string;
  } | null;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_sold_out: boolean;
  is_special_offer: boolean;
}

interface BrandStats {
  totalViews: number;
  totalClicks: number;
  productCount: number;
}

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, isSuperAdmin, isAdmin, adminTribe } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('home');
  const [brandStats, setBrandStats] = useState<BrandStats | null>(null);
  const [tribeInfo, setTribeInfo] = useState<{ id: string; name: string } | null>(null);
  const [showIDCard, setShowIDCard] = useState(false);
  const { role } = useUserRole(profile?.user_id);
  const isOwner = user?.id === profile?.user_id;
  const isVipBrand = role === 'vip_brand';
  const isProfileTribeAdmin = role === 'tribe_admin';
  const isStudent = role === 'user';
  
  // Can current viewer see brand stats? (brand owner or super admin viewing a brand)
  const canSeeBrandStats = isVipBrand && (isOwner || isSuperAdmin);
  
  // Can current viewer open management hub?
  const canOpenManagementHub = isSuperAdmin && (isVipBrand || isProfileTribeAdmin);
  
  // Can current viewer open tribe admin hub for this profile's tribe?
  const canOpenTribeAdminHub = profile && (isSuperAdmin || (isAdmin && adminTribe === profile.tribe));

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);
  useEffect(() => {
    if (profile) {
      fetchUserPosts();
      fetchTribeInfo();
      if (user) {
        fetchUserReactions();
      }
      if (isVipBrand) {
        fetchProducts();
        if (canSeeBrandStats) {
          fetchBrandStats();
        }
      }
    }
  }, [profile, user, isVipBrand, canSeeBrandStats]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single();
    
    if (!error && data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  };

  const fetchTribeInfo = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('tribes')
      .select('id, name')
      .eq('name', profile.tribe)
      .single();
    if (data) setTribeInfo(data);
  };

  const fetchBrandStats = async () => {
    if (!profile) return;
    
    // Get product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.user_id);
    
    // Get total views (sum of product views)
    const { data: productIds } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', profile.user_id);
    
    let totalViews = 0;
    let totalClicks = 0;
    
    if (productIds && productIds.length > 0) {
      const ids = productIds.map(p => p.id);
      
      const { count: views } = await supabase
        .from('product_views')
        .select('*', { count: 'exact', head: true })
        .in('product_id', ids);
      
      const { count: clicks } = await supabase
        .from('product_clicks')
        .select('*', { count: 'exact', head: true })
        .in('product_id', ids);
      
      totalViews = views || 0;
      totalClicks = clicks || 0;
    }
    
    setBrandStats({
      totalViews,
      totalClicks,
      productCount: productCount || 0
    });
  };

  const fetchUserPosts = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('posts')
      .select('id, content, fire_count, report_count, is_hidden, created_at, user_id, visibility, target_tribe, media_url, media_type')
      .eq('user_id', profile.user_id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const postsWithProfile = data.map(post => ({
        ...post,
        profiles: {
          nickname: profile.nickname,
          tribe: profile.tribe
        }
      }));
      setPosts(postsWithProfile);
    }
  };

  const fetchProducts = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
  };

  const fetchUserReactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_reactions')
      .select('post_id')
      .eq('user_id', user.id);
    
    if (data) {
      setUserReactions(data.map(r => r.post_id));
    }
  };

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    setActiveNav(item);
    switch (item) {
      case 'home':
        navigate('/feed');
        break;
      case 'discover':
        navigate('/explore');
        break;
      case 'chat':
        navigate('/tribe-feed');
        break;
      case 'market':
        navigate('/market');
        break;
    }
  };

  const handleReactionChange = () => {
    fetchUserPosts();
    fetchUserReactions();
  };

  const handleWhatsApp = () => {
    if (profile?.whatsapp_number) {
      const cleanNumber = profile.whatsapp_number.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Profile not found</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const displayName = isVipBrand && profile.brand_name ? profile.brand_name : profile.nickname;
  const displayImage = isVipBrand && profile.brand_logo_url ? profile.brand_logo_url : profile.avatar_url;
  const displayBio = isVipBrand && profile.brand_description ? profile.brand_description : profile.bio;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cover Photo */}
      <div className="relative h-32 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.2),transparent)]" />
        
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 bg-background/50 backdrop-blur-sm hover:bg-background/70 z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Manage Profile button for owner */}
        {isOwner && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/settings')}
            className="absolute top-3 right-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground gap-1.5 z-10"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Manage Profile</span>
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          {/* Profile Picture */}
          <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-muted">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt={displayName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">
                  {displayName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
              <RoleBadge role={role} size="md" />
              <AcademicLevelBadge level={profile.academic_level} size="md" />
              {profile.is_verified && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Verified
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile.tribe}
            </p>
          </div>
        </div>

        {/* Bio */}
        {displayBio && (
          <p className="text-foreground mb-4">{displayBio}</p>
        )}

        {/* Conditional Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* For Students: Message button */}
          {isStudent && !isOwner && profile.whatsapp_number && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleWhatsApp}
              className="gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Button>
          )}
          
          {/* For Brands: View Shop button */}
          {isVipBrand && !isOwner && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate('/market')}
              className="gap-1.5"
            >
              <Store className="w-4 h-4" />
              View Shop
            </Button>
          )}
          
          {/* Admin Door: Open Management Hub (for super admins viewing brand/tribe admin profiles) */}
          {canOpenManagementHub && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (isVipBrand) {
                  navigate('/brand-hub');
                } else if (isProfileTribeAdmin) {
                  navigate(`/tribe-admin/${encodeURIComponent(profile.tribe)}`);
                }
              }}
              className="gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            >
              <Crown className="w-4 h-4" />
              Open Management Hub
            </Button>
          )}
        </div>

        {/* Social Links / Contact */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              Website
            </a>
          )}
          {profile.whatsapp_number && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm hover:opacity-80 transition-opacity"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </button>
          )}
          {profile.social_links && Object.entries(profile.social_links).map(([platform, url]) => (
            url && (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors capitalize"
              >
                <ExternalLink className="w-3 h-3" />
                {platform}
              </a>
            )
          ))}
        </div>

        {/* Tribe Membership & Verification Status for Students */}
        {isStudent && (
           <div className="mb-4">
             {/* Digital Student ID Card - tap to expand */}
             <button
               onClick={() => setShowIDCard(true)}
               className="w-full text-left focus:outline-none active:scale-[0.98] transition-transform"
             >
               <DigitalIDCard
                 nickname={profile.nickname}
                 tribe={profile.tribe}
                 isVerified={profile.is_verified}
                 avatarUrl={profile.avatar_url}
                 joinedAt={profile.created_at}
                 academicLevel={profile.academic_level}
                 userId={profile.user_id}
                 role={role}
               />
             </button>
             <p className="text-center text-xs text-muted-foreground mt-1.5">Tap card to view & share</p>

             <IDCardViewer
               open={showIDCard}
               onClose={() => setShowIDCard(false)}
               nickname={profile.nickname}
               tribe={profile.tribe}
               isVerified={profile.is_verified}
               avatarUrl={profile.avatar_url}
               joinedAt={profile.created_at}
               academicLevel={profile.academic_level}
               userId={profile.user_id}
               role={role}
             />
             
             {/* Tribe Admin Hub button for admins */}
             {canOpenTribeAdminHub && tribeInfo && (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => navigate(`/tribe-admin/${encodeURIComponent(profile.tribe)}`)}
                 className="w-full mt-3 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
               >
                 <Building2 className="w-4 h-4" />
                 Open Tribe Admin Hub
               </Button>
             )}
           </div>
        )}

        {/* Brand Performance Stats (visible to brand owner and super admin) */}
        {canSeeBrandStats && brandStats && (
          <Card className="mb-4 bg-card/50 border-border/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Marketplace Performance
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{brandStats.productCount}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{brandStats.totalViews}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MousePointer className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{brandStats.totalClicks}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Points Card */}
        {isStudent && (
          <div className="mb-4">
            <StudentPointsCard userId={profile.user_id} />
          </div>
        )}

        {/* Joined date */}
        <p className="text-muted-foreground text-xs flex items-center gap-1 mb-6">
          <Calendar className="w-3 h-3" />
          Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
        </p>

        {/* Brand Products Section */}
        {isVipBrand && products.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Products & Services
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 4).map((product) => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/market')}
                >
                  {product.image_url && (
                    <div className="aspect-square relative">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      {product.is_sold_out && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="text-destructive font-bold">Sold Out</span>
                        </div>
                      )}
                      {product.is_special_offer && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                          Mijedu Exclusive
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-2">
                    <h3 className="font-medium text-foreground text-sm line-clamp-1">
                      {product.title}
                    </h3>
                    <span className="font-bold text-primary text-sm">
                      MK{product.price.toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
            {products.length > 4 && (
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => navigate('/market')}
              >
                View all {products.length} products
              </Button>
            )}
          </section>
        )}

        {/* Posts Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Posts ({posts.length})
          </h2>
          
          {posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-muted/30 rounded-xl"
            >
              <p className="text-muted-foreground">No posts yet</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  userReactions={userReactions}
                  onReactionChange={handleReactionChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav activeItem={activeNav} onItemClick={handleNavClick} />
    </div>
  );
};

export default ProfilePage;
