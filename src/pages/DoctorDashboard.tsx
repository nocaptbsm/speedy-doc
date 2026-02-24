import { useQueue } from "@/contexts/QueueContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, UserCheck, Users, Clock, CheckCircle2, ArrowUp, ArrowDown, Lock, TimerReset, Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";

const VALID_CREDENTIALS = [
  { id: "1234", password: "1234" },
  { id: "DRSK", password: "Sandeep1234" },
];

const DoctorDashboard = () => {
  const { patients, callNextPatient, callSpecificPatient, movePatient, markDone, currentPatient, avgMinutesPerPatient, delayMinutes, setDelayMinutes } = useQueue();
  const [, setTick] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_CREDENTIALS.some((c) => c.id === doctorId && c.password === password)) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid ID or password");
    }
  };

  const handleMarkDone = (patientId: string) => {
    markDone(patientId, notesMap[patientId] || "");
    setNotesMap((prev) => {
      const next = { ...prev };
      delete next[patientId];
      return next;
    });
  };

  const calledPatients = patients.filter((p) => p.status === "called");

  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const doneToday = patients.filter((p) => p.status === "done").length;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full max-w-sm shadow-soft">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Doctor Login</CardTitle>
              <CardDescription>Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorId">Doctor ID</Label>
                  <Input id="doctorId" placeholder="Enter your ID" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Login</Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
              <p className="text-2xl font-bold text-foreground">~{waitingPatients.length * avgMinutesPerPatient + delayMinutes}m</p>
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

        {/* Delay Control */}
        <Card className="mb-6 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TimerReset className="h-5 w-5 text-primary" />
              Delay All Visits
            </CardTitle>
            <CardDescription>Add extra wait time for all patients (e.g., emergency delay)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                disabled={delayMinutes <= 0}
                onClick={() => setDelayMinutes(Math.max(0, delayMinutes - 5))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 rounded-lg bg-accent px-4 py-2 text-center">
                <span className="text-2xl font-bold text-foreground">{delayMinutes}</span>
                <span className="ml-1 text-sm text-muted-foreground">min delay</span>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                onClick={() => setDelayMinutes(delayMinutes + 5)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {delayMinutes > 0 && (
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs text-muted-foreground" onClick={() => setDelayMinutes(0)}>
                Reset delay to 0
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Called Patients */}
        {calledPatients.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Currently Seeing ({calledPatients.length})</h2>
            <AnimatePresence>
              {calledPatients.map((cp) => (
                <motion.div key={cp.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="border-primary/30 shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <PhoneCall className="h-5 w-5 text-primary" />
                        {cp.name}
                      </CardTitle>
                      <CardDescription>
                        {cp.reason} • {cp.isFollowUp ? `Follow-up (Visit #${cp.visitNumber})` : "First Visit"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Doctor Notes</Label>
                        <Textarea
                          placeholder="Add notes about this patient's visit..."
                          value={notesMap[cp.id] || ""}
                          onChange={(e) => setNotesMap((prev) => ({ ...prev, [cp.id]: e.target.value }))}
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleMarkDone(cp.id)} className="w-full">
                        <UserCheck className="mr-2 h-4 w-4" /> Mark Done
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
          {waitingPatients.length > 0 && ` (${waitingPatients[0].patientId || waitingPatients[0].name})`}
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
                          <p className="font-medium text-foreground">{patient.patientId || "—"} <span className="text-muted-foreground font-normal">— {patient.name}</span></p>
                          <p className="text-xs text-muted-foreground">
                            {patient.reason} • {patient.isFollowUp ? `Follow-up #${patient.visitNumber}` : "First Visit"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => movePatient(patient.id, "up")}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === waitingPatients.length - 1} onClick={() => movePatient(patient.id, "down")}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => callSpecificPatient(patient.id)}>
                          <PhoneCall className="mr-1 h-3 w-3" /> Call
                        </Button>
                        <span className="ml-1 text-sm text-muted-foreground">
                          ~{(idx + calledPatients.length) * avgMinutesPerPatient + delayMinutes}m
                        </span>
                      </div>
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
