import Typography from '@mui/material/Typography';
import { useTheme, type Theme } from '@mui/material/styles';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

import { Pill, type PillColor } from '@digit/lib-frontend';

import KpiTile from './KpiTile';

export type OnTimeGaugeTileProps = {
  todayValue: number | null;
  loading?: boolean;
};

type Band = { pill: PillColor; label: string; arc: (theme: Theme) => string };

/** Good ≥ 90%, needs attention < 70%, otherwise a middle "watch" state. */
function bandForPercent(percent: number): Band {
  if (percent >= 90) return { pill: 'green', label: 'On target', arc: (t) => t.palette.emerald.main };
  if (percent >= 70) return { pill: 'yellow', label: 'Watch', arc: (t) => t.palette.amber.main };
  return { pill: 'red', label: 'Needs attention', arc: (t) => t.palette.red.main };
}

export default function OnTimeGaugeTile({ todayValue, loading }: OnTimeGaugeTileProps) {
  const theme = useTheme();
  const clamped = todayValue === null ? null : Math.max(0, Math.min(100, todayValue));
  const band = clamped === null ? null : bandForPercent(clamped);

  return (
    <KpiTile
      title="MOs completed on time"
      loading={loading}
      value={clamped === null ? null : `${Math.round(clamped)}%`}
      footer={
        band && (
          <>
            <Pill size="sm" color={band.pill} label={band.label} />
            <Typography variant="overline" color="text.tertiary">
              Target 90%
            </Typography>
          </>
        )
      }
      aside={
        clamped !== null &&
        band && (
          // The value is the h2 beside it, so the gauge draws no text of its own.
          <Gauge
            width={72}
            height={56}
            value={clamped}
            valueMin={0}
            valueMax={100}
            startAngle={-110}
            endAngle={110}
            innerRadius="72%"
            cornerRadius="50%"
            text={() => null}
            aria-label={`${Math.round(clamped)}% of MOs completed on time`}
            sx={{
              flexShrink: 0,
              [`& .${gaugeClasses.valueArc}`]: { fill: band.arc(theme) },
              [`& .${gaugeClasses.referenceArc}`]: { fill: theme.palette.border.extrastrong },
            }}
          />
        )
      }
    />
  );
}
