 import { motion } from 'framer-motion';
 import { ExternalLink, Sparkles } from 'lucide-react';
 import { AspectRatio } from '@/components/ui/aspect-ratio';
 
 interface BillboardCardProps {
   imageUrl: string;
   linkUrl?: string | null;
   index?: number;
 }
 
 const BillboardCard = ({ imageUrl, linkUrl, index = 0 }: BillboardCardProps) => {
   const handleClick = () => {
     // Haptic feedback
     if ('vibrate' in navigator) {
       navigator.vibrate(30);
     }
     
     if (linkUrl) {
       window.open(linkUrl, '_blank');
     }
   };
   
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.05 }}
       className="relative rounded-xl overflow-hidden bg-card border-2 border-amber-500/30 shadow-lg"
       onClick={handleClick}
     >
       {/* Sponsored badge */}
       <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white text-xs font-medium shadow-lg">
         <Sparkles className="w-3 h-3" />
         Sponsored
       </div>
       
       {/* Link indicator */}
       {linkUrl && (
         <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
           <ExternalLink className="w-4 h-4 text-white" />
         </div>
       )}
       
       {/* Image */}
       <AspectRatio ratio={16/9}>
         <img 
           src={imageUrl} 
           alt="Sponsored content"
           className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
         />
       </AspectRatio>
       
       {/* Gradient overlay at bottom */}
       <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
     </motion.div>
   );
 };
 
 export default BillboardCard;