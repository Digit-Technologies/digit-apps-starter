import { useState } from 'react';

import Typography from '@mui/material/Typography';

import {
  AppErrorAlert,
  Bookmark,
  BoxIcon,
  DataTable,
  EmptyState,
  PageBody,
  RecordName,
  TextIcon,
  useDigitApiQuery,
  type DataTableColumn,
} from '@digit/lib-frontend';


type ItemNode = { id: string; name?: string | null; sku?: string | null };

type ItemsData = {
  items?: { nodes?: ItemNode[] };
};

// Needs READ_ITEM in manifest.json.
const ITEMS_QUERY = `
  query Items($connection: ConnectionInput) {
    items(connection: $connection) {
      nodes {
        id
        name
        sku
      }
    }
  }
`;

const columns: DataTableColumn<ItemNode>[] = [
  {
    field: 'name',
    headerName: 'Item',
    flex: 1,
    minWidth: 240,
    icon: TextIcon,
    sortable: false,
    renderCell: (params) => <RecordName name={params.row.name || 'Untitled'} />,
  },
  {
    field: 'sku',
    headerName: 'SKU',
    width: 200,
    icon: Bookmark,
    sortable: false,
    renderCell: (params) =>
      params.row.sku ? (
        <Typography variant="body1" color="text.secondary" noWrap>
          {params.row.sku}
        </Typography>
      ) : (
        <Typography variant="body1" color="text.tertiary">
          None
        </Typography>
      ),
  },
];

export default function DigitApiPanel() {
  // The template asks for the first 10 items. For a full list, send `connection` (first/after)
  // and sort arguments from the table's models and refetch when they change.
  const { data, error, loading, refetch } = useDigitApiQuery<ItemsData>({
    query: ITEMS_QUERY,
    variables: { connection: { first: 10 } },
  });
  const items = data?.items?.nodes ?? [];
  const [paging, setPaging] = useState({ page: 0, pageSize: 10 });

  if (error) {
    return (
      <PageBody maxWidth={720}>
        <AppErrorAlert error={error} onRetry={() => void refetch()} />
      </PageBody>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <PageBody maxWidth={720}>
        <EmptyState
          icon={<BoxIcon size={20} />}
          title="No items"
          description="Items you can see in Sutton show up here."
        />
      </PageBody>
    );
  }

  return (
    <DataTable
      rows={items}
      columns={columns}
      rowCount={items.length}
      paginationModel={paging}
      onPaginationModelChange={setPaging}
      onRefresh={() => void refetch()}
      loading={loading}
    />
  );
}
