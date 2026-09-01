import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { QueuePushDisplay } from '../eligibility';

const compactChipSx = {
  height: 22,
  maxWidth: 200,
  '& .MuiChip-label': {
    px: 0.75,
    fontSize: '0.6875rem',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
} as const;

export default function QueueStatusDisplay({ pushDisplay }: { pushDisplay: QueuePushDisplay }) {
  const outlined = pushDisplay.chipColor === 'error' || pushDisplay.chipColor === 'warning';

  if (!pushDisplay.showPrimaryAsChip) {
    return (
      <Tooltip title={pushDisplay.tooltip}>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', maxWidth: 200 }}>
          {pushDisplay.primary}
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={pushDisplay.tooltip}>
      <Chip
        size="small"
        variant={outlined ? 'outlined' : 'filled'}
        color={pushDisplay.chipColor}
        label={pushDisplay.primary}
        sx={compactChipSx}
      />
    </Tooltip>
  );
}
