import React, { useMemo, useState } from 'react';
import { PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';
import type { Doctor, Row } from '../types/entities';
import { GENDER_LABELS, GENDERS } from '../types/entities';
import { useResource } from '../hooks/useResource';
import { useCrud } from '../hooks/useCrud';
import { doctorsApi } from '../utils/api/doctors';
import { friendlyMessage } from '../utils/api/client';
import { doctorKeys, toDoctor } from '../utils/entities';
import { distinctValues, matchesQuery, pickString } from '../utils/fields';
import { formatDate, formatGender, humanise, initials, orDash } from '../utils/format';
import { payloads } from '../utils/api/payloads';
import { Badge, DetailList, Panel } from '../components/ui/Panel';
import { Toolbar } from '../components/ui/Toolbar';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EntityForm } from '../components/ui/EntityForm';
import type { FieldDef, FormValues } from '../components/ui/EntityForm';
import { DetailDrawer } from '../components/DetailDrawer';
import { RelatedCollection } from '../components/RelatedCollection';

const fields: FieldDef[] = [
{ name: 'firstName', label: 'First name', required: true },
{ name: 'lastName', label: 'Last name', required: true },
{ name: 'gender', label: 'Gender', type: 'select', options: GENDERS, optionLabels: GENDER_LABELS, required: true },
{ name: 'dob', label: 'Date of birth', type: 'date', required: true },
{ name: 'dateJoined', label: 'Date joined', type: 'date' },
{ name: 'licenseNumber', label: 'License number', required: true },
{ name: 'experience', label: 'Experience (years)', type: 'number', min: 0, max: 70 }];


export function DoctorsPage() {
  const list = useResource<Row[]>(() => doctorsApi.list(), []);
  const specializationList = useResource<Row[]>(() => doctorsApi.allSpecializations(), []);
  const rows = useMemo(() => list.data ?? [], [list.data]);
  const specializationByDoctor = useMemo(() => {
    const map: Record<string, string> = {};
    (specializationList.data ?? []).forEach((row) => {
      const doctorId = pickString(row, ['doctor_id']);
      if (doctorId && !map[doctorId]) map[doctorId] = pickString(row, ['specialization']);
    });
    return map;
  }, [specializationList.data]);
  const doctors = useMemo(
    () => rows.map((row) => ({ ...toDoctor(row), specialization: specializationByDoctor[toDoctor(row).id] ?? '' })),
    [rows, specializationByDoctor]
  );

  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [gender, setGender] = useState('');
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Doctor | null>(null);

  const { submitting, save, remove } = useCrud(doctorsApi, 'doctor', list.refetch);

  const specializationOptions = useMemo(() => {
    return Array.from(new Set(Object.values(specializationByDoctor))).filter(Boolean).sort();
  }, [specializationByDoctor]);

  const filtered = useMemo(
    () =>
    doctors.filter(
      (doctor) =>
      matchesQuery(doctor.raw, query) && (
      !specialization || doctor.specialization === specialization) && (
      !gender || doctor.gender === gender)
    ),
    [doctors, query, specialization, gender]
  );

  const columns: Column<Doctor>[] = [
  {
    key: 'name',
    header: 'Doctor',
    render: (doctor) =>
    <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-2xs font-semibold text-brand-700">
            {initials(doctor.firstName, doctor.lastName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{doctor.fullName}</span>
            <span className="block text-2xs text-ink-soft">ID {orDash(doctor.id)}</span>
          </span>
        </span>

  },
  {
    key: 'specialization',
    header: 'Specialization',
    render: (doctor) => doctor.specialization ? <Badge tone="info">{humanise(doctor.specialization)}</Badge> : '—'
  },
  { key: 'license', header: 'License', render: (doctor) => orDash(doctor.licenseNumber), hideBelow: 'lg' },
  {
    key: 'experience',
    header: 'Experience',
    align: 'right',
    render: (doctor) => doctor.experience ? `${doctor.experience} yrs` : '—',
    hideBelow: 'md'
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    render: (doctor) =>
    doctor.rating ?
    <span className="inline-flex items-center justify-end gap-1 tabular">
            <StarIcon size={12} aria-hidden="true" className="text-brand-500" />
            {doctor.rating}
          </span> :

    '—',

    hideBelow: 'md'
  },
  { key: 'joined', header: 'Joined', render: (doctor) => formatDate(doctor.dateJoined), hideBelow: 'xl' },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    width: '110px',
    render: (doctor) =>
    <span className="flex justify-end gap-1">
          <button
        type="button"
        aria-label={`Edit ${doctor.fullName}`}
        onClick={(event) => {
          event.stopPropagation();
          setEditing(doctor);
          setFormOpen(true);
        }}
        className="rounded p-1.5 text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink">
        
            <PencilIcon size={14} aria-hidden="true" />
          </button>
          <button
        type="button"
        aria-label={`Delete ${doctor.fullName}`}
        onClick={(event) => {
          event.stopPropagation();
          setPendingDelete(doctor);
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
    gender: editing.gender,
    dob: editing.dob.slice(0, 10),
    dateJoined: editing.dateJoined.slice(0, 10),
    licenseNumber: editing.licenseNumber,
    experience: editing.experience,
  } :
  undefined;

  const handleSubmit = async (values: FormValues) => {
    const body = payloads.doctor(values);
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
          searchPlaceholder="Search doctors by name, license, ID…"
          filters={[
          {
            id: 'specialization',
            label: 'Specialization',
            value: specialization,
            options: specializationOptions,
            onChange: setSpecialization
          },
          { id: 'gender', label: 'Gender', value: gender, options: distinctValues(rows, doctorKeys.gender), onChange: setGender }]
          }
          resultLabel={list.loading ? undefined : `${filtered.length} of ${doctors.length}`}
          actionLabel="Add doctor"
          onAction={() => {
            setEditing(null);
            setFormOpen(true);
          }} />
        
        <DataTable
          caption="Registered doctors"
          columns={columns}
          rows={filtered}
          getRowKey={(doctor) => doctor.id || doctor.fullName}
          loading={list.loading}
          errorMessage={list.error ? friendlyMessage(list.error, 'doctors') : undefined}
          onRetry={list.refetch}
          onRowClick={setSelected}
          selectedKey={selected?.id}
          emptyTitle={doctors.length === 0 ? 'No doctors returned by the backend' : 'No doctors match these filters'}
          emptyHint={
          doctors.length === 0 ?
          'The request succeeded but the DOCTOR table returned no rows.' :
          'Clear the search or filters to see all records.'
          } />
        
      </Panel>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.fullName ?? ''}
        subtitle={selected ? `Doctor ID ${orDash(selected.id)}` : undefined}
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
            { label: 'Gender', value: formatGender(selected.gender) },
            { label: 'Date of birth', value: formatDate(selected.dob) },
            { label: 'Date joined', value: formatDate(selected.dateJoined) },
            { label: 'License number', value: orDash(selected.licenseNumber) },
            { label: 'Experience', value: selected.experience ? `${selected.experience} years` : '—' },
            { label: 'Rating', value: orDash(selected.rating) }]
            } />
          
            <RelatedCollection
            title="Specializations"
            subject="specializations"
            dependency={selected.id}
            loader={() => doctorsApi.specializations(selected.id)} />
          
            <RelatedCollection
            title="Qualifications"
            subject="qualifications"
            dependency={selected.id}
            loader={() => doctorsApi.qualifications(selected.id)} />
          
            <RelatedCollection
            title="Ratings"
            subject="ratings"
            dependency={selected.id}
            loader={() => doctorsApi.ratings(selected.id)} />
          
            <RelatedCollection
            title="Phone numbers"
            subject="phone numbers"
            dependency={selected.id}
            loader={() => doctorsApi.phones(selected.id)} />
          
            <RelatedCollection
            title="Associated hospitals"
            subject="hospital affiliations"
            dependency={selected.id}
            loader={() => doctorsApi.hospitals(selected.id)} />
          
          </> :
        null}
      </DetailDrawer>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit doctor' : 'Add doctor'}
        description={editing ? `Updating doctor ${orDash(editing.id)}` : 'Creates a new row in the DOCTOR table'}>
        
        <EntityForm
          fields={fields}
          initialValues={initialValues}
          submitLabel={editing ? 'Save changes' : 'Create doctor'}
          submitting={submitting}
          note="Specializations are managed separately in the DOCTOR_SPECIALIZATION relation and are not sent with this doctor payload."
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }} />
        
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete doctor"
        message={`This permanently removes ${pendingDelete?.fullName ?? 'this doctor'} and may be rejected if consultations reference them.`}
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
