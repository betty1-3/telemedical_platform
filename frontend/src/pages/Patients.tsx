import React, { useMemo, useState } from 'react';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import type { Patient, Row } from '../types/entities';
import { GENDER_LABELS, GENDERS } from '../types/entities';
import { useResource } from '../hooks/useResource';
import { useCrud } from '../hooks/useCrud';
import { patientsApi } from '../utils/api/patients';
import { friendlyMessage } from '../utils/api/client';
import { patientKeys, toPatient } from '../utils/entities';
import { distinctValues, matchesQuery } from '../utils/fields';
import { formatDate, formatGender, initials, orDash } from '../utils/format';
import { payloads } from '../utils/api/payloads';
import { Panel, DetailList } from '../components/ui/Panel';
import { Toolbar } from '../components/ui/Toolbar';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { EntityForm } from '../components/ui/EntityForm';
import type { FieldDef, FormValues } from '../components/ui/EntityForm';
import { DetailDrawer } from '../components/DetailDrawer';
import { RelatedCollection } from '../components/RelatedCollection';

/** ⚠️ VERIFY against the PATIENT request DTO before going live. */
const fields: FieldDef[] = [
{ name: 'firstName', label: 'First name', required: true },
{ name: 'lastName', label: 'Last name', required: true },
{ name: 'dob', label: 'Date of birth', type: 'date', required: true },
{ name: 'gender', label: 'Gender', type: 'select', options: GENDERS, optionLabels: GENDER_LABELS, required: true },
{ name: 'city', label: 'City' },
{ name: 'area', label: 'Area' },
{ name: 'pincode', label: 'Pincode', pattern: /^\d{4,10}$/, patternMessage: 'Pincode must be 4–10 digits' }];


export function PatientsPage() {
  const list = useResource<Row[]>(() => patientsApi.list(), []);
  const rows = useMemo(() => list.data ?? [], [list.data]);
  const patients = useMemo(() => rows.map(toPatient), [rows]);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Patient | null>(null);

  const { submitting, save, remove } = useCrud(patientsApi, 'patient', list.refetch);

  const filtered = useMemo(
    () =>
    patients.filter(
      (patient) =>
      matchesQuery(patient.raw, query) && (!city || patient.city === city) && (!gender || patient.gender === gender)
    ),
    [patients, query, city, gender]
  );

  const columns: Column<Patient>[] = [
  {
    key: 'name',
    header: 'Patient',
    render: (patient) =>
    <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-2xs font-semibold text-brand-700">
            {initials(patient.firstName, patient.lastName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{patient.fullName}</span>
            <span className="block text-2xs text-ink-soft">ID {orDash(patient.id)}</span>
          </span>
        </span>

  },
  { key: 'gender', header: 'Gender', render: (patient) => formatGender(patient.gender) },
  { key: 'dob', header: 'Date of birth', render: (patient) => formatDate(patient.dob), hideBelow: 'md' },
  { key: 'city', header: 'City', render: (patient) => orDash(patient.city) },
  { key: 'area', header: 'Area', render: (patient) => orDash(patient.area), hideBelow: 'lg' },
  { key: 'pincode', header: 'Pincode', render: (patient) => orDash(patient.pincode), hideBelow: 'lg' },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    width: '110px',
    render: (patient) =>
    <span className="flex justify-end gap-1">
          <button
        type="button"
        aria-label={`Edit ${patient.fullName}`}
        onClick={(event) => {
          event.stopPropagation();
          setEditing(patient);
          setFormOpen(true);
        }}
        className="rounded p-1.5 text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink">
        
            <PencilIcon size={14} aria-hidden="true" />
          </button>
          <button
        type="button"
        aria-label={`Delete ${patient.fullName}`}
        onClick={(event) => {
          event.stopPropagation();
          setPendingDelete(patient);
        }}
        className="rounded p-1.5 text-ink-soft transition-colors duration-150 hover:bg-status-badbg hover:text-status-bad">
        
            <Trash2Icon size={14} aria-hidden="true" />
          </button>
        </span>

  }];


  const initialValues: FormValues | undefined = editing ?
  {
    firstName: editing.firstName,
    lastName: editing.lastName,
    dob: editing.dob.slice(0, 10),
    gender: editing.gender,
    city: editing.city,
    area: editing.area,
    pincode: editing.pincode
  } :
  undefined;

  const handleSubmit = async (values: FormValues) => {
    const body = payloads.patient(values);
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
          searchPlaceholder="Search patients by name, city, ID…"
          filters={[
          { id: 'city', label: 'City', value: city, options: distinctValues(rows, patientKeys.city), onChange: setCity },
          { id: 'gender', label: 'Gender', value: gender, options: distinctValues(rows, patientKeys.gender), onChange: setGender }]
          }
          resultLabel={list.loading ? undefined : `${filtered.length} of ${patients.length}`}
          actionLabel="Add patient"
          onAction={() => {
            setEditing(null);
            setFormOpen(true);
          }} />
        
        <DataTable
          caption="Registered patients"
          columns={columns}
          rows={filtered}
          getRowKey={(patient) => patient.id || patient.fullName}
          loading={list.loading}
          errorMessage={list.error ? friendlyMessage(list.error, 'patients') : undefined}
          onRetry={list.refetch}
          onRowClick={setSelected}
          selectedKey={selected?.id}
          emptyTitle={patients.length === 0 ? 'No patients returned by the backend' : 'No patients match these filters'}
          emptyHint={
          patients.length === 0 ?
          'The request succeeded but the PATIENT table returned no rows.' :
          'Clear the search or filters to see all records.'
          } />
        
      </Panel>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.fullName ?? ''}
        subtitle={selected ? `Patient ID ${orDash(selected.id)}` : undefined}
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
            { label: 'First name', value: orDash(selected.firstName) },
            { label: 'Last name', value: orDash(selected.lastName) },
            { label: 'Date of birth', value: formatDate(selected.dob) },
            { label: 'Gender', value: formatGender(selected.gender) },
            { label: 'City', value: orDash(selected.city) },
            { label: 'Area', value: orDash(selected.area) },
            { label: 'Pincode', value: orDash(selected.pincode) }]
            } />
          
            <RelatedCollection
            title="Phone numbers"
            subject="phone numbers"
            dependency={selected.id}
            loader={() => patientsApi.phones(selected.id)} />
          
            <RelatedCollection
            title="Medical records"
            subject="medical records"
            dependency={selected.id}
            loader={() => patientsApi.medicalRecords(selected.id)} />
          
            <RelatedCollection
            title="Feedback"
            subject="feedback"
            dependency={selected.id}
            loader={() => patientsApi.feedback(selected.id)} />
          
          </> :
        null}
      </DetailDrawer>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit patient' : 'Add patient'}
        description={editing ? `Updating patient ${orDash(editing.id)}` : 'Creates a new row in the PATIENT table'}>
        
        <EntityForm
          fields={fields}
          initialValues={initialValues}
          submitLabel={editing ? 'Save changes' : 'Create patient'}
          submitting={submitting}
          note="Gender is displayed as Male, Female, or Other and sent to Oracle as M, F, or O."
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }} />
        
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete patient"
        message={`This permanently removes ${pendingDelete?.fullName ?? 'this patient'} and may be rejected if related records exist.`}
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
