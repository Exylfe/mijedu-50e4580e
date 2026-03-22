import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ErrorLog {
  id: string;
  created_at: string;
  error_type: string;
  error_message: string;
  context: Record<string, unknown>;
  user_id: string | null;
  user_agent: string | null;
  url: string | null;
}

const ErrorLogsSection = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [errorTypes, setErrorTypes] = useState<string[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterType !== 'all') {
      query = query.eq('error_type', filterType);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as ErrorLog[]);
      const types = [...new Set((data as ErrorLog[]).map(l => l.error_type))];
      if (types.length > errorTypes.length) setErrorTypes(types);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [filterType]);

  const clearOldLogs = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', sevenDaysAgo);
    if (error) toast.error('Failed to clear old logs');
    else { toast.success('Cleared logs older than 7 days'); fetchLogs(); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getDeviceLabel = (ua: string | null) => {
    if (!ua) return 'Unknown';
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPad/i.test(ua)) return 'iPad';
    return 'Desktop';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-bold text-foreground">Error Logs</h2>
          <span className="text-xs text-muted-foreground">({logs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {errorTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="destructive" size="sm" onClick={clearOldLogs}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear 7d+
          </Button>
        </div>
      </div>

      {logs.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No errors logged yet — that's great!</p>
        </div>
      )}

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="p-3 rounded-xl border border-border bg-card/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                {log.error_type}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getDeviceLabel(log.user_agent)}</span>
                <span>·</span>
                <span>{formatDate(log.created_at)}</span>
              </div>
            </div>
            <p className="text-sm text-foreground font-medium break-words">{log.error_message}</p>
            {log.url && (
              <p className="text-xs text-muted-foreground truncate">Page: {log.url}</p>
            )}
            {log.context && Object.keys(log.context).length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">Context</summary>
                <pre className="mt-1 p-2 rounded bg-muted/50 overflow-x-auto text-[10px]">
                  {JSON.stringify(log.context, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorLogsSection;
