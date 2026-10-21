import { useState } from 'react';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  Calendar,
  EmptyState,
  History,
  Loader,
  Pill,
  RecordName,
  RefreshCw,
  Section,
  Table,
  Tags,
  TextIcon,
  Zap,
  useBackendMutation,
  useBackendQuery,
  type TableColumn,
} from '@digit/lib-frontend';

import PageBody from '../PageBody';

type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

type JobRun = {
  runId: string;
  name: string;
  kind: 'job' | 'schedule';
  status: RunStatus;
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

// Pill colours come from its shared status words, so map the job states onto them.
const RUN_STATUS: Record<RunStatus, { status: string; label: string }> = {
  queued: { status: 'not started', label: 'Queued' },
  running: { status: 'in progress', label: 'Running' },
  succeeded: { status: 'completed', label: 'Succeeded' },
  failed: { status: 'failed', label: 'Failed' },
  cancelled: { status: 'cancelled', label: 'Cancelled' },
};

const formatTime = (epochMs: number) =>
  new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatEvery = (seconds: number) =>
  seconds % 3600 === 0
    ? `Every ${seconds / 3600 === 1 ? 'hour' : `${seconds / 3600} hours`}`
    : `Every ${Math.round(seconds / 60)} min`;

const columns: TableColumn<JobRun>[] = [
  {
    field: 'name',
    headerName: 'Job',
    flex: 1,
    minWidth: 160,
    icon: TextIcon,
    sortable: false,
    renderCell: (params) => <RecordName name={params.row.name} placeholder="tool" />,
  },
  {
    field: 'kind',
    headerName: 'Kind',
    width: 110,
    icon: Tags,
    sortable: false,
    renderCell: (params) => (
      <Pill size="sm" color="gray" label={params.row.kind === 'job' ? 'On demand' : 'Schedule'} />
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    icon: Loader,
    sortable: false,
    renderCell: (params) => <Pill {...RUN_STATUS[params.row.status]} />,
  },
  {
    field: 'createdAt',
    headerName: 'Started',
    width: 150,
    icon: Calendar,
    sortable: false,
    valueFormatter: (value: number) => formatTime(value),
  },
  {
    field: 'result',
    headerName: 'Result',
    flex: 1,
    minWidth: 200,
    icon: TextIcon,
    sortable: false,
    renderCell: (params) => {
      const { error, result } = params.row;
      if (error) {
        return (
          <Tooltip title={error}>
            <Typography variant="body1" color="error.main" noWrap>
              {error}
            </Typography>
          </Tooltip>
        );
      }
      if (result === undefined || result === null) {
        return (
          <Typography variant="body1" color="text.tertiary">
            None
          </Typography>
        );
      }
      const text = JSON.stringify(result);
      return (
        <Tooltip title={text}>
          <Typography variant="mono" color="text.secondary" noWrap>
            {text}
          </Typography>
        </Tooltip>
      );
    },
  },
];

export default function JobsPanel() {
  const runsQuery = useBackendQuery<{ runs: JobRun[] }>({ path: '/jobs/runs' });
  const schedulesQuery = useBackendQuery<{ schedules: Schedule[] }>({ path: '/jobs/schedules' });
  const [submitJob, { error: submitError, loading: submitting }] = useBackendMutation();
  const [paging, setPaging] = useState({ page: 0, pageSize: 10 });

  const runs = runsQuery.data?.runs ?? [];
  const schedules = schedulesQuery.data?.schedules ?? [];
  const pageRuns = runs.slice(paging.page * paging.pageSize, (paging.page + 1) * paging.pageSize);

  const runNoteStats = async () => {
    const result = await submitJob({ path: '/jobs/note-stats', method: 'POST' });
    if (result.ok) await runsQuery.refetch();
  };

  return (
    <PageBody wide>
      <Section title="Schedules" subtitle="From manifest.json">
        {schedulesQuery.error ? (
          <AppErrorAlert
            error={schedulesQuery.error}
            onRetry={() => void schedulesQuery.refetch()}
          />
        ) : (
          !schedulesQuery.loading && (
            <MuiTable>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.name} hover>
                    <TableCell>
                      <Typography variant="h6" component="span">
                        {schedule.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatEvery(schedule.everySeconds)}</TableCell>
                    <TableCell>
                      {schedule.autoPaused ? (
                        <Typography variant="body1" color="text.tertiary" component="span">
                          None
                        </Typography>
                      ) : (
                        `Next ${formatTime(schedule.nextDueAt)}`
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {schedule.autoPaused ? (
                        <Pill status="stopped" label="Auto-paused" />
                      ) : (
                        <Pill status="active" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </MuiTable>
          )
        )}
      </Section>

      <Section
        title="Runs"
        subtitle={runs.length > 0 ? `${runs.length} recent` : undefined}
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton aria-label="Refresh" onClick={() => void runsQuery.refetch()}>
                <RefreshCw />
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<Zap />}
              loading={submitting}
              loadingPosition="start"
              onClick={() => void runNoteStats()}
            >
              Run note-stats
            </Button>
          </>
        }
      >
        {submitError && <AppErrorAlert error={submitError} />}
        {runsQuery.error ? (
          <AppErrorAlert error={runsQuery.error} onRetry={() => void runsQuery.refetch()} />
        ) : !runsQuery.loading && runs.length === 0 ? (
          <EmptyState
            icon={<History size={20} />}
            title="No runs yet"
            description="Run note-stats, or wait for the hourly schedule."
          />
        ) : (
          <Table
            inset="none"
            rows={pageRuns}
            columns={columns}
            getRowId={(run) => run.runId}
            rowCount={runs.length}
            paginationModel={paging}
            onPaginationModelChange={setPaging}
            loading={runsQuery.loading}
          />
        )}
      </Section>
    </PageBody>
  );
}
