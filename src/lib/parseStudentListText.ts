export type ParsedStudentRow = { studentNo: string; fullName: string; gender: string };

// Matches a class-list row copy-pasted as plain text: a leading row number, a 9-digit
// student number, a name, then a Sex column (M/F). Anything after the gender letter
// (course-year, remarks, etc.) is ignored since those columns vary between class lists.
// The (?!\.) after the gender letter skips over a name's middle initial (e.g. "IVONNY M.")
// so the match lands on the real Sex column, which is never followed by a period.
const ROW_PATTERN = /^\s*\d+\s+(\d{9})\s+(.+?)\s+([MF])(?!\.)\b/;

export function parseStudentListText(text: string): ParsedStudentRow[] {
  const rows: ParsedStudentRow[] = [];

  for (const line of text.split("\n")) {
    const match = line.match(ROW_PATTERN);
    if (!match) continue;

    const [, studentNo, fullName, genderLetter] = match;
    rows.push({
      studentNo: studentNo.trim(),
      fullName: fullName.trim(),
      gender: genderLetter === "F" ? "Female" : "Male",
    });
  }

  return rows;
}
