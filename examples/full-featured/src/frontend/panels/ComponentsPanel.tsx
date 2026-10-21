import { useState } from 'react';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  BookOpenText,
  Download,
  Factory,
  FormField,
  PageBody,
  Pill,
  Plus,
  PropertyGrid,
  Save,
  Section,
  Switch,
} from '@digit/lib-frontend';


const STATUSES = ['draft', 'open', 'in progress', 'ready', 'sent', 'completed', 'blocked', 'closed'];

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 } as const;

/**
 * A quick reference of the themed components, for whoever copies this template. Everything is
 * a library component or a themed MUI component with layout props only.
 */
export default function ComponentsPanel() {
  const [view, setView] = useState('all');
  const [period, setPeriod] = useState('week');
  const [notify, setNotify] = useState(true);

  return (
    <PageBody maxWidth={720}>
      <Section title="Buttons" subtitle="One primary per surface, last in its group">
        <Box sx={row}>
          <Button variant="text">Cancel</Button>
          <Button variant="outlined">Learn more</Button>
          <Button startIcon={<Download />}>Export</Button>
          <Button variant="contained" color="primary" startIcon={<Plus />}>
            New record
          </Button>
        </Box>
        <Box sx={row}>
          <Button variant="contained" color="primary" startIcon={<Save />} loading loadingPosition="start">
            Save
          </Button>
          <Button variant="contained" color="primary" startIcon={<Save />} disabled>
            Save
          </Button>
          <Button size="xs">Extra small</Button>
          <Tooltip title="Learning center">
            <IconButton aria-label="Learning center">
              <BookOpenText />
            </IconButton>
          </Tooltip>
        </Box>
      </Section>

      <Section title="Fields" subtitle="Label above with FormField; SettingsRow in panels and dialogs">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1 }}>
          <FormField label="Name" required>
            <TextField hiddenLabel fullWidth placeholder="Enter value" />
          </FormField>
          <FormField label="Unit">
            <Select fullWidth defaultValue="each">
              <MenuItem value="each">Each</MenuItem>
              <MenuItem value="box">Box</MenuItem>
            </Select>
          </FormField>
          <FormField label="Due by">
            <TextField hiddenLabel fullWidth type="date" />
          </FormField>
          <FormField label="Reference" error="Enter a reference">
            <TextField hiddenLabel fullWidth placeholder="Enter value" />
          </FormField>
          <FormField label="Owner" helperText="Reads as text until hover">
            <TextField variant="standard" fullWidth defaultValue="Sean B." />
          </FormField>
        </Box>
        <FormField label="Notes">
          <TextField hiddenLabel fullWidth multiline minRows={3} placeholder="Add a note" />
        </FormField>
      </Section>

      <Section title="Choices">
        <Box sx={row}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, value: string | null) => value && setView(value)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="archived">Archived</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            exclusive
            value={period}
            onChange={(_, value: string | null) => value && setPeriod(value)}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ maxWidth: 320 }}>
          <Switch
            label="Email me when a run fails"
            description="Sent to the app owner."
            checked={notify}
            onChange={(_, checked) => setNotify(checked)}
          />
        </Box>
      </Section>

      <Section title="Pills" subtitle="Every status or category">
        <Box sx={row}>
          {STATUSES.map((status) => (
            <Pill key={status} status={status} />
          ))}
        </Box>
        <Box sx={row}>
          <Pill size="sm" color="sky" label="Category" />
          <Pill size="sm" color="gray" label="System" />
          <Pill color="violet" icon={<Factory size={12} />} label="MO 277" />
        </Box>
      </Section>

      <Section title="Alerts">
        <Alert severity="info">Changes apply to new orders only.</Alert>
        <Alert severity="success">Import finished.</Alert>
        <Alert severity="warning">
          <AlertTitle>Two items are low on stock</AlertTitle>
          Reorder before Friday.
        </Alert>
        <Alert severity="error">The label printer is offline.</Alert>
        <Alert variant="neutral" severity="info">
          Neutral alerts sit on paper with no tint.
        </Alert>
      </Section>

      <Section title="Type" subtitle="Pick the variant by role">
        <PropertyGrid
          rows={[
            { label: 'h6', value: <Typography variant="h6">Section title, name cell</Typography> },
            { label: 'body1', value: <Typography variant="body1">Labels, values, paragraphs</Typography> },
            { label: 'body2', value: <Typography variant="body2">Row titles, emphasised values</Typography> },
            {
              label: 'overline',
              value: (
                <Typography variant="overline" color="text.tertiary">
                  Hints, counts, timestamps
                </Typography>
              ),
            },
            { label: 'mono', value: <Typography variant="mono">sk_live_51H8</Typography> },
          ]}
        />
      </Section>
    </PageBody>
  );
}
