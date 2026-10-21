import { useState, type ReactNode } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { PageHeader, Plus } from '@digit/lib-frontend';

import PageBody from './PageBody';
import ComponentsPanel from './panels/ComponentsPanel';
import ConfigPanel from './panels/ConfigPanel';
import DigitApiPanel from './panels/DigitApiPanel';
import ErrorLabPanel from './panels/ErrorLabPanel';
import JobsPanel from './panels/JobsPanel';
import NotesPanel from './panels/NotesPanel';
import PublicApiPanel from './panels/PublicApiPanel';
import SecretsPanel from './panels/SecretsPanel';

type TabId = 'notes' | 'items' | 'jobs' | 'backend' | 'errors' | 'components';

type TabConfig = {
  id: TabId;
  label: string;
  /** PageHeader actions while this tab is open: secondary buttons, then one primary, last. */
  actions?: ReactNode;
  content: ReactNode;
};

export default function App() {
  const [tab, setTab] = useState<TabId>('notes');
  // A header action that opens something inside a tab: App owns the open flag, the tab owns
  // the dialog.
  const [newNoteOpen, setNewNoteOpen] = useState(false);

  const tabs: TabConfig[] = [
    {
      id: 'notes',
      label: 'Notes',
      actions: (
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus />}
          onClick={() => setNewNoteOpen(true)}
        >
          New note
        </Button>
      ),
      content: (
        <NotesPanel
          createOpen={newNoteOpen}
          onCreateOpen={() => setNewNoteOpen(true)}
          onCreateClose={() => setNewNoteOpen(false)}
        />
      ),
    },
    { id: 'items', label: 'Items', content: <DigitApiPanel /> },
    { id: 'jobs', label: 'Jobs', content: <JobsPanel /> },
    {
      id: 'backend',
      label: 'Backend',
      content: (
        <PageBody>
          <PublicApiPanel />
          <SecretsPanel />
          <ConfigPanel />
        </PageBody>
      ),
    },
    { id: 'errors', label: 'Error lab', content: <ErrorLabPanel /> },
    { id: 'components', label: 'Components', content: <ComponentsPanel /> },
  ];
  const current = tabs.find((entry) => entry.id === tab) ?? tabs[0]!;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PageHeader
        title="Full featured"
        actions={current.actions}
        tabs={
          <Tabs value={current.id} onChange={(_, value: TabId) => setTab(value)}>
            {tabs.map((entry) => (
              <Tab key={entry.id} value={entry.id} label={entry.label} />
            ))}
          </Tabs>
        }
      />
      {current.content}
    </Box>
  );
}
