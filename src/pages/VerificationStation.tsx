import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, Clock, CheckCircle2,
  Image, User, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AcademicLevelBadge from '@/components/AcademicLevelBadge';
import QuickApproveCard from '@/components/verification/QuickApproveCard';

interface PendingStudent {
  id: string;
  user_id: string;
  nickname: string;
  tribe: string;
  tribe_type: string;
  academic_level: string | null;
  student_id_url: string | null;
  created_at: string;
}

const VerificationStation = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, adminTribe } = useAuth();

  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [reviewImageUrl, setReviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    fetchPendingStudents();
  }, [user, isAdmin]);

  const fetchPendingStudents = async () => {
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_verified', false)
      .eq('tribe_type', 'college')
      .not('student_id_url', 'is', null)
      .order('created_at', { ascending: true });

    if (!isSuperAdmin && adminTribe) {
      query = query.eq('tribe', adminTribe);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pending students:', error);
      toast.error('Failed to load verification queue');
    } else {
      setPendingStudents(data as PendingStudent[]);
    }
    setLoading(false);
  };

  const handleReview = async (student: PendingStudent) => {
    setSelectedStudent(student);
    setShowReviewModal(true);
    setImageLoading(true);
    setReviewImageUrl(null);

    // Generate a fresh signed URL for the admin to view the ID
    if (student.student_id_url) {
      // Extract the storage path from the URL
      const urlParts = student.student_id_url.split('/identities/');
      const storagePath = urlParts[urlParts.length - 1]?.split('?')[0];
      
      if (storagePath) {
        const { data } = await supabase.storage
          .from('identities')
          .createSignedUrl(decodeURIComponent(storagePath), 3600); // 1 hour
        
        if (data?.signedUrl) {
          setReviewImageUrl(data.signedUrl);
        }
      }
    }
  };

  const handleApprove = async (student: PendingStudent) => {
    setProcessingId(student.id);

    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', student.id);

    if (error) {
      toast.error('Failed to approve student');
    } else {
      if (user) {
        await supabase.from('admin_action_logs').insert({
          admin_id: user.id,
          action: 'verify_student',
          target_user_id: student.user_id,
          details: { target_type: 'profile', target_tribe: student.tribe, action: 'approved', nickname: student.nickname } as unknown as Record<string, never>,
        });
      }

      toast.success(`${student.nickname} has been approved! 🎉`);
      setShowReviewModal(false);
      setSelectedStudent(null);
      fetchPendingStudents();
    }
    setProcessingId(null);
  };

  const handleReject = async (student: PendingStudent) => {
    setProcessingId(student.id);

    const { error } = await supabase
      .from('profiles')
      .update({ student_id_url: null })
      .eq('id', student.id);

    if (error) {
      toast.error('Failed to reject student');
    } else {
      if (user) {
        await supabase.from('admin_action_logs').insert({
          admin_id: user.id,
          action: 'reject_verification',
          target_user_id: student.user_id,
          details: { target_type: 'profile', target_tribe: student.tribe, action: 'rejected', nickname: student.nickname } as unknown as Record<string, never>,
        });
      }

      toast.info(`${student.nickname} has been notified to re-upload their ID`);
      setShowReviewModal(false);
      setSelectedStudent(null);
      fetchPendingStudents();
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Verification Station</h1>
              <p className="text-[10px] text-muted-foreground">
                {isSuperAdmin ? 'All Tribes' : adminTribe || 'Your Tribe'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">{pendingStudents.length} Pending</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6">
        {pendingStudents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">All Clear!</h2>
            <p className="text-muted-foreground">No pending verifications at the moment.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {pendingStudents.map((student, index) => (
                <QuickApproveCard
                  key={student.id}
                  student={student}
                  index={index}
                  processingId={processingId}
                  onReview={handleReview}
                  onQuickApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-lg bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Student Verification Review
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedStudent.nickname[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-foreground">{selectedStudent.nickname}</h3>
                    <AcademicLevelBadge level={selectedStudent.academic_level} size="md" />
                  </div>
                  <p className="text-sm text-primary font-medium">{selectedStudent.tribe}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStudent.academic_level || 'No academic level specified'}
                  </p>
                </div>
              </div>

              {/* Student ID Image */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  Student ID Photo
                </label>
                <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30 min-h-[200px]">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}
                  {(reviewImageUrl || selectedStudent.student_id_url) && (
                    <img
                      src={reviewImageUrl || selectedStudent.student_id_url || ''}
                      alt="Student ID"
                      className="w-full object-contain max-h-[400px]"
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleReject(selectedStudent)}
                  disabled={processingId === selectedStudent.id}
                  className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  {processingId === selectedStudent.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span className="mr-2">✕</span>
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleApprove(selectedStudent)}
                  disabled={processingId === selectedStudent.id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {processingId === selectedStudent.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationStation;
