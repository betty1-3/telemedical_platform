import React from "react";
import { Building2Icon, CalendarClockIcon, CreditCardIcon, FileTextIcon, StethoscopeIcon, UsersIcon, BoxIcon } from "lucide-react";
import { Row } from "../../types/entities";
import { pickNumber } from "../../utils/fields";
import { formatCurrency, formatNumber } from "../../utils/format";
import { friendlyMessage } from "../../utils/api/client";
import { ErrorState } from "../ui/StateBlock";
/**
 * ⚠️ VERIFY: key candidates for GET /api/dashboard/summary. Reads are
 * case/underscore-insensitive, so TOTAL_PATIENTS, total_patients and
 * totalPatients all resolve. Add your DTO's name to a list if it differs.
 */
const metrics: Array<{
  label: string;
  keys: string[];
  icon: BoxIcon;
}> = [{
  label: 'Patients',
  keys: ['totalPatients'],
  icon: UsersIcon
}, {
  label: 'Doctors',
  keys: ['totalDoctors'],
  icon: StethoscopeIcon
}, {
  label: 'Hospitals',
  keys: ['totalHospitals'],
  icon: Building2Icon
}, {
  label: 'Consultations',
  keys: ['totalConsultations'],
  icon: CalendarClockIcon
}, {
  label: 'Prescriptions',
  keys: ['totalPrescriptions'],
  icon: FileTextIcon
}, {
  label: 'Payments',
  keys: ['totalPayments'],
  icon: CreditCardIcon
}];
const revenueKeys = ['totalRevenue'];
interface SummaryCardsProps {
  data: Row | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}
export function SummaryCards({
  data,
  loading,
  error,
  onRetry
}: SummaryCardsProps) {
  if (error) {
    return <div className="rounded-lg border border-line bg-white shadow-panel">
        <ErrorState message={friendlyMessage(error, 'the dashboard summary')} onRetry={onRetry} />
      </div>;
  }
  const revenue = pickNumber(data, revenueKeys);
  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
      <section className="rounded-lg border border-brand-800 bg-brand-900 p-5 text-white lg:row-span-2 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-brand-200">Total revenue</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular">
            {loading ? <span className="inline-block h-8 w-36 animate-pulse rounded bg-white/15" /> : formatCurrency(revenue)}
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-brand-200">
          Settled across all recorded payments returned by the dashboard summary endpoint.
        </p>
      </section>

      {metrics.map((metric, index) => {
      const value = pickNumber(data, metric.keys);
      const cardColours = ['bg-pastel-yellow', 'bg-pastel-pink', 'bg-pastel-lavender', 'bg-pastel-olive', 'bg-pastel-blue', 'bg-white'];
      return <section key={metric.label} className={`rounded-lg border border-line p-4 shadow-panel ${cardColours[index]}`}>
            <div className="flex items-center justify-between">
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-soft">{metric.label}</p>
              <metric.icon size={15} aria-hidden="true" className="text-brand-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular">
              {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-canvas" /> : formatNumber(value)}
            </p>
          </section>;
    })}
    </div>;
}
