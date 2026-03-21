import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ZoomIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AcademicLevelBadge from '@/components/AcademicLevelBadge';
import { formatDistanceToNow } from 'date-fns';

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

interface QuickApproveCardProps {
  student: PendingStudent;
  index: number;
  processingId: string | null;
  onReview: (student: PendingStudent) => void;
  onQuickApprove: (student: PendingStudent) => void;
  onReject: (student: PendingStudent) => void;
}

const QuickApproveCard = ({ student, index, processingId, onReview, onQuickApprove, onReject }: QuickApproveCardProps) => {
  const isProcessing = processingId === student.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {student.nickname[0]?.toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-foreground truncate">
                  {student.nickname}
                </span>
                <AcademicLevelBadge level={student.academic_level} />
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                  Pending
                </span>
              </div>
              <p className="text-xs text-primary font-medium">{student.tribe}</p>
              <p className="text-[11px] text-muted-foreground">
                Requested {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => onReview(student)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ZoomIn className="w-3.5 h-3.5 mr-1" />
              Review ID
            </Button>
            <Button
              onClick={() => onQuickApprove(student)}
              disabled={isProcessing}
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Quick Approve
                </>
              )}
            </Button>
            <Button
              onClick={() => onReject(student)}
              disabled={isProcessing}
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 px-2"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickApproveCard;
