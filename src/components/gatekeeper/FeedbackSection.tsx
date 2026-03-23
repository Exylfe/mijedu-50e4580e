import { useEffect, useState } from 'react';
import { Star, Bug, Lightbulb, MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import GlassCard from './GlassCard';

interface FeedbackEntry {
  id: string;
  user_id: string;
  rating: number;
  category: string;
  context: string | null;
  message: string | null;
  created_at: string;
}

const categoryIcon: Record<string, React.ReactNode> = {
  bug_report: <Bug className="w-4 h-4 text-destructive" />,
  suggestion: <Lightbulb className="w-4 h-4 text-primary" />,
  experience: <MessageSquare className="w-4 h-4 text-muted-foreground" />,
};

const categoryLabel: Record<string, string> = {
  bug_report: 'Bug Report',
  suggestion: 'Suggestion',
  experience: 'Experience',
};

const FeedbackSection = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchFeedback = async () => {
    setLoading(true);
    let query = supabase
      .from('feedback' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      query = query.eq('category', filter);
    }

    const { data } = await query;
    setEntries((data as any as FeedbackEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchFeedback(); }, [filter]);

  const avgRating = entries.length > 0
    ? (entries.reduce((sum, e) => sum + (e.rating || 0), 0) / entries.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Student Feedback</h2>
        <Button variant="ghost" size="sm" onClick={fetchFeedback}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{entries.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-2xl font-bold text-yellow-500">{avgRating} ⭐</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-2xl font-bold text-destructive">
            {entries.filter(e => e.category === 'bug_report').length}
          </p>
          <p className="text-xs text-muted-foreground">Bugs</p>
        </GlassCard>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'experience', 'bug_report', 'suggestion'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat === 'all' ? 'All' : categoryLabel[cat] || cat}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-muted-foreground text-sm">No feedback yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <GlassCard key={entry.id} className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {categoryIcon[entry.category] || categoryIcon.experience}
                  <span className="text-xs font-medium text-muted-foreground">
                    {categoryLabel[entry.category] || entry.category}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= (entry.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {entry.message && (
                <p className="text-sm text-foreground">{entry.message}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{entry.context}</span>
                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;
