import { useState } from 'react';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  Calendar,
  DataTable,
  EmptyState,
  HistoryIcon,
  Loader,
  PageBody,
  RecordName,
  RefreshCw,
  Section,
  StatusPill,
  Tags,
  TextIcon,
  useBackendMutation,
  useBackendQuery,
  Zap,
  type DataTableColumn,
  type RecordStatus,
} from '@digit/lib-frontend';


type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

// Each run status word, mapped to its Figma record-status stage.
const runStatusStage: Record<RunStatus, RecordStatus> = {
  queued: 'open',
  running: 'active',
  succeeded: 'done',
  failed: 'stopped',
  cancelled: 'closed',
};

const runStatusLabel: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

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

const columns: DataTableColumn<JobRun>[] = [
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
      <Chip size="small" label={params.row.kind === 'job' ? 'On demand' : 'Schedule'} />
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    icon: Loader,
    sortable: false,
    renderCell: (params) => (
      <StatusPill status={runStatusStage[params.row.status]} label={runStatusLabel[params.row.status]} />
    ),
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
    <PageBody>
      <Section title="Schedules" subtitle="From manifest.json">
        {schedulesQuery.error ? (
          <AppErrorAlert
            error={schedulesQuery.error}
            onRetry={() => void schedulesQuery.refetch()}
          />
        ) : (
          !schedulesQuery.loading && (
            <Table>
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
                        <StatusPill status="stopped" label="Auto-paused" />
                      ) : (
                        <StatusPill status="active" label="Active" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            icon={<HistoryIcon size={20} />}
            title="No runs yet"
            description="Run note-stats, or wait for the hourly schedule."
          />
        ) : (
          <DataTable
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
