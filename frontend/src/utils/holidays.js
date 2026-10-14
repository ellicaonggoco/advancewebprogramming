// Philippine Standard & Corporate Institutional Holidays (2026 Reference)
export const HOLIDAYS_2026 = {
  '2026-01-01': { name: "New Year's Day", type: 'Regular Holiday' },
  '2026-02-25': { name: 'EDSA Revolution Anniversary', type: 'Special Non-Working' },
  '2026-04-02': { name: 'Maundy Thursday', type: 'Regular Holiday' },
  '2026-04-03': { name: 'Good Friday', type: 'Regular Holiday' },
  '2026-04-04': { name: 'Black Saturday', type: 'Special Non-Working' },
  '2026-04-09': { name: 'Araw ng Kagitingan', type: 'Regular Holiday' },
  '2026-05-01': { name: 'Labor Day', type: 'Regular Holiday' },
  '2026-06-12': { name: 'Independence Day', type: 'Regular Holiday' },
  '2026-08-21': { name: 'Ninoy Aquino Day', type: 'Special Non-Working' },
  '2026-08-31': { name: 'National Heroes Day', type: 'Regular Holiday' },
  '2026-10-16': { name: 'Company Institutional Day', type: 'Special Corporate Holiday' },
  '2026-10-31': { name: "All Saints' Eve", type: 'Special Non-Working' },
  '2026-11-01': { name: "All Saints' Day", type: 'Special Non-Working' },
  '2026-11-02': { name: "All Souls' Day", type: 'Special Non-Working' },
  '2026-11-30': { name: 'Bonifacio Day', type: 'Regular Holiday' },
  '2026-12-08': { name: 'Feast of Immaculate Conception', type: 'Special Non-Working' },
  '2026-12-24': { name: 'Christmas Eve', type: 'Special Non-Working' },
  '2026-12-25': { name: 'Christmas Day', type: 'Regular Holiday' },
  '2026-12-30': { name: 'Rizal Day', type: 'Regular Holiday' },
  '2026-12-31': { name: 'Last Day of the Year', type: 'Special Non-Working' }
};

export const getHoliday = (dateStr) => {
  if (!dateStr) return null;
  // Match full date YYYY-MM-DD or MM-DD across any year
  if (HOLIDAYS_2026[dateStr]) return HOLIDAYS_2026[dateStr];
  const mmdd = dateStr.slice(5);
  for (const [key, val] of Object.entries(HOLIDAYS_2026)) {
    if (key.slice(5) === mmdd) {
      return val;
    }
  }
  return null;
};
