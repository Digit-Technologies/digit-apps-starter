import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  PageBody,
  PageHeader,
  Section,
  useApiQuery,
} from '@heysutton/sdk-react';

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

// Every screen is a PageHeader, then content. Pick a recipe from
// .agents/skills/sutton-app/reference/design-patterns.md (list page, record page, settings,
// dashboard, …) and build it from the @heysutton/sdk-react components it names.
export default function App() {
  const { data, error, loading, refetch } = useApiQuery<CurrentUserData>({
    query: CURRENT_USER_QUERY,
  });
  const name =
    data?.currentUser?.username?.trim() || data?.currentUser?.email?.trim() || 'world';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PageHeader title="Hello world" />
      <PageBody maxWidth={720}>
        {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}
        <Section title={loading ? <Skeleton width={120} /> : `Hello, ${name}`}>
          <Typography variant="body1" color="text.secondary">
            Start building your app in src/frontend/App.tsx.
          </Typography>
        </Section>
      </PageBody>
    </Box>
  );
}
