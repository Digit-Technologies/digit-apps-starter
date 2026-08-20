import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Paper sx={{ width: '100%', maxWidth: 560, p: { xs: 3, sm: 5 } }}>
        <Stack spacing={1.5}>
          <Typography variant="overline" component="p" sx={{ color: 'primary.main' }}>
            Digit App
          </Typography>
          <Typography variant="h1" component="h1">
            Hello, world!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Start building your app in src/frontend/App.tsx.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
