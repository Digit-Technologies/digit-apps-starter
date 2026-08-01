import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export default function ThemePanel() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2" sx={{ mb: 1 }}>
          Theme showcase
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          MUI components styled by <code>DigitThemeProvider</code> from{' '}
          <code>@digit/app-frontend</code>. Prefer palette / typography tokens over hard-coded
          colors.
        </Typography>
      </Box>

      <Stack spacing={1}>
        <Typography variant="overline">Typography</Typography>
        <Typography variant="h1">Heading 1</Typography>
        <Typography variant="h2">Heading 2</Typography>
        <Typography variant="h3">Heading 3</Typography>
        <Typography variant="body1">Body 1 — primary reading text.</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Body 2 — secondary text.
        </Typography>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline">Buttons</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
          <Button variant="contained" color="secondary">
            Secondary
          </Button>
          <Button variant="contained" color="error">
            Error
          </Button>
          <Button variant="contained" disabled>
            Disabled
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline">Fields & chips</Typography>
        <TextField label="Sample field" placeholder="Type here" size="small" sx={{ maxWidth: 280 }} />
        <Stack direction="row" spacing={1}>
          <Chip label="Default" />
          <Chip label="Primary" color="primary" />
          <Chip label="Success" color="success" />
          <Chip label="Warning" color="warning" />
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline">Alerts</Typography>
        <Alert severity="info">Info alert</Alert>
        <Alert severity="success">Success alert</Alert>
        <Alert severity="warning">Warning alert</Alert>
        <Alert severity="error">Error alert</Alert>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline">Table</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Widget A</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Widget B</TableCell>
              <TableCell>Draft</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Stack>
    </Stack>
  );
}
