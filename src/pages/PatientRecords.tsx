import { useQueue } from "@/contexts/QueueContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const PatientRecords = () => {
  const { patients } = useQueue();

  // Show most recent first
  const sorted = [...patients].reverse();

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-soft">
            <ClipboardList className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Patient Records</h1>
          <p className="mt-2 text-muted-foreground">Complete history of all patient bookings</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Records</span>
              <Badge variant="secondary">{patients.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sorted.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No patient records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Booking Date</TableHead>
                      <TableHead>Booking Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Called At</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Consultation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((p, i) => {
                      const consultMins =
                        p.status === "done" && p.calledAt && p.doneAt
                          ? Math.max(1, Math.round((p.doneAt - p.calledAt) / 60000))
                          : null;

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{patients.length - i}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.phone}</TableCell>
                          <TableCell>{p.reason}</TableCell>
                          <TableCell>
                            <Badge variant={p.isFollowUp ? "outline" : "default"} className="text-xs">
                              {p.isFollowUp ? "Follow-up" : "First Visit"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(p.bookedAt)}</TableCell>
                          <TableCell>{formatTime(p.bookedAt)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.status === "done" ? "secondary" : p.status === "called" ? "default" : "outline"
                              }
                              className="text-xs"
                            >
                              {p.status === "done" ? "Visited" : p.status === "called" ? "In Consultation" : "Waiting"}
                            </Badge>
                          </TableCell>
                          <TableCell>{p.calledAt ? formatTime(p.calledAt) : "—"}</TableCell>
                          <TableCell>{p.doneAt ? formatTime(p.doneAt) : "—"}</TableCell>
                          <TableCell>
                            {consultMins ? `${consultMins} min` : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PatientRecords;
