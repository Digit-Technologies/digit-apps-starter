import type { ReactNode } from 'react';

import Box from '@mui/material/Box';

type PageBodyProps = {
  /** Drops the 720px reading width, for content with a wide table. */
  wide?: boolean;
  children: ReactNode;
};

/**
 * Content under the PageHeader that is not a full-bleed Table: the page gutter (36px, 20px
 * below 600px) and a column of `Section`s. Layout props only.
 */
export default function PageBody({ wide = false, children }: PageBodyProps) {
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 4.5 },
        py: 3,
        maxWidth: wide ? undefined : 720,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {children}
    </Box>
  );
}
