import { useEffect, useState } from 'react';
import { MessageCircle, BookOpen, ArrowLeft, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/ai/ChatInterface';
import CourseManager from '@/components/ai/CourseManager';
import { useCourses } from '@/hooks/useCourses';
import BottomNav from '@/components/BottomNav';

const AIAssistant = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const {
    courses, maxSlots, usedSlots, loading,
    fetchCourses, createCourse, deleteCourse,
    uploadDocument, deleteDocument,
  } = useCourses();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-9 w-9 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Mijedu AI</h1>
              <p className="text-[10px] text-muted-foreground">Chat & Tutor Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2 grid grid-cols-2 h-10 rounded-xl bg-muted/50">
            <TabsTrigger value="chat" className="flex items-center gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:shadow-sm">
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
              Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
            <ChatInterface courses={courses} />
          </TabsContent>

          <TabsContent value="courses" className="flex-1 overflow-auto mt-0 pb-20">
            <CourseManager
              courses={courses}
              maxSlots={maxSlots}
              usedSlots={usedSlots}
              loading={loading}
              onCreateCourse={createCourse}
              onDeleteCourse={deleteCourse}
              onUploadDocument={uploadDocument}
              onDeleteDocument={deleteDocument}
            />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav activeItem="home" onItemClick={(item) => {
        if (item === 'home') navigate('/feed');
        else if (item === 'discover') navigate('/explore');
        else if (item === 'chat') navigate('/tribe-feed');
        else if (item === 'market') navigate('/market');
      }} />
    </div>
  );
};

export default AIAssistant;
