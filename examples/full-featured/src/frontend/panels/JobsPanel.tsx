import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
} from '@digit/lib-frontend';

type JobRun = {
  runId: string;
  name: string;
  kind: 'job' | 'schedule';
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  createdAt: number;
  endedAt: number | null;
  result: unknown;
  error: string | null;
};

type Schedule = {
  name: string;
  everySeconds: number;
  nextDueAt: number;
  autoPaused: boolean;
};

const time = (epochMs: number | null) =>
  epochMs === null ? '—' : new Date(epochMs).toLocaleTimeString();

export default function JobsPanel() {
  const {
    data: runsData,
    error: runsError,
    loading: runsLoading,
    refetch: refetchRuns,
  } = useBackendQuery<{ runs: JobRun[] }>({ path: '/jobs/runs' });
  const { data: schedulesData, error: schedulesError } = useBackendQuery<{
    schedules: Schedule[];
  }>({ path: '/jobs/schedules' });
  const [submitJob, { error: submitError, loading: submitting }] = useBackendMutation();

  const runs = runsData?.runs ?? [];
  const schedules = schedulesData?.schedules ?? [];
  const firstError = runsError ?? schedulesError ?? submitError;

  const runNoteStats = async () => {
    const result = await submitJob({ path: '/jobs/note-stats', method: 'POST' });
    if (!result.ok) return;
    await refetchRuns();
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h2" component="h2">
        Jobs &amp; schedules
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        <code>note-stats</code> is submitted on demand via <code>DIGIT_JOBS</code>;{' '}
        <code>prune-notes</code> runs hourly from <code>manifest.json</code>. Handlers live
        in <code>src/backend/jobs.js</code>. Refresh to watch a run go queued → succeeded.
      </Typography>

      {firstError && <AppErrorAlert error={firstError} onRetry={() => void refetchRuns()} />}

      <Stack direction="row" spacing={1.5}>
        <Button variant="contained" disabled={submitting} onClick={() => void runNoteStats()}>
          Run note-stats job
        </Button>
        <Button onClick={() => void refetchRuns()}>Refresh runs</Button>
      </Stack>

      {schedules.length > 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Schedules:{' '}
          {schedules
            .map(
              (schedule) =>
                `${schedule.name} every ${schedule.everySeconds}s` +
                `${schedule.autoPaused ? ' (auto-paused)' : ` — next ${time(schedule.nextDueAt)}`}`,
            )
            .join('; ')}
        </Typography>
      )}

      {runsLoading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading runs…
          </Typography>
        </Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Kind</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ended</TableCell>
              <TableCell>Result / error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No runs yet — submit one above, or wait for the schedule.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.runId}>
                  <TableCell>{run.name}</TableCell>
                  <TableCell>{run.kind}</TableCell>
                  <TableCell>{run.status}</TableCell>
                  <TableCell>{time(run.endedAt)}</TableCell>
                  <TableCell sx={{ maxWidth: 320, overflowWrap: 'anywhere' }}>
                    {run.error ?? (run.result === undefined ? '—' : JSON.stringify(run.result))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
