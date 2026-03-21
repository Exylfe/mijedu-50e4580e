import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Square, BookOpen, MessageCircle, Trash2, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIChat } from '@/hooks/useAIChat';
import { Course } from '@/hooks/useCourses';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  courses: Course[];
}

const ChatInterface = ({ courses }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    sendMessage(trimmed, selectedCourseId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isTutorMode = !!selectedCourseId;
  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="flex flex-col h-full">
      {/* Mode selector bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card/60 backdrop-blur-sm">
        <Select
          value={selectedCourseId || 'chat'}
          onValueChange={(v) => setSelectedCourseId(v === 'chat' ? null : v)}
        >
          <SelectTrigger className="w-full max-w-[260px] h-9 text-xs rounded-lg border-border/50 bg-background/50">
            <SelectValue placeholder="Select mode..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chat">
              <span className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
                General Chat
              </span>
            </SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  {course.title}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearMessages} title="Clear chat" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tutor mode indicator */}
      <AnimatePresence>
        {isTutorMode && selectedCourse && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 text-xs bg-primary/5 text-primary border-b border-border flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">Tutor mode:</span>
              <span className="truncate">{selectedCourse.title}</span>
              <span className="text-primary/60">({selectedCourse.course_documents?.length || 0} docs)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
            {/* Floating AI avatar */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background" />
            </motion.div>
            <p className="text-sm font-semibold text-foreground">
              {isTutorMode
                ? `Ask me about "${selectedCourse?.title}"`
                : 'Ask me anything!'
              }
            </p>
            <p className="text-xs mt-1.5 text-muted-foreground max-w-[260px]">
              {isTutorMode
                ? 'I\'ll reference your uploaded documents to answer.'
                : 'I can help with points, tribes, perks, studying, and more.'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted/60 text-foreground rounded-bl-md border border-border/30'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>p:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3 border border-border/30">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 bg-primary/40 rounded-full"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t border-border bg-card/60 backdrop-blur-sm">
        <div className="flex gap-2 items-end max-w-lg mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTutorMode ? `Ask about ${selectedCourse?.title}...` : 'Ask Mijedu AI...'}
            className="min-h-[44px] max-h-[120px] resize-none rounded-xl border-border/50 bg-background/50 text-sm"
            rows={1}
          />
          {isStreaming ? (
            <Button size="icon" variant="destructive" onClick={stopStreaming} className="rounded-xl h-[44px] w-[44px] shrink-0">
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="rounded-xl h-[44px] w-[44px] shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
