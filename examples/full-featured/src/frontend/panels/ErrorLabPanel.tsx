import { useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  useBackendMutation,
  useDigitApiMutation,
  type AppError,
} from '@digit/lib-frontend';

const FIXTURES: Record<string, AppError> = {
  platform_session: {
    kind: 'platform',
    code: 'NO_SESSION',
    message: 'No active session.',
    requestId: 'req_demo_session',
    status: 401,
  },
  platform_rate: {
    kind: 'platform',
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
    requestId: 'req_demo_rate',
    status: 429,
  },
  graphql: {
    kind: 'graphql',
    code: null,
    message: 'Cannot query field "nope" on type "Query".',
    requestId: null,
    status: 200,
  },
  backend_validation: {
    kind: 'backend',
    code: 'VALIDATION_ERROR',
    message: 'title is required.',
    requestId: null,
    status: 400,
  },
  backend_config: {
    kind: 'backend',
    code: 'MISSING_CONFIG',
    message: 'Set WELCOME_MESSAGE on the Digit app (env var or secret), then republish.',
    requestId: null,
    status: 500,
  },
  unavailable: {
    kind: 'unavailable',
    code: 'CLIENT_UNAVAILABLE',
    message: 'DigitProxyClient is unavailable. This page only works inside the Digit app harness.',
    requestId: null,
    status: null,
  },
};

type LiveState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: AppError }
  | { status: 'ok'; detail: string };

const BAD_GRAPHQL = 'query { __thisFieldDoesNotExist }';

export default function ErrorLabPanel() {
  const [fixtureKey, setFixtureKey] = useState('platform_session');
  const fixture = useMemo(() => FIXTURES[fixtureKey]!, [fixtureKey]);
  const [live, setLive] = useState<LiveState>({ status: 'idle' });

  const [runGraphql] = useDigitApiMutation({ mutation: BAD_GRAPHQL });
  const [runBackend] = useBackendMutation();

  const runLive = async (kind: 'graphql' | 'validation' | 'server') => {
    setLive({ status: 'loading' });
    if (kind === 'graphql') {
      const result = await runGraphql();
      setLive(
        result.ok
          ? { status: 'ok', detail: 'Unexpected success' }
          : { status: 'error', error: result.error },
      );
      return;
    }
    const result = await runBackend({
      path: '/error/demo',
      method: 'POST',
      body: { kind },
    });
    setLive(
      result.ok
        ? { status: 'ok', detail: 'Unexpected success' }
        : { status: 'error', error: result.error },
    );
  };

  return (
    <Stack spacing={3}>
      <BoxHeader />

      <Stack spacing={1.5}>
        <Typography variant="h3" component="h3">
          Canned fixtures
        </Typography>
        <FormControl size="small" sx={{ maxWidth: 320 }}>
          <InputLabel id="fixture-label">Fixture</InputLabel>
          <Select
            labelId="fixture-label"
            label="Fixture"
            value={fixtureKey}
            onChange={(event) => setFixtureKey(String(event.target.value))}
          >
            <MenuItem value="platform_session">Platform · NO_SESSION</MenuItem>
            <MenuItem value="platform_rate">Platform · RATE_LIMITED</MenuItem>
            <MenuItem value="graphql">GraphQL field error</MenuItem>
            <MenuItem value="backend_validation">Backend · VALIDATION_ERROR</MenuItem>
            <MenuItem value="backend_config">Backend · MISSING_CONFIG</MenuItem>
            <MenuItem value="unavailable">Client unavailable</MenuItem>
          </Select>
        </FormControl>
        <AppErrorAlert error={fixture} onRetry={() => undefined} />
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="h3" component="h3">
          Live triggers
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          These call the real Digit API / Worker. Outside the Digit harness they will show the
          unavailable client error.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            disabled={live.status === 'loading'}
            onClick={() => void runLive('graphql')}
          >
            Bad GraphQL
          </Button>
          <Button
            variant="outlined"
            disabled={live.status === 'loading'}
            onClick={() => void runLive('validation')}
          >
            Backend validation
          </Button>
          <Button
            variant="outlined"
            disabled={live.status === 'loading'}
            onClick={() => void runLive('server')}
          >
            Backend 500
          </Button>
        </Stack>
        {live.status === 'loading' && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Running…
          </Typography>
        )}
        {live.status === 'error' && (
          <AppErrorAlert error={live.error} onRetry={() => setLive({ status: 'idle' })} />
        )}
        {live.status === 'ok' && (
          <Typography variant="body2" color="success.main">
            {live.detail}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

function BoxHeader() {
  return (
    <Stack spacing={1}>
      <Typography variant="h2" component="h2">
        Error lab
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        Preview how <code>AppErrorAlert</code> renders known platform / backend codes
        (titles, messages, guidance) — then trigger live ones.
      </Typography>
    </Stack>
  );
}
