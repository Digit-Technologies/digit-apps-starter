import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, useDigitApiQuery } from '@digit/lib-frontend';

type CurrentUserData = {
  currentUser?: { username: string | null; email: string | null } | null;
};

const CURRENT_USER_QUERY = `
  query CurrentUser {
    currentUser {
      username
      email
    }
  }
`;

export default function App() {
  const { data, error, loading, refetch } = useDigitApiQuery<CurrentUserData>({
    query: CURRENT_USER_QUERY,
  });
  const name =
    data?.currentUser?.username?.trim() || data?.currentUser?.email?.trim() || 'world';

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Paper sx={{ width: '100%', maxWidth: 560, p: { xs: 3, sm: 5 } }}>
        <Stack spacing={1.5}>
          <Typography variant="overline" component="p" sx={{ color: 'primary.main' }}>
            Digit App
          </Typography>
          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Loading…
              </Typography>
            </Stack>
          ) : (
            <Typography variant="h1" component="h1">
              Hello, {name}!
            </Typography>
          )}
          {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Start building your app in src/frontend/App.tsx.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
