import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, type AppError } from '@digit/lib-frontend';

import type { CarrierDraft, DigitCarrierOption, OrgSettingsData, SsServiceRow } from '../carrierTypes';
import { serviceDraftKey } from '../carrierTypes';

const ROWS_PER_PAGE = 10;

type Status = {
  label: string;
  color: 'success' | 'info' | 'warning' | 'error';
  hint: string;
};

function DigitSelect({
  value,
  disabled,
  options,
  emptyLabel,
  ariaLabel,
  onChange,
}: {
  value: string;
  disabled: boolean;
  options: DigitCarrierOption[];
  emptyLabel: string;
  ariaLabel: string;
  onChange: (digitOptionId: string) => void;
}) {
  return (
    <Select
      size="small"
      fullWidth
      displayEmpty
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputProps={{ 'aria-label': ariaLabel }}
      renderValue={(selected) => {
        const option = options.find((row) => row.id === selected);
        if (option) return option.value;
        return (
          <Typography component="span" variant="body2" sx={{ color: 'text.disabled' }}>
            {emptyLabel}
          </Typography>
        );
      }}
    >
      <MenuItem value="">{emptyLabel}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.value}
        </MenuItem>
      ))}
    </Select>
  );
}

function serviceStatus(service: SsServiceRow, draftId: string): Status {
  const selected = draftId.trim();
  if (selected) {
    return { label: 'Manual', color: 'info', hint: 'Pinned for this ShipStation service.' };
  }
  if (!service.digitOptionId) {
    return {
      label: 'Unmatched',
      color: 'error',
      hint: 'Digit stores no carrier for labels that use this service.',
    };
  }
  if (service.inheritedFromCarrier || service.matchSource === 'carrier') {
    return {
      label: 'Default',
      color: 'info',
      hint: 'Uses the Digit carrier set on this ShipStation carrier.',
    };
  }
  switch (service.matchSource) {
    case 'fuzzy':
      return {
        label: 'Fuzzy',
        color: 'warning',
        hint: 'Matched this service on name similarity. Confirm it is right.',
      };
    case 'exact':
    case 'alias':
      return {
        label: 'Auto',
        color: 'success',
        hint: 'Matched this ShipStation service to a Digit shipping carrier.',
      };
    default:
      return { label: 'Auto', color: 'success', hint: 'Matched automatically.' };
  }
}

export default function CarrierSettingsDialog({
  open,
  orgSettings,
  draft,
  mutating,
  mutationError,
  onChangeDefault,
  onChangeService,
  onClose,
  onSave,
}: {
  open: boolean;
  orgSettings: OrgSettingsData | undefined;
  draft: CarrierDraft;
  mutating: boolean;
  mutationError: AppError | null;
  onChangeDefault: (ssCarrierCode: string, digitOptionId: string) => void;
  onChangeService: (ssCarrierCode: string, ssServiceCode: string, digitOptionId: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const digitCarriers = orgSettings?.digitCarriers ?? [];
  const loadError = orgSettings?.digitCarriersError;
  const carriers = orgSettings?.ssCarriers ?? [];
  const [carrierFilter, setCarrierFilter] = useState('');
  const [page, setPage] = useState(0);

  const unmatchedFirst = useMemo(() => {
    return [...carriers].sort((a, b) => {
      const aUn = (a.services ?? []).some((row) => !row.digitOptionId) ? 0 : 1;
      const bUn = (b.services ?? []).some((row) => !row.digitOptionId) ? 0 : 1;
      if (aUn !== bUn) return aUn - bUn;
      return (a.name || a.carrierCode).localeCompare(b.name || b.carrierCode);
    });
  }, [carriers]);

  useEffect(() => {
    if (!open) return;
    setPage(0);
    setCarrierFilter((current) => {
      if (current && unmatchedFirst.some((row) => row.carrierCode === current)) return current;
      const firstUnmatched = unmatchedFirst.find((row) =>
        (row.services ?? []).some((service) => !service.digitOptionId),
      );
      return firstUnmatched?.carrierCode || unmatchedFirst[0]?.carrierCode || '';
    });
  }, [open, unmatchedFirst]);

  const selected =
    unmatchedFirst.find((row) => row.carrierCode === carrierFilter) || unmatchedFirst[0] || null;
  const services = [...(selected?.services ?? [])].sort((a, b) => {
    const aUn = a.digitOptionId ? 1 : 0;
    const bUn = b.digitOptionId ? 1 : 0;
    if (aUn !== bUn) return aUn - bUn;
    return (a.name || a.serviceCode).localeCompare(b.name || b.serviceCode);
  });
  const pageCount = Math.max(1, Math.ceil(services.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const paginated =
    services.length > ROWS_PER_PAGE
      ? services.slice(safePage * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE + ROWS_PER_PAGE)
      : services;

  const serviceTotal = carriers.reduce((sum, row) => sum + (row.services ?? []).length, 0);
  const serviceMapped = carriers.reduce(
    (sum, row) => sum + (row.services ?? []).filter((service) => service.digitOptionId).length,
    0,
  );
  const defaultLabel = selected?.digitValue
    ? `Use carrier default (${selected.digitValue})`
    : 'Auto or unmatched';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="carrier-settings-title"
    >
      <DialogTitle id="carrier-settings-title" sx={{ pb: 1 }}>
        Carrier mapping
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Digit treats each shipping service as its own carrier (UPS Ground vs UPS Next Day).
            Set a default Digit carrier for the ShipStation brand, then override individual
            services. Empty service rows inherit the default, or auto-match the service name.
          </Typography>
          {loadError ? <Alert severity="warning">{loadError}</Alert> : null}
          {mutationError ? <AppErrorAlert error={mutationError} /> : null}
          {carriers.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Connect ShipStation to load carriers and services, then map each service to a Digit
              shipping carrier.
            </Typography>
          ) : (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {serviceMapped} of {serviceTotal} services mapped
              </Typography>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="carrier-filter-label">ShipStation carrier</InputLabel>
                <Select
                  labelId="carrier-filter-label"
                  label="ShipStation carrier"
                  value={selected?.carrierCode || ''}
                  onChange={(event) => {
                    setCarrierFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  {unmatchedFirst.map((carrier) => {
                    const gap = (carrier.services ?? []).filter((row) => !row.digitOptionId).length;
                    return (
                      <MenuItem key={carrier.carrierCode} value={carrier.carrierCode}>
                        {carrier.name}
                        {gap > 0 ? ` (${gap} unmatched)` : ''}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Stack>
          )}
        </Stack>

        {selected ? (
          <Stack spacing={1.5} sx={{ px: 2, pb: 1.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
            >
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2">{selected.name}</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {selected.carrierCode}
                  {selected.inCatalog === false ? ' · from label' : ''}
                </Typography>
              </Stack>
              <Stack sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Default Digit carrier
                </Typography>
                <DigitSelect
                  value={draft.defaults[selected.carrierCode] ?? ''}
                  disabled={Boolean(loadError)}
                  options={digitCarriers}
                  emptyLabel="No default"
                  ariaLabel={`Default Digit carrier for ${selected.name}`}
                  onChange={(id) => onChangeDefault(selected.carrierCode, id)}
                />
              </Stack>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Used when a service below is left on inherit. Auto-match still applies if there is no
              default.
            </Typography>
          </Stack>
        ) : null}

        {selected && services.length > 0 ? (
          <TableContainer>
            <Table size="small" sx={{ '& td, & th': { py: 0.75 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>ShipStation service</TableCell>
                  <TableCell sx={{ width: '42%' }}>Digit shipping carrier</TableCell>
                  <TableCell align="right">Match</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((service) => {
                  const key = serviceDraftKey(selected.carrierCode, service.serviceCode);
                  const draftId = draft.services[key] ?? '';
                  const status = serviceStatus(service, draftId);
                  const emptyLabel = service.digitOptionId
                    ? service.inheritedFromCarrier
                      ? defaultLabel
                      : `Auto (${service.digitValue})`
                    : 'Not mapped';
                  return (
                    <TableRow key={key} hover>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {service.name}
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                          >
                            {service.serviceCode || '—'}
                          </Typography>
                          {service.inCatalog === false ? (
                            <Tooltip title="Seen on a purchased label, not in the catalog synced at connect">
                              <Typography variant="caption" sx={{ color: 'warning.main' }}>
                                from label
                              </Typography>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <DigitSelect
                          value={draftId}
                          disabled={Boolean(loadError)}
                          options={digitCarriers}
                          emptyLabel={emptyLabel}
                          ariaLabel={`Digit carrier for ${service.name}`}
                          onChange={(id) =>
                            onChangeService(selected.carrierCode, service.serviceCode, id)
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={status.hint}>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={status.color}
                            label={status.label}
                          />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : selected ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', px: 2, pb: 2 }}>
            No services synced for this carrier. Set the default Digit carrier above, or reconnect
            to refresh the catalog.
          </Typography>
        ) : null}

        {services.length > ROWS_PER_PAGE ? (
          <TablePagination
            component="div"
            count={services.length}
            page={safePage}
            onPageChange={(_event, next) => setPage(next)}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[ROWS_PER_PAGE]}
          />
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={mutating || Boolean(loadError)}>
          {mutating ? 'Saving…' : 'Save mapping'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
