import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export type ChartCardProps = {
  title: string;
  noData?: boolean;
  noDataMessage?: string;
  children?: ReactNode;
};

export default function ChartCard({
  title,
  noData = false,
  noDataMessage = 'No data for this period',
  children,
}: ChartCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        {title}
      </Typography>
      {noData ? (
        <Box
          sx={{
            height: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.tertiary' }}>
            {noDataMessage}
          </Typography>
        </Box>
      ) : (
        children
      )}
    </Paper>
  );
}
