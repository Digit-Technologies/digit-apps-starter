import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export type KpiTileProps = {
  label: string;
  /** When true, renders the "No data" state instead of `children`. */
  noData?: boolean;
  noDataMessage?: string;
  /** Optional background tint, e.g. for the alert tile. */
  bgcolor?: string;
  children?: ReactNode;
};

export default function KpiTile({
  label,
  noData = false,
  noDataMessage = 'No data',
  bgcolor,
  children,
}: KpiTileProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor,
      }}
    >
      <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
        {label}
      </Typography>
      {noData ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.tertiary' }}>
            {noDataMessage}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {children}
        </Box>
      )}
    </Paper>
  );
}
