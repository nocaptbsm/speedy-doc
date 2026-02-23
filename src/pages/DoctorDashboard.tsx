import { useQueue } from "@/contexts/QueueContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, UserCheck, Users, Clock, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const DoctorDashboard = () => {
  const { patients, callNextPatient, markDone, currentPatient, avgMinutesPerPatient } = useQueue();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const doneToday = patients.filter((p) => p.status === "done").length;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Doctor Dashboard</h1>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{waitingPatients.length}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">~{waitingPatients.length * avgMinutesPerPatient}m</p>
              <p className="text-xs text-muted-foreground">Total Wait</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{doneToday}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        {/* Current Patient */}
        {currentPatient && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="mb-6 border-primary/30 shadow-soft">
              <CardHeader className="pb-3">
                <CardDescription>Currently Seeing</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-primary" />
                  {currentPatient.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{currentPatient.reason}</span>
                <Button size="sm" variant="outline" onClick={() => markDone(currentPatient.id)}>
                  <UserCheck className="mr-2 h-4 w-4" /> Mark Done
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Call Next */}
        <Button
          className="mb-6 w-full gradient-primary text-primary-foreground"
          size="lg"
          disabled={waitingPatients.length === 0}
          onClick={callNextPatient}
        >
          <PhoneCall className="mr-2 h-5 w-5" />
          Call Next Patient
          {waitingPatients.length > 0 && ` (${waitingPatients[0].name})`}
        </Button>

        {/* Waiting List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Waiting List</CardTitle>
            <CardDescription>{waitingPatients.length} patients waiting</CardDescription>
          </CardHeader>
          <CardContent>
            {waitingPatients.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No patients in queue</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {waitingPatients.map((patient, idx) => (
                    <motion.div
                      key={patient.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.reason}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ~{(idx + (currentPatient ? 1 : 0)) * avgMinutesPerPatient}m
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DoctorDashboard;
