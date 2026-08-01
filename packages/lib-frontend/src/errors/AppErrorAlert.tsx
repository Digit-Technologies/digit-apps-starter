import { useState, type ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { isRetryable, userMessage } from './messages';
import type { AppError } from './types';

export type AppErrorAlertProps = {
  error: AppError;
  onRetry?: () => void;
  /** Override the Alert title. Defaults to a kind-based label. */
  title?: string;
  children?: ReactNode;
};

function defaultTitle(error: AppError): string {
  switch (error.kind) {
    case 'platform':
      return 'Platform error';
    case 'graphql':
      return 'GraphQL error';
    case 'backend':
      return 'Backend error';
    case 'unavailable':
      return 'Unavailable';
    default:
      return 'Error';
  }
}

function supportInfo(error: AppError): string {
  const parts = [
    error.code ? `code=${error.code}` : null,
    error.requestId ? `requestId=${error.requestId}` : null,
    error.status !== null ? `status=${error.status}` : null,
    `kind=${error.kind}`,
  ].filter(Boolean);
  return parts.join(' ');
}

/**
 * Shared error surface for Digit apps. Shows a safe user message, optional machine
 * code / request id, Copy support info, and Retry when `onRetry` is set and the error
 * looks transient (`isRetryable`).
 *
 * @example Query failure with refetch
 * import { AppErrorAlert, useBackendQuery } from '@digit/app-frontend';
 *
 * function NotesList() {
 *   const { data, error, loading, refetch } = useBackendQuery({ path: '/notes' });
 *
 *   if (error) {
 *     return <AppErrorAlert error={error} onRetry={() => void refetch()} />;
 *   }
 *   if (loading) return null;
 *   return <pre>{JSON.stringify(data)}</pre>;
 * }
 *
 * @example Mutation failure (no retry button — validation / config errors)
 * import { AppErrorAlert, useBackendMutation } from '@digit/app-frontend';
 *
 * function SaveNote() {
 *   const [saveNote, { error, loading }] = useBackendMutation();
 *
 *   return (
 *     <>
 *       <button
 *         disabled={loading}
 *         onClick={() => void saveNote({ path: '/notes', method: 'POST', body: { title: '' } })}
 *       >
 *         Save
 *       </button>
 *       {error ? <AppErrorAlert error={error} /> : null}
 *     </>
 *   );
 * }
 *
 * @example Digit GraphQL query + custom title
 * import { AppErrorAlert, useDigitApiQuery } from '@digit/app-frontend';
 *
 * function Items() {
 *   const { error, refetch } = useDigitApiQuery({
 *     query: `query Items { items(connection: { first: 10 }) { nodes { id } } }`,
 *   });
 *
 *   if (error) {
 *     return (
 *       <AppErrorAlert
 *         error={error}
 *         title="Couldn’t load items"
 *         onRetry={() => void refetch()}
 *       />
 *     );
 *   }
 *   return null;
 * }
 *
 * @example Extra guidance via children
 * <AppErrorAlert error={error} onRetry={() => void refetch()}>
 *   <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
 *     If this keeps happening, check the app’s env vars in Digit settings.
 *   </Typography>
 * </AppErrorAlert>
 */
export const AppErrorAlert = ({ error, onRetry, title, children }: AppErrorAlertProps) => {
  const [copied, setCopied] = useState(false);
  const showRetry = Boolean(onRetry) && isRetryable(error);
  const info = supportInfo(error);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(info);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Alert
      severity="error"
      action={
        <Stack direction="row" spacing={1} alignItems="center">
          {info ? (
            <Button color="inherit" size="small" onClick={() => void handleCopy()}>
              {copied ? 'Copied' : 'Copy support info'}
            </Button>
          ) : null}
          {showRetry && onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </Stack>
      }
    >
      <AlertTitle>{title ?? defaultTitle(error)}</AlertTitle>
      <Typography variant="body2">{userMessage(error)}</Typography>
      {(error.code || error.requestId) && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" component="p" sx={{ color: 'text.secondary' }}>
            {error.code ? `Code: ${error.code}` : null}
            {error.code && error.requestId ? ' · ' : null}
            {error.requestId ? `Request: ${error.requestId}` : null}
          </Typography>
        </Box>
      )}
      {children}
    </Alert>
  );
};
