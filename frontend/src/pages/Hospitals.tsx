import React, { useMemo, useState } from 'react';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import type { Hospital, Row } from '../types/entities';
import { useResource } from '../hooks/useResource';
import { useCrud } from '../hooks/useCrud';
import { hospitalsApi } from '../utils/api/hospitals';
import { friendlyMessage } from '../utils/api/client';
import { hospitalKeys, toHospital } from '../utils/entities';
import { distinctValues, matchesQuery } from '../utils/fields';
import { payloads } from '../utils/api/payloads';
import { orDash } from '../utils/format';
import { DetailList, Panel } from '../components/ui/Panel';
import { Toolbar } from '../components/ui/Toolbar';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EntityForm } from '../components/ui/EntityForm';
import type { FieldDef, FormValues } from '../components/ui/EntityForm';
import { DetailDrawer } from '../components/DetailDrawer';
import { RelatedCollection } from '../components/RelatedCollection';

/** ⚠️ VERIFY against the HOSPITAL request DTO. */
const fields: FieldDef[] = [
{ name: 'hospitalName', label: 'Hospital name', required: true, full: true },
{ name: 'street', label: 'Street' },
{ name: 'area', label: 'Area' },
{ name: 'city', label: 'City', required: true },
{ name: 'pincode', label: 'Pincode', pattern: /^\d{4,10}$/, patternMessage: 'Pincode must be 4–10 digits' }];


export function HospitalsPage() {
  const list = useResource<Row[]>(() => hospitalsApi.list(), []);
  const rows = useMemo(() => list.data ?? [], [list.data]);
  const hospitals = useMemo(() => rows.map(toHospital), [rows]);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [selected, setSelected] = useState<Hospital | null>(null);
  const [editing, setEditing] = useState<Hospital | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Hospital | null>(null);

  const { submitting, save, remove } = useCrud(hospitalsApi, 'hospital', list.refetch);

  const filtered = useMemo(
    () => hospitals.filter((hospital) => matchesQuery(hospital.raw, query) && (!city || hospital.city === city)),
    [hospitals, query, city]
  );

  const columns: Column<Hospital>[] = [
  {
    key: 'name',
    header: 'Hospital',
    render: (hospital) =>
    <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{hospital.name}</span>
          <span className="block text-2xs text-ink-soft">ID {orDash(hospital.id)}</span>
        </span>

  },
  { key: 'street', header: 'Street', render: (hospital) => orDash(hospital.street), hideBelow: 'lg' },
  { key: 'area', header: 'Area', render: (hospital) => orDash(hospital.area), hideBelow: 'md' },
  { key: 'city', header: 'City', render: (hospital) => orDash(hospital.city) },
  { key: 'pincode', header: 'Pincode', render: (hospital) => orDash(hospital.pincode), hideBelow: 'md' },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    width: '110px',
    render: (hospital) =>
    <span className="flex justify-end gap-1">
          <button
        type="button"
        aria-label={`Edit ${hospital.name}`}
        onClick={(event) => {
          event.stopPropagation();
          setEditing(hospital);
          setFormOpen(true);
        }}
        className="rounded p-1.5 text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink">
        
            <PencilIcon size={14} aria-hidden="true" />
          </button>
          <button
        type="button"
        aria-label={`Delete ${hospital.name}`}
        onClick={(event) => {
          event.stopPropagation();
          setPendingDelete(hospital);
        }}
        className="rounded p-1.5 text-ink-soft transition-colors duration-150 hover:bg-status-badbg hover:text-status-bad">
        
            <Trash2Icon size={14} aria-hidden="true" />
          </button>
        </span>

  }];


  const initialValues: FormValues | undefined = editing ?
  {
    hospitalName: editing.name,
    street: editing.street,
    area: editing.area,
    city: editing.city,
    pincode: editing.pincode
  } :
  undefined;

  const handleSubmit = async (values: FormValues) => {
    const body = payloads.hospital(values);
    const ok = await save(editing?.id ?? null, body);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
      setSelected(null);
    }
  };

  return (
    <>
      <Panel>
        <Toolbar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search hospitals by name, area, city…"
          filters={[{ id: 'city', label: 'City', value: city, options: distinctValues(rows, hospitalKeys.city), onChange: setCity }]}
          resultLabel={list.loading ? undefined : `${filtered.length} of ${hospitals.length}`}
          actionLabel="Add hospital"
          onAction={() => {
            setEditing(null);
            setFormOpen(true);
          }} />
        
        <DataTable
          caption="Registered hospitals"
          columns={columns}
          rows={filtered}
          getRowKey={(hospital) => hospital.id || hospital.name}
          loading={list.loading}
          errorMessage={list.error ? friendlyMessage(list.error, 'hospitals') : undefined}
          onRetry={list.refetch}
          onRowClick={setSelected}
          selectedKey={selected?.id}
          emptyTitle={hospitals.length === 0 ? 'No hospitals returned by the backend' : 'No hospitals match these filters'}
          emptyHint={
          hospitals.length === 0 ?
          'The request succeeded but the HOSPITAL table returned no rows.' :
          'Clear the search or filters to see all records.'
          } />
        
      </Panel>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? `Hospital ID ${orDash(selected.id)}` : undefined}
        actions={
        selected ?
        <button
          type="button"
          onClick={() => {
            setEditing(selected);
            setFormOpen(true);
          }}
          className="rounded border border-line-strong bg-white px-2.5 py-1 text-xs font-medium text-ink transition-colors duration-150 hover:bg-canvas">
          
              Edit
            </button> :
        null
        }>
        
        {selected ?
        <>
            <DetailList
            items={[
            { label: 'Street', value: orDash(selected.street) },
            { label: 'Area', value: orDash(selected.area) },
            { label: 'City', value: orDash(selected.city) },
            { label: 'Pincode', value: orDash(selected.pincode) }]
            } />
          
            <RelatedCollection
            title="Phone numbers"
            subject="phone numbers"
            dependency={selected.id}
            loader={() => hospitalsApi.phones(selected.id)} />
          
            <RelatedCollection
            title="Doctors at this hospital"
            subject="doctors"
            dependency={selected.id}
            loader={() => hospitalsApi.doctors(selected.id)} />
          
          </> :
        null}
      </DetailDrawer>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit hospital' : 'Add hospital'}
        description={editing ? `Updating hospital ${orDash(editing.id)}` : 'Creates a new row in the HOSPITAL table'}>
        
        <EntityForm
          fields={fields}
          initialValues={initialValues}
          submitLabel={editing ? 'Save changes' : 'Create hospital'}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }} />
        
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete hospital"
        message={`This permanently removes ${pendingDelete?.name ?? 'this hospital'} and may be rejected if doctors are still linked to it.`}
        busy={submitting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          const ok = await remove(pendingDelete.id);
          setPendingDelete(null);
          if (ok && selected?.id === pendingDelete.id) setSelected(null);
        }} />
      
    </>);

}
