import { useEffect, useState, type KeyboardEvent } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

type MaintenanceRecord = {
  id: number;
  machineName: string;
  serialNumber: string;
  scheduled: boolean;
  lastInspectionDate: string | null;
  performedBy: string | null;
};

type RecordFormState = {
  id: string;
  machineName: string;
  serialNumber: string;
  lastInspectionDate: string;
  performedBy: string;
  scheduled: boolean;
};

const EMPTY_FORM: RecordFormState = {
  id: '',
  machineName: '',
  serialNumber: '',
  lastInspectionDate: '',
  performedBy: '',
  scheduled: false,
};

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const err = (data as { error?: unknown }).error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    try {
      return JSON.stringify(err);
    } catch {
      return null;
    }
  }
  return null;
}

async function backendRequest(path: string, init?: RequestInit) {
  const response = await fetch(`/proxy/backend/${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Digit-Proxy-Client': '1',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(extractErrorMessage(data) || `Request failed (HTTP ${response.status})`);
  }
  return data;
}

export default function App() {
  const [records, setRecords] = useState<MaintenanceRecord[] | null>(null);
  const [listStatus, setListStatus] = useState<{ message: string; isError: boolean }>({
    message: '',
    isError: false,
  });
  const [form, setForm] = useState<RecordFormState>(EMPTY_FORM);
  const [formStatus, setFormStatus] = useState<{ message: string; isError: boolean }>({
    message: '',
    isError: false,
  });

  const isEditing = form.id !== '';

  const loadRecords = async () => {
    setListStatus({ message: 'Loading…', isError: false });
    try {
      const data = await backendRequest('records');
      setRecords(data.records as MaintenanceRecord[]);
      setListStatus({ message: '', isError: false });
    } catch (error) {
      setRecords([]);
      setListStatus({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to load records (expected outside the Digit harness).',
        isError: true,
      });
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormStatus({ message: '', isError: false });
  };

  const startEdit = (record: MaintenanceRecord) => {
    setForm({
      id: String(record.id),
      machineName: record.machineName,
      serialNumber: record.serialNumber,
      lastInspectionDate: record.lastInspectionDate || '',
      performedBy: record.performedBy || '',
      scheduled: record.scheduled,
    });
    setFormStatus({ message: '', isError: false });
  };

  const saveRecord = async () => {
    const payload = {
      machineName: form.machineName.trim(),
      serialNumber: form.serialNumber.trim(),
      scheduled: form.scheduled,
      lastInspectionDate: form.lastInspectionDate || null,
      performedBy: form.performedBy.trim() || null,
    };

    if (!payload.machineName || !payload.serialNumber) {
      setFormStatus({ message: 'Machine and serial number are required.', isError: true });
      return;
    }

    setFormStatus({ message: isEditing ? 'Saving…' : 'Adding…', isError: false });

    try {
      if (isEditing) {
        await backendRequest(`records/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await backendRequest('records', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      await loadRecords();
    } catch (error) {
      setFormStatus({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save record (expected outside the Digit harness).',
        isError: true,
      });
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      await backendRequest(`records/${id}`, { method: 'DELETE' });
      await loadRecords();
    } catch (error) {
      setListStatus({
        message: error instanceof Error ? error.message : 'Failed to delete record.',
        isError: true,
      });
    }
  };

  const handleFieldKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveRecord();
    }
  };

  return (
    <Box sx={{ maxWidth: '60rem', mx: 'auto', px: 3, py: 5 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Weekly maintenance
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        Maintenance Log
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Track whether each machine's weekly maintenance was scheduled, when it was last
        inspected, and who performed the inspection.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1.5}
          alignItems="flex-end"
          sx={{ mb: formStatus.message ? 1.5 : 0 }}
        >
          <TextField
            label="Machine"
            required
            placeholder="e.g. CNC Mill 3"
            size="small"
            value={form.machineName}
            onChange={(e) => setForm((f) => ({ ...f, machineName: e.target.value }))}
            onKeyDown={handleFieldKeyDown}
            sx={{ minWidth: '11rem', flex: 1 }}
          />
          <TextField
            label="Serial number"
            required
            placeholder="e.g. SN-48213"
            size="small"
            value={form.serialNumber}
            onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            onKeyDown={handleFieldKeyDown}
            sx={{ minWidth: '11rem', flex: 1 }}
          />
          <TextField
            label="Date of last inspection"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.lastInspectionDate}
            onChange={(e) => setForm((f) => ({ ...f, lastInspectionDate: e.target.value }))}
            onKeyDown={handleFieldKeyDown}
            sx={{ minWidth: '11rem', flex: 1 }}
          />
          <TextField
            label="Performed by"
            placeholder="e.g. J. Alvarez"
            size="small"
            value={form.performedBy}
            onChange={(e) => setForm((f) => ({ ...f, performedBy: e.target.value }))}
            onKeyDown={handleFieldKeyDown}
            sx={{ minWidth: '11rem', flex: 1 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.scheduled}
                onChange={(e) => setForm((f) => ({ ...f, scheduled: e.target.checked }))}
              />
            }
            label="Weekly maintenance scheduled"
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => void saveRecord()}>
              {isEditing ? 'Save changes' : 'Add record'}
            </Button>
            {isEditing && (
              <Button variant="outlined" color="inherit" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
        {formStatus.message && (
          <Typography variant="body2" sx={{ color: formStatus.isError ? 'error.main' : 'text.secondary' }}>
            {formStatus.message}
          </Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary' }}>Machine</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>Serial number</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>Scheduled</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>Last inspection</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>Performed by</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {records && records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ color: 'text.secondary', py: 3 }}>
                  No maintenance records yet.
                </TableCell>
              </TableRow>
            )}
            {records?.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.machineName}</TableCell>
                <TableCell>{record.serialNumber}</TableCell>
                <TableCell>
                  {record.scheduled ? (
                    <Chip label="Scheduled" size="small" color="success" variant="outlined" />
                  ) : (
                    <Chip label="Not scheduled" size="small" color="warning" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>{record.lastInspectionDate || '—'}</TableCell>
                <TableCell>{record.performedBy || '—'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75}>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => startEdit(record)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => void deleteRecord(record.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {listStatus.message && (
          <Typography
            variant="body2"
            sx={{ color: listStatus.isError ? 'error.main' : 'text.secondary', mt: 1.5 }}
          >
            {listStatus.message}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
