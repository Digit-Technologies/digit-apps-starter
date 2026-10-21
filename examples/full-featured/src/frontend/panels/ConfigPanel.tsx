import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  PropertyGrid,
  RefreshCw,
  Section,
  useBackendQuery,
} from '@digit/lib-frontend';

type GreetingData = { message: string };

export default function ConfigPanel() {
  // Reads the non-secret env var WELCOME_MESSAGE. When it is missing the Worker answers
  // MISSING_CONFIG, which AppErrorAlert explains.
  const { data, error, loading, refetch } = useBackendQuery<GreetingData>({ path: '/greeting' });

  return (
    <Section
      title="Config"
      subtitle="A greeting from the app's env vars."
      subtitlePlacement="below"
      actions={
        <Button
          startIcon={<RefreshCw />}
          loading={loading}
          loadingPosition="start"
          onClick={() => void refetch()}
        >
          Refresh
        </Button>
      }
    >
      {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}
      <PropertyGrid
        rows={[
          {
            label: 'Greeting',
            value: data?.message ?? (
              <Typography variant="body1" color="text.tertiary" component="span">
                None
              </Typography>
            ),
          },
        ]}
      />
    </Section>
  );
}
