import { useQueue } from "@/contexts/QueueContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ClipboardList, Printer } from "lucide-react";

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

  const sorted = [...patients].reverse();

  // Count visits per phone number up to each record
  const getVisitNumber = (patient: typeof patients[0], index: number) => {
    const allPatients = [...patients];
    const patientIndex = patients.length - 1 - index;
    let count = 0;
    for (let i = 0; i <= patientIndex; i++) {
      if (allPatients[i].phone === patient.phone) count++;
    }
    return count;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = sorted
      .map((p, i) => {
        const visitNum = getVisitNumber(p, i);
        const consultMins =
          p.status === "done" && p.calledAt && p.doneAt
            ? Math.max(1, Math.round((p.doneAt - p.calledAt) / 60000))
            : null;

        return `<tr>
          <td>${patients.length - i}</td>
          <td>${p.name}</td>
          <td>${p.phone}</td>
          <td>${p.reason}</td>
          <td>${visitNum > 1 ? `Follow-up (Visit #${visitNum})` : "First Visit"}</td>
          <td>${formatDate(p.bookedAt)}</td>
          <td>${formatTime(p.bookedAt)}</td>
          <td>${p.status === "done" ? "Visited" : p.status === "called" ? "In Consultation" : "Waiting"}</td>
          <td>${p.calledAt ? formatTime(p.calledAt) : "—"}</td>
          <td>${p.doneAt ? formatTime(p.doneAt) : "—"}</td>
          <td>${consultMins ? `${consultMins} min` : "—"}</td>
          <td>${p.doctorNotes || "—"}</td>
        </tr>`;
      })
      .join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Patient Records - MediQueue</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 5px; }
        p.sub { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>MediQueue - Patient Records</h1>
      <p class="sub">Generated on ${new Date().toLocaleString("en-IN")}</p>
      <table>
        <thead><tr>
          <th>#</th><th>Name</th><th>Phone</th><th>Reason</th><th>Type</th>
          <th>Date</th><th>Time</th><th>Status</th><th>Called</th><th>Completed</th><th>Duration</th><th>Doctor Notes</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

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
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{patients.length} total</Badge>
                <Button size="sm" variant="outline" onClick={handlePrint} disabled={sorted.length === 0}>
                  <Printer className="mr-1 h-4 w-4" /> Print / PDF
                </Button>
              </div>
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
                      <TableHead>Doctor Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((p, i) => {
                      const visitNum = getVisitNumber(p, i);
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
                            <Badge
                              variant={visitNum > 1 ? "outline" : "default"}
                              className={`text-xs ${visitNum > 1 ? "border-orange-400 bg-orange-100 text-orange-700 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-300" : ""}`}
                            >
                              {visitNum > 1 ? `Follow-up #${visitNum}` : "First Visit"}
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
                          <TableCell>{consultMins ? `${consultMins} min` : "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{p.doctorNotes || "—"}</TableCell>
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
