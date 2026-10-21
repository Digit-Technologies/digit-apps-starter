import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { Section } from '@digit/lib-frontend';

export type KpiTileProps = {
  /** Sentence-case metric name, shown as the tile's `Section` heading. */
  title: string;
  /** Today's value, already formatted. `null` renders "None" (no data for today). */
  value?: ReactNode;
  /** Small text after the value, such as the unit of measure ("ea"). */
  unit?: string | null;
  /** One line under the value: a `Pill` and/or an `overline` hint. */
  footer?: ReactNode;
  /** Trailing visual beside the value, such as a gauge. */
  aside?: ReactNode;
  /** Shows skeleton blocks in place of the value and footer. */
  loading?: boolean;
};

/**
 * A dashboard tile (design-patterns.md › Dashboard): a themed `Card` with `p: 2`, a `Section`
 * heading, the value in `h2` and an optional footer line. Never restyle the Card itself.
 */
export default function KpiTile({ title, value, unit, footer, aside, loading = false }: KpiTileProps) {
  return (
    <Card sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
      <Section title={title} component="h4">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            {loading ? (
              <>
                <Typography variant="h2" component="p">
                  <Skeleton width={96} />
                </Typography>
                <Typography variant="overline" component="p">
                  <Skeleton width={128} />
                </Typography>
              </>
            ) : (
              <>
                {value === null || value === undefined ? (
                  <Typography variant="h2" component="p" color="text.tertiary">
                    None
                  </Typography>
                ) : (
                  <Typography variant="h2" component="p" color="text.primary">
                    {value}
                    {unit && (
                      <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 0.5 }}>
                        {unit}
                      </Typography>
                    )}
                  </Typography>
                )}
                {footer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, minHeight: 20 }}>
                    {footer}
                  </Box>
                )}
              </>
            )}
          </Box>
          {!loading && aside}
        </Box>
      </Section>
    </Card>
  );
}
