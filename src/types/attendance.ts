export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

export interface SessionCol {
  id: string;
  date: string;
}

export interface StudentRow {
  id: string;
  fullName: string;
}

export interface StudentAttendanceRow {
  id: string;
  fullName: string;
  records: Record<string, AttendanceStatus>;
}
