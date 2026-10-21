import type { FormValues } from '../../components/ui/EntityForm';
import type { Row } from '../../types/entities';

const number = (value: string): number => Number(value);

export const payloads = {
  patient: (v: FormValues): Row => ({ firstName: v.firstName, lastName: v.lastName, dob: v.dob, gender: v.gender, city: v.city, area: v.area, pincode: v.pincode }),
  doctor: (v: FormValues): Row => ({ firstName: v.firstName, lastName: v.lastName, dob: v.dob, gender: v.gender, dateJoined: v.dateJoined || null, licenseNumber: v.licenseNumber, experience: v.experience ? number(v.experience) : null }),
  hospital: (v: FormValues): Row => ({ hospitalName: v.hospitalName, street: v.street || null, area: v.area || null, city: v.city, pincode: v.pincode || null }),
  consultation: (v: FormValues): Row => ({ patientId: number(v.patientId), doctorId: number(v.doctorId), bookingDate: v.bookingDate || null, date: v.date, startTime: v.startTime || null, endTime: v.endTime || null, status: v.status || null, consultationMode: v.consultationMode, videoLink: v.videoLink || null, callNumber: v.callNumber || null, chatTranscriptId: v.chatTranscriptId || null }),
  prescription: (v: FormValues): Row => ({ consultationId: number(v.consultationId), prescriptionDate: v.prescriptionDate, dosage: v.dosage || null }),
  medicine: (v: FormValues): Row => ({ medicineName: v.medicineName, medicineType: v.medicineType }),
  test: (v: FormValues): Row => ({ testName: v.testName, testType: v.testType }),
  payment: (v: FormValues): Row => ({ consultationId: number(v.consultationId), amount: number(v.amount), paidBy: v.paidBy })
};
