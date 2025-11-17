"use client";

type CalendarDay = {
  day: string;
  completed: number;
  total: number;
};

type GalleryCalendarProps = {
  days: CalendarDay[];
  year: number;
  month: number;
};

export function GalleryCalendar({ days, year, month }: GalleryCalendarProps) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstDay.getUTCDay();
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dayMap = new Map(
    days.map((day) => [day.day, { completed: day.completed, total: day.total }])
  );

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = new Date(Date.UTC(year, month - 1, day))
      .toISOString()
      .slice(0, 10);
    cells.push({
      label: day,
      data: dayMap.get(dateStr) ?? { completed: 0, total: 0 },
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 p-6">
      <h2 className="text-lg font-semibold">Calendar</h2>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-white/50">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((cell, idx) =>
          cell ? (
            <div
              key={idx}
              className={`rounded-xl border px-2 py-3 text-center text-sm ${
                cell.data.completed > 0
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 text-white/60"
              }`}
            >
              <p>{cell.label}</p>
              <p className="text-[10px]">
                {cell.data.completed}/{cell.data.total}
              </p>
            </div>
          ) : (
            <div key={idx} />
          )
        )}
      </div>
    </div>
  );
}
