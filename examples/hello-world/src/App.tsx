import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function App() {
  return (
    <Box sx={{ maxWidth: '40rem', mx: 'auto', px: 3, py: 6 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Digit App
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1.5 }}>
        Hello World
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        A minimal frontend-only Digit app.
      </Typography>
    </Box>
  );
}
