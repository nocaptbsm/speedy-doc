import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  reason: string;
  bookedAt: number;
  calledAt?: number;
  doneAt?: number;
  status: "waiting" | "called" | "done";
  isFollowUp: boolean;
  visitNumber: number;
  doctorNotes?: string;
}

interface QueueContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, "id" | "bookedAt" | "status" | "isFollowUp" | "visitNumber">) => Patient;
  callNextPatient: () => Patient | null;
  callSpecificPatient: (id: string) => void;
  movePatient: (id: string, direction: "up" | "down") => void;
  markDone: (id: string, notes?: string) => void;
  getPatientPosition: (id: string) => number;
  getPatientETA: (id: string) => number;
  currentPatient: Patient | null;
  avgMinutesPerPatient: number;
  findPatientByPhone: (phone: string) => Patient | undefined;
  delayMinutes: number;
  setDelayMinutes: (minutes: number) => void;
  getVisitCount: (phone: string) => number;
}

const QueueContext = createContext<QueueContextType | null>(null);

const FIRST_VISIT_MINUTES = 10;
const FOLLOW_UP_MINUTES = 5;

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const stored = localStorage.getItem("clinic-queue");
    return stored ? JSON.parse(stored) : [];
  });
  const [delayMinutes, setDelayMinutes] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem("clinic-queue", JSON.stringify(patients));
  }, [patients]);

  const getVisitCount = useCallback((phone: string) => {
    return patients.filter((p) => p.phone === phone && p.status === "done").length;
  }, [patients]);

  const addPatient = useCallback((data: Omit<Patient, "id" | "bookedAt" | "status" | "isFollowUp" | "visitNumber">) => {
    const doneVisits = patients.filter((p) => p.phone === data.phone && p.status === "done").length;
    const hasVisitedBefore = doneVisits > 0;
    const newPatient: Patient = {
      ...data,
      id: crypto.randomUUID(),
      bookedAt: Date.now(),
      status: "waiting",
      isFollowUp: hasVisitedBefore,
      visitNumber: doneVisits + 1,
    };
    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  }, [patients]);

  const callNextPatient = useCallback(() => {
    let calledPatient: Patient | null = null;
    setPatients((prev) => {
      const nextIdx = prev.findIndex((p) => p.status === "waiting");
      if (nextIdx === -1) return prev;
      calledPatient = { ...prev[nextIdx], status: "called", calledAt: Date.now() };
      const updated = [...prev];
      updated[nextIdx] = calledPatient;
      return updated;
    });
    return calledPatient;
  }, []);

  const callSpecificPatient = useCallback((id: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "called" as const, calledAt: Date.now() } : p))
    );
  }, []);

  const movePatient = useCallback((id: string, direction: "up" | "down") => {
    setPatients((prev) => {
      const waitingIds = prev.filter((p) => p.status === "waiting").map((p) => p.id);
      const idx = waitingIds.indexOf(id);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= waitingIds.length) return prev;
      [waitingIds[idx], waitingIds[swapIdx]] = [waitingIds[swapIdx], waitingIds[idx]];
      // Rebuild: non-waiting stay in place, waiting reordered
      const nonWaiting = prev.filter((p) => p.status !== "waiting");
      const waitingMap = new Map(prev.filter((p) => p.status === "waiting").map((p) => [p.id, p]));
      const reorderedWaiting = waitingIds.map((wid) => waitingMap.get(wid)!);
      // Merge back preserving original interleaving positions
      const result: Patient[] = [];
      let wi = 0;
      for (const p of prev) {
        if (p.status === "waiting") {
          result.push(reorderedWaiting[wi++]);
        } else {
          result.push(p);
        }
      }
      return result;
    });
  }, []);

  const markDone = useCallback((id: string, notes?: string) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status: "done", doneAt: Date.now(), doctorNotes: notes || p.doctorNotes } : p)));
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

  return (
    <QueueContext.Provider
      value={{ patients, addPatient, callNextPatient, callSpecificPatient, movePatient, markDone, getPatientPosition, getPatientETA, currentPatient, avgMinutesPerPatient: FIRST_VISIT_MINUTES, findPatientByPhone, delayMinutes, setDelayMinutes, getVisitCount }}
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
