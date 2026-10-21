import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  LockKeyhole,
  Pill,
  PropertyGrid,
  Section,
  useBackendQuery,
} from '@digit/lib-frontend';

type StatusData = {
  authenticated: boolean;
  tokenPrefix: string | null;
};

const none = (
  <Typography variant="body1" color="text.tertiary" component="span">
    None
  </Typography>
);

export default function SecretsPanel() {
  // Needs env API_BASE_URL and secret THIRD_PARTY_API_KEY on the app. The secret stays in the
  // Worker; it only returns a short prefix.
  const { data, error, loading, refetch } = useBackendQuery<StatusData>({
    path: '/external-status',
    skip: true,
  });

  return (
    <Section
      title="Secrets"
      subtitle="The Worker signs a request with a secret it never returns."
      subtitlePlacement="below"
      actions={
        <Button
          startIcon={<LockKeyhole />}
          loading={loading}
          loadingPosition="start"
          onClick={() => void refetch()}
        >
          Check status
        </Button>
      }
    >
      {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}
      <PropertyGrid
        rows={[
          {
            label: 'Status',
            value: data ? (
              data.authenticated ? (
                <Pill status="approved" label="Authenticated" />
              ) : (
                <Pill status="failed" label="Not authenticated" />
              )
            ) : (
              none
            ),
          },
          {
            label: 'Token prefix',
            value: data?.tokenPrefix ? (
              <Typography variant="mono" component="span">
                {data.tokenPrefix}
              </Typography>
            ) : (
              none
            ),
          },
        ]}
      />
    </Section>
  );
}
