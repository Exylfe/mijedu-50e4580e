 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { Check, X, Image, User, ExternalLink, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import GlassCard from './GlassCard';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface PendingMember {
   id: string;
   user_id: string;
   nickname: string;
   tribe: string;
   tribe_type: string;
   student_id_url: string | null;
   created_at: string;
 }
 
 interface VerificationQueueProps {
   pendingMembers: PendingMember[];
   onRefresh: () => void;
 }
 
 const VerificationQueue = ({ pendingMembers, onRefresh }: VerificationQueueProps) => {
   const [processingId, setProcessingId] = useState<string | null>(null);
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [showImageModal, setShowImageModal] = useState(false);
 
   const handleVerify = async (member: PendingMember) => {
     setProcessingId(member.id);
     
     const { error } = await supabase
       .from('profiles')
       .update({ is_verified: true })
       .eq('id', member.id);
 
     if (error) {
       toast.error('Failed to verify user');
     } else {
       toast.success(`${member.nickname} has been verified!`);
       onRefresh();
     }
     setProcessingId(null);
   };
 
   const handleDeny = async (member: PendingMember) => {
     setProcessingId(member.id);
     
     // Clear the student ID URL to prompt re-upload
     const { error } = await supabase
       .from('profiles')
       .update({ student_id_url: null })
       .eq('id', member.id);
 
     if (error) {
       toast.error('Failed to deny verification');
     } else {
       toast.info(`${member.nickname} has been notified to re-upload their ID`);
       onRefresh();
     }
     setProcessingId(null);
   };
 
   const openImagePreview = (imageUrl: string) => {
     setSelectedImage(imageUrl);
     setShowImageModal(true);
   };
 
   if (pendingMembers.length === 0) {
     return (
       <GlassCard className="p-8 text-center">
         <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
         <p className="text-foreground font-medium">All Clear!</p>
         <p className="text-sm text-muted-foreground">No pending verifications</p>
       </GlassCard>
     );
   }
 
   return (
     <div className="space-y-3">
       <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-foreground">
           Verification Queue ({pendingMembers.length})
         </h3>
       </div>
 
       {pendingMembers.map((member, index) => {
         const isProcessing = processingId === member.id;
         
         return (
           <motion.div
             key={member.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: index * 0.05 }}
           >
             <GlassCard className="p-4">
               <div className="flex items-start gap-4">
                 {/* Avatar */}
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                   <span className="text-white font-bold text-lg">
                     {member.nickname[0]?.toUpperCase()}
                   </span>
                 </div>
 
                 {/* Info */}
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="font-semibold text-foreground truncate">
                       {member.nickname}
                     </span>
                     <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                       Pending
                     </span>
                   </div>
                   <p className="text-xs text-primary font-medium">{member.tribe}</p>
                   <p className="text-[11px] text-muted-foreground">
                     Joined {new Date(member.created_at).toLocaleDateString()}
                   </p>
 
                   {/* ID Image Preview */}
                   {member.student_id_url ? (
                     <button
                       onClick={() => openImagePreview(member.student_id_url!)}
                       className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors w-full"
                     >
                       <Image className="w-4 h-4 text-primary" />
                       <span className="text-xs text-foreground">View Student ID</span>
                       <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                     </button>
                   ) : (
                     <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10">
                       <Image className="w-4 h-4 text-destructive" />
                       <span className="text-xs text-destructive">No ID uploaded</span>
                     </div>
                   )}
                 </div>
 
                 {/* Actions */}
                 <div className="flex flex-col gap-2">
                   <Button
                     size="sm"
                     onClick={() => handleVerify(member)}
                     disabled={isProcessing}
                     className="bg-emerald-500 hover:bg-emerald-600 h-9 px-4"
                   >
                     {isProcessing ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       <>
                         <Check className="w-4 h-4 mr-1" />
                         Verify
                       </>
                     )}
                   </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => handleDeny(member)}
                     disabled={isProcessing}
                     className="border-destructive/50 text-destructive hover:bg-destructive/10 h-9 px-4"
                   >
                     <X className="w-4 h-4 mr-1" />
                     Deny
                   </Button>
                 </div>
               </div>
             </GlassCard>
           </motion.div>
         );
       })}
 
       {/* Image Preview Modal */}
       <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
         <DialogContent className="max-w-lg bg-background border-border">
           <DialogHeader>
             <DialogTitle>Student ID Preview</DialogTitle>
           </DialogHeader>
           <div className="mt-4">
             {selectedImage && (
               <img
                 src={selectedImage}
                 alt="Student ID"
                 className="w-full rounded-lg object-contain max-h-[60vh]"
               />
             )}
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
 
 export default VerificationQueue;