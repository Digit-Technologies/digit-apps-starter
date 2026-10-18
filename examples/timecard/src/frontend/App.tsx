import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
  useDigitApiQuery,
} from '@digit/lib-frontend';

import {
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

// Matches the backend's PAGE_SIZE — used to slice the client-side preview data the same way.
const PAGE_SIZE = 10;

// Tabular numerals keep the ticking elapsed-time display from jittering as digits change width.
const tabularNums = { fontVariantNumeric: 'tabular-nums' as const };

/** Small breathing dot shown next to the status chip while a shift is open. */
function LivePulse() {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: '50%',
        bgcolor: 'success.dark',
        animation: 'timecard-pulse 1.6s ease-in-out infinite',
        '@keyframes timecard-pulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.35, transform: 'scale(0.8)' },
        },
      }}
    />
  );
}

/**
 * Fabricated data for "Preview data" mode — lets someone see the UI with no real shifts
 * yet. Always shown clocked out with some hours already logged today, so the toggle
 * button stays a normal, fully-interactive-looking "Clock in" state rather than needing
 * a fake "currently open" shift.
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

export default function App() {
  const [previewMode, setPreviewMode] = useState(false);

  // Generated once per session so the fake "since" time actually ticks forward like a real
  // open shift would, instead of jumping back to the same offset on every re-render.
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

  const previewTotalPages = Math.max(1, Math.ceil(previewData.shifts.length / PAGE_SIZE));
  const previewShiftsPage = useMemo(
    () => previewData.shifts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [previewData, page],
  );

  const shifts = previewMode ? previewShiftsPage : shiftsData?.shifts ?? [];
  const totalPages = previewMode ? previewTotalPages : shiftsData?.totalPages ?? 1;

  const initialLoading =
    !previewMode && (userLoading || (Boolean(userId) && statusLoading && !status));

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            rowGap: 1
          }}>
          <Box>
            <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 0.5 }}>
              Digit App
            </Typography>
            <Typography variant="h1" component="h1">
              Time card
            </Typography>
          </Box>
          <FormControlLabel
            labelPlacement="start"
            sx={{ gap: 1 }}
            control={
              <Switch
                checked={previewMode}
                onChange={(event) => {
                  setPreviewMode(event.target.checked);
                  setPage(1);
                }}
              />
            }
            label="Preview data"
          />
        </Stack>

        {!previewMode && userError && <AppErrorAlert error={userError} />}
        {!previewMode && statusError && (
          <AppErrorAlert error={statusError} onRetry={() => void refetchStatus()} />
        )}

        {initialLoading ? (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              py: 6
            }}>
            <CircularProgress size={22} />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Loading…
            </Typography>
          </Stack>
        ) : (
          <>
            <Paper
              variant="outlined"
              sx={{ px: 3, py: 3.5, borderRadius: 1, textAlign: 'center' }}
            >
              <Stack spacing={1.5} sx={{
                alignItems: "center"
              }}>
                {identityLine && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {identityLine}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{
                  alignItems: "center"
                }}>
                  <Chip
                    label={isClockedIn ? 'Clocked in' : 'Clocked out'}
                    sx={{
                      fontSize: '1rem',
                      px: 1.5,
                      py: 2.5,
                      fontWeight: 600,
                      borderRadius: '10px',
                      ...(isClockedIn && {
                        bgcolor: 'success.dark',
                        color: 'common.white',
                      }),
                    }}
                  />
                  {isClockedIn && <LivePulse />}
                </Stack>

                <Typography
                  variant="h2"
                  component="p"
                  sx={{ fontWeight: 700, lineHeight: 1.1, mt: 1, ...tabularNums }}
                >
                  {formatDurationHM(todaySeconds)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Today
                </Typography>

                {isClockedIn && activeShift && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', ...tabularNums }}>
                    Since {formatTimeWithZone(activeShift.clockInTime)}
                  </Typography>
                )}
              </Stack>
            </Paper>

            {!previewMode && mutateError && <AppErrorAlert error={mutateError} />}

            <Button
              variant="contained"
              color={isClockedIn ? 'error' : 'primary'}
              size="large"
              fullWidth
              disabled={!previewMode && (!userId || mutating)}
              onClick={previewMode ? undefined : () => void toggleClock()}
              startIcon={
                mutating ? undefined : isClockedIn ? <StopCircleOutlinedIcon /> : <AccessTimeIcon />
              }
              sx={{
                py: 1.75,
                fontSize: '1.05rem',
                fontWeight: 600,
                ...(isClockedIn && {
                  bgcolor: 'error.dark',
                  '&:hover': { bgcolor: 'error.dark' },
                  '&:active': { bgcolor: 'error.dark' },
                }),
              }}
            >
              {mutating ? <CircularProgress size={22} color="inherit" /> : isClockedIn ? 'Clock out' : 'Clock in'}
            </Button>

            <Divider />

            <Stack spacing={1.5}>
              <Typography variant="h3" component="h2" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                Recent shifts
              </Typography>

              {!previewMode && shiftsError && (
                <AppErrorAlert error={shiftsError} onRetry={() => void refetchShifts()} />
              )}

              {!previewMode && shiftsLoading && !shiftsData ? (
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                    py: 2
                  }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading shifts…
                  </Typography>
                </Stack>
              ) : shifts.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No shifts yet.
                </Typography>
              ) : (
                <Stack spacing={0} divider={<Divider flexItem />}>
                  {shifts.map((shift) => (
                    <Stack key={shift.id} spacing={0.25} sx={{ py: 1.25 }}>
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDate(shift.clockInTime)}
                        </Typography>
                        {shift.durationSeconds !== null ? (
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: 'text.primary', ...tabularNums }}
                          >
                            {formatDurationHM(shift.durationSeconds)}
                          </Typography>
                        ) : (
                          <Chip
                            label="In progress"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(225, 113, 0, 0.14)',
                              // Literal hex, not a theme.palette token: warning.dark (amber 600)
                              // only reaches ~2.9:1 contrast against this background — well under
                              // WCAG AA's 4.5:1. This darker amber measures ~6.5:1.
                              color: '#973C00',
                            }}
                          />
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ color: 'text.secondary', ...tabularNums }}>
                        {formatTime(shift.clockInTime)}
                        {' – '}
                        {shift.clockOutTime ? formatTimeWithZone(shift.clockOutTime) : '—'}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}

              {shifts.length > 0 && (
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    pt: 0.5
                  }}>
                  <Button
                    size="small"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Page {page} of {totalPages}
                  </Typography>
                  <Button
                    size="small"
                    disabled={page >= totalPages}
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  >
                    Next
                  </Button>
                </Stack>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}
