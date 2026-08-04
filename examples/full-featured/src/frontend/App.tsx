import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import ConfigPanel from './panels/ConfigPanel';
import DigitApiPanel from './panels/DigitApiPanel';
import ErrorLabPanel from './panels/ErrorLabPanel';
import NotesPanel from './panels/NotesPanel';
import PublicApiPanel from './panels/PublicApiPanel';
import SecretsPanel from './panels/SecretsPanel';
import ThemePanel from './panels/ThemePanel';

const TABS = [
  { id: 'theme', label: 'Theme', element: <ThemePanel /> },
  { id: 'errors', label: 'Error lab', element: <ErrorLabPanel /> },
  { id: 'digit', label: 'Digit API', element: <DigitApiPanel /> },
  { id: 'public', label: 'Public API', element: <PublicApiPanel /> },
  { id: 'secrets', label: 'Secrets', element: <SecretsPanel /> },
  { id: 'notes', label: 'Notes', element: <NotesPanel /> },
  { id: 'config', label: 'Config', element: <ConfigPanel /> },
] as const;

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ maxWidth: '56rem', mx: 'auto', px: 3, py: 4 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Digit App
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        Full Featured
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Reference app for theme, errors, Digit GraphQL, public APIs, secrets, D1 CRUD, and
        env config — using <code>@digit/lib-frontend</code> and <code>@digit/lib-backend</code>.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((entry) => (
          <Tab key={entry.id} label={entry.label} />
        ))}
      </Tabs>

      {TABS[tab]?.element}
    </Box>
  );
}
