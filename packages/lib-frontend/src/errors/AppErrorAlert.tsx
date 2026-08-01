import { useState, type ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { presentError } from './messages';
import type { AppError } from './types';

export type AppErrorAlertProps = {
  error: AppError;
  onRetry?: () => void;
  /** Override the Alert title. Defaults to a code-aware label when known. */
  title?: string;
  children?: ReactNode;
};

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
 * Shared error surface for Digit apps. Maps known platform / backend codes to a
 * title, safe message, optional next-step guidance, Copy support info, and Retry
 * when the error looks transient. Apps should render this instead of branching on
 * `AppErrorCode` in UI.
 *
 * @example Query failure with refetch
 * import { AppErrorAlert, useBackendQuery } from '@digit/lib-frontend';
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
 * import { AppErrorAlert, useBackendMutation } from '@digit/lib-frontend';
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
 * import { AppErrorAlert, useDigitApiQuery } from '@digit/lib-frontend';
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
 * @example Extra app-specific guidance via children (known codes already have baked-in hints)
 * <AppErrorAlert error={error} onRetry={() => void refetch()}>
 *   <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
 *     Notes are stored in this app’s D1 database.
 *   </Typography>
 * </AppErrorAlert>
 */
export const AppErrorAlert = ({ error, onRetry, title, children }: AppErrorAlertProps) => {
  const [copied, setCopied] = useState(false);
  const presentation = presentError(error);
  const showRetry = Boolean(onRetry) && presentation.retryable;
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
      <AlertTitle>{title ?? presentation.title}</AlertTitle>
      <Typography variant="body2">{presentation.message}</Typography>
      {presentation.guidance ? (
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          {presentation.guidance}
        </Typography>
      ) : null}
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
