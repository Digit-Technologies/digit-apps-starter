import { useState } from 'react';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
} from '@digit/app-frontend';

type Note = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type NotesData = { notes: Note[] };

type FormState = { id: string; title: string; body: string };

const EMPTY: FormState = { id: '', title: '', body: '' };

export default function NotesPanel() {
  const { data, error: listError, loading, refetch } = useBackendQuery<NotesData>('/notes');
  const [saveNote, { error: formError, loading: saving, reset: resetFormError }] =
    useBackendMutation();
  const [form, setForm] = useState<FormState>(EMPTY);
  const notes = data?.notes ?? [];

  const save = async () => {
    resetFormError();
    const editing = form.id !== '';
    const result = await saveNote(editing ? `/notes/${form.id}` : '/notes', {
      method: editing ? 'PUT' : 'POST',
      body: { title: form.title, body: form.body },
    });
    if (!result.ok) return;
    setForm(EMPTY);
    await refetch();
  };

  const remove = async (id: number) => {
    resetFormError();
    const result = await saveNote(`/notes/${id}`, { method: 'DELETE' });
    if (!result.ok) return;
    if (form.id === String(id)) setForm(EMPTY);
    await refetch();
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h2" component="h2">
        Notes (D1)
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        App-owned CRUD via <code>FULL_FEATURED_DB</code>. Run migration{' '}
        <code>0001_init.sql</code> in Digit before first use.
      </Typography>

      {listError && <AppErrorAlert error={listError} onRetry={() => void refetch()} />}

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading notes…
          </Typography>
        </Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Body</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No notes yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>{note.title}</TableCell>
                  <TableCell>{note.body || '—'}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() =>
                        setForm({ id: String(note.id), title: note.title, body: note.body })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => void remove(note.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
        <Typography variant="h3" component="h3">
          {form.id ? 'Edit note' : 'New note'}
        </Typography>
        <TextField
          label="Title"
          size="small"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <TextField
          label="Body"
          size="small"
          multiline
          minRows={2}
          value={form.body}
          onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
        />
        {formError && <AppErrorAlert error={formError} />}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={saving} onClick={() => void save()}>
            {form.id ? 'Update' : 'Create'}
          </Button>
          {form.id ? (
            <Button variant="text" onClick={() => setForm(EMPTY)}>
              Cancel
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Stack>
  );
}
