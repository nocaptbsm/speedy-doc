import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  reason: string;
  age?: number;
  height?: number;
  weight?: number;
  bookedAt: number;
  calledAt?: number;
  doneAt?: number;
  status: "waiting" | "called" | "done";
  isFollowUp: boolean;
  visitNumber: number;
  doctorNotes?: string;
  position_order?: number;
}

interface QueueContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, "id" | "patientId" | "bookedAt" | "status" | "isFollowUp" | "visitNumber">, reusePatientId?: string) => Patient;
  callNextPatient: () => Patient | null;
  callSpecificPatient: (id: string) => void;
  movePatient: (id: string, direction: "up" | "down") => void;
  markDone: (id: string, notes?: string) => void;
  getPatientPosition: (id: string) => number;
  getPatientETA: (id: string) => number;
  currentPatient: Patient | null;
  avgMinutesPerPatient: number;
  findPatientByPhone: (phone: string) => Patient | undefined;
  findPatientByPatientId: (patientId: string) => Patient | undefined;
  delayMinutes: number;
  setDelayMinutes: (minutes: number) => void;
  getVisitCount: (phone: string) => number;
  bookingOpen: boolean;
  setBookingOpen: (open: boolean) => void;
  deletePatient: (id: string) => void;
  deleteAllPatients: () => void;
  maxBookingsPerDay: number;
  setMaxBookingsPerDay: (limit: number) => void;
  getTodayBookingCount: () => number;
  isWhatsAppEnabled: boolean;
  setIsWhatsAppEnabled: (enabled: boolean) => void;
}

const QueueContext = createContext<QueueContextType | null>(null);

const FIRST_VISIT_MINUTES = 10;
const FOLLOW_UP_MINUTES = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbToPatient = (row: any): Patient => ({
  id: row.id,
  patientId: row.patient_id,
  name: row.name,
  phone: row.phone,
  reason: row.reason,
  age: row.age,
  height: row.height,
  weight: row.weight,
  bookedAt: Number(row.booked_at),
  calledAt: row.called_at ? Number(row.called_at) : undefined,
  doneAt: row.done_at ? Number(row.done_at) : undefined,
  status: row.status,
  isFollowUp: row.is_follow_up,
  visitNumber: row.visit_number,
  doctorNotes: row.doctor_notes,
  position_order: row.position_order
});

const patientToDb = (p: Partial<Patient> & { id?: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = {};
  if (p.id) obj.id = p.id;
  if (p.patientId) obj.patient_id = p.patientId;
  if (p.name) obj.name = p.name;
  if (p.phone) obj.phone = p.phone;
  if (p.reason) obj.reason = p.reason;
  if (p.age !== undefined) obj.age = p.age;
  if (p.height !== undefined) obj.height = p.height;
  if (p.weight !== undefined) obj.weight = p.weight;
  if (p.bookedAt) obj.booked_at = p.bookedAt;
  if (p.calledAt !== undefined) obj.called_at = p.calledAt;
  if (p.doneAt !== undefined) obj.done_at = p.doneAt;
  if (p.status) obj.status = p.status;
  if (p.isFollowUp !== undefined) obj.is_follow_up = p.isFollowUp;
  if (p.visitNumber !== undefined) obj.visit_number = p.visitNumber;
  if (p.doctorNotes !== undefined) obj.doctor_notes = p.doctorNotes;
  if (p.position_order !== undefined) obj.position_order = p.position_order;
  return obj;
};

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [delayMinutes, setDelayMinutesState] = useState<number>(0);
  const [bookingOpen, setBookingOpenState] = useState<boolean>(true);
  const [maxBookingsPerDay, setMaxBookingsPerDayState] = useState<number>(0);
  const [isWhatsAppEnabled, setIsWhatsAppEnabledState] = useState<boolean>(true);

  const fetchState = useCallback(async () => {
    // Migration logic
    const oldQueue = localStorage.getItem("clinic-queue");
    if (oldQueue) {
      try {
        const parsed = JSON.parse(oldQueue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if we already have patients
          const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
          if (count === 0) {
            // Migrate
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const toInsert = parsed.map((p: any) => patientToDb(p));
            await supabase.from('patients').insert(toInsert);
          }
        }
      } catch (e) {
        console.error("Migration error", e);
      } finally {
        localStorage.removeItem("clinic-queue");
      }
    }
    const oldSettings = localStorage.getItem("clinic-max-bookings");
    if (oldSettings) {
      localStorage.removeItem("clinic-max-bookings");
    }

    const { data: dbPatients } = await supabase.from('patients').select('*').order('position_order', { ascending: true });
    if (dbPatients) {
      setPatients(dbPatients.map(dbToPatient));
    }
    const { data: settings } = await supabase.from('clinic_settings').select('*').eq('id', 1).single();
    if (settings) {
      setDelayMinutesState(settings.delay_minutes);
      setBookingOpenState(settings.booking_open);
      setMaxBookingsPerDayState(settings.max_bookings_per_day);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const sub1 = supabase.channel('patients_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchState();
      }).subscribe();

    const sub2 = supabase.channel('settings_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_settings' }, () => {
        fetchState();
      }).subscribe();

    return () => {
      supabase.removeChannel(sub1);
      supabase.removeChannel(sub2);
    };
  }, [fetchState]);

  const setDelayMinutes = useCallback(async (minutes: number) => {
    setDelayMinutesState(minutes);
    await supabase.from('clinic_settings').update({ delay_minutes: minutes }).eq('id', 1);
  }, []);

  const setBookingOpen = useCallback(async (open: boolean) => {
    setBookingOpenState(open);
    await supabase.from('clinic_settings').update({ booking_open: open }).eq('id', 1);
  }, []);

  const setMaxBookingsPerDay = useCallback(async (limit: number) => {
    setMaxBookingsPerDayState(limit);
    await supabase.from('clinic_settings').update({ max_bookings_per_day: limit }).eq('id', 1);
  }, []);

  const setIsWhatsAppEnabled = useCallback((enabled: boolean) => {
    setIsWhatsAppEnabledState(enabled);
    localStorage.setItem('clinic-whatsapp-enabled', JSON.stringify(enabled));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('clinic-whatsapp-enabled');
    if (stored) {
      setIsWhatsAppEnabledState(JSON.parse(stored));
    }
  }, []);

  const sendWhatsAppNotification = useCallback((patient: Patient) => {
    if (!isWhatsAppEnabled || !patient.phone) return;

    // Clean phone number (remove non-digits). Ensure it has a country code, assuming India (+91) if 10 digits.
    let cleanPhone = patient.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const message = `Hello ${patient.name}, the doctor is ready to see you now. Please proceed to the clinic room.`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // Open in a new window/tab
    window.open(url, '_blank');
  }, [isWhatsAppEnabled]);

  const getTodayBookingCount = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 86400000;
    return patients.filter((p) => p.bookedAt >= todayStart && p.bookedAt < todayEnd).length;
  }, [patients]);


  const getVisitCount = useCallback((phone: string) => {
    return patients.filter((p) => p.phone === phone && p.status === "done").length;
  }, [patients]);

  const generatePatientId = useCallback(() => {
    const count = patients.length + 1;
    return `MQ-${String(count).padStart(3, "0")}`;
  }, [patients]);

  const addPatient = useCallback((data: Omit<Patient, "id" | "patientId" | "bookedAt" | "status" | "isFollowUp" | "visitNumber">, reusePatientId?: string) => {
    const doneVisits = patients.filter((p) => p.phone === data.phone && p.status === "done").length;
    const hasVisitedBefore = doneVisits > 0;
    const maxOrder = patients.length > 0 ? Math.max(...patients.map(p => p.position_order || 0)) : 0;
    const newPatient: Patient = {
      ...data,
      id: crypto.randomUUID(),
      patientId: reusePatientId || generatePatientId(),
      bookedAt: Date.now(),
      status: "waiting",
      isFollowUp: hasVisitedBefore || !!reusePatientId,
      visitNumber: doneVisits + 1,
      position_order: maxOrder + 1,
    };

    setPatients((prev) => [...prev, newPatient]);
    supabase.from('patients').insert(patientToDb(newPatient)).then();
    return newPatient;
  }, [patients, generatePatientId]);

  const callNextPatient = useCallback(() => {
    let calledPatient: Patient | null = null;
    const nextIdx = patients.findIndex((p) => p.status === "waiting");
    if (nextIdx === -1) return null;

    calledPatient = { ...patients[nextIdx], status: "called", calledAt: Date.now() };

    setPatients((prev) => {
      const updated = [...prev];
      updated[nextIdx] = calledPatient!;
      return updated;
    });

    supabase.from('patients').update({ status: 'called', called_at: calledPatient.calledAt }).eq('id', calledPatient.id).then();

    sendWhatsAppNotification(calledPatient);

    return calledPatient;
  }, [patients, sendWhatsAppNotification]);

  const callSpecificPatient = useCallback((id: string) => {
    const now = Date.now();
    let patientToCall: Patient | null = null;
    setPatients((prev) => {
      const p = prev.find(p => p.id === id);
      if (p) patientToCall = { ...p, status: "called", calledAt: now };
      return prev.map((p) => (p.id === id ? patientToCall! : p));
    });

    supabase.from('patients').update({ status: 'called', called_at: now }).eq('id', id).then();

    // We wrap this in a setTimeout because state might still be updating
    setTimeout(() => {
      if (patientToCall) sendWhatsAppNotification(patientToCall);
    }, 100);
  }, [sendWhatsAppNotification]);

  const movePatient = useCallback((id: string, direction: "up" | "down") => {
    const waitingPatients = patients.filter((p) => p.status === "waiting");
    const idx = waitingPatients.findIndex(p => p.id === id);
    if (idx === -1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= waitingPatients.length) return;

    const p1 = waitingPatients[idx];
    const p2 = waitingPatients[swapIdx];

    const p1Order = p1.position_order || 0;
    const p2Order = p2.position_order || 0;

    setPatients(prev => {
      return prev.map(p => {
        if (p.id === p1.id) return { ...p, position_order: p2Order };
        if (p.id === p2.id) return { ...p, position_order: p1Order };
        return p;
      }).sort((a, b) => (a.position_order || 0) - (b.position_order || 0));
    });

    supabase.from('patients').update({ position_order: p2Order }).eq('id', p1.id).then();
    supabase.from('patients').update({ position_order: p1Order }).eq('id', p2.id).then();
  }, [patients]);

  const markDone = useCallback((id: string, notes?: string) => {
    const now = Date.now();
    setPatients((prev) => prev.map((p) => {
      if (p.id === id) {
        return { ...p, status: "done", doneAt: now, doctorNotes: notes || p.doctorNotes };
      }
      return p;
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status: 'done', done_at: now };
    if (notes) updateData.doctor_notes = notes;

    supabase.from('patients').update(updateData).eq('id', id).then();
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    supabase.from('patients').delete().eq('id', id).then();
  }, []);

  const deleteAllPatients = useCallback(() => {
    setPatients([]);
    // Delete all patients
    supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000').then();
  }, []);

  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const calledPatients = patients.filter((p) => p.status === "called");
  const currentPatient = calledPatients[0] || null;

  const getPatientPosition = useCallback(
    (id: string) => {
      const idx = waitingPatients.findIndex((p) => p.id === id);
      if (idx === -1) return -1;
      return idx + 1 + (currentPatient ? 1 : 0);
    },
    [waitingPatients, currentPatient]
  );

  const getPatientETA = useCallback(
    (id: string) => {
      const idx = waitingPatients.findIndex((p) => p.id === id);
      if (idx === -1) return 0;
      let eta = delayMinutes;
      for (const cp of calledPatients) {
        eta += cp.isFollowUp ? FOLLOW_UP_MINUTES : FIRST_VISIT_MINUTES;
      }
      for (let i = 0; i < idx; i++) {
        eta += waitingPatients[i].isFollowUp ? FOLLOW_UP_MINUTES : FIRST_VISIT_MINUTES;
      }
      return eta;
    },
    [waitingPatients, calledPatients, delayMinutes]
  );

  const findPatientByPhone = useCallback(
    (phone: string) => patients.find((p) => p.phone === phone),
    [patients]
  );

  const findPatientByPatientId = useCallback(
    (patientId: string) => patients.find((p) => p.patientId === patientId),
    [patients]
  );

  return (
    <QueueContext.Provider
      value={{ patients, addPatient, callNextPatient, callSpecificPatient, movePatient, markDone, getPatientPosition, getPatientETA, currentPatient, avgMinutesPerPatient: FIRST_VISIT_MINUTES, findPatientByPhone, findPatientByPatientId, delayMinutes, setDelayMinutes, getVisitCount, bookingOpen, setBookingOpen, deletePatient, deleteAllPatients, maxBookingsPerDay, setMaxBookingsPerDay, getTodayBookingCount, isWhatsAppEnabled, setIsWhatsAppEnabled }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue must be used within QueueProvider");
  return ctx;
};
