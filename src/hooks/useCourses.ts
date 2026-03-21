import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CourseDocument {
  id: string;
  title: string;
  file_url: string;
  course_name: string | null;
  created_at: string;
}

export interface Course {
  id: string; // We use course_name as the virtual "id"
  title: string;
  description: string | null;
  created_at: string;
  course_documents: CourseDocument[];
}

const MAX_COURSES = 5;
const MAX_DOCS_PER_COURSE = 1;

export function useCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [maxSlots, setMaxSlots] = useState(MAX_COURSES);
  const [usedSlots, setUsedSlots] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by course_name
      const grouped: Record<string, CourseDocument[]> = {};
      for (const doc of (data || [])) {
        const key = doc.course_name || 'Untitled';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          id: doc.id,
          title: doc.title,
          file_url: doc.file_url,
          course_name: doc.course_name,
          created_at: doc.created_at,
        });
      }

      const courseList: Course[] = Object.entries(grouped).map(([name, docs]) => ({
        id: name,
        title: name,
        description: null,
        created_at: docs[0]?.created_at || new Date().toISOString(),
        course_documents: docs,
      }));

      setCourses(courseList);
      setUsedSlots(courseList.length);
    } catch (e: any) {
      console.error('Failed to fetch courses:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCourse = useCallback(async (title: string, _description?: string) => {
    if (!user) return null;
    if (usedSlots >= maxSlots) {
      toast({ title: 'Slot limit reached', description: `You can have up to ${maxSlots} courses.`, variant: 'destructive' });
      return null;
    }
    // "Creating" a course just means we have a new course_name group
    // We'll insert a placeholder doc entry that the user will replace
    toast({ title: `Course "${title}" created! Upload a document to start.` });
    await fetchCourses();
    return { id: title, title };
  }, [user, usedSlots, maxSlots, fetchCourses]);

  const deleteCourse = useCallback(async (courseId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('course_documents')
        .delete()
        .eq('user_id', user.id)
        .eq('course_name', courseId);
      if (error) throw error;
      toast({ title: 'Course deleted' });
      await fetchCourses();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }, [user, fetchCourses]);

  const uploadDocument = useCallback(async (courseId: string, file: File) => {
    if (!user) return null;

    // Check 1-doc limit
    const existing = courses.find(c => c.id === courseId);
    if (existing && existing.course_documents.length >= MAX_DOCS_PER_COURSE) {
      toast({ title: 'Document limit reached', description: `MVP limit: ${MAX_DOCS_PER_COURSE} document per course.`, variant: 'destructive' });
      return null;
    }

    try {
      const filePath = `${user.id}/${courseId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('course-documents')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-documents')
        .getPublicUrl(filePath);

      const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      const { data, error } = await supabase
        .from('course_documents')
        .insert({
          user_id: user.id,
          course_name: courseId,
          title: file.name,
          file_url: publicUrl,
          file_type: ext,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Document uploaded! 🧠' });
      await fetchCourses();
      return data;
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
      return null;
    }
  }, [user, fetchCourses, courses]);

  const deleteDocument = useCallback(async (docId: string) => {
    try {
      const { error } = await supabase
        .from('course_documents')
        .delete()
        .eq('id', docId);
      if (error) throw error;
      toast({ title: 'Document removed' });
      await fetchCourses();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }, [fetchCourses]);

  return {
    courses, maxSlots, usedSlots, loading,
    fetchCourses, createCourse, deleteCourse,
    uploadDocument, deleteDocument,
  };
}
