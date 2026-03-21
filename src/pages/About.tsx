import { ArrowLeft, Heart, Shield, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AdaptiveLogo from '@/components/AdaptiveLogo';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-border">
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold gradient-text">About Mijedu</h1>
        </div>
      </header>

      <div className="px-4 py-8 space-y-8">
        {/* Logo & Tagline */}
        <div className="text-center">
          <AdaptiveLogo size="w-24 h-24" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold gradient-text mb-2">Mijedu</h2>
          <p className="text-muted-foreground">Your Campus. Your Tribe. Your Voice.</p>
        </div>

        {/* Mission */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Our Mission</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Mijedu connects Malawian university students in a safe, verified space where they can share ideas, 
            discuss campus life, and build meaningful connections within their tribes.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">What We Offer</h3>
          
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Verified Students Only</p>
              <p className="text-sm text-muted-foreground">Every user is verified with their student ID</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
            <Users className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Tribe Communities</p>
              <p className="text-sm text-muted-foreground">Connect with students from your university</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Stories & Posts</p>
              <p className="text-sm text-muted-foreground">Share moments and thoughts with your tribe</p>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="text-center pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Made with ❤️ in Malawi</p>
        </div>
      </div>
    </div>
  );
};

export default About;
