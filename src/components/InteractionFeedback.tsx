 import { motion, AnimatePresence } from 'framer-motion';
 import { Heart, ShoppingCart, Zap } from 'lucide-react';
 import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
 
 type FeedbackType = 'vibe' | 'cart' | 'click';
 
 interface FeedbackState {
   show: boolean;
   type: FeedbackType;
   x: number;
   y: number;
 }
 
 interface InteractionContextType {
   triggerFeedback: (type: FeedbackType, x: number, y: number) => void;
 }
 
 const InteractionContext = createContext<InteractionContextType | null>(null);
 
 export const useInteractionFeedback = () => {
   const context = useContext(InteractionContext);
   if (!context) {
     return { triggerFeedback: () => {} };
   }
   return context;
 };
 
 export const InteractionFeedbackProvider = ({ children }: { children: ReactNode }) => {
   const [feedback, setFeedback] = useState<FeedbackState>({
     show: false,
     type: 'vibe',
     x: 0,
     y: 0
   });
   
   const triggerFeedback = (type: FeedbackType, x: number, y: number) => {
     // Haptic feedback
     if ('vibrate' in navigator) {
       navigator.vibrate(50);
     }
     
     setFeedback({ show: true, type, x, y });
   };
   
   useEffect(() => {
     if (feedback.show) {
       const timer = setTimeout(() => {
         setFeedback(prev => ({ ...prev, show: false }));
       }, 800);
       return () => clearTimeout(timer);
     }
   }, [feedback.show]);
   
   const getIcon = () => {
     switch (feedback.type) {
       case 'vibe':
         return <Heart className="w-8 h-8 fill-secondary text-secondary" />;
       case 'cart':
         return <ShoppingCart className="w-8 h-8 text-primary" />;
       case 'click':
         return <Zap className="w-8 h-8 text-amber-500" />;
     }
   };
   
   return (
     <InteractionContext.Provider value={{ triggerFeedback }}>
       {children}
       
       <AnimatePresence>
         {feedback.show && (
           <motion.div
             initial={{ opacity: 0, scale: 0.5 }}
             animate={{ opacity: 1, scale: 1.2 }}
             exit={{ opacity: 0, scale: 0.8, y: -30 }}
             transition={{ duration: 0.3, ease: "easeOut" }}
             className="fixed pointer-events-none z-[100]"
             style={{
               left: feedback.x - 16,
               top: feedback.y - 16,
             }}
           >
             <div className="relative">
               {getIcon()}
               {/* Glow effect */}
               <div 
                 className="absolute inset-0 blur-md opacity-50"
                 style={{
                   background: feedback.type === 'vibe' 
                     ? 'hsl(330, 90%, 65%)' 
                     : feedback.type === 'cart' 
                       ? 'hsl(270, 91%, 65%)'
                       : 'hsl(45, 100%, 50%)'
                 }}
               />
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </InteractionContext.Provider>
   );
 };