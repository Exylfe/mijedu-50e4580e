 import { motion } from 'framer-motion';
 import { ShieldCheck, GraduationCap, BadgeCheck, Calendar } from 'lucide-react';
 import { formatDistanceToNow } from 'date-fns';
 
 interface MijeduIDCardProps {
   nickname: string;
   tribe: string;
   isVerified: boolean;
   avatarUrl?: string | null;
   joinedAt: string;
 }
 
 const MijeduIDCard = ({ nickname, tribe, isVerified, avatarUrl, joinedAt }: MijeduIDCardProps) => {
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="relative overflow-hidden rounded-2xl"
     >
       {/* Card background with gradient */}
       <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
       
       {/* Decorative patterns */}
       <div className="absolute inset-0 opacity-10">
         <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
         {/* Grid pattern */}
         <div 
           className="absolute inset-0" 
           style={{
             backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }}
         />
       </div>
       
       {/* Card content */}
       <div className="relative p-5">
         {/* Header */}
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <GraduationCap className="w-5 h-5 text-white" />
             <span className="text-white/90 text-xs font-medium uppercase tracking-wider">Mijedu Student ID</span>
           </div>
           {isVerified && (
             <motion.div
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ delay: 0.3, type: 'spring' }}
               className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30"
             >
               <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
               <span className="text-xs font-medium text-emerald-200">Verified</span>
             </motion.div>
           )}
         </div>
         
         {/* Main content */}
         <div className="flex items-start gap-4">
           {/* Photo */}
           <div className="relative">
             <div className="w-20 h-24 rounded-lg border-2 border-white/30 overflow-hidden bg-white/10 shadow-lg">
               {avatarUrl ? (
                 <img 
                   src={avatarUrl} 
                   alt={nickname}
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <span className="text-3xl font-bold text-white/70">
                     {nickname?.[0]?.toUpperCase() || '?'}
                   </span>
                 </div>
               )}
             </div>
             {isVerified && (
               <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.5 }}
                 className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
               >
                 <BadgeCheck className="w-4 h-4 text-white" />
               </motion.div>
             )}
           </div>
           
           {/* Details */}
           <div className="flex-1 space-y-2">
             <h3 className="text-xl font-bold text-white tracking-tight">{nickname}</h3>
             <div className="space-y-1">
               <div className="flex items-center gap-2">
                 <span className="text-xs text-white/60 uppercase tracking-wider">College</span>
               </div>
               <p className="text-white/90 font-medium text-sm">{tribe}</p>
             </div>
             <div className="flex items-center gap-1.5 text-white/50 text-xs pt-1">
               <Calendar className="w-3 h-3" />
               <span>Member since {formatDistanceToNow(new Date(joinedAt), { addSuffix: false })}</span>
             </div>
           </div>
         </div>
         
         {/* Footer with barcode-style decoration */}
         <div className="mt-4 pt-3 border-t border-white/10">
           <div className="flex items-center justify-between">
             <div className="flex gap-0.5">
               {[...Array(20)].map((_, i) => (
                 <div 
                   key={i}
                   className="bg-white/30 rounded-full"
                   style={{
                     width: Math.random() > 0.5 ? '2px' : '3px',
                     height: '16px'
                   }}
                 />
               ))}
             </div>
             <span className="text-white/40 text-[10px] font-mono tracking-wider">MIJEDU-{Date.now().toString(36).toUpperCase().slice(-8)}</span>
           </div>
         </div>
       </div>
     </motion.div>
   );
 };
 
 export default MijeduIDCard;