import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import {
  AppErrorAlert,
  FormField,
  Section,
  useBackendMutation,
  useDigitApiMutation,
  type AppError,
} from '@digit/lib-frontend';

import PageBody from '../PageBody';

const FIXTURES: { id: string; label: string; error: AppError }[] = [
  {
    id: 'platform_session',
    label: 'No session (platform)',
    error: {
      kind: 'platform',
      code: 'NO_SESSION',
      message: 'No active session.',
      requestId: 'req_demo_session',
      status: 401,
    },
  },
  {
    id: 'platform_rate',
    label: 'Rate limited (platform)',
    error: {
      kind: 'platform',
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
      requestId: 'req_demo_rate',
      status: 429,
    },
  },
  {
    id: 'graphql',
    label: 'GraphQL field error',
    error: {
      kind: 'graphql',
      code: null,
      message: 'Cannot query field "nope" on type "Query".',
      requestId: null,
      status: 200,
    },
  },
  {
    id: 'backend_validation',
    label: 'Validation error (backend)',
    error: {
      kind: 'backend',
      code: 'VALIDATION_ERROR',
      message: 'title is required.',
      requestId: null,
      status: 400,
    },
  },
  {
    id: 'backend_config',
    label: 'Missing config (backend)',
    error: {
      kind: 'backend',
      code: 'MISSING_CONFIG',
      message: 'Set WELCOME_MESSAGE on the Digit app (env var or secret), then republish.',
      requestId: null,
      status: 500,
    },
  },
  {
    id: 'unavailable',
    label: 'Client unavailable',
    error: {
      kind: 'unavailable',
      code: 'CLIENT_UNAVAILABLE',
      message: 'AppProxy is unavailable. This page only works inside the Digit app harness.',
      requestId: null,
      status: null,
    },
  },
];

type Trigger = 'graphql' | 'validation' | 'server';

const TRIGGERS: { id: Trigger; label: string }[] = [
  { id: 'graphql', label: 'Bad GraphQL' },
  { id: 'validation', label: 'Backend validation' },
  { id: 'server', label: 'Backend 500' },
];

type LiveResult = { trigger: Trigger } & ({ ok: true } | { ok: false; error: AppError });

const BAD_GRAPHQL = 'query { __thisFieldDoesNotExist }';

export default function ErrorLabPanel() {
  const [fixtureId, setFixtureId] = useState(FIXTURES[0]!.id);
  const fixture = FIXTURES.find((entry) => entry.id === fixtureId) ?? FIXTURES[0]!;

  const [runGraphql] = useDigitApiMutation({ mutation: BAD_GRAPHQL });
  const [runBackend] = useBackendMutation();
  const [running, setRunning] = useState<Trigger | null>(null);
  const [live, setLive] = useState<LiveResult | null>(null);

  const trigger = async (id: Trigger) => {
    setRunning(id);
    setLive(null);
    const result =
      id === 'graphql'
        ? await runGraphql()
        : await runBackend({ path: '/error/demo', method: 'POST', body: { kind: id } });
    setLive(result.ok ? { trigger: id, ok: true } : { trigger: id, ok: false, error: result.error });
    setRunning(null);
  };

  return (
    <PageBody>
      <Section
        title="Fixtures"
        subtitle="How AppErrorAlert presents each known error."
        subtitlePlacement="below"
      >
        <Box sx={{ maxWidth: 320 }}>
          <FormField label="Error">
            <Select
              fullWidth
              value={fixtureId}
              onChange={(event) => setFixtureId(String(event.target.value))}
            >
              {FIXTURES.map((entry) => (
                <MenuItem key={entry.id} value={entry.id}>
                  {entry.label}
                </MenuItem>
              ))}
            </Select>
          </FormField>
        </Box>
        <AppErrorAlert error={fixture.error} onRetry={() => undefined} />
      </Section>

      <Section
        title="Live triggers"
        subtitle="Calls the real Digit API and Worker. Outside Digit they fail as unavailable."
        subtitlePlacement="below"
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {TRIGGERS.map((entry) => (
            <Button
              key={entry.id}
              loading={running === entry.id}
              disabled={running !== null && running !== entry.id}
              onClick={() => void trigger(entry.id)}
            >
              {entry.label}
            </Button>
          ))}
        </Box>
        {live && !live.ok && (
          <AppErrorAlert error={live.error} onRetry={() => void trigger(live.trigger)} />
        )}
        {live?.ok && <Alert severity="success">The call succeeded, which was not expected.</Alert>}
      </Section>
    </PageBody>
  );
}
