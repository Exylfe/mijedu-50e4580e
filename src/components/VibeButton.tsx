 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Heart } from 'lucide-react';
 
 interface VibeButtonProps {
   hasVibed: boolean;
   vibeCount: number;
   onVibe: () => void;
   disabled?: boolean;
 }
 
 const VibeButton = ({ hasVibed, vibeCount, onVibe, disabled }: VibeButtonProps) => {
   const [showHearts, setShowHearts] = useState(false);
   
   const handleClick = () => {
     if (disabled) return;
     
     // Trigger haptic feedback if available
     if ('vibrate' in navigator) {
       navigator.vibrate(50);
     }
     
     if (!hasVibed) {
       setShowHearts(true);
       setTimeout(() => setShowHearts(false), 1000);
     }
     
     onVibe();
   };
   
   return (
     <div className="relative">
       {/* Floating hearts animation */}
       <AnimatePresence>
         {showHearts && (
           <>
             {[...Array(6)].map((_, i) => (
               <motion.div
                 key={i}
                 initial={{ 
                   opacity: 1, 
                   scale: 0.5,
                   x: 0,
                   y: 0
                 }}
                 animate={{ 
                   opacity: 0, 
                   scale: 1.5,
                   x: (Math.random() - 0.5) * 60,
                   y: -60 - Math.random() * 40
                 }}
                 exit={{ opacity: 0 }}
                 transition={{ 
                   duration: 0.8 + Math.random() * 0.4,
                   ease: "easeOut",
                   delay: i * 0.05
                 }}
                 className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-50"
               >
                 <Heart 
                   className="w-4 h-4 fill-secondary text-secondary" 
                   style={{
                     filter: 'drop-shadow(0 0 4px hsl(330, 90%, 65%))'
                   }}
                 />
               </motion.div>
             ))}
           </>
         )}
       </AnimatePresence>
       
       <motion.button
         onClick={handleClick}
         disabled={disabled}
         className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
           hasVibed 
             ? 'bg-secondary/15 text-secondary' 
             : 'bg-muted/50 text-muted-foreground hover:bg-secondary/10 hover:text-secondary'
         }`}
         whileTap={{ scale: 0.9 }}
       >
         <motion.div
           animate={hasVibed ? { 
             scale: [1, 1.3, 1],
           } : {}}
           transition={{ duration: 0.3 }}
         >
           <Heart 
             className={`w-5 h-5 transition-all ${
               hasVibed ? 'fill-secondary text-secondary' : ''
             }`}
           />
         </motion.div>
         <span className="text-sm font-semibold">{vibeCount}</span>
       </motion.button>
     </div>
   );
 };
 
 export default VibeButton;