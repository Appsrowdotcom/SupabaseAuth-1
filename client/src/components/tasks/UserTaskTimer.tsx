import { useEffect, useRef, useState } from "react";
import { supabase, type Task } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Play, Pause, Square } from "lucide-react";

interface TaskTimerProps {
  task: Task;
  onChanged?: (active: boolean) => void; // notify parent when timer state changes
}

// Single active timer per user: we persist current running timer in-memory per session.
// In a real app consider persisting to Supabase or localStorage to recover after reloads.
let globalActiveTimer: { taskId: string; start: number } | null = null;

export function TaskTimer({ task, onChanged }: TaskTimerProps) {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Tick while running
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [isRunning, startTime]);

  const start = () => {
    if (!user) return;
    // Enforce single active timer across tasks
    if (globalActiveTimer && globalActiveTimer.taskId !== task.id) {
      // Another task is running; ignore start
      return;
    }
    const now = Date.now();
    globalActiveTimer = { taskId: task.id, start: now };
    setStartTime(now);
    setIsRunning(true);
    onChanged?.(true);
  };

  const pause = () => {
    if (!isRunning) return;
    setIsRunning(false);
    onChanged?.(false);
  };

  const stop = () => {
    if (!startTime) return;
    setIsRunning(false);
    setShowStopDialog(true);
    onChanged?.(false);
  };

  const confirmStop = async () => {
    if (!user || !startTime) return;
    try {
      setSaving(true);
      const end = Date.now();
      // Save log to work_logs with start/end/notes
      const { error } = await supabase
        .from('work_logs')
        .insert({
          user_id: user.id,
          project_id: task.project_id,
          task_id: task.id,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(end).toISOString(),
          note: notes || null,
        });
      if (error) throw new Error(error.message);
      // Reset timer state
      setStartTime(null);
      setElapsed(0);
      globalActiveTimer = null;
      setShowStopDialog(false);
      setNotes("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const formatHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="font-mono text-sm w-[80px] text-right">{formatHMS(elapsed)}</div>
      <Button variant={isRunning ? "outline" : "default"} size="sm" onClick={start} disabled={!!globalActiveTimer && globalActiveTimer.taskId !== task.id}>
        <Play className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={pause} disabled={!isRunning}>
        <Pause className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={stop} disabled={!startTime}>
        <Square className="h-4 w-4" />
      </Button>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Work Notes</DialogTitle>
            <DialogDescription>Optionally describe what you worked on.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="What did you do? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>Cancel</Button>
            <Button onClick={confirmStop} disabled={saving}>
              {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : 'Save Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


