import type { ReactNode } from 'react';

import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { ChartLine, EmptyState, Section } from '@digit/lib-frontend';

/** Plot height shared by every chart, its skeleton and its empty state. */
export const CHART_HEIGHT = 280;

export type ChartCardProps = {
  title: string;
  /** Overline hint beside the title, such as the unit of measure. */
  subtitle?: ReactNode;
  loading?: boolean;
  /** No points in the window: shows an `EmptyState` instead of the chart. */
  noData?: boolean;
  children?: ReactNode;
};

/**
 * A chart tile (design-patterns.md › Dashboard: "Charts sit in a Card with a Section heading").
 * Loading is a skeleton block the size of the plot; no data is an `EmptyState`.
 */
export default function ChartCard({ title, subtitle, loading = false, noData = false, children }: ChartCardProps) {
  return (
    <Card sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
      <Section title={title} subtitle={subtitle} component="h4">
        {loading ? (
          <Skeleton variant="rounded" height={CHART_HEIGHT} />
        ) : noData ? (
          <EmptyState
            icon={<ChartLine size={20} />}
            title="No data for this period"
            description="Values appear here once production is recorded."
          />
        ) : (
          children
        )}
      </Section>
    </Card>
  );
}
