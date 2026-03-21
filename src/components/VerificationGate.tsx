import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Key, Shield, ArrowRight, Check, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Tribe } from './TribeCard';
import { z } from 'zod';

interface VerificationGateProps {
  tribe: Tribe | null;
  onClose: () => void;
}

const nicknameSchema = z.string()
  .trim()
  .min(3, { message: 'Nickname must be at least 3 characters' })
  .max(20, { message: 'Nickname must be less than 20 characters' })
  .regex(/^[a-zA-Z0-9_]+$/, { message: 'Nickname can only contain letters, numbers, and underscores' });

const accessCodeSchema = z.string()
  .trim()
  .min(4, { message: 'Access code must be at least 4 characters' })
  .max(50, { message: 'Access code must be less than 50 characters' });

const ACADEMIC_LEVELS = [
  'Year 1',
  'Year 2', 
  'Year 3',
  'Year 4',
  'Year 5',
  'Postgraduate'
];

const VerificationGate = ({ tribe, onClose }: VerificationGateProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nickname, setNickname] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!tribe) return null;

  const isCollege = tribe.type === 'college';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WebP, or PDF file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setSelectedFileName(file.name);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/student-id-${Date.now()}.${fileExt}`;

      // Upload to identities bucket
      const { data, error } = await supabase.storage
        .from('identities')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get signed URL (bucket is private)
      const { data: urlData } = await supabase.storage
        .from('identities')
        .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 day expiry

      setUploadedFileUrl(urlData?.signedUrl || fileName);
      setUploadSuccess(true);
      toast.success('Student ID uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
      setSelectedFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    // Validate nickname
    const nicknameValidation = nicknameSchema.safeParse(nickname);
    if (!nicknameValidation.success) {
      toast.error(nicknameValidation.error.errors[0].message);
      return;
    }

    if (!isCollege) {
      const codeValidation = accessCodeSchema.safeParse(accessCode);
      if (!codeValidation.success) {
        toast.error(codeValidation.error.errors[0].message);
        return;
      }
    }

    if (!user) {
      toast.error('Please sign in first');
      navigate('/auth');
      return;
    }

    if (isCollege) {
      if (!uploadSuccess || !uploadedFileUrl) {
        toast.error('Please upload your Student ID first');
        return;
      }
      if (!academicLevel) {
        toast.error('Please select your academic level');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Check if nickname is taken
      const { data: existingNickname } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname.trim())
        .maybeSingle();

      if (existingNickname) {
        toast.error('This nickname is already taken');
        setIsSubmitting(false);
        return;
      }

      // Create profile with pending verification status
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          nickname: nickname.trim(),
          tribe: tribe.name,
          tribe_type: tribe.type,
          is_verified: false, // Pending verification
          verification_code: !isCollege ? accessCode.trim() : null,
          student_id_url: isCollege ? uploadedFileUrl : null,
          academic_level: isCollege ? academicLevel : null
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a profile. Please wait for verification.');
        } else {
          toast.error('Failed to submit request. Please try again.');
        }
      } else {
        toast.success('Request submitted successfully!');
        navigate('/pending');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-lg"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md mx-4 mb-4 md:mb-0 gradient-border rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-muted/20" />

          {/* Content */}
          <div className="relative p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center
                ${isCollege 
                  ? 'bg-gradient-to-br from-neon-purple to-neon-purple/50' 
                  : 'bg-gradient-to-br from-neon-pink to-neon-pink/50'
                }
              `}>
                <Shield className="w-7 h-7 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Request Entry</h2>
                <p className="text-sm text-muted-foreground">{tribe.name}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-6">
              {isCollege
                ? 'Verify your student status to join this college community. Your ID will be reviewed by the Tribe Admin.'
                : 'Enter your exclusive access code to unlock this community. Codes are shared by existing members.'}
            </p>

            {/* Nickname field (common to both) */}
            <div className="mb-4">
              <Label className="text-foreground mb-2">
                Choose your nickname
              </Label>
              <Input
                type="text"
                placeholder="Enter a unique nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full h-12 bg-muted/50 border-border focus:border-neon-purple focus:ring-neon-purple/20 text-foreground placeholder:text-muted-foreground rounded-xl"
              />
            </div>

            {/* Verification method */}
            {isCollege ? (
              <div className="space-y-4">
                {/* Academic Level Dropdown */}
                <div>
                  <Label className="text-foreground mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Academic Level
                  </Label>
                  <Select value={academicLevel} onValueChange={setAcademicLevel}>
                    <SelectTrigger className="w-full h-12 bg-muted/50 border-border focus:border-neon-purple focus:ring-neon-purple/20 text-foreground rounded-xl">
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />
                
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleUploadClick}
                  disabled={isUploading || uploadSuccess}
                  className={`
                    w-full p-4 rounded-xl border-2 border-dashed transition-all duration-300
                    ${uploadSuccess 
                      ? 'border-emerald-500/50 bg-emerald-500/10' 
                      : 'border-border hover:border-neon-purple/50 hover:bg-neon-purple/5'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-3">
                    {uploadSuccess ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="text-center">
                          <span className="block text-emerald-500 font-medium">ID Uploaded Successfully</span>
                          {selectedFileName && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                              {selectedFileName}
                            </span>
                          )}
                        </div>
                      </>
                    ) : isUploading ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-neon-purple animate-spin" />
                        </div>
                        <span className="text-muted-foreground">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <span className="block text-foreground font-medium">Upload Student ID</span>
                          <span className="text-xs text-muted-foreground">JPG, PNG, WebP or PDF • Max 5MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.button>

                <Button
                  onClick={handleSubmit}
                  disabled={!uploadSuccess || !nickname.trim() || !academicLevel || isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-neon-purple to-neon-pink text-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Submit for Review
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter access code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full h-14 pl-12 bg-muted/50 border-border focus:border-neon-pink focus:ring-neon-pink/20 text-foreground placeholder:text-muted-foreground rounded-xl"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!accessCode.trim() || !nickname.trim() || isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-neon-pink to-neon-violet text-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Verify Access Code
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Footer note */}
            <p className="mt-4 text-xs text-center text-muted-foreground">
              By requesting entry, you agree to our community guidelines
            </p>

            {/* Sign in prompt if not authenticated */}
            {!user && (
              <div className="mt-4 p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/30">
                <p className="text-sm text-center text-foreground">
                  You need to{' '}
                  <button
                    onClick={() => navigate('/auth')}
                    className="text-neon-purple hover:text-neon-pink font-medium underline"
                  >
                    sign in
                  </button>
                  {' '}to request entry
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VerificationGate;
