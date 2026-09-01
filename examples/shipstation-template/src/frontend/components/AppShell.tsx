import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';

export default function AppShell({
  commandBar,
  children,
}: {
  commandBar: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {commandBar}
      </Box>
      <Stack
        spacing={3}
        sx={{
          width: '100%',
          maxWidth: 1100,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 3 },
        }}
      >
        {children}
      </Stack>
    </Box>
  );
}
