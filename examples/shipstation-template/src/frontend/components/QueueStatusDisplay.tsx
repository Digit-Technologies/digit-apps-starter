import Tooltip from '@mui/material/Tooltip';

import type { QueuePushDisplay } from '../eligibility';
import StatusChip from './StatusChip';

export const statusTooltipSlotProps = {
  tooltip: {
    sx: {
      maxWidth: 360,
      whiteSpace: 'normal',
      display: 'block',
      textTransform: 'none',
      letterSpacing: 'normal',
      fontWeight: 400,
      lineHeight: 1.45,
      fontSize: 14,
      py: 1,
      px: 1.25,
    },
  },
} as const;

export default function QueueStatusDisplay({ pushDisplay }: { pushDisplay: QueuePushDisplay }) {
  return (
    <Tooltip
      title={pushDisplay.tooltip}
      enterDelay={200}
      enterTouchDelay={0}
      slotProps={statusTooltipSlotProps}
    >
      <StatusChip color={pushDisplay.chipColor} label={pushDisplay.primary} />
    </Tooltip>
  );
}
