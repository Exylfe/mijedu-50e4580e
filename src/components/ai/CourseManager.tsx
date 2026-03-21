import { useState, useRef } from 'react';
import { Plus, Trash2, FileText, Upload, BookOpen, Lock, ChevronDown, ChevronRight, Sparkles, Archive, AlertTriangle, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Course } from '@/hooks/useCourses';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CourseManagerProps {
  courses: Course[];
  maxSlots: number;
  usedSlots: number;
  loading: boolean;
  onCreateCourse: (title: string, description?: string) => Promise<any>;
  onDeleteCourse: (id: string) => Promise<void>;
  onUploadDocument: (courseId: string, file: File) => Promise<any>;
  onDeleteDocument: (docId: string) => Promise<void>;
}

const SLOT_THRESHOLDS = [
  { points: 0, slots: 1, label: 'Free' },
  { points: 50, slots: 2, label: '50 pts' },
  { points: 100, slots: 3, label: '100 pts' },
  { points: 250, slots: 4, label: '250 pts' },
  { points: 500, slots: 5, label: '500 pts' },
];

const CourseManager = ({
  courses, maxSlots, usedSlots, loading,
  onCreateCourse, onDeleteCourse, onUploadDocument, onDeleteDocument,
}: CourseManagerProps) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCourseId, setUploadCourseId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    await onCreateCourse(newTitle.trim(), newDesc.trim() || undefined);
    setNewTitle('');
    setNewDesc('');
    setCreating(false);
    setDialogOpen(false);
  };

  const handleFileSelect = (courseId: string) => {
    setUploadCourseId(courseId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadCourseId) return;
    setUploading(uploadCourseId);
    await onUploadDocument(uploadCourseId, file);
    setUploading(null);
    setUploadCourseId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasIndexedDocs = (course: Course) =>
    course.course_documents?.length > 0;

  const initiateDelete = (course: Course) => {
    setDeleteTarget(course);
    setDeleteStep(hasIndexedDocs(course) ? 1 : 2);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    await onDeleteCourse(deleteTarget.id);
    setDeleteTarget(null);
    setDeleteStep(0);
  };

  const slotPercentage = maxSlots > 0 ? (usedSlots / maxSlots) * 100 : 0;

  return (
    <div className="p-4 space-y-5">
      {/* Slot usage with visual tiers */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-foreground">Course Slots</span>
          <span className="text-sm font-bold text-primary">{usedSlots} / {maxSlots}</span>
        </div>
        <Progress value={slotPercentage} className="h-2.5 rounded-full" />
        {/* Slot tier indicators */}
        <div className="flex gap-1">
          {SLOT_THRESHOLDS.map((tier, i) => (
            <div
              key={tier.points}
              className={cn(
                'flex-1 text-center py-1.5 rounded-lg text-[10px] font-medium transition-colors',
                i < maxSlots
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              {i < maxSlots ? (
                <CheckCircle2 className="w-3 h-3 mx-auto mb-0.5" />
              ) : (
                <Lock className="w-3 h-3 mx-auto mb-0.5" />
              )}
              {tier.label}
            </div>
          ))}
        </div>
      </div>

      {/* Create course */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full rounded-xl h-12 text-sm font-semibold" disabled={usedSlots >= maxSlots}>
            {usedSlots >= maxSlots ? (
              <><Lock className="w-4 h-4 mr-2" /> All Slots Used</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> New Project</>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course Project</DialogTitle>
            <DialogDescription>
              Add a course to upload documents and get personalized AI tutoring.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="e.g., Quantum Physics, Data Structures..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={100}
              className="rounded-xl"
            />
            <Textarea
              placeholder="Brief description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="rounded-xl resize-none"
            />
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()} className="w-full rounded-xl h-11">
              {creating ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.txt,.md,.doc,.docx,.csv,.json"
        onChange={handleFileChange}
      />

      {/* Course list - project card style */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs mt-1 opacity-70">Create one to start AI-powered studying!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => {
            const isExpanded = expandedCourse === course.id;
            const docCount = course.course_documents?.length || 0;
            const isReady = docCount > 0;
            

            return (
              <motion.div
                key={course.id}
                layout
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Project card header */}
                <button
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Project icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    isReady ? 'bg-green-500/10' : 'bg-primary/10'
                  )}>
                    {isReady ? (
                      <Sparkles className="w-5 h-5 text-green-500" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{course.title}</h3>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {docCount} doc{docCount !== 1 ? 's' : ''}
                      </span>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        isReady
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {isReady ? `${docCount} uploaded` : 'No docs yet'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {/* Documents list */}
                        {docCount > 0 ? (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Documents</p>
                            {course.course_documents.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-xs truncate">{doc.title}</span>


                                </div>
                                <Button
                                  variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => onDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <p className="text-[10px] text-muted-foreground">{docCount}/1 document (MVP limit)</p>
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-muted/30 rounded-xl">
                            <Upload className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">Upload docs to enable AI tutoring</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-xl text-xs h-9"
                            onClick={() => handleFileSelect(course.id)}
                            disabled={uploading === course.id || docCount >= 1}
                          >
                            {uploading === course.id ? (
                              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin mr-1.5" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Add Files
                          </Button>
                          {isReady && (
                            <Button
                              size="sm"
                              className="flex-1 rounded-xl text-xs h-9"
                              onClick={() => {
                                // Navigate to chat tab with this course selected
                                const tabTrigger = document.querySelector('[data-value="chat"]') as HTMLElement;
                                tabTrigger?.click();
                                // Dispatch custom event so ChatInterface picks up courseId
                                window.dispatchEvent(new CustomEvent('select-course', { detail: course.id }));
                              }}
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                              Ask AI
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => initiateDelete(course)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Multi-step delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteStep(0); } }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {deleteStep === 1 ? 'Course Has Indexed Content' : 'Confirm Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteStep === 1 ? (
                <>
                  <strong>"{deleteTarget?.title}"</strong> has AI-indexed documents. Deleting this course will permanently remove all documents and AI knowledge.
                  <br /><br />
                  Are you sure you want to proceed?
                </>
              ) : (
                <>
                  This will permanently delete <strong>"{deleteTarget?.title}"</strong> and all its documents. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {deleteStep === 1 ? 'Continue' : 'Delete Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseManager;
