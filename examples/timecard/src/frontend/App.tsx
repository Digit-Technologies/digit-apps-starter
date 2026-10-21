import { useEffect, useMemo, useState, type ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  Calendar,
  Clock,
  LogIn,
  LogOut,
  EmptyState,
  PageBody,
  PageHeader,
  Pill,
  PropertyGrid,
  Section,
  Switch,
  Table,
  useBackendMutation,
  useBackendQuery,
  useDigitApiQuery,
  type PropertyGridRow,
  type TableColumn,
} from '@digit/lib-frontend';

import {
  currentZoneAbbreviation,
  endOfLocalDay,
  formatDate,
  formatDurationHM,
  formatTime,
  formatTimeWithZone,
  startOfLocalDay,
} from './format';

type CurrentUserData = {
  currentUser?: { id: string; username: string | null; email: string | null } | null;
};

const CURRENT_USER_QUERY = `
  query CurrentUser {
    currentUser {
      id
      username
      email
    }
  }
`;

type Shift = {
  id: number;
  userId: string;
  clockInTime: string;
  clockOutTime: string | null;
  durationSeconds: number | null;
};

type StatusData = {
  activeShift: Shift | null;
  completedSecondsToday: number;
};

type ShiftsData = {
  shifts: Shift[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

// Matches the backend's PAGE_SIZE. The backend pages the history; preview data is sliced the
// same way in the browser.
const PAGE_SIZE = 10;

/**
 * Fabricated data for "Preview data" mode, so someone can see the UI before any real shifts
 * exist. It is always clocked out with some hours already logged today.
 */
function buildPreviewData() {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000);

  const completedShift = (id: number, startHoursAgo: number, durationHours: number): Shift => {
    const start = hoursAgo(startHoursAgo);
    const end = new Date(start.getTime() + durationHours * 3600 * 1000);
    return {
      id,
      userId: 'preview-user',
      clockInTime: start.toISOString(),
      clockOutTime: end.toISOString(),
      durationSeconds: Math.round(durationHours * 3600),
    };
  };

  const shifts: Shift[] = [
    completedShift(-1, 8, 7), // today, wrapped up about an hour ago
    completedShift(-2, 30, 4),
    completedShift(-3, 33.5, 3.5),
    completedShift(-4, 54, 8),
    completedShift(-5, 78, 1.5),
    completedShift(-6, 80, 6),
    completedShift(-7, 102, 7.75),
    completedShift(-8, 126, 4.25),
    completedShift(-9, 148, 8),
    completedShift(-10, 150.5, 1),
    completedShift(-11, 172, 5.5),
    completedShift(-12, 196, 7),
  ];

  return {
    completedSecondsToday: shifts[0].durationSeconds ?? 0,
    shifts,
    userName: 'Jordan Alvarez',
    userEmail: 'jordan.alvarez@example.com',
  };
}

const none = (
  <Typography variant="body1" color="text.tertiary" component="span">
    None
  </Typography>
);

// History columns. The backend pages and orders the list (most recent first) and has no sort
// or search, so every column is unsortable and the table has no toolbar.
const columns: TableColumn<Shift>[] = [
  {
    field: 'clockInTime',
    headerName: 'Date',
    flex: 1,
    minWidth: 100,
    icon: Calendar,
    sortable: false,
    valueFormatter: (value: string) => formatDate(value),
  },
  {
    field: 'clockOutTime',
    headerName: 'Time',
    width: 170,
    icon: Clock,
    sortable: false,
    valueGetter: (_value, row) =>
      row.clockOutTime
        ? `${formatTime(row.clockInTime)} – ${formatTime(row.clockOutTime)}`
        : `Since ${formatTime(row.clockInTime)}`,
  },
  {
    field: 'durationSeconds',
    headerName: 'Duration',
    width: 110,
    icon: Clock,
    type: 'number',
    sortable: false,
    renderCell: (params) =>
      params.row.durationSeconds === null ? (
        <Pill status="in progress" />
      ) : (
        formatDurationHM(params.row.durationSeconds)
      ),
  },
];

export default function App() {
  const [previewMode, setPreviewMode] = useState(false);

  // Generated once per session so the preview timestamps stay put across re-renders.
  const previewData = useMemo(buildPreviewData, []);

  const { data: userData, error: userError, loading: userLoading } =
    useDigitApiQuery<CurrentUserData>({ query: CURRENT_USER_QUERY });
  const userId = userData?.currentUser?.id;
  const userName = previewMode ? previewData.userName : userData?.currentUser?.username ?? null;
  const userEmail = previewMode ? previewData.userEmail : userData?.currentUser?.email ?? null;
  const identityLine = [userName, userEmail].filter(Boolean).join(' · ');

  // Local-day window, computed once on load. Used both for "today"'s elapsed total
  // and to decide whether a currently-open shift counts toward it.
  const { dayStartIso, dayEndIso, dayStartMs, dayEndMs } = useMemo(() => {
    const now = new Date();
    const start = startOfLocalDay(now);
    const end = endOfLocalDay(now);
    return {
      dayStartIso: start.toISOString(),
      dayEndIso: end.toISOString(),
      dayStartMs: start.getTime(),
      dayEndMs: end.getTime(),
    };
  }, []);

  // 1-based, as the backend's `page` query parameter expects.
  const [page, setPage] = useState(1);

  // Tick once a second so the live elapsed-time display advances while clocked in.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const statusPath = userId
    ? `/status?userId=${encodeURIComponent(userId)}&dayStart=${encodeURIComponent(dayStartIso)}&dayEnd=${encodeURIComponent(dayEndIso)}`
    : '';
  const {
    data: status,
    error: statusError,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useBackendQuery<StatusData>({ path: statusPath, skip: !userId || previewMode });

  const shiftsPath = userId
    ? `/shifts?userId=${encodeURIComponent(userId)}&page=${page}`
    : '';
  const {
    data: shiftsData,
    error: shiftsError,
    loading: shiftsLoading,
    refetch: refetchShifts,
  } = useBackendQuery<ShiftsData>({ path: shiftsPath, skip: !userId || previewMode });

  const [mutate, { error: mutateError, loading: mutating, reset: resetMutateError }] =
    useBackendMutation();

  const activeShift = previewMode ? null : status?.activeShift ?? null;
  const isClockedIn = activeShift !== null;

  const liveActiveSeconds = activeShift
    ? Math.max(0, Math.floor((Date.now() - new Date(activeShift.clockInTime).getTime()) / 1000))
    : 0;
  const activeCountsTowardToday = activeShift
    ? new Date(activeShift.clockInTime).getTime() >= dayStartMs &&
      new Date(activeShift.clockInTime).getTime() < dayEndMs
    : false;

  const completedSecondsToday = previewMode
    ? previewData.completedSecondsToday
    : status?.completedSecondsToday ?? 0;
  const todaySeconds = completedSecondsToday + (activeCountsTowardToday ? liveActiveSeconds : 0);

  const toggleClock = async () => {
    if (!userId || previewMode) return;
    resetMutateError();
    const result = isClockedIn
      ? await mutate({ path: '/clock-out', method: 'POST', body: { userId } })
      : await mutate({ path: '/clock-in', method: 'POST', body: { userId } });
    if (!result.ok) return;
    setPage(1);
    await Promise.all([refetchStatus(), refetchShifts()]);
  };

  const previewShiftsPage = useMemo(
    () => previewData.shifts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [previewData, page],
  );

  const shifts = previewMode ? previewShiftsPage : shiftsData?.shifts ?? [];
  const totalCount = previewMode ? previewData.shifts.length : shiftsData?.totalCount ?? 0;

  // Until the user and their status have loaded, values show skeletons rather than zeros.
  const statusPending =
    !previewMode && (userLoading || (Boolean(userId) && statusLoading && !status));
  const historyPending = !previewMode && (userLoading || (shiftsLoading && !shiftsData));
  const value = (node: ReactNode) =>
    statusPending ? <Skeleton variant="text" width={96} /> : node;

  const todayRows: PropertyGridRow[] = [
    { label: 'Employee', value: value(identityLine || none) },
    {
      label: 'Status',
      // "Clocked in" / "Clocked out" are not in Pill's shared status list, so the colour is
      // passed: blue for an open shift (like "active"), gray when off the clock.
      value: value(
        <Pill status={isClockedIn ? 'clocked in' : 'clocked out'} />,
      ),
    },
    ...(isClockedIn && activeShift
      ? [{ label: 'Clocked in at', value: formatTimeWithZone(activeShift.clockInTime) }]
      : []),
    { label: 'Worked today', value: value(formatDurationHM(todaySeconds)) },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PageHeader
        title="Time card"
        actions={
          <>
            <Switch
              label="Preview data"
              checked={previewMode}
              onChange={(_, checked) => {
                setPreviewMode(checked);
                setPage(1);
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={isClockedIn ? <LogOut /> : <LogIn />}
              loading={mutating}
              loadingPosition="start"
              disabled={previewMode || !userId || statusPending}
              onClick={() => void toggleClock()}
            >
              {isClockedIn ? 'Clock out' : 'Clock in'}
            </Button>
          </>
        }
      />
      <PageBody maxWidth={720}>
        {previewMode && (
          <Alert severity="info">
            Showing sample shifts. Turn off preview data to clock in or out.
          </Alert>
        )}
        {!previewMode && userError && <AppErrorAlert error={userError} />}
        {!previewMode && statusError && (
          <AppErrorAlert error={statusError} onRetry={() => void refetchStatus()} />
        )}
        {!previewMode && mutateError && <AppErrorAlert error={mutateError} />}

        <Section title="Today" subtitle={formatDate(new Date(dayStartMs).toISOString())}>
          <PropertyGrid rows={todayRows} />
        </Section>

        <Section title="Recent shifts" subtitle={`Times in ${currentZoneAbbreviation()}`}>
          {!previewMode && shiftsError ? (
            <AppErrorAlert error={shiftsError} onRetry={() => void refetchShifts()} />
          ) : !historyPending && shifts.length === 0 ? (
            <EmptyState
              icon={<Clock size={20} />}
              title="No shifts yet"
              description="Clock in to start your first shift. Each shift you finish shows up here."
            />
          ) : (
            <Table
              inset="none"
              rows={shifts}
              columns={columns}
              rowCount={totalCount}
              paginationModel={{ page: page - 1, pageSize: PAGE_SIZE }}
              onPaginationModelChange={(model) => setPage(model.page + 1)}
              pageSizeOptions={[PAGE_SIZE]}
              loading={historyPending}
            />
          )}
        </Section>
      </PageBody>
    </Box>
  );
}
