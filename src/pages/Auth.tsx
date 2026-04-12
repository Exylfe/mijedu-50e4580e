import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AdaptiveLogo from '@/components/AdaptiveLogo';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

const signUpSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  nickname: z.string().trim()
    .min(3, { message: 'Nickname must be at least 3 characters' })
    .max(20, { message: 'Nickname must be less than 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Letters, numbers, and underscores only' }),
  tribe: z.string().min(1, { message: 'Please select a tribe' })
});

interface TribeOption {
  id: string;
  name: string;
  type: string;
}

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedTribe, setSelectedTribe] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tribes, setTribes] = useState<TribeOption[]>([]);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTribes = async () => {
      const { data } = await supabase
        .from('tribes')
        .select('id, name, type')
        .eq('is_visible', true)
        .order('type')
        .order('name');
      if (data) setTribes(data);
    };
    fetchTribes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    } else {
      const validation = signUpSchema.safeParse({ email, password, nickname, tribe: selectedTribe });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/feed');
        }
      } else {
        // Check nickname availability first
        const { data: existingNickname } = await supabase
          .from('profiles')
          .select('id')
          .eq('nickname', nickname.trim())
          .maybeSingle();

        if (existingNickname) {
          toast.error('This nickname is already taken');
          setIsLoading(false);
          return;
        }

        const tribe = tribes.find(t => t.name === selectedTribe);
        // Pass nickname and tribe as metadata — the handle_new_user trigger creates the profile
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/`,
            data: {
              nickname: nickname.trim(),
              tribe: selectedTribe,
              tribe_type: tribe?.type || 'college',
            }
          }
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! Welcome to Mijedu.');
          navigate('/feed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const collegeTribes = tribes.filter(t => t.type === 'college');
  const mediaTribes = tribes.filter(t => t.type === 'media');

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 overflow-y-auto">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <AdaptiveLogo size="w-28 h-28" className="mb-4" />
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? 'Welcome back to your tribe' : 'Join the movement'}
          </p>
        </div>

        {/* Form card */}
        <div className="gradient-border rounded-2xl overflow-hidden">
          <div className="glass-card p-6 rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => setTimeout(() => (e.target as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)}
                  className="h-14 pl-12 bg-muted/50 border-border focus:border-neon-purple focus:ring-neon-purple/20 text-foreground placeholder:text-muted-foreground rounded-xl"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => setTimeout(() => (e.target as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)}
                  className="h-14 pl-12 pr-12 bg-muted/50 border-border focus:border-neon-purple focus:ring-neon-purple/20 text-foreground placeholder:text-muted-foreground rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Sign-up only fields */}
              {!isLogin && (
                <>
                  {/* Nickname */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Choose a nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onFocus={(e) => setTimeout(() => (e.target as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)}
                      className="h-14 pl-12 bg-muted/50 border-border focus:border-neon-purple focus:ring-neon-purple/20 text-foreground placeholder:text-muted-foreground rounded-xl"
                    />
                  </div>

                  {/* Tribe Selection */}
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Select value={selectedTribe} onValueChange={setSelectedTribe}>
                      <SelectTrigger className="h-14 pl-12 bg-muted/50 border-border focus:border-neon-purple focus:ring-neon-purple/20 text-foreground rounded-xl">
                        <SelectValue placeholder="Select your tribe" />
                      </SelectTrigger>
                      <SelectContent>
                        {collegeTribes.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Colleges</div>
                            {collegeTribes.map(t => (
                              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                            ))}
                          </>
                        )}
                        {mediaTribes.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Media & Influencer Hubs</div>
                            {mediaTribes.map(t => (
                              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-neon-purple to-neon-pink text-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: import.meta.env.VITE_APP_URL || window.location.origin },
                  });
                  if (error) toast.error(String(error));
                } catch (err) {
                  toast.error('Google sign-in failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full h-14 rounded-xl mt-4 gap-3 text-sm font-medium"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Forgot Password & Toggle */}
            <div className="mt-6 space-y-3 text-center">
              {isLogin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      toast.error('Enter your email address first');
                      return;
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`,
                    });
                    if (error) toast.error(error.message);
                    else toast.success('Password reset link sent to your email');
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
              )}
              <p className="text-muted-foreground text-sm">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-neon-purple hover:text-neon-pink transition-colors font-medium"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Decorative */}
            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              <span>Exclusive communities await</span>
              <Sparkles className="w-4 h-4 text-neon-pink" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
