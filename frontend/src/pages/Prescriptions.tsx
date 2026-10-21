import React, { useMemo, useState } from 'react';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import type { Prescription, Row } from '../types/entities';
import { useResource } from '../hooks/useResource';
import { useCrud } from '../hooks/useCrud';
import { prescriptionsApi } from '../utils/api/prescriptions';
import { consultationsApi } from '../utils/api/consultations';
import { friendlyMessage } from '../utils/api/client';
import { toConsultation, toPrescription } from '../utils/entities';
import { matchesQuery } from '../utils/fields';
import { payloads } from '../utils/api/payloads';
import { formatDate, orDash } from '../utils/format';
import { DetailList, Panel } from '../components/ui/Panel';
import { Toolbar } from '../components/ui/Toolbar';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EntityForm } from '../components/ui/EntityForm';
import type { FieldDef, FormValues } from '../components/ui/EntityForm';
import { DetailDrawer } from '../components/DetailDrawer';
import { RelatedCollection } from '../components/RelatedCollection';

export function PrescriptionsPage() {
  const list = useResource<Row[]>(() => prescriptionsApi.list(), []);
  const consultationList = useResource<Row[]>(() => consultationsApi.list(), []);

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const prescriptions = useMemo(() => rows.map(toPrescription), [rows]);
  const consultations = useMemo(() => (consultationList.data ?? []).map(toConsultation), [consultationList.data]);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Prescription | null>(null);

  const { submitting, save, remove } = useCrud(prescriptionsApi, 'prescription', list.refetch);

  const consultationLabel = useMemo(() => {
    const map: Record<string, string> = {};
    consultations.forEach((consultation) => {
      const who = consultation.patientName || (consultation.patientId ? `Patient #${consultation.patientId}` : '');
      map[consultation.id] = who ? `#${consultation.id} · ${who}` : `#${consultation.id}`;
    });
    return map;
  }, [consultations]);

  /** ⚠️ VERIFY against the PRESCRIPTION request DTO. */
  const fields: FieldDef[] = useMemo(
    () => [
    {
      name: 'consultationId',
      label: 'Consultation',
      type: consultations.length > 0 ? 'select' : 'text',
      required: true,
      options: consultations.length > 0 ? consultations.map((consultation) => consultation.id) : undefined,
      optionLabels: consultationLabel,
      hint: consultations.length === 0 ? 'Consultation list unavailable — enter the CONSULTATION_ID directly.' : undefined
    },
    { name: 'prescriptionDate', label: 'Prescription date', type: 'date', required: true },
    { name: 'dosage', label: 'Dosage', type: 'textarea', full: true, placeholder: 'e.g. 1 tablet twice daily after meals' }],

    [consultations, consultationLabel]
  );

  const filtered = useMemo(
    () => prescriptions.filter((prescription) => matchesQuery(prescription.raw, query)),
    [prescriptions, query]
  );

  const columns: Column<Prescription>[] = [
  {
    key: 'id',
    header: 'ID',
    width: '72px',
    render: (prescription) => <span className="font-mono text-xs text-ink-muted">{orDash(prescription.id)}</span>
  },
  {
    key: 'consultation',
    header: 'Consultation',
    render: (prescription) =>
    <span className="font-medium text-ink">
          {consultationLabel[prescription.consultationId] ?? (prescription.consultationId ? `#${prescription.consultationId}` : '—')}
        </span>

  },
  { key: 'date', header: 'Prescription date', render: (prescription) => formatDate(prescription.prescriptionDate) },
  {
    key: 'dosage',
    header: 'Dosage',
    render: (prescription) =>
    <span className="block max-w-[280px] truncate text-ink-muted">{orDash(prescription.dosage)}</span>,

    hideBelow: 'md'
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    width: '110px',
    render: (prescription) =>
    <span className="flex justify-end gap-1">
          <button
        type="button"
        aria-label={`Edit prescription ${prescription.id}`}
        onClick={(event) => {
          event.stopPropagation();
          setEditing(prescription);
          setFormOpen(true);
        }}
        className="rounded p-1.5 text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink">
        
            <PencilIcon size={14} aria-hidden="true" />
          </button>
          <button
        type="button"
        aria-label={`Delete prescription ${prescription.id}`}
        onClick={(event) => {
          event.stopPropagation();
          setPendingDelete(prescription);
        }}
        className="rounded p-1.5 text-ink-soft transition-colors duration-150 hover:bg-status-badbg hover:text-status-bad">
        
            <Trash2Icon size={14} aria-hidden="true" />
          </button>
        </span>

  }];


  const handleSubmit = async (values: FormValues) => {
    const body = payloads.prescription(values);
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
          searchPlaceholder="Search prescriptions by ID, consultation, dosage…"
          resultLabel={list.loading ? undefined : `${filtered.length} of ${prescriptions.length}`}
          actionLabel="Add prescription"
          onAction={() => {
            setEditing(null);
            setFormOpen(true);
          }} />
        
        <DataTable
          caption="Issued prescriptions"
          columns={columns}
          rows={filtered}
          getRowKey={(prescription) => prescription.id}
          loading={list.loading}
          errorMessage={list.error ? friendlyMessage(list.error, 'prescriptions') : undefined}
          onRetry={list.refetch}
          onRowClick={setSelected}
          selectedKey={selected?.id}
          emptyTitle={prescriptions.length === 0 ? 'No prescriptions returned by the backend' : 'No prescriptions match this search'}
          emptyHint={
          prescriptions.length === 0 ?
          'The request succeeded but the PRESCRIPTION table returned no rows.' :
          'Clear the search to see all records.'
          } />
        
      </Panel>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Prescription #${orDash(selected.id)}` : ''}
        subtitle={selected ? consultationLabel[selected.consultationId] ?? `Consultation #${orDash(selected.consultationId)}` : undefined}
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
            { label: 'Consultation ID', value: orDash(selected.consultationId) },
            { label: 'Prescription date', value: formatDate(selected.prescriptionDate) },
            { label: 'Dosage', value: orDash(selected.dosage) }]
            } />
          
            <RelatedCollection
            title="Prescribed medicines"
            subject="medicines"
            dependency={selected.id}
            loader={() => prescriptionsApi.medicines(selected.id)}
            emptyTitle="No medicines on this prescription" />
          
            <RelatedCollection
            title="Ordered tests"
            subject="tests"
            dependency={selected.id}
            loader={() => prescriptionsApi.tests(selected.id)}
            emptyTitle="No tests on this prescription" />
          
          </> :
        null}
      </DetailDrawer>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit prescription' : 'Add prescription'}
        description={editing ? `Updating prescription ${orDash(editing.id)}` : 'Creates a new row in the PRESCRIPTION table'}>
        
        <EntityForm
          fields={fields}
          initialValues={
          editing ?
          {
            consultationId: editing.consultationId,
            prescriptionDate: editing.prescriptionDate.slice(0, 10),
            dosage: editing.dosage
          } :
          undefined
          }
          submitLabel={editing ? 'Save changes' : 'Create prescription'}
          submitting={submitting}
          note="Medicines and tests are stored as separate prescription-medicine and prescription-test associations."
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }} />
        
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete prescription"
        message={`This permanently removes prescription #${pendingDelete?.id ?? ''} and its linked medicine and test rows may block deletion.`}
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
