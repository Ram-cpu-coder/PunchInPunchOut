import React, { useEffect, useMemo, useState } from "react";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const API_BASE = import.meta.env.VITE_API_URL || "";

function FieldIcon({ name }) {
  return (
    <span className="field-icon" aria-hidden="true">
      <Icon name={name} />
    </span>
  );
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return formatDate(copy);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function Icon({ name }) {
  const paths = {
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z M17 21v-8H7v8 M7 3v5h8",
    trash: "M3 6h18 M8 6V4h8v2 M6 6l1 15h10l1-15",
    check: "M20 6 9 17l-5-5",
    undo: "M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-1",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2",
    play: "M8 5v14l11-7-11-7Z",
    stop: "M6 6h12v12H6Z",
    dollar: "M12 2v20 M17 5.5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
    coffee: "M4 8h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z M16 9h2a2 2 0 0 1 0 4h-2 M5 21h10",
    note: "M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M14 3v5h5 M8 13h8 M8 17h6",
    calendar: "M7 3v4 M17 3v4 M4 9h16 M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
    archive: "M4 7h16 M5 7l1 14h12l1-14 M8 3h8l2 4H6l2-4 M10 12h4",
    chevronLeft: "M15 18 9 12l6-6",
    chevronRight: "m9 18 6-6-6-6",
    chevronDown: "m6 9 6 6 6-6",
    sparkles: "M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z M19 15l.7 2.3L22 18l-2.3.7L19 22l-.7-2.3L16 18l2.3-.7L19 15Z",
    clear: "M18 6 6 18 M6 6l12 12"
  };

  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function createWeek(weekStart = getMonday()) {
  const start = new Date(`${weekStart}T00:00:00`);

  return {
    weekStart,
    isPaid: false,
    days: dayNames.map((label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      return {
        key: dayKeys[index],
        label,
        date: formatDate(date),
        start: "",
        end: "",
        breakMinutes: 0,
        notes: ""
      };
    })
  };
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function calculateDayHours(day) {
  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);

  if (start === null || end === null) return 0;

  const adjustedEnd = end < start ? end + 24 * 60 : end;
  const minutes = Math.max(adjustedEnd - start - Number(day.breakMinutes || 0), 0);
  return Number((minutes / 60).toFixed(2));
}

function money(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD"
  }).format(value || 0);
}

function calculateWeekTotals(savedWeek, hourlyRate = 0) {
  const daily = (savedWeek.days || []).map(calculateDayHours);
  const weeklyHours = Number(daily.reduce((sum, hours) => sum + hours, 0).toFixed(2));
  const rate = Number(hourlyRate || 0);

  return {
    weeklyHours,
    weeklyPay: Number((weeklyHours * rate).toFixed(2))
  };
}

function formatClockTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function calculateLiveDayHours(day, activeTimer, now) {
  if (!activeTimer) return calculateDayHours(day);

  const elapsedMs = Math.max(now.getTime() - activeTimer.startedAt, 0);
  const breakMs = Number(day.breakMinutes || 0) * 60 * 1000;
  return Number((Math.max(elapsedMs - breakMs, 0) / 3600000).toFixed(2));
}

function formatRunningTime(day, activeTimer, now) {
  if (!activeTimer) return "";

  const elapsedSeconds = Math.max(Math.floor((now.getTime() - activeTimer.startedAt) / 1000) - Number(day.breakMinutes || 0) * 60, 0);
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function App() {
  const [weeks, setWeeks] = useState([]);
  const [week, setWeek] = useState(createWeek());
  const [hourlyRate, setHourlyRate] = useState("");
  const [weekView, setWeekView] = useState("unpaid");
  const [isPaymentOpen, setIsPaymentOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 700
  );
  const [activeTimer, setActiveTimer] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState("Ready");
  const [isSaving, setIsSaving] = useState(false);

  const totals = useMemo(() => {
    const daily = week.days.map((day, index) =>
      activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index
        ? calculateLiveDayHours(day, activeTimer, now)
        : calculateDayHours(day)
    );
    const weeklyHours = Number(daily.reduce((sum, hours) => sum + hours, 0).toFixed(2));
    const rate = Number(hourlyRate || 0);
    const weeklyPay = Number((weeklyHours * rate).toFixed(2));

    return { daily, weeklyHours, weeklyPay };
  }, [activeTimer, hourlyRate, now, week]);

  const unpaidWeeks = useMemo(() => {
    return weeks
      .filter((savedWeek) => !savedWeek.isPaid)
      .map((savedWeek) => ({
        ...savedWeek,
        totals: calculateWeekTotals(savedWeek, hourlyRate)
      }));
  }, [hourlyRate, weeks]);

  const paidWeeks = useMemo(() => {
    return weeks
      .filter((savedWeek) => savedWeek.isPaid)
      .map((savedWeek) => ({
        ...savedWeek,
        totals: calculateWeekTotals(savedWeek, hourlyRate)
      }));
  }, [hourlyRate, weeks]);

  const allWeeks = useMemo(() => {
    return weeks.map((savedWeek) => ({
      ...savedWeek,
      totals: calculateWeekTotals(savedWeek, hourlyRate)
    }));
  }, [hourlyRate, weeks]);

  const visibleWeeks = useMemo(() => {
    if (weekView === "paid") return paidWeeks;
    if (weekView === "all") return allWeeks;
    return unpaidWeeks;
  }, [allWeeks, paidWeeks, unpaidWeeks, weekView]);

  const unpaidSummary = useMemo(() => {
    return unpaidWeeks.reduce(
      (summary, savedWeek) => ({
        hours: Number((summary.hours + savedWeek.totals.weeklyHours).toFixed(2)),
        pay: Number((summary.pay + savedWeek.totals.weeklyPay).toFixed(2))
      }),
      { hours: 0, pay: 0 }
    );
  }, [unpaidWeeks]);

  const viewSummary = useMemo(() => {
    return visibleWeeks.reduce(
      (summary, savedWeek) => ({
        hours: Number((summary.hours + savedWeek.totals.weeklyHours).toFixed(2)),
        pay: Number((summary.pay + savedWeek.totals.weeklyPay).toFixed(2))
      }),
      { hours: 0, pay: 0 }
    );
  }, [visibleWeeks]);

  const allWeeksSummary = useMemo(() => {
    return allWeeks.reduce(
      (summary, savedWeek) => ({
        hours: Number((summary.hours + savedWeek.totals.weeklyHours).toFixed(2)),
        pay: Number((summary.pay + savedWeek.totals.weeklyPay).toFixed(2))
      }),
      { hours: 0, pay: 0 }
    );
  }, [allWeeks]);

  async function loadWeeks() {
    const response = await fetch(`${API_BASE}/api/weeks`);
    const data = await response.json();
    setWeeks(data);
    return data;
  }

  async function loadSettings() {
    const response = await fetch(`${API_BASE}/api/settings`);
    const data = await response.json();
    setHourlyRate(data.hourlyRate ?? "");
    return data;
  }

  async function saveActiveTimer(timer) {
    const response = await fetch(`${API_BASE}/api/settings/timer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(timer)
    });

    if (!response.ok) throw new Error("Timer save failed");
    return response.json();
  }

  async function clearActiveTimer() {
    const response = await fetch(`${API_BASE}/api/settings/timer`, { method: "DELETE" });
    if (!response.ok) throw new Error("Timer clear failed");
  }

  async function saveSettings(nextHourlyRate = hourlyRate) {
    const response = await fetch(`${API_BASE}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hourlyRate: nextHourlyRate })
    });

    if (!response.ok) throw new Error("Rate save failed");
    const saved = await response.json();
    setHourlyRate(saved.hourlyRate ?? "");
  }

  async function loadWeek(weekStart) {
    setStatus("Loading week...");
    const response = await fetch(`${API_BASE}/api/weeks/${weekStart}`);
    const data = await response.json();
    const normalized = { ...createWeek(weekStart), ...data, isPaid: Boolean(data.isPaid) };
    setWeek(normalized);
    setStatus("Ready");
    return normalized;
  }

  useEffect(() => {
    Promise.all([loadSettings(), loadWeeks()])
      .then(async ([settings, savedWeeks]) => {
        const legacyRate = savedWeeks.find((savedWeek) => savedWeek.hourlyRate != null)?.hourlyRate;
        if (settings.hourlyRate == null && legacyRate != null) {
          setHourlyRate(legacyRate);
          saveSettings(legacyRate).catch(() => {});
        }
        const restoredTimer = settings.activeTimer?.weekStart ? settings.activeTimer : null;

        if (restoredTimer) {
          await loadWeek(restoredTimer.weekStart);
          setWeek((current) => ({
            ...current,
            days: current.days.map((day, dayIndex) =>
              dayIndex === restoredTimer.dayIndex
                ? { ...day, start: restoredTimer.startTime, end: "" }
                : day
            )
          }));
          setActiveTimer({
            weekStart: restoredTimer.weekStart,
            dayIndex: restoredTimer.dayIndex,
            startedAt: new Date(restoredTimer.startedAt).getTime(),
            startTime: restoredTimer.startTime
          });
          setNow(new Date());
          setStatus(`${dayNames[restoredTimer.dayIndex]} timer restored. Click Stop shift when finished.`);
          return;
        }

        await loadWeek(getMonday());
      })
      .catch(() => setStatus("Connect MongoDB and start the API to load saved weeks."));
  }, []);

  useEffect(() => {
    if (!activeTimer) return undefined;

    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  function updateDay(index, field, value) {
    setWeek((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) => (dayIndex === index ? { ...day, [field]: value } : day))
    }));
  }

  function clearDay(index) {
    if (activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index) {
      setActiveTimer(null);
      clearActiveTimer().catch((error) => setStatus(error.message));
    }

    setWeek((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) =>
        dayIndex === index ? { ...day, start: "", end: "", breakMinutes: 0, notes: "" } : day
      )
    }));
  }

  async function toggleDayTimer(index) {
    const clockTime = formatClockTime();
    const isRunning = activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index;

    if (isRunning) {
      try {
        await clearActiveTimer();
      } catch (error) {
        setStatus(error.message);
        return;
      }

      setWeek((current) => ({
        ...current,
        days: current.days.map((day, dayIndex) => (dayIndex === index ? { ...day, end: clockTime } : day))
      }));
      setActiveTimer(null);
      setStatus(`${week.days[index].label} stopped at ${clockTime}. Save the week when ready.`);
      return;
    }

    if (activeTimer) {
      setStatus("Stop the running timer before starting another day.");
      return;
    }

    const startedAt = Date.now();
    const nextTimer = {
      weekStart: week.weekStart,
      dayIndex: index,
      startedAt: new Date(startedAt).toISOString(),
      startTime: clockTime
    };

    try {
      await saveActiveTimer(nextTimer);
    } catch (error) {
      setStatus(error.message);
      return;
    }

    setNow(new Date());
    setWeek((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) =>
        dayIndex === index ? { ...day, start: clockTime, end: "" } : day
      )
    }));
    setActiveTimer({ ...nextTimer, startedAt });
    setStatus(`${week.days[index].label} timer started at ${clockTime}.`);
  }

  function fillSampleWeek() {
    const sample = [
      ["09:00", "17:00", 30, "Morning shift"],
      ["10:00", "18:00", 30, ""],
      ["09:30", "16:30", 30, ""],
      ["12:00", "20:00", 30, "Late shift"],
      ["08:00", "14:00", 0, ""],
      ["", "", 0, ""],
      ["", "", 0, ""]
    ];

    setWeek((current) => ({
      ...current,
      isPaid: false,
      days: current.days.map((day, index) => ({
        ...day,
        start: sample[index][0],
        end: sample[index][1],
        breakMinutes: sample[index][2],
        notes: sample[index][3]
      }))
    }));
    setStatus("Sample week added. Save when ready.");
  }

  async function saveWeek() {
    if (activeTimer?.weekStart === week.weekStart) {
      setStatus("Stop the running timer before saving this week.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving...");

    try {
      await saveSettings();
      const response = await fetch(`${API_BASE}/api/weeks/${week.weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...week, hourlyRate: null })
      });

      if (!response.ok) throw new Error("Save failed");

      const saved = await response.json();
      setWeek({ ...saved, isPaid: Boolean(saved.isPaid) });
      await loadWeeks();
      setStatus("Saved");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePaidStatus() {
    const nextWeek = { ...week, isPaid: !week.isPaid, hourlyRate: null };
    setWeek(nextWeek);
    setStatus(nextWeek.isPaid ? "Marking paid..." : "Marking unpaid...");

    try {
      const response = await fetch(`${API_BASE}/api/weeks/${nextWeek.weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextWeek)
      });

      if (!response.ok) throw new Error("Status save failed");

      const saved = await response.json();
      setWeek({ ...saved, isPaid: Boolean(saved.isPaid) });
      await loadWeeks();
      setStatus(saved.isPaid ? "Marked paid" : "Marked unpaid");
    } catch (error) {
      setWeek((current) => ({ ...current, isPaid: !nextWeek.isPaid }));
      setStatus(error.message);
    }
  }

  async function deleteWeek() {
    const confirmed = window.confirm(`Delete the week starting ${week.weekStart}?`);
    if (!confirmed) return;

    setStatus("Deleting...");
    if (activeTimer?.weekStart === week.weekStart) {
      await clearActiveTimer();
      setActiveTimer(null);
    }
    await fetch(`${API_BASE}/api/weeks/${week.weekStart}`, { method: "DELETE" });
    await loadWeeks();
    const fresh = createWeek(week.weekStart);
    setWeek(fresh);
    setStatus("Week deleted");
  }

  function changeWeekStart(value) {
    if (!value) return;
    if (activeTimer) {
      setStatus("Stop the running timer before changing weeks.");
      return;
    }

    loadWeek(value).catch(() => {
      setWeek(createWeek(value));
      setStatus("New unsaved week");
    });
  }

  function navigateWeek(direction) {
    const nextWeekStart = direction === "current" ? getMonday() : addDays(week.weekStart, direction === "previous" ? -7 : 7);
    changeWeekStart(nextWeekStart);
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Weekly hours</p>
          <h1>Track your week, day by day.</h1>
          <p className="hero-copy">
            Store weekly timesheets, calculate every day separately, and see the weekly total and pay in one calm view.
          </p>
        </div>
      </section>

      <section className="summary-grid" aria-label="Weekly summary">
        <article className="rate-card">
          <span>Hourly rate</span>
          <label className="pretty-field rate-field">
            <FieldIcon name="dollar" />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="35.00"
              value={hourlyRate}
              onChange={(event) => setHourlyRate(event.target.value)}
              onBlur={() => saveSettings().catch((error) => setStatus(error.message))}
              onWheel={(event) => event.currentTarget.blur()}
              aria-label="Hourly rate"
            />
          </label>
        </article>
        <article>
          <span>Current week hours</span>
          <strong>{totals.weeklyHours.toFixed(2)}</strong>
        </article>
        <article>
          <span>Current week pay</span>
          <strong>{hourlyRate ? money(totals.weeklyPay) : "--"}</strong>
        </article>
        <article>
          <span>Total money</span>
          <strong>{hourlyRate ? money(allWeeksSummary.pay) : "--"}</strong>
        </article>
        <article>
          <span>Total worked</span>
          <strong>{allWeeksSummary.hours.toFixed(2)}</strong>
        </article>
        <article>
          <span>Unpaid weeks</span>
          <strong>{unpaidWeeks.length}</strong>
        </article>
      </section>

      <section className="week-navigation" aria-label="Week navigation">
        <div>
          <p className="eyebrow">Selected week</p>
          <strong>{week.weekStart}</strong>
          <span>{week.isPaid ? "Paid" : "Unpaid until marked paid"}</span>
        </div>
        <div className="week-jump">
          <button type="button" onClick={() => navigateWeek("previous")}>
            <Icon name="chevronLeft" />
            Previous
          </button>
          <button type="button" onClick={() => navigateWeek("current")}>
            <Icon name="calendar" />
            Current
          </button>
          <button type="button" onClick={() => navigateWeek("next")}>
            Next
            <Icon name="chevronRight" />
          </button>
        </div>
        <button className={week.isPaid ? "status-button paid" : "status-button"} type="button" onClick={togglePaidStatus}>
          <Icon name={week.isPaid ? "undo" : "check"} />
          {week.isPaid ? "Mark unpaid" : "Mark paid"}
        </button>
      </section>

      <section className="toolbar" aria-label="Week controls">
        <label>
          <span>Week starting</span>
          <span className="pretty-field">
            <FieldIcon name="calendar" />
            <input type="date" value={week.weekStart} onChange={(event) => changeWeekStart(event.target.value)} />
          </span>
        </label>

        <label>
          <span>Saved weeks</span>
          <span className="pretty-field">
            <FieldIcon name="archive" />
            <select value={week.weekStart} onChange={(event) => changeWeekStart(event.target.value)}>
              <option value={week.weekStart}>Current week</option>
              {weeks.map((savedWeek) => (
                <option value={savedWeek.weekStart} key={savedWeek.weekStart}>
                  {savedWeek.weekStart}
                </option>
              ))}
            </select>
          </span>
        </label>
      </section>

      <section className={`week-browser ${isPaymentOpen ? "open" : "collapsed"}`} aria-label="Saved weeks browser">
        <button
          className="accordion-trigger"
          type="button"
          aria-expanded={isPaymentOpen}
          onClick={() => setIsPaymentOpen((open) => !open)}
        >
          <span className="accordion-label">
            <span className="eyebrow">Payment status</span>
            <span className="accordion-heading">
              {weekView === "paid" ? "Paid weeks" : weekView === "all" ? "All saved weeks" : "Weeks not paid"}
            </span>
          </span>
          <span className="accordion-summary">
            <span>{viewSummary.hours.toFixed(2)} hours</span>
            <strong>{viewSummary.pay ? money(viewSummary.pay) : "--"}</strong>
            <Icon name="chevronDown" />
          </span>
        </button>

        {isPaymentOpen && (
          <div className="accordion-body">
            <div className="panel-actions">
              <div className="tab-list" role="tablist" aria-label="Filter saved weeks">
                <button className={weekView === "unpaid" ? "active" : ""} type="button" onClick={() => setWeekView("unpaid")}>
                  Unpaid
                </button>
                <button className={weekView === "paid" ? "active" : ""} type="button" onClick={() => setWeekView("paid")}>
                  Paid
                </button>
                <button className={weekView === "all" ? "active" : ""} type="button" onClick={() => setWeekView("all")}>
                  All
                </button>
              </div>
              <div className="browser-total">
                <span>{viewSummary.hours.toFixed(2)} hours</span>
                <strong>{viewSummary.pay ? money(viewSummary.pay) : "--"}</strong>
              </div>
            </div>

            {visibleWeeks.length ? (
              <div className="week-list">
                {visibleWeeks.map((savedWeek) => (
                  <button
                    className={`week-item ${savedWeek.isPaid ? "paid" : "unpaid"} ${
                      savedWeek.weekStart === week.weekStart ? "selected" : ""
                    }`}
                    type="button"
                    key={savedWeek.weekStart}
                    onClick={() => changeWeekStart(savedWeek.weekStart)}
                  >
                    <span>
                      <strong>{savedWeek.weekStart}</strong>
                      <small>{savedWeek.isPaid ? "Paid" : "Not paid"} - {savedWeek.totals.weeklyHours.toFixed(2)} hours</small>
                    </span>
                    <span>{hourlyRate ? money(savedWeek.totals.weeklyPay) : "No rate"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-note">No {weekView} weeks to show.</p>
            )}
          </div>
        )}
      </section>

      <section className="days-table" aria-label="Daily hour entries">
        <div className="table-toolbar">
          <div>
            <p className="eyebrow">Timesheet</p>
            <h2>Daily hours</h2>
          </div>
          <div className="actions">
            <button className="sample-button" type="button" onClick={fillSampleWeek}>
              <Icon name="sparkles" />
              Sample week
            </button>
            <button className="ghost-button" type="button" onClick={deleteWeek}>
              <Icon name="trash" />
              Delete week
            </button>
            <button className="primary-button" type="button" onClick={saveWeek} disabled={isSaving}>
              <Icon name="save" />
              {isSaving ? "Saving" : "Save week"}
            </button>
          </div>
        </div>
        <div className="table-head">
          <span>Day</span>
          <span>Timer</span>
          <span>Break</span>
          <span>Hours</span>
          <span>Note</span>
          <span>Clear</span>
        </div>

        {week.days.map((day, index) => {
          const isRunning = activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index;
          const isCompleted = Boolean(day.start && day.end && !isRunning);
          const anotherTimerRunning = Boolean(activeTimer) && !isRunning;

          return (
            <article className={`day-row ${isRunning ? "is-running" : ""}`} key={day.key}>
              <div className="day-name">
                <strong>{day.label}</strong>
                <span>{day.date}</span>
              </div>
              <div className="punch-control">
                <button
                  className={`punch-button ${isRunning ? "running" : ""} ${isCompleted ? "completed" : ""}`}
                  type="button"
                  onClick={() => toggleDayTimer(index)}
                  disabled={anotherTimerRunning || isCompleted}
                >
                  <Icon name={isRunning || isCompleted ? "stop" : "play"} />
                  {isRunning ? "Stop shift" : isCompleted ? "Completed" : "Start shift"}
                </button>
                <div className="time-stamps">
                  <span>Start <strong>{day.start || "--:--"}</strong></span>
                  <span>End <strong>{day.end || (isRunning ? "Running" : "--:--")}</strong></span>
                </div>
                {isRunning && <span className="live-clock">{formatRunningTime(day, activeTimer, now)}</span>}
              </div>
              <label className="pretty-field compact-field">
                <FieldIcon name="coffee" />
                <input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="0"
                  value={day.breakMinutes}
                  onChange={(event) => updateDay(index, "breakMinutes", event.target.value)}
                  onWheel={(event) => event.currentTarget.blur()}
                  aria-label={`${day.label} break minutes`}
                />
              </label>
              <output>{totals.daily[index].toFixed(2)}</output>
              <label className="pretty-field note-field">
                <FieldIcon name="note" />
                <input
                  type="text"
                  value={day.notes}
                  placeholder="Optional note"
                  onChange={(event) => updateDay(index, "notes", event.target.value)}
                />
              </label>
              <button className="clear-day-button" type="button" onClick={() => clearDay(index)}>
                <Icon name="clear" />
                Clear
              </button>
            </article>
          );
        })}
      </section>

      <footer className="status-bar">
        <span>{status}</span>
        <span>Weeks stay saved until you delete them.</span>
      </footer>
    </main>
  );
}

export default App;
