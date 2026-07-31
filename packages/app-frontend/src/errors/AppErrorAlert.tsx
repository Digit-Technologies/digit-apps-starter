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
 * code / request id, Copy support info, and an optional Retry when the error looks transient.
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
