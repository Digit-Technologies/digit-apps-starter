import { useEffect, useState, type MouseEvent } from 'react';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  Calendar,
  ConfirmDialog,
  Ellipsis,
  EmptyState,
  FileText,
  Modal,
  ModalSection,
  Pencil,
  Plus,
  RecordName,
  Save,
  SettingsRow,
  Table,
  TextIcon,
  Trash2,
  useBackendMutation,
  useBackendQuery,
  type TableColumn,
} from '@digit/lib-frontend';

import PageBody from '../PageBody';

type Note = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type NotesData = { notes: Note[] };

// D1 returns UTC "YYYY-MM-DD HH:MM:SS".
const formatDate = (value: string) =>
  new Date(`${value.replace(' ', 'T')}Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

type NotesPanelProps = {
  /** The "New note" header action lives in App; it opens the dialog through these props. */
  createOpen: boolean;
  onCreateOpen: () => void;
  onCreateClose: () => void;
};

export default function NotesPanel({ createOpen, onCreateOpen, onCreateClose }: NotesPanelProps) {
  const { data, error, loading, refetch } = useBackendQuery<NotesData>({ path: '/notes' });
  const [deleteNote, { error: deleteError, loading: deleting, reset: resetDelete }] =
    useBackendMutation();
  const notes = data?.notes ?? [];

  // GET /notes returns every note, so the table pages in the browser. When a route accepts
  // paging and sort arguments, pass these models to it instead.
  const [paging, setPaging] = useState({ page: 0, pageSize: 10 });
  const pageRows = notes.slice(paging.page * paging.pageSize, (paging.page + 1) * paging.pageSize);

  const [editing, setEditing] = useState<Note | null>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; note: Note } | null>(null);
  const [confirming, setConfirming] = useState<Note | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const closeEditor = () => {
    setEditing(null);
    onCreateClose();
  };

  const remove = async () => {
    if (!confirming) return;
    const result = await deleteNote({ path: `/notes/${confirming.id}`, method: 'DELETE' });
    if (!result.ok) return;
    setConfirming(null);
    setToast('Note deleted');
    await refetch();
  };

  const columns: TableColumn<Note>[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      icon: TextIcon,
      sortable: false,
      renderCell: (params) => <RecordName name={params.row.title} link />,
    },
    {
      field: 'body',
      headerName: 'Body',
      flex: 1,
      minWidth: 200,
      icon: TextIcon,
      sortable: false,
      renderCell: (params) =>
        params.row.body ? (
          <Typography variant="body1" color="text.secondary" noWrap>
            {params.row.body}
          </Typography>
        ) : (
          <Typography variant="body1" color="text.tertiary">
            None
          </Typography>
        ),
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 140,
      icon: Calendar,
      sortable: false,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'actions',
      headerName: '',
      width: 48,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="More actions">
          <IconButton
            aria-label="More actions"
            onClick={(event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
              setMenu({ anchor: event.currentTarget, note: params.row });
            }}
          >
            <Ellipsis />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const errorAlerts = (error || deleteError) && (
    <PageBody>
      {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}
      {deleteError && <AppErrorAlert error={deleteError} />}
    </PageBody>
  );

  return (
    <>
      {errorAlerts}

      {!error && !loading && notes.length === 0 ? (
        <PageBody>
          <EmptyState
            icon={<FileText size={20} />}
            title="No notes yet"
            description="Notes are stored in the app's own database."
            action={
              <Button startIcon={<Plus />} onClick={onCreateOpen}>
                New note
              </Button>
            }
          />
        </PageBody>
      ) : (
        !error && (
          <Table
            rows={pageRows}
            columns={columns}
            rowCount={notes.length}
            paginationModel={paging}
            onPaginationModelChange={setPaging}
            onRefresh={() => void refetch()}
            onRowClick={setEditing}
            loading={loading}
          />
        )
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            setEditing(menu!.note);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <Pencil />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            resetDelete();
            setConfirming(menu!.note);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <Trash2 />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <NoteDialog
        open={createOpen || editing !== null}
        note={editing}
        onClose={closeEditor}
        onSaved={async (message) => {
          closeEditor();
          setToast(message);
          await refetch();
        }}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Delete note?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep note"
        destructive
        busy={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setConfirming(null)}
      />

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <SnackbarContent message={toast} />
      </Snackbar>
    </>
  );
}

type NoteDialogProps = {
  open: boolean;
  /** The note to edit, or null to create one. */
  note: Note | null;
  onClose: () => void;
  onSaved: (message: string) => void | Promise<void>;
};

function NoteDialog({ open, note, onClose, onSaved }: NoteDialogProps) {
  const [saveNote, { error, loading: saving, reset }] = useBackendMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Start from the note (or blank) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? '');
    setBody(note?.body ?? '');
    reset();
  }, [open, note, reset]);

  const dirty = title !== (note?.title ?? '') || body !== (note?.body ?? '');
  const valid = title.trim() !== '';

  const save = async () => {
    const result = await saveNote({
      path: note ? `/notes/${note.id}` : '/notes',
      method: note ? 'PUT' : 'POST',
      body: { title, body },
    });
    if (result.ok) await onSaved(note ? 'Note saved' : 'Note created');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? 'Edit note' : 'New note'}
      footer={{
        onCancel: onClose,
        primary: (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            loading={saving}
            loadingPosition="start"
            disabled={!dirty || !valid}
            onClick={() => void save()}
          >
            Save
          </Button>
        ),
      }}
    >
      <ModalSection>
        <SettingsRow
          variant="form"
          label="Title"
          required
          control={
            <TextField
              hiddenLabel
              fullWidth
              autoFocus
              placeholder="Enter value"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          }
        />
      </ModalSection>
      <ModalSection title="Body">
        <TextField
          hiddenLabel
          fullWidth
          multiline
          minRows={3}
          placeholder="Add a note"
          slotProps={{ htmlInput: { 'aria-label': 'Body' } }}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        {error && <AppErrorAlert error={error} />}
      </ModalSection>
    </Modal>
  );
}
