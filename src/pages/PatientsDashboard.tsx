import { useState } from "react";
import { useQueue } from "@/contexts/QueueContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Search, Hash, Clock, PhoneCall, CheckCircle2, Heart, CalendarClock } from "lucide-react";

const PatientsDashboard = () => {
  const { findPatientByPhone, getPatientPosition, getPatientETA } = useQueue();
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);

  const patient = searched ? findPatientByPhone(phone) : undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const position = patient ? getPatientPosition(patient.id) : -1;
  const eta = patient ? getPatientETA(patient.id) : 0;
  const isCalled = patient?.status === "called";
  const isDone = patient?.status === "done";

  const consultationMinutes = isDone && patient?.calledAt && patient?.doneAt
    ? Math.max(1, Math.round((patient.doneAt - patient.calledAt) / 60000))
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-soft">
            <Search className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Check Your Status</h1>
          <p className="mt-2 text-muted-foreground">Enter your phone number to see your queue position</p>
        </div>

        <Card className="mb-6 shadow-soft">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="phone-lookup">Phone Number</Label>
                <Input
                  id="phone-lookup"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setSearched(false); }}
                  required
                />
              </div>
              <Button type="submit" className="mt-8 gradient-primary text-primary-foreground">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && !patient && (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No active appointment found for this phone number</p>
            </CardContent>
          </Card>
        )}

        {patient && isCalled && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 rounded-2xl gradient-primary p-6 text-center text-primary-foreground shadow-soft"
          >
            <PhoneCall className="mx-auto mb-3 h-10 w-10 animate-pulse" />
            <h2 className="text-2xl font-bold">It's Your Turn!</h2>
            <p className="mt-1 opacity-90">Please proceed to the doctor's office</p>
          </motion.div>
        )}

        {patient && isDone && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="shadow-soft border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <CardTitle>Visit Completed</CardTitle>
                <CardDescription>Thank you, {patient.name}!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {consultationMinutes > 0 && (
                  <div className="rounded-xl bg-accent p-4 text-center">
                    <Clock className="mx-auto mb-1 h-5 w-5 text-accent-foreground" />
                    <p className="text-2xl font-bold text-foreground">{consultationMinutes} min</p>
                    <p className="text-xs text-muted-foreground">Consultation Duration</p>
                  </div>
                )}
                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-center">
                  <Heart className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="font-medium text-foreground">Get well soon! 💐</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Wishing you a speedy recovery and good health!
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-accent p-4">
                  <CalendarClock className="h-5 w-5 shrink-0 text-accent-foreground" />
                  <p className="text-sm text-foreground">
                    Please schedule a <span className="font-semibold">follow-up visit within 3 weeks</span> for a check-up.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {patient && !isCalled && !isDone && (
          <Card className="shadow-soft">
            <CardHeader className="text-center">
              <CardTitle>{patient.name}</CardTitle>
              <CardDescription>{patient.reason}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-accent p-4 text-center">
                  <Hash className="mx-auto mb-1 h-5 w-5 text-accent-foreground" />
                  <p className="text-3xl font-bold text-foreground">{position}</p>
                  <p className="text-xs text-muted-foreground">Queue Position</p>
                </div>
                <div className="rounded-xl bg-accent p-4 text-center">
                  <Clock className="mx-auto mb-1 h-5 w-5 text-accent-foreground" />
                  <p className="text-3xl font-bold text-foreground">~{eta}</p>
                  <p className="text-xs text-muted-foreground">Minutes ETA</p>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Re-search to refresh your status
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default PatientsDashboard;
