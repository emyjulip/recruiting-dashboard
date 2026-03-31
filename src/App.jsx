import { useState, useEffect,} from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg: "#07090f",
  surface: "rgba(255,255,255,0.028)",
  surfaceHover: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#f1f5f9",
  textMid: "#94a3b8",
  textDim: "#475569",
  textFaint: "#1e293b",
  accent: "#FF6719",
  accentSoft: "#FF8C47",
  accentFaint: "rgba(255,103,25,0.12)",
  green: "#22c55e",
  greenFaint: "rgba(34,197,94,0.1)",
  yellow: "#eab308",
  yellowFaint: "rgba(234,179,8,0.1)",
  red: "#ef4444",
  redFaint: "rgba(239,68,68,0.1)",
  purple: "#a855f7",
  purpleFaint: "rgba(168,85,247,0.1)",
  font: "'Syne', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// const DEPTS = ["Engineering", "Product", "Analytics", "Design", "Sales", "People", "Finance", "Marketing"];

const PLAN_DATA = [];

const ASHBY_STAGE_ORDER = [
  "Source",
  "Application Review",
  "Recruiter Screen",
  "HM Screen",
  "Technical Interview",
  "Onsite 1",
  "Onsite 2",
  "Reference Check",
  "Offer",
];

// const VELOCITY = [
 // { week: "Jan 6", eng: 42, nonEng: 31 },
  //{ week: "Jan 13", eng: 38, nonEng: 29 },
  //{ week: "Jan 20", eng: 36, nonEng: 33 },
  //{ week: "Jan 27", eng: 33, nonEng: 28 },
  //{ week: "Feb 3", eng: 30, nonEng: 27 },
  //{ week: "Feb 10", eng: 31, nonEng: 24 },
  //{ week: "Feb 17", eng: 28, nonEng: 22 },
  //{ week: "Feb 24", eng: 25, nonEng: 21 },
  //{ week: "Mar 3", eng: 27, nonEng: 20 },
  //{ week: "Mar 10", eng: 24, nonEng: 18 },
//];


// ─── BOARD MEETING CONFIG ─────────────────────────────────────────────────────
// ✏️  EMILY: Update these two dates after each board meeting.
// Format: "YYYY-MM-DD"
// The dashboard automatically calculates all hires between these two dates
// from Ashby data — no other changes needed.
const BOARD_DATE_LAST = "2026-01-14";
const BOARD_DATE_NEXT = "2026-04-08";
// ─────────────────────────────────────────────────────────────────────────────

const WEEKLY_SNAPSHOT = {
  weekEnding: "2026-03-14",
  hiresThisWeek: [
    { name: "Priya Nair", title: "Senior Engineer, Platform", dept: "Engineering", start: "2026-02-10", recruiter: "Emily Doran" },
  ],
  hiresSinceBoard: 6,
  engHiresSinceBoard: 2,
  openReqs: 8,
  offersOut: 4,
  finalStage: [
    { name: "Candidate A", role: "VP of Sales", days: 12 },
    { name: "Candidate B", role: "Engineer II, Data Infra", days: 8 },
    { name: "Candidate C", role: "Analytics — Sr Data Analyst", days: 5 },
  ],
  atRisk: [
    { role: "VP of Sales", reason: "Counter-offer received — in deliberation", urgency: "critical" },
    { role: "Staff Engineer, Frontend", reason: "Limited pipeline — only 2 qualified candidates screened", urgency: "high" },
  ],
  top3: [
    "Close VP Sales offer — decision expected Monday",
    "Open sourcing on Staff Engineer Frontend (currently under-pipelined)",
    "Resolve Ashby status audit with Jenny — data must be clean before Friday send",
  ],
  blocked: [
    "Ashby historical offers need status correction before hire counts are accurate — Jenny owns, target EOW",
  ],
};

// ─── STAGE VELOCITY DATA ─────────────────────────────────────────────────────
// Each transition tagged by OWNER: who is responsible for the delay.
// recruiter = recruiter controls this gap
// hiring_team = HM / interview loop / leadership controls this gap
// candidate = deliberation, outside everyone's control
const STAGE_TRANSITIONS_AGG = [
  { stage: "Applied → Screened",         owner: "recruiter",   avgDays: 1.8, threshold: 3,  note: "Recruiter reviews and advances inbound applicants" },
  { stage: "Screened → HM Interview",    owner: "recruiter",   avgDays: 3.4, threshold: 4,  note: "Recruiter submits to HM; HM schedules" },
  { stage: "HM Interview → Final Round", owner: "hiring_team", avgDays: 7.1, threshold: 5,  note: "Interview team debrief and decision to advance — Hiring Team Process Lag" },
  { stage: "Final Round → Offer",        owner: "hiring_team", avgDays: 4.8, threshold: 3,  note: "Leadership approval and offer construction" },
  { stage: "Offer → Accept / Decline",   owner: "candidate",   avgDays: 5.2, threshold: 7,  note: "Candidate deliberation window — outside team control" },
  { stage: "Accept → Day 1",             owner: "hiring_team", avgDays: 19,  threshold: 21, note: "Notice period + onboarding scheduling (HRIS signal)" },
];

const ROLE_STAGE_VELOCITY = [
  {
    id: "SAL-001", role: "VP of Sales", recruiter: "Emily Doran", dept: "Sales",
    transitions: [
      { stage: "Applied → Screened",         days: 2,    owner: "recruiter" },
      { stage: "Screened → HM Interview",    days: 4,    owner: "recruiter" },
      { stage: "HM Interview → Final Round", days: 22,   owner: "hiring_team" },  // HM rescheduled twice
      { stage: "Final Round → Offer",        days: null, owner: "hiring_team" },
      { stage: "Offer → Accept / Decline",   days: null, owner: "candidate" },
    ],
  },
  {
    id: "ENG-003", role: "Engineer II, Data Infra", recruiter: "Emily Doran", dept: "Engineering",
    transitions: [
      { stage: "Applied → Screened",         days: 1,    owner: "recruiter" },
      { stage: "Screened → HM Interview",    days: 3,    owner: "recruiter" },
      { stage: "HM Interview → Final Round", days: 5,    owner: "hiring_team" },
      { stage: "Final Round → Offer",        days: null, owner: "hiring_team" },
      { stage: "Offer → Accept / Decline",   days: null, owner: "candidate" },
    ],
  },
  {
    id: "ANA-002", role: "Senior Data Analyst", recruiter: "Russell Lifson", dept: "Analytics",
    transitions: [
      { stage: "Applied → Screened",         days: 3,    owner: "recruiter" },
      { stage: "Screened → HM Interview",    days: 6,    owner: "recruiter" },
      { stage: "HM Interview → Final Round", days: 8,    owner: "hiring_team" },
      { stage: "Final Round → Offer",        days: null, owner: "hiring_team" },
      { stage: "Offer → Accept / Decline",   days: null, owner: "candidate" },
    ],
  },
  {
    id: "SAL-002", role: "Account Executive, ENT", recruiter: "Russell Lifson", dept: "Sales",
    transitions: [
      { stage: "Applied → Screened",         days: 2,    owner: "recruiter" },
      { stage: "Screened → HM Interview",    days: 5,    owner: "recruiter" },
      { stage: "HM Interview → Final Round", days: 9,    owner: "hiring_team" },
      { stage: "Final Round → Offer",        days: 7,    owner: "hiring_team" },
      { stage: "Offer → Accept / Decline",   days: null, owner: "candidate" },
    ],
  },
  {
    id: "PRD-002", role: "Product Designer, Growth", recruiter: "Emily Doran", dept: "Product",
    transitions: [
      { stage: "Applied → Screened",         days: 1,    owner: "recruiter" },
      { stage: "Screened → HM Interview",    days: 3,    owner: "recruiter" },
      { stage: "HM Interview → Final Round", days: 4,    owner: "hiring_team" },
      { stage: "Final Round → Offer",        days: 3,    owner: "hiring_team" },
      { stage: "Offer → Accept / Decline",   days: null, owner: "candidate" },
    ],
  },
  {
    id: "ENG-004", role: "Staff Engineer, Frontend", recruiter: "Emily Doran", dept: "Engineering",
    transitions: [
      { stage: "Applied → Screened",         days: 2,    owner: "recruiter" },
      { stage: "Screened → HM Interview",    days: null, owner: "recruiter" },
      { stage: "HM Interview → Final Round", days: null, owner: "hiring_team" },
      { stage: "Final Round → Offer",        days: null, owner: "hiring_team" },
      { stage: "Offer → Accept / Decline",   days: null, owner: "candidate" },
    ],
  },
];

// Pre-computed delay ownership summary per recruiter (for RecruiterWorkload)
const RECRUITER_DELAY_OWNERSHIP = {
  "Emily Doran": {
    recruiterOwnedAvg: 2.6,
    hiringTeamOwnedAvg: 9.4,
    candidateOwnedAvg: 5.2,
    bottleneck: { stage: "HM Interview → Final Round", avgDays: 13.5, owner: "hiring_team" },
  },
  "Russell Lifson": {
    recruiterOwnedAvg: 4.1,
    hiringTeamOwnedAvg: 12.0,
    candidateOwnedAvg: 5.2,
    bottleneck: { stage: "HM Interview → Final Round", avgDays: 8.5, owner: "hiring_team" },
  },
};

// ─── FUNNEL + SOURCE DATA (combined) ─────────────────────────────────────────
// Source keys use short names for Recharts dataKey compatibility
const SOURCES = [
  { key: "LinkedIn",    label: "LinkedIn Inbound",   color: "#0A66C2" },
  { key: "Outbound",    label: "Sourced (Outbound)",  color: "#FF6719" },
  { key: "Referral",    label: "Referral",            color: "#22c55e" },
  { key: "Agency",      label: "Agency",              color: "#a855f7" },
  { key: "CompanySite", label: "Company Site",        color: "#4b5563" },
];

// Engineering funnel — each row is a stage, each source key is a count
// Totals: Applied 412, Screened 74, HM 31, Final 14, Offer 6, Hired 4
const FUNNEL_ENG = [
  { stage: "Applied",      LinkedIn: 180, Outbound: 82, Referral: 28, Agency: 20, CompanySite: 102 },
  { stage: "Screened",     LinkedIn: 28,  Outbound: 24, Referral: 14, Agency: 6,  CompanySite: 2   },
  { stage: "HM Interview", LinkedIn: 11,  Outbound: 13, Referral: 5,  Agency: 2,  CompanySite: 0   },
  { stage: "Final Round",  LinkedIn: 5,   Outbound: 6,  Referral: 2,  Agency: 1,  CompanySite: 0   },
  { stage: "Offer",        LinkedIn: 2,   Outbound: 3,  Referral: 1,  Agency: 0,  CompanySite: 0   },
  { stage: "Hired",        LinkedIn: 1,   Outbound: 2,  Referral: 1,  Agency: 0,  CompanySite: 0   },
];

// Non-Engineering funnel
// Totals: Applied 318, Screened 62, HM 28, Final 13, Offer 5, Hired 2
const FUNNEL_NONENG = [
  { stage: "Applied",      LinkedIn: 118, Outbound: 60, Referral: 20, Agency: 14, CompanySite: 106 },
  { stage: "Screened",     LinkedIn: 20,  Outbound: 17, Referral: 15, Agency: 6,  CompanySite: 4   },
  { stage: "HM Interview", LinkedIn: 7,   Outbound: 9,  Referral: 11, Agency: 1,  CompanySite: 0   },
  { stage: "Final Round",  LinkedIn: 4,   Outbound: 5,  Referral: 3,  Agency: 1,  CompanySite: 0   },
  { stage: "Offer",        LinkedIn: 2,   Outbound: 2,  Referral: 1,  Agency: 0,  CompanySite: 0   },
  { stage: "Hired",        LinkedIn: 1,   Outbound: 1,  Referral: 0,  Agency: 0,  CompanySite: 0   },
];

// ─── 2025 HISTORICAL DATA ────────────────────────────────────────────────────
// Full Ashby history — all filled roles from 2025.
// When live: same job.list + application.list endpoints, filtered startDate < 2026-01-01
const PLAN_2025 = [
  { id: "E25-001", title: "Staff Engineer, Backend",       dept: "Engineering", status: "filled", planned: true,  startDate: "2025-02-14", recruiter: "Emily Doran" },
  { id: "E25-002", title: "Senior Engineer, Platform",     dept: "Engineering", status: "filled", planned: true,  startDate: "2025-03-03", recruiter: "Emily Doran" },
  { id: "E25-003", title: "Engineer II, Mobile",           dept: "Engineering", status: "filled", planned: true,  startDate: "2025-05-19", recruiter: "Emily Doran" },
  { id: "E25-004", title: "Senior Engineer, Security",     dept: "Engineering", status: "missed", planned: true,  startDate: null,        recruiter: "Emily Doran" },
  { id: "E25-005", title: "Staff Engineer, Infrastructure",dept: "Engineering", status: "filled", planned: true,  startDate: "2025-08-11", recruiter: "Emily Doran" },
  { id: "E25-006", title: "Engineer II, Data Infra",       dept: "Engineering", status: "filled", planned: false, startDate: "2025-10-06", recruiter: "Emily Doran" },  // unplanned backfill
  { id: "P25-001", title: "Senior Product Manager",        dept: "Product",     status: "filled", planned: true,  startDate: "2025-04-07", recruiter: "Emily Doran" },
  { id: "P25-002", title: "Product Designer, Growth",      dept: "Product",     status: "missed", planned: true,  startDate: null,        recruiter: "Emily Doran" },
  { id: "A25-001", title: "Analytics Engineer",            dept: "Analytics",   status: "filled", planned: true,  startDate: "2025-03-24", recruiter: "Russell Lifson" },
  { id: "A25-002", title: "Senior Data Analyst",           dept: "Analytics",   status: "filled", planned: true,  startDate: "2025-07-14", recruiter: "Russell Lifson" },
  { id: "S25-001", title: "VP of Sales",                   dept: "Sales",       status: "missed", planned: true,  startDate: null,        recruiter: "Emily Doran" },   // rolled into 2026
  { id: "S25-002", title: "Account Executive, Mid-Market", dept: "Sales",       status: "filled", planned: true,  startDate: "2025-06-02", recruiter: "Russell Lifson" },
  { id: "S25-003", title: "Sales Engineer",                dept: "Sales",       status: "filled", planned: true,  startDate: "2025-09-15", recruiter: "Russell Lifson" },
  { id: "M25-001", title: "Head of Growth",                dept: "Marketing",   status: "filled", planned: true,  startDate: "2025-05-05", recruiter: "Emily Doran" },
  { id: "M25-002", title: "Content Lead",                  dept: "Marketing",   status: "filled", planned: true,  startDate: "2025-11-17", recruiter: "Emily Doran" },
  { id: "F25-001", title: "Data Analyst, Finance",         dept: "Finance",     status: "filled", planned: true,  startDate: "2025-08-25", recruiter: "Russell Lifson" },
  { id: "D25-001", title: "Brand Designer",                dept: "Design",      status: "filled", planned: true,  startDate: "2025-04-21", recruiter: "Emily Doran" },
  { id: "PP25-001",title: "Recruiter, Technical",          dept: "People",      status: "missed", planned: true,  startDate: null,        recruiter: "Emily Doran" },   // still open
];

// 2025 source funnel — Eng + Non-Eng combined
// Applied volume was lower; sourcing mix was different
const FUNNEL_2025_ENG = [
  { stage: "Applied",      LinkedIn: 142, Outbound: 61, Referral: 18, Agency: 22, CompanySite: 89 },
  { stage: "Screened",     LinkedIn: 22,  Outbound: 18, Referral: 10, Agency: 8,  CompanySite: 2  },
  { stage: "HM Interview", LinkedIn: 8,   Outbound: 10, Referral: 4,  Agency: 3,  CompanySite: 0  },
  { stage: "Final Round",  LinkedIn: 4,   Outbound: 5,  Referral: 2,  Agency: 1,  CompanySite: 0  },
  { stage: "Offer",        LinkedIn: 2,   Outbound: 3,  Referral: 1,  Agency: 1,  CompanySite: 0  },
  { stage: "Hired",        LinkedIn: 2,   Outbound: 3,  Referral: 1,  Agency: 1,  CompanySite: 0  },
];

const FUNNEL_2025_NONENG = [
  { stage: "Applied",      LinkedIn: 98,  Outbound: 44, Referral: 12, Agency: 18, CompanySite: 94 },
  { stage: "Screened",     LinkedIn: 16,  Outbound: 13, Referral: 8,  Agency: 5,  CompanySite: 3  },
  { stage: "HM Interview", LinkedIn: 5,   Outbound: 7,  Referral: 6,  Agency: 2,  CompanySite: 0  },
  { stage: "Final Round",  LinkedIn: 3,   Outbound: 4,  Referral: 2,  Agency: 1,  CompanySite: 0  },
  { stage: "Offer",        LinkedIn: 2,   Outbound: 2,  Referral: 1,  Agency: 1,  CompanySite: 0  },
  { stage: "Hired",        LinkedIn: 2,   Outbound: 2,  Referral: 1,  Agency: 1,  CompanySite: 0  },
];

// 2025 recruiter arcs — two separate 6-month arcs
const ARC_2025 = {
  "Emily Doran": {
    h1: { hired: 5, applicantsReviewed: 890, screensCompleted: 98, submittalsToHM: 44, avgTimeToHire: 38, offerDeclineRate: 22 },
    h2: { hired: 4, applicantsReviewed: 1040, screensCompleted: 112, submittalsToHM: 51, avgTimeToHire: 34, offerDeclineRate: 19 },
  },
  "Russell Lifson": {
    h1: { hired: 3, applicantsReviewed: 210, screensCompleted: 52, submittalsToHM: 24, avgTimeToHire: 44, offerDeclineRate: 28 },
    h2: { hired: 3, applicantsReviewed: 268, screensCompleted: 61, submittalsToHM: 29, avgTimeToHire: 41, offerDeclineRate: 31 },
  },
};

// ─── RECRUITER ARC DATA ───────────────────────────────────────────────────────
// Six-month arc: Oct 2025 → Mar 2026. Two-month buckets.
// Activity field note: Emily Doran is inbound-heavy (hot startup, high applicant volume).
// Russell Lifson carries a smaller req load with more outbound sourcing work.
const RECRUITER_ARC = {
  "Emily Doran": {
    color: T.accent,
    arcStart: "Oct 2025",
    arcEnd: "Mar 2026",
    rolesOwned: 13,
    currentOpenings: 8,
    // Monthly hire breakdown — shows the lagging/uneven nature of recruiting output
    monthlyHires: [
      { month: "Oct", hired: 1 },
      { month: "Nov", hired: 1 },
      { month: "Dec", hired: 2 },
      { month: "Jan", hired: 1 },
      { month: "Feb", hired: 1 },
      { month: "Mar", hired: 0 }, // in progress
    ],
    buckets: [
      {
        label: "Oct – Nov 2025",
        activity: {
          // Inbound-heavy: Emily reviews large applicant volume from job posts
          applicantsReviewed: 312,
          applicantsAdvanced: 58,   // moved from applied → screen
          screensCompleted: 41,
          submittalsToHM: 19,
        },
        conversion: {
          hmInterviews: 12,
          finalRounds: 6,
          offersExtended: 3,
          offerDeclines: 1,
          candidateWithdrawals: 2,
        },
        outcomes: { hired: 2, retainedAt90Days: 2 },
      },
      {
        label: "Dec – Jan 2026",
        activity: {
          applicantsReviewed: 274,
          applicantsAdvanced: 51,
          screensCompleted: 38,
          submittalsToHM: 17,
        },
        conversion: {
          hmInterviews: 11,
          finalRounds: 5,
          offersExtended: 4,
          offerDeclines: 0,
          candidateWithdrawals: 1,
        },
        outcomes: { hired: 3, retainedAt90Days: 3 },
      },
      {
        label: "Feb – Mar 2026",
        activity: {
          applicantsReviewed: 341,
          applicantsAdvanced: 63,
          screensCompleted: 44,
          submittalsToHM: 21,
        },
        conversion: {
          hmInterviews: 9,
          finalRounds: 4,
          offersExtended: 2,
          offerDeclines: 1,
          candidateWithdrawals: 0,
        },
        outcomes: { hired: 1, retainedAt90Days: null },
      },
    ],
    signals: {
      avgTimeToHire: 31,
      offerDeclineRate: 18,
      withdrawalRate: 11,
      hmFeedbackLag: 3.2,
      interviewCancelRate: 9,
    },
    // HRIS signals — sourced from Rippling/BambooHR, not Ashby
    hris: {
      offerToStartGap: 17,        // avg days between offer accept and Day 1
      day1ShowRate: 100,           // % of accepted offers who actually started
      day30CheckinRate: 92,        // % who completed 30-day new hire check-in
      day60CheckinRate: 88,        // % who completed 60-day check-in
      day90RetentionRate: 100,     // % still employed at 90 days
      avgOnboardingScore: 4.4,     // out of 5.0 — new hire satisfaction at 30 days
      internalMobilityCount: 0,    // hires promoted/transferred within 6mo arc
    },
    notes: [
      { type: "watch", text: "VP of Sales search at 71 days — HM has rescheduled final round twice. Not a pipeline problem." },
      { type: "positive", text: "Offer acceptance rate 82% over arc — strong candidate expectation management." },
      { type: "positive", text: "Day 1 show rate 100% and 90-day retention 100% — quality of hire is exceptionally high." },
    ],
  },
  "Russell Lifson": {
    color: T.purple,
    arcStart: "Oct 2025",
    arcEnd: "Mar 2026",
    rolesOwned: 6,
    currentOpenings: 4,
    monthlyHires: [
      { month: "Oct", hired: 0 },
      { month: "Nov", hired: 1 },
      { month: "Dec", hired: 1 },
      { month: "Jan", hired: 0 },
      { month: "Feb", hired: 0 },
      { month: "Mar", hired: 0 },
    ],
    buckets: [
      {
        label: "Oct – Nov 2025",
        activity: {
          // Russell's roles are harder to fill — more outbound, lower inbound volume
          applicantsReviewed: 94,
          applicantsAdvanced: 24,
          screensCompleted: 22,
          submittalsToHM: 11,
        },
        conversion: {
          hmInterviews: 7,
          finalRounds: 3,
          offersExtended: 2,
          offerDeclines: 0,
          candidateWithdrawals: 1,
        },
        outcomes: { hired: 1, retainedAt90Days: 1 },
      },
      {
        label: "Dec – Jan 2026",
        activity: {
          applicantsReviewed: 81,
          applicantsAdvanced: 21,
          screensCompleted: 19,
          submittalsToHM: 9,
        },
        conversion: {
          hmInterviews: 6,
          finalRounds: 3,
          offersExtended: 2,
          offerDeclines: 1,
          candidateWithdrawals: 0,
        },
        outcomes: { hired: 1, retainedAt90Days: 1 },
      },
      {
        label: "Feb – Mar 2026",
        activity: {
          applicantsReviewed: 107,
          applicantsAdvanced: 28,
          screensCompleted: 21,
          submittalsToHM: 10,
        },
        conversion: {
          hmInterviews: 5,
          finalRounds: 2,
          offersExtended: 1,
          offerDeclines: 1,
          candidateWithdrawals: 0,
        },
        outcomes: { hired: 0, retainedAt90Days: null },
      },
    ],
    signals: {
      avgTimeToHire: 38,
      offerDeclineRate: 33,
      withdrawalRate: 8,
      hmFeedbackLag: 5.1,
      interviewCancelRate: 14,
    },
    hris: {
      offerToStartGap: 21,
      day1ShowRate: 100,
      day30CheckinRate: 100,
      day60CheckinRate: 100,
      day90RetentionRate: 100,
      avgOnboardingScore: 4.7,
      internalMobilityCount: 0,
    },
    notes: [
      { type: "watch", text: "Offer decline rate elevated at 33% — comp benchmarking on Analytics/Sales roles may be misaligned. Requires comp review, not recruiter action." },
      { type: "watch", text: "HM feedback lag 5.1 days vs Emily's 3.2 — process friction is on the hiring manager side, not Russell's." },
      { type: "positive", text: "Applicant-to-advance ratio is strong given lower inbound volume — pipeline quality is holding." },
    ],
  },
};

// ─── PERSISTENT SORT HOOK ────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }) {
  return col !== sortKey
    ? <span style={{ color: T.textFaint, marginLeft: 4 }}>⇅</span>
    : <span style={{ color: T.accent, marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
}

function useSortState(tableKey, defaultKey, defaultDir = "asc") {
  const lsKey = `sort_${tableKey}_key`;
  const lsDir = `sort_${tableKey}_dir`;
  const [sortKey, _setSortKey] = useState(() => localStorage.getItem(lsKey) || defaultKey);
  const [sortDir, _setSortDir] = useState(() => localStorage.getItem(lsDir) || defaultDir);

  const setSortKey = (v) => { _setSortKey(v); localStorage.setItem(lsKey, v); };
  const setSortDir = (v) => { _setSortDir(v); localStorage.setItem(lsDir, v); };

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return { sortKey, sortDir, handleSort };
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────

function Badge({ children, color = "accent" }) {
  const map = {
    accent: { bg: T.accentFaint, border: T.accent, text: T.accentSoft },
    green: { bg: T.greenFaint, border: T.green, text: "#86efac" },
    yellow: { bg: T.yellowFaint, border: T.yellow, text: "#fde047" },
    red: { bg: T.redFaint, border: T.red, text: "#fca5a5" },
    purple: { bg: T.purpleFaint, border: T.purple, text: "#d8b4fe" },
    dim: { bg: "rgba(255,255,255,0.05)", border: T.border, text: T.textMid },
  };
  const s = map[color] || map.dim;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "2px 8px", borderRadius: 3,
      background: s.bg, border: `1px solid ${s.border}`, color: s.text,
      fontFamily: T.mono, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Card({ children, style = {}, animate = 0 }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "22px 24px",
      animation: `fadeUp 0.45s ease ${animate * 0.06}s both`,
      ...style,
    }}>{children}</div>
  );
}

function CardLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: "0.14em", color: T.textDim,
      fontWeight: 700, textTransform: "uppercase", marginBottom: 14,
      fontFamily: T.font,
    }}>{children}</div>
  );
}

function StatTile({ label, value, sub, accent, size = 36, animate = 0 }) {
  return (
    <Card animate={animate} style={{ flex: 1, minWidth: 140 }}>
      <CardLabel>{label}</CardLabel>
      <div style={{ fontSize: size, fontWeight: 700, color: accent || T.text, lineHeight: 1, fontFamily: T.mono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 16px" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.18em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0b1120", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ color: T.textMid, fontSize: 11, marginBottom: 6, fontFamily: T.font }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.accent, fontSize: 13, fontFamily: T.mono }}>
          {formatter ? formatter(p) : `${p.value} — ${p.name}`}
        </div>
      ))}
    </div>
  );
};

const statusConfig = {
  filled: { label: "Filled", color: "green" },
  in_progress: { label: "In Progress", color: "accent" },
  open: { label: "Open", color: "dim" },
};

// ─── TAB: EXECUTIVE OVERVIEW ─────────────────────────────────────────────────
function TabExecutive({ hiringPlan, stageCounts }) {
  const plan = hiringPlan || [];
  const totalPlanned = plan.length;
  const totalHired = plan.filter(r => r.openingState === "Filled").length;
  const totalInProgress = plan.filter(r => r.openingState === "Open").length;
  const totalApproved = plan.filter(r => r.openingState === "Approved").length;
  const pct = totalPlanned > 0 ? Math.round((totalHired / totalPlanned) * 100) : 0;

  const deptProgress = Object.entries(
    plan.reduce((acc, r) => {
      acc[r.dept] = (acc[r.dept] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([dept, planned]) => ({ dept, planned, hired: 0, inProgress: 0, open: planned }));

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatTile label="2026 Plan" value={totalPlanned} sub="Total roles planned" animate={0} />
        <StatTile label="Hired" value={totalHired} accent={T.green} sub={`${pct}% of plan · 2026 headcount only`} animate={1} />
        <StatTile label="In Progress" value={totalInProgress} accent={T.accentSoft} sub="Active searches" animate={2} />
        <StatTile label="Not Started" value={totalApproved} accent={T.textMid} sub="Approved, no pipeline yet" animate={3} />
        <StatTile label="Offers Out" value={stageCounts?.Offer ?? 0} accent={T.yellow} sub="Awaiting decisions" animate={4} />
      </div>

      {/* Progress bar */}
      <Card animate={5} style={{ marginBottom: 20 }}>
        <CardLabel>Overall Hiring Plan Progress</CardLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.green})`, borderRadius: 4, transition: "width 1s ease" }} />
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 14, color: T.text, fontWeight: 700, minWidth: 42 }}>{pct}%</div>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          {[["Filled", totalHired, T.green], ["In Progress", totalInProgress, T.accent], ["Approved", totalApproved, T.textDim]].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 11, color: T.textMid }}>{l}: <strong style={{ color: T.text, fontFamily: T.mono }}>{v}</strong></span>
            </div>
          ))}
        </div>
      </Card>

      {/* By Department */}
      <Card animate={6}>
        <CardLabel>Progress by Department</CardLabel>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deptProgress} barCategoryGap="30%" barGap={2}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="dept" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip formatter={p => `${p.value} — ${p.name}`} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="hired" name="Hired" stackId="a" fill={T.green} radius={[0, 0, 0, 0]} />
            <Bar dataKey="inProgress" name="In Progress" stackId="a" fill={T.accent} />
            <Bar dataKey="open" name="Open" stackId="a" fill="rgba(255,255,255,0.08)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bottleneck summary */}
      <SectionDivider label="Where Is the Friction Right Now?" />
      <BottleneckSummary />

      {/* Recruiter Workload */}
      <SectionDivider label="Recruiter Workload" />
      <RecruiterWorkload animate={7} />
    </div>
  );
}

function BottleneckSummary() {
  // Aggregate stage bars — condensed for exec view
  const ownerColor = (o) => o === "recruiter" ? T.accent : o === "hiring_team" ? T.yellow : T.purple;
  const ownerLabel = (o) => o === "recruiter" ? "Recruiter" : o === "hiring_team" ? "Hiring Team" : "Candidate";

  // Top stalled roles — any transition over threshold
  const stalledRoles = ROLE_STAGE_VELOCITY
    .map(r => {
      const worst = r.transitions.reduce((w, t, i) => {
        const threshold = STAGE_TRANSITIONS_AGG[i]?.threshold || 99;
        if (t.days !== null && t.days > threshold) {
          const over = t.days - threshold;
          return (!w || over > w.over) ? { stage: t.stage, days: t.days, over, owner: t.owner } : w;
        }
        return w;
      }, null);
      return worst ? { ...r, bottleneck: worst } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.bottleneck.over - a.bottleneck.over);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 4 }}>

      {/* Left — stage velocity bars */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font, marginBottom: 4 }}>
              Hiring Team Process Lag — All Active Roles
            </div>
            <div style={{ fontSize: 11, color: T.textDim }}>Avg days per stage · white tick = target threshold</div>
          </div>
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            {[["recruiter", T.accent, "Recruiter"], ["hiring_team", T.yellow, "Hiring Team"], ["candidate", T.purple, "Candidate"]].map(([k, c, l]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                <span style={{ fontSize: 9, color: T.textDim }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {STAGE_TRANSITIONS_AGG.map((t, i) => {
          const isOver = t.avgDays > t.threshold;
          const barMax = 25;
          const barW = Math.min((t.avgDays / barMax) * 100, 100);
          const threshW = Math.min((t.threshold / barMax) * 100, 100);
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: ownerColor(t.owner), flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: isOver ? T.text : T.textMid }}>{t.stage}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: isOver ? T.yellow : T.green }}>{t.avgDays}d</span>
                  {isOver && <Badge color="yellow">⚠ +{(t.avgDays - t.threshold).toFixed(1)}d over</Badge>}
                </div>
              </div>
              <div style={{ position: "relative", height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, height: "100%",
                  width: `${barW}%`,
                  background: isOver ? T.yellow : ownerColor(t.owner),
                  borderRadius: 3, opacity: 0.75,
                }} />
                <div style={{ position: "absolute", top: -3, left: `${threshW}%`, width: 2, height: 11, background: "rgba(255,255,255,0.35)", borderRadius: 1 }} />
              </div>
            </div>
          );
        })}

        <div style={{ fontSize: 10, color: T.textDim, marginTop: 6, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          Full stage drill-down by role available in the <span style={{ color: T.accent }}>Pipeline</span> tab
        </div>
      </div>

      {/* Right — stalled roles */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font, marginBottom: 4 }}>
          Roles With Active Friction
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 16 }}>Searches where a stage is over threshold — sorted by severity</div>

        {stalledRoles.length === 0 ? (
          <div style={{ fontSize: 13, color: T.green, textAlign: "center", paddingTop: 20 }}>✓ All stages within threshold</div>
        ) : (
          stalledRoles.map((r, i) => (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: 8, marginBottom: 10,
              background: "rgba(234,179,8,0.06)",
              border: `1px solid rgba(234,179,8,0.2)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.role}</div>
                  <div style={{ fontSize: 10, color: T.textDim }}>{r.id} · {r.recruiter}</div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: T.yellow, lineHeight: 1 }}>
                  +{r.bottleneck.over}d
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ownerColor(r.bottleneck.owner) }} />
                <span style={{ fontSize: 11, color: T.textMid }}>{r.bottleneck.stage}</span>
                <span style={{ fontSize: 9, color: ownerColor(r.bottleneck.owner), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {ownerLabel(r.bottleneck.owner)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecruiterWorkload({ animate }) {
  const [activeRecruiter, setActiveRecruiter] = useState("Emily Doran");
  const arc = RECRUITER_ARC[activeRecruiter];
  const names = Object.keys(RECRUITER_ARC);

  const totalHired = arc.buckets.reduce((s, b) => s + b.outcomes.hired, 0);
  const totalReviewed = arc.buckets.reduce((s, b) => s + b.activity.applicantsReviewed, 0);
  const biMonthlyHires = arc.buckets.map(b => ({ label: b.label.split(" 20")[0], hired: b.outcomes.hired }));

  // Current bucket color helper — uses actual accent rgb values
  const currentBg = arc.color === T.accent
    ? "rgba(255,103,25,0.06)" : "rgba(168,85,247,0.06)";
  const currentBorder = arc.color === T.accent
    ? "rgba(255,103,25,0.25)" : "rgba(168,85,247,0.25)";

  return (
    <div style={{ animation: `fadeUp 0.45s ease ${animate * 0.06}s both` }}>

      {/* ── Explainer ── */}
      <div style={{
        background: "rgba(255,103,25,0.06)", border: `1px solid rgba(255,103,25,0.18)`,
        borderRadius: 10, padding: "16px 20px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.accentSoft, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: T.font }}>
          How to read recruiter performance
        </div>
        <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.8, maxWidth: 860 }}>
          <p style={{ marginBottom: 10 }}>Recruiting does not close like a sales pipeline. A hire that appears in Q2 was almost always built in Q1.</p>
          <p style={{ marginBottom: 10 }}>Holding recruiters to quarterly output numbers is like measuring a farmer by weekly crop yield — the wrong signal at the wrong interval.</p>
          <p style={{ marginBottom: 10 }}><span style={{ color: T.text, fontWeight: 600 }}>What recruiters control:</span> activity and pipeline quality.</p>
          <p style={{ marginBottom: 6 }}><span style={{ color: T.text, fontWeight: 600 }}>What they don't control:</span></p>
          <ul style={{ listStyle: "none", paddingLeft: 16, marginBottom: 10 }}>
            {["Hiring manager responsiveness", "Interview team consistency", "Candidate counter-offers", "Compensation alignment"].map(item => (
              <li key={item} style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.accent, fontSize: 10 }}>◎</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginBottom: 10 }}>This view separates those two things so you can see the real picture.</p>
          <p>Performance is measured in <span style={{ color: T.text, fontWeight: 600 }}>six-month arcs</span> with two-month breakdowns — long enough to see patterns, granular enough to catch problems early.</p>
        </div>
      </div>

      {/* ── Recruiter selector ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {names.map(name => (
          <button key={name} onClick={() => setActiveRecruiter(name)} style={{
            padding: "7px 18px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            fontFamily: T.font, cursor: "pointer",
            background: activeRecruiter === name ? RECRUITER_ARC[name].color : T.surface,
            color: activeRecruiter === name ? "#fff" : T.textMid,
            border: `1px solid ${activeRecruiter === name ? RECRUITER_ARC[name].color : T.border}`,
            transition: "all 0.15s",
          }}>{name}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: T.textDim, alignSelf: "center", fontFamily: T.mono }}>
          Arc: {arc.arcStart} → {arc.arcEnd} · {arc.rolesOwned} roles owned · {arc.currentOpenings} currently open
        </div>
      </div>

      {/* ── Arc summary tiles ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Hires (6mo Arc)", value: totalHired, accent: T.green, sub: "Oct 2025 → Mar 2026 · includes pre-plan" },
          { label: "Current Openings", value: arc.currentOpenings, accent: arc.color, sub: "Active requisitions" },
          { label: "Applicants Reviewed", value: totalReviewed, accent: T.textMid, sub: "6mo inbound volume" },
          { label: "Offer Decline Rate", value: `${arc.signals.offerDeclineRate}%`, accent: arc.signals.offerDeclineRate > 25 ? T.yellow : T.green, sub: arc.signals.offerDeclineRate > 25 ? "Elevated — see notes" : "Within normal range" },
          { label: "HM Feedback Lag", value: `${arc.signals.hmFeedbackLag}d`, accent: arc.signals.hmFeedbackLag > 4 ? T.yellow : T.green, sub: "Avg HM response time — not recruiter" },
        ].map((tile, i) => (
          <div key={i} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, fontFamily: T.font }}>{tile.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 700, color: tile.accent, lineHeight: 1 }}>{tile.value}</div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 5 }}>{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Two-month buckets ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {arc.buckets.map((bucket, bi) => {
          const isCurrent = bi === arc.buckets.length - 1;
          return (
            <div key={bi} style={{
              background: isCurrent ? currentBg : T.surface,
              border: `1px solid ${isCurrent ? currentBorder : T.border}`,
              borderRadius: 10, padding: "18px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? arc.color : T.textMid, fontFamily: T.font }}>{bucket.label}</div>
                {isCurrent && <Badge color={arc.color === T.accent ? "accent" : "purple"}>Current</Badge>}
              </div>

              {/* CONTROLS */}
              <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.green, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, fontFamily: T.font }}>
                ✓ Recruiter Controls
              </div>
              {[
                ["Applicants Reviewed", bucket.activity.applicantsReviewed],
                ["Applicants Advanced", bucket.activity.applicantsAdvanced],
                ["Screens Completed", bucket.activity.screensCompleted],
                ["Submittals to HM", bucket.activity.submittalsToHM],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ fontSize: 11, color: T.textMid }}>{label}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text }}>{val}</span>
                </div>
              ))}

              {/* SYSTEM FACTORS */}
              <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.yellow, fontWeight: 700, textTransform: "uppercase", margin: "12px 0 8px", fontFamily: T.font }}>
                ◎ System Factors
              </div>
              {[
                ["HM Interviews", bucket.conversion.hmInterviews, null],
                ["Final Rounds", bucket.conversion.finalRounds, null],
                ["Offers Extended", bucket.conversion.offersExtended, null],
                ["Offer Declines", bucket.conversion.offerDeclines, bucket.conversion.offerDeclines > 1 ? T.yellow : null],
                ["Candidate Withdrawals", bucket.conversion.candidateWithdrawals, null],
              ].map(([label, val, warn]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ fontSize: 11, color: T.textMid }}>{label}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: warn || T.text }}>{val}</span>
                </div>
              ))}

              {/* OUTCOME */}
              <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", margin: "12px 0 8px", fontFamily: T.font }}>
                ◈ Outcome (Lagging)
              </div>
              {[
                ["Hires", bucket.outcomes.hired, T.green, false],
                ["Retained at 90 Days", bucket.outcomes.retainedAt90Days, T.green, true],
              ].map(([label, val, color, isPending]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ fontSize: 11, color: T.textMid }}>{label}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: val === null ? T.textDim : color }}>
                    {val === null ? "pending" : val}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Hire cadence: Monthly / Bi-Monthly / Bi-Annual ── */}
      <SectionDivider label="Hire Cadence — Why Output Looks Uneven" />
      <div style={{
        background: "rgba(255,255,255,0.015)", border: `1px solid ${T.border}`,
        borderRadius: 10, padding: "18px 20px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.7, marginBottom: 16, maxWidth: 760 }}>
          A recruiter can do excellent work for 3 months and show 0 hires, then close 3 roles in a single month.
          This is normal. The charts below show the same data at three intervals — the pattern tells the real story.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr", gap: 20 }}>

          {/* Monthly */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: T.font }}>Monthly Hires</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
              {arc.monthlyHires.map((m, i) => {
                const maxH = Math.max(...arc.monthlyHires.map(x => x.hired), 1);
                const barH = m.hired === 0 ? 4 : Math.round((m.hired / maxH) * 68) + 8;
                const isCurr = i === arc.monthlyHires.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, fontFamily: T.mono, color: m.hired > 0 ? T.green : T.textDim, fontWeight: 700 }}>
                      {m.hired > 0 ? m.hired : "—"}
                    </div>
                    <div style={{
                      width: "100%", height: barH,
                      background: isCurr ? `${arc.color}88` : m.hired > 0 ? T.green : "rgba(255,255,255,0.06)",
                      borderRadius: "3px 3px 0 0",
                      border: isCurr ? `1px solid ${arc.color}` : "none",
                      transition: "height 0.4s ease",
                    }} />
                    <div style={{ fontSize: 9, color: isCurr ? arc.color : T.textDim, fontFamily: T.font, textAlign: "center" }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bi-Monthly */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: T.font }}>Bi-Monthly Hires</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {biMonthlyHires.map((b, i) => {
                const maxH = Math.max(...biMonthlyHires.map(x => x.hired), 1);
                const barW = b.hired === 0 ? 4 : Math.round((b.hired / maxH) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: T.textDim }}>{b.label}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: b.hired > 0 ? T.green : T.textDim, fontWeight: 700 }}>{b.hired}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barW}%`, background: b.hired > 0 ? T.green : "transparent", borderRadius: 2, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bi-Annual */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: T.font }}>6-Month Total</div>
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 52, fontWeight: 700, color: T.green, lineHeight: 1 }}>{totalHired}</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 6 }}>hires across full arc</div>
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
                {arc.rolesOwned} roles assigned · {Math.round((totalHired / arc.rolesOwned) * 100)}% fill rate
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Diagnostic signals + Notes ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, fontFamily: T.font }}>
            Diagnostic Signals
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 14 }}>Where is time being lost, and who owns it?</div>

          {/* Delay ownership bar */}
          {(() => {
            const d = RECRUITER_DELAY_OWNERSHIP[activeRecruiter];
            const total = d.recruiterOwnedAvg + d.hiringTeamOwnedAvg + d.candidateOwnedAvg;
            const rPct = Math.round((d.recruiterOwnedAvg / total) * 100);
            const hPct = Math.round((d.hiringTeamOwnedAvg / total) * 100);
            const cPct = 100 - rPct - hPct;
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 8, gap: 2 }}>
                  <div style={{ width: `${rPct}%`, background: T.accent }} />
                  <div style={{ width: `${hPct}%`, background: T.yellow }} />
                  <div style={{ width: `${cPct}%`, background: T.purple }} />
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  {[
                    { label: "Recruiter", val: d.recruiterOwnedAvg, color: T.accent },
                    { label: "Hiring Team", val: d.hiringTeamOwnedAvg, color: T.yellow },
                    { label: "Candidate", val: d.candidateOwnedAvg, color: T.purple },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: T.textDim, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}d</div>
                      <div style={{ fontSize: 9, color: T.textDim }}>avg owned</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.18)" }}>
                  <div style={{ fontSize: 9, color: T.yellow, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>◎ Primary Bottleneck</div>
                  <div style={{ fontSize: 11, color: T.textMid }}>{d.bottleneck.stage}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.yellow, fontWeight: 700 }}>{d.bottleneck.avgDays}d avg · Hiring Team</div>
                </div>
              </div>
            );
          })()}

          {[
            { label: "Offer Decline Rate", value: `${arc.signals.offerDeclineRate}%`, warn: arc.signals.offerDeclineRate > 25, note: "If elevated: comp misalignment or HM closing issue — not recruiter" },
            { label: "Candidate Withdrawal Rate", value: `${arc.signals.withdrawalRate}%`, warn: arc.signals.withdrawalRate > 20, note: "If elevated: candidate experience or process length issue" },
            { label: "Interview Cancel Rate", value: `${arc.signals.interviewCancelRate}%`, warn: arc.signals.interviewCancelRate > 12, note: "Scheduling friction — usually hiring team side" },
          ].map(({ label, value, warn, note }) => (
            <div key={label} style={{ padding: "9px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 12, color: T.text }}>{label}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: warn ? T.yellow : T.green }}>{value}</span>
              </div>
              <div style={{ fontSize: 10, color: T.textDim }}>{note}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: T.font }}>
            Notes & Flags
          </div>
          {arc.notes.map((note, i) => (
            <div key={i} style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 8,
              background: note.type === "watch" ? T.yellowFaint : T.greenFaint,
              border: `1px solid ${note.type === "watch" ? "rgba(234,179,8,0.2)" : "rgba(34,197,94,0.2)"}`,
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.1em", color: note.type === "watch" ? T.yellow : T.green, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, fontFamily: T.font }}>
                {note.type === "watch" ? "◎ Watch" : "✓ Positive"}
              </div>
              <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.6 }}>{note.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HRIS Signals — bottom, pending integration ── */}
      <SectionDivider label="HRIS Signals — Post-Hire Quality (Pending Rippling Integration)" />
      <div style={{
        background: "rgba(255,255,255,0.015)", border: `1px dashed ${T.border}`,
        borderRadius: 10, padding: "14px 18px", marginBottom: 8,
        fontSize: 11, color: T.textDim, lineHeight: 1.6,
      }}>
        These signals — retention, onboarding scores, 30/60/90-day check-ins — will populate once Rippling is connected.
        They confirm quality of hire after the candidate starts, not just speed of fill. Currently showing mock data.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, opacity: 0.65 }}>
        {[
          { label: "Offer → Day 1 Gap",  value: `${arc.hris.offerToStartGap}d`,       sub: "Avg days offer accept to start",       warn: arc.hris.offerToStartGap > 25 },
          { label: "Day 1 Show Rate",    value: `${arc.hris.day1ShowRate}%`,            sub: "Accepted offers who actually started",  warn: arc.hris.day1ShowRate < 95 },
          { label: "30-Day Check-in",    value: `${arc.hris.day30CheckinRate}%`,        sub: "New hire 30-day review completion",     warn: arc.hris.day30CheckinRate < 80 },
          { label: "60-Day Check-in",    value: `${arc.hris.day60CheckinRate}%`,        sub: "New hire 60-day review completion",     warn: arc.hris.day60CheckinRate < 80 },
          { label: "90-Day Retention",   value: `${arc.hris.day90RetentionRate}%`,      sub: "Still employed at 90 days",             warn: arc.hris.day90RetentionRate < 90 },
          { label: "Onboarding Score",   value: `${arc.hris.avgOnboardingScore}/5`,     sub: "New hire satisfaction at 30 days",      warn: arc.hris.avgOnboardingScore < 3.5 },
          { label: "Internal Mobility",  value: arc.hris.internalMobilityCount,         sub: "Promotions/transfers within arc",       warn: false },
          { label: "Quality Score",      value: "A+",                                   sub: "Composite: retention + satisfaction",   warn: false },
        ].map((s, i) => (
          <div key={i} style={{
            background: s.warn ? T.yellowFaint : T.greenFaint,
            border: `1px solid ${s.warn ? "rgba(234,179,8,0.2)" : "rgba(34,197,94,0.15)"}`,
            borderRadius: 8, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 9, letterSpacing: "0.1em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, fontFamily: T.font }}>{s.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: s.warn ? T.yellow : T.green, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
const STATUS_ORDER = { filled: 0, in_progress: 1, open: 2 };

function TabHiringPlan({ hiringPlan }) {
  const plan = hiringPlan || [];
  const { sortKey, sortDir, handleSort } = useSortState("hiring_plan", null, "asc");

  const sorted = sortKey ? [...plan].sort((a, b) => {
    let aVal, bVal;
    switch (sortKey) {
      case "id":    aVal = a.id;          bVal = b.id;          break;
      case "title": aVal = a.description; bVal = b.description; break;
      case "dept":  aVal = a.dept;        bVal = b.dept;        break;
      case "date":  aVal = a.targetHireDate || ""; bVal = b.targetHireDate || ""; break;
      case "state": aVal = a.openingState; bVal = b.openingState; break;
      default: return 0;
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  }) : plan;

  const cols = [
    { key: "id",    label: "ID" },
    { key: "title", label: "Role" },
    { key: "dept",  label: "Dept" },
    { key: "date",  label: "Target Hire Date" },
    { key: "state", label: "State" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatTile label="Approved Headcount" value={plan.length} sub="2026 approved openings" animate={0} />
      </div>

      <SectionDivider label="Role Detail" />

      <Card animate={0} style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
              {cols.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{
                  padding: "11px 18px", textAlign: "left", fontSize: 9, letterSpacing: "0.12em",
                  color: sortKey === col.key ? T.accent : T.textDim,
                  fontWeight: 700, textTransform: "uppercase", fontFamily: T.font,
                  whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
                  transition: "color 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accentSoft}
                  onMouseLeave={e => e.currentTarget.style.color = sortKey === col.key ? T.accent : T.textDim}
                >
                  {col.label} <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.length === 0 ? (
              <tr>
                <td colSpan={cols.length} style={{ padding: "32px 18px", textAlign: "center", fontSize: 12, color: T.textDim }}>
                  {hiringPlan === null ? "Loading…" : "No approved openings found"}
                </td>
              </tr>
            ) : sorted.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: i < sorted.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "13px 18px", fontFamily: T.mono, fontSize: 10, color: T.textDim }}>{row.id}</td>
                <td style={{ padding: "13px 18px", fontSize: 13, fontWeight: 600, color: T.text }}>{row.description || "—"}</td>
                <td style={{ padding: "13px 18px", fontSize: 12, color: T.textMid }}>{row.dept}</td>
                <td style={{ padding: "13px 18px", fontFamily: T.mono, fontSize: 11, color: T.textDim }}>{row.targetHireDate || "—"}</td>
                <td style={{ padding: "13px 18px" }}><Badge color="accent">{row.openingState}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{ marginTop: 10, fontSize: 11, color: T.textDim, fontFamily: T.mono }}>
        {plan.length > 0 ? `${sorted.length} approved openings · 2026 · Click any column header to sort` : ""}
      </div>
    </div>
  );
}

// ─── TAB: PIPELINE BY STAGE ──────────────────────────────────────────────────
function RoleDrillDown() {
  const [selectedRole, setSelectedRole] = useState(null);

  const ownerColor = (owner) => owner === "recruiter" ? T.accent : owner === "hiring_team" ? T.yellow : T.purple;
  const ownerLabel = (owner) => owner === "recruiter" ? "Recruiter" : owner === "hiring_team" ? "Hiring Team" : "Candidate";

  const activeRole = selectedRole
    ? ROLE_STAGE_VELOCITY.find(r => r.id === selectedRole)
    : null;

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font, marginRight: 4 }}>
          Stage Timing — Drill Into Role
        </div>
        <button onClick={() => setSelectedRole(null)} style={{
          padding: "4px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600,
          fontFamily: T.font, cursor: "pointer",
          background: !selectedRole ? T.accent : T.surface,
          color: !selectedRole ? "#fff" : T.textMid,
          border: `1px solid ${!selectedRole ? T.accent : T.border}`,
        }}>All</button>
        {ROLE_STAGE_VELOCITY.map(r => (
          <button key={r.id} onClick={() => setSelectedRole(r.id === selectedRole ? null : r.id)} style={{
            padding: "4px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600,
            fontFamily: T.font, cursor: "pointer",
            background: selectedRole === r.id ? T.accent : T.surface,
            color: selectedRole === r.id ? "#fff" : T.textMid,
            border: `1px solid ${selectedRole === r.id ? T.accent : T.border}`,
            transition: "all 0.15s",
          }}>{r.id}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 10, color: T.textDim }}>
          <span style={{ color: T.accent }}>●</span> Recruiter &nbsp;
          <span style={{ color: T.yellow }}>●</span> Hiring Team &nbsp;
          <span style={{ color: T.purple }}>●</span> Candidate
        </div>
      </div>

      {activeRole ? (
        <div>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{activeRole.role}</span>
            <span style={{ fontSize: 11, color: T.textDim, marginLeft: 10 }}>{activeRole.recruiter} · {activeRole.dept}</span>
          </div>
          {activeRole.transitions.map((t, i) => {
            const isOver = t.days !== null && t.days > (STAGE_TRANSITIONS_AGG[i]?.threshold || 99);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", marginBottom: 6, borderRadius: 8,
                background: isOver ? "rgba(234,179,8,0.07)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isOver ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ownerColor(t.owner), flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: T.textMid }}>{t.stage}</span>
                <span style={{ fontSize: 9, color: ownerColor(t.owner), fontFamily: T.font, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, minWidth: 80 }}>
                  {ownerLabel(t.owner)}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, minWidth: 60, textAlign: "right", color: t.days === null ? T.textDim : isOver ? T.yellow : T.green }}>
                  {t.days === null ? "—" : `${t.days}d`}
                </span>
                {isOver && <Badge color="yellow">⚠</Badge>}
                {t.days === null && <span style={{ fontSize: 9, color: T.textDim }}>not yet reached</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Role", "Recruiter", "Screened→HM", "HM→Final", "Final→Offer", "Offer→Decision", "Bottleneck"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, letterSpacing: "0.1em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_STAGE_VELOCITY.map((r) => {
              const get = (idx) => r.transitions[idx]?.days;
              const thresholds = [4, 5, 3, 7];
              const vals = [get(1), get(2), get(3), get(4)];
              const bottleneckIdx = vals.reduce((worst, v, idx) => {
                if (v === null) return worst;
                const over = v - thresholds[idx];
                return (worst === -1 || over > (vals[worst] - thresholds[worst])) ? idx : worst;
              }, -1);
              const bottleneckLabels = ["Screened→HM", "HM→Final", "Final→Offer", "Offer→Dec"];
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "9px 10px" }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{r.role}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{r.id}</div>
                  </td>
                  <td style={{ padding: "9px 10px", fontSize: 11, color: T.textMid }}>{r.recruiter.split(" ")[0]}</td>
                  {vals.map((v, vi) => {
                    const over = v !== null && v > thresholds[vi];
                    return (
                      <td key={vi} style={{ padding: "9px 10px", fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: v === null ? T.textFaint : over ? T.yellow : T.green }}>
                        {v === null ? "—" : `${v}d`}
                      </td>
                    );
                  })}
                  <td style={{ padding: "9px 10px" }}>
                    {bottleneckIdx >= 0 && vals[bottleneckIdx] !== null && vals[bottleneckIdx] > thresholds[bottleneckIdx] ? (
                      <Badge color="yellow">{bottleneckLabels[bottleneckIdx]}</Badge>
                    ) : (
                      <span style={{ fontSize: 10, color: T.green }}>✓ On track</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TabPipeline({ stageCounts }) {
  const openRoles = PLAN_DATA.filter(r => r.status !== "filled");
  const stageColors = ["#1e3a5f", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#34d399", "#a3e635", "#22c55e"];

  const pipelineData = ASHBY_STAGE_ORDER.map(stage => ({
    stage,
    count: stageCounts ? (stageCounts[stage] ?? 0) : 0,
  }));
  const { sortKey: sqKey, sortDir: sqDir, handleSort: sqSort, } = useSortState("source_quality", "advanceRate", "desc");

  // Build source rows with computed totals, then sort
  const sourceRows = SOURCES.map(src => {
    const get = (data, idx) => data[idx][src.key] || 0;
    const applied     = get(FUNNEL_ENG, 0) + get(FUNNEL_NONENG, 0);
    const screened    = get(FUNNEL_ENG, 1) + get(FUNNEL_NONENG, 1);
    const hmInterview = get(FUNNEL_ENG, 2) + get(FUNNEL_NONENG, 2);
    const hired       = get(FUNNEL_ENG, 5) + get(FUNNEL_NONENG, 5);
    const advanceRate = applied > 0 ? Math.round((hmInterview / applied) * 100) : 0;
    const hireRate    = applied > 0 ? Math.round((hired / applied) * 100) : 0;
    return { ...src, applied, screened, hmInterview, hired, advanceRate, hireRate };
  }).sort((a, b) => {
    const av = a[sqKey] ?? 0;
    const bv = b[sqKey] ?? 0;
    if (typeof av === "string") return sqDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sqDir === "asc" ? av - bv : bv - av;
  });

  return (
    <div>
      {/* ── Pipeline by stage ── */}
      <Card animate={0} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <CardLabel>Active Pipeline — All Tracks</CardLabel>
          <Badge color="accent">{openRoles.length} open roles</Badge>
          {!stageCounts && <Badge color="dim">loading…</Badge>}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineData} layout="vertical" barCategoryGap="28%">
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="stage" tick={{ fill: T.textMid, fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
            <Tooltip content={<CustomTooltip formatter={p => `${p.value} candidates`} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {pipelineData.map((_, i) => <Cell key={i} fill={stageColors[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Conversion funnel — dual, source-stacked ── */}
      <SectionDivider label="Stage Conversion Funnel — Source of Pipeline by Track" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
        {[
          { label: "Engineering", badge: "accent", data: FUNNEL_ENG },
          { label: "Non-Engineering", badge: "purple", data: FUNNEL_NONENG },
        ].map(({ label, badge, data }) => {
          // Compute total per stage and conversion rates
          const withTotals = data.map((row, i) => {
            const total = SOURCES.reduce((s, src) => s + (row[src.key] || 0), 0);
            const prevTotal = i > 0 ? SOURCES.reduce((s, src) => s + (data[i - 1][src.key] || 0), 0) : null;
            const rate = prevTotal ? Math.round((total / prevTotal) * 100) : null;
            return { ...row, _total: total, _rate: rate };
          });

          return (
            <Card key={label} animate={2}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <CardLabel>{label} — Source Funnel</CardLabel>
                <Badge color={badge}>{withTotals[0]._total} applied</Badge>
              </div>

              {/* Source legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {SOURCES.map(s => (
                  <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: T.textDim }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Stacked funnel bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                {withTotals.map((row, i) => {
                  const maxTotal = withTotals[0]._total;
                  const barH = Math.max(Math.round((row._total / maxTotal) * 160), 14);
                  const isHired = i === withTotals.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {/* Conversion rate */}
                      <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {row._rate !== null && (
                          <span style={{
                            fontSize: 9, fontFamily: T.mono, fontWeight: 700,
                            color: row._rate < 25 ? T.yellow : row._rate < 55 ? T.textMid : T.green,
                          }}>{row._rate}%</span>
                        )}
                      </div>

                      {/* Stacked source bar */}
                      <div style={{ width: "85%", borderRadius: "3px 3px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {SOURCES.map(src => {
                          const count = row[src.key] || 0;
                          if (count === 0) return null;
                          const segH = Math.max(Math.round((count / row._total) * barH), 2);
                          return (
                            <div key={src.key} style={{
                              height: segH, background: src.color, opacity: isHired ? 1 : 0.82,
                              transition: "height 0.4s ease",
                            }} title={`${src.label}: ${count}`} />
                          );
                        })}
                      </div>

                      {/* Total count */}
                      <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, marginTop: 6, color: isHired ? T.green : T.text }}>
                        {row._total}
                      </div>
                      <div style={{ fontSize: 8, color: T.textDim, textAlign: "center", marginTop: 2, lineHeight: 1.4 }}>
                        {row.stage}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Source quality table — combined Eng + Non-Eng */}
      <Card animate={3} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <CardLabel>Source Quality — Combined</CardLabel>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: -8 }}>Click any column to sort · Eng + Non-Eng combined</div>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {[
                { key: "label",       label: "Source" },
                { key: "applied",     label: "Applied" },
                { key: "screened",    label: "Screened" },
                { key: "hmInterview", label: "HM Interview" },
                { key: "hired",       label: "Hired" },
                { key: "advanceRate", label: "Advance Rate" },
                { key: "hireRate",    label: "Hire Rate" },
              ].map(col => (
                <th key={col.key} onClick={() => sqSort(col.key)} style={{
                  padding: "8px 12px", textAlign: "left", fontSize: 9, letterSpacing: "0.1em",
                  color: sqKey === col.key ? T.accent : T.textDim,
                  fontWeight: 700, textTransform: "uppercase", fontFamily: T.font,
                  whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", transition: "color 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accentSoft}
                  onMouseLeave={e => e.currentTarget.style.color = sqKey === col.key ? T.accent : T.textDim}
                >
                  {col.label} <SortIcon col={col.key} sortKey={sqKey} sortDir={sqDir} />
                </th>
              ))}
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, letterSpacing: "0.1em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font }}>Signal</th>
            </tr>
          </thead>
          <tbody>
            {sourceRows.map(s => (
              <tr key={s.key} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "11px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{s.label}</span>
                  </div>
                </td>
                <td style={{ padding: "11px 12px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{s.applied}</td>
                <td style={{ padding: "11px 12px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{s.screened}</td>
                <td style={{ padding: "11px 12px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{s.hmInterview}</td>
                <td style={{ padding: "11px 12px", fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: s.hired > 0 ? T.green : T.textDim }}>{s.hired}</td>
                <td style={{ padding: "11px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(s.advanceRate * 3, 100)}%`, background: s.advanceRate > 10 ? T.green : T.yellow, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: s.advanceRate > 10 ? T.green : T.yellow }}>{s.advanceRate}%</span>
                  </div>
                </td>
                <td style={{ padding: "11px 12px", fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: s.hireRate > 0 ? T.green : T.textDim }}>{s.hireRate}%</td>
                <td style={{ padding: "11px 12px" }}>
                  {s.advanceRate >= 15 ? <Badge color="green">High quality</Badge>
                    : s.advanceRate >= 8  ? <Badge color="accent">Solid</Badge>
                    : s.applied > 100 && s.hired === 0 ? <Badge color="yellow">Low yield</Badge>
                    : <Badge color="dim">Developing</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(255,103,25,0.06)", border: "1px solid rgba(255,103,25,0.18)", fontSize: 11, color: T.textMid }}>
          <span style={{ color: T.accent, fontWeight: 700 }}>Referrals</span> and <span style={{ color: T.accent, fontWeight: 700 }}>Outbound</span> lead on advance rate despite lower volume.
          Company Site drives high inbound with near-zero yield — worth auditing the job posting quality or application funnel.
        </div>
      </Card>

      {/* ── Open roles ── */}
      <SectionDivider label="Open Roles — Days in Current Stage" />
      <PipelineRolesTable openRoles={openRoles} />

      {/* ── Role drill-down ── */}
      <SectionDivider label="Stage Timing — Drill Into Role" />
      <RoleDrillDown />
    </div>
  );
}

function PipelineRolesTable({ openRoles }) {
  const { sortKey, sortDir, handleSort, } = useSortState("pipeline_roles", "days", "desc");

  const rolesWithDays = openRoles.map(r => ({
    ...r,
    days: r.status === "in_progress" ? (r.id.charCodeAt(0) + r.id.charCodeAt(4)) % 18 + 3 : null,
  }));

  const sorted = [...rolesWithDays].sort((a, b) => {
    let av, bv;
    switch (sortKey) {
      case "title":     av = a.title;      bv = b.title;      break;
      case "dept":      av = a.dept;       bv = b.dept;       break;
      case "hm":        av = a.hm;         bv = b.hm;         break;
      case "recruiter": av = a.recruiter;  bv = b.recruiter;  break;
      case "stage":     av = a.status;     bv = b.status;     break;
      case "days":      av = a.days ?? -1; bv = b.days ?? -1; break;
      default: return 0;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const cols = [
    { key: "title", label: "Role" },
    { key: "dept", label: "Dept" },
    { key: "hm", label: "HM" },
    { key: "recruiter", label: "Recruiter" },
    { key: "stage", label: "Stage" },
    { key: "days", label: "Days in Stage" },
  ];

  return (
    <Card animate={3} style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
            {cols.map(col => (
              <th key={col.key} onClick={() => handleSort(col.key)} style={{
                padding: "10px 18px", textAlign: "left", fontSize: 9, letterSpacing: "0.12em",
                color: sortKey === col.key ? T.accent : T.textDim,
                fontWeight: 700, textTransform: "uppercase", fontFamily: T.font,
                cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", transition: "color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = T.accentSoft}
                onMouseLeave={e => e.currentTarget.style.color = sortKey === col.key ? T.accent : T.textDim}
              >
                {col.label}{SortIcon({ col: col.key})}               </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const stalled = r.days > 12;
            return (
              <tr key={r.id} style={{ borderBottom: i < sorted.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 18px", fontSize: 13, fontWeight: 600, color: T.text }}>{r.title}</td>
                <td style={{ padding: "12px 18px", fontSize: 11, color: r.dept === "Engineering" ? T.accentSoft : "#d8b4fe" }}>{r.dept}</td>
                <td style={{ padding: "12px 18px", fontSize: 11, color: T.textMid }}>{r.hm}</td>
                <td style={{ padding: "12px 18px", fontSize: 11, color: T.textMid }}>{r.recruiter}</td>
                <td style={{ padding: "12px 18px" }}>
                  <Badge color={r.status === "in_progress" ? "accent" : "dim"}>
                    {r.status === "in_progress" ? "Active Search" : "Not Started"}
                  </Badge>
                </td>
                <td style={{ padding: "12px 18px", fontFamily: T.mono, fontSize: 12, color: stalled ? T.red : T.textMid }}>
                  {r.days !== null ? `${r.days}d ${stalled ? "⚠" : ""}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ─── TAB: BOARD TRACKER ──────────────────────────────────────────────────────
function TabBoard() {
  const { sortKey, sortDir, handleSort } = useSortState("board", "startDate", "asc");
  const [lastBoard, setLastBoard] = useState(
    () => localStorage.getItem("board_date_last") || BOARD_DATE_LAST
  );
  const [nextBoard, setNextBoard] = useState(
    () => localStorage.getItem("board_date_next") || BOARD_DATE_NEXT
  );

  const handleLastBoard = (val) => {
    setLastBoard(val);
    localStorage.setItem("board_date_last", val);
  };
  const handleNextBoard = (val) => {
    setNextBoard(val);
    localStorage.setItem("board_date_next", val);
  };

  const today = new Date("2026-03-13");
  const lastBoardDate = new Date(lastBoard);
  const nextBoardDate = new Date(nextBoard);
  const daysSinceLast = Math.round((today - lastBoardDate) / 86400000);
  const daysToNext = Math.round((nextBoardDate - today) / 86400000);

  const boardHires = PLAN_DATA.filter(r =>
    r.status === "filled" &&
    r.startDate &&
    new Date(r.startDate) > lastBoardDate
  ).map(r => ({
    name: r.candidate, title: r.title, dept: r.dept,
    startDate: r.startDate, recruiter: r.recruiter,
  }));

  const engHires = boardHires.filter(h => h.dept === "Engineering");
  const nonEngHires = boardHires.filter(h => h.dept !== "Engineering");

  const sorted = [...boardHires].sort((a, b) => {
    let av, bv;
    switch (sortKey) {
      case "name":      av = a.name;      bv = b.name;      break;
      case "title":     av = a.title;     bv = b.title;     break;
      case "dept":      av = a.dept;      bv = b.dept;      break;
      case "startDate": av = a.startDate; bv = b.startDate; break;
      case "recruiter": av = a.recruiter; bv = b.recruiter; break;
      case "track":     av = a.dept === "Engineering" ? 0 : 1; bv = b.dept === "Engineering" ? 0 : 1; break;
      default: return 0;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const cols = [
    { key: "name",      label: "Name" },
    { key: "title",     label: "Title" },
    { key: "dept",      label: "Department" },
    { key: "startDate", label: "Start Date" },
    { key: "recruiter", label: "Recruiter" },
    { key: "track",     label: "Track" },
  ];

  const inputStyle = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 6, padding: "6px 10px", color: T.text,
    fontFamily: T.mono, fontSize: 13, cursor: "pointer",
    colorScheme: "dark",
  };

  return (
    <div>
      {/* ── Date config ── */}
      <div style={{
        background: "rgba(255,103,25,0.06)", border: `1px solid rgba(255,103,25,0.18)`,
        borderRadius: 10, padding: "14px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.accentSoft, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font }}>
          Board Meeting Dates
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 11, color: T.textDim }}>Last meeting</label>
          <input type="date" value={lastBoard} onChange={e => handleLastBoard(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 11, color: T.textDim }}>Next meeting</label>
          <input type="date" value={nextBoard} onChange={e => handleNextBoard(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginLeft: "auto" }}>
          Changes save automatically · no page reload needed
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Card animate={0} style={{ flex: 1 }}>
          <CardLabel>Last Board Meeting</CardLabel>
          <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.textMid }}>
            {lastBoardDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{daysSinceLast} days ago</div>
        </Card>
        <Card animate={1} style={{ flex: 1 }}>
          <CardLabel>Next Board Meeting</CardLabel>
          <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.accent }}>
            {nextBoardDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{daysToNext} days from today</div>
        </Card>
        <Card animate={2} style={{ flex: 1 }}>
          <CardLabel>Total Hires Since Last Board</CardLabel>
          <div style={{ fontFamily: T.mono, fontSize: 40, fontWeight: 700, color: T.green, lineHeight: 1 }}>{boardHires.length}</div>
        </Card>
        <Card animate={3} style={{ flex: 1 }}>
          <CardLabel>Engineering Hires</CardLabel>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontFamily: T.mono, fontSize: 40, fontWeight: 700, color: T.accentSoft, lineHeight: 1 }}>{engHires.length}</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, color: T.textDim, paddingBottom: 4 }}>/ {nonEngHires.length} non-eng</div>
          </div>
        </Card>
      </div>

      {/* ── Hires table ── */}
      <Card animate={4} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font }}>
            All Hires Since Last Board Meeting
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Badge color="accent">{engHires.length} Engineering</Badge>
            <Badge color="purple">{nonEngHires.length} Non-Engineering</Badge>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
              {cols.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{
                  padding: "10px 24px", textAlign: "left", fontSize: 9, letterSpacing: "0.12em",
                  color: sortKey === col.key ? T.accent : T.textDim,
                  fontWeight: 700, textTransform: "uppercase", fontFamily: T.font,
                  cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", transition: "color 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accentSoft}
                  onMouseLeave={e => e.currentTarget.style.color = sortKey === col.key ? T.accent : T.textDim}
                >
                  {col.label}
                  <span style={{ marginLeft: 4, color: sortKey === col.key ? T.accent : T.textFaint }}>
                    {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, i) => (
              <tr key={i} style={{ borderBottom: i < sorted.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "13px 24px", fontSize: 14, fontWeight: 600, color: T.text }}>{h.name}</td>
                <td style={{ padding: "13px 24px", fontSize: 12, color: T.textMid }}>{h.title}</td>
                <td style={{ padding: "13px 24px" }}>
                  <Badge color={h.dept === "Engineering" ? "accent" : "purple"}>{h.dept}</Badge>
                </td>
                <td style={{ padding: "13px 24px", fontFamily: T.mono, fontSize: 11, color: T.textDim }}>
                  {new Date(h.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td style={{ padding: "13px 24px", fontSize: 11, color: T.textMid }}>{h.recruiter}</td>
                <td style={{ padding: "13px 24px" }}>
                  <Badge color={h.dept === "Engineering" ? "accent" : "purple"}>
                    {h.dept === "Engineering" ? "Eng" : "Non-Eng"}
                  </Badge>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: T.textDim, fontSize: 12 }}>
                  No hires recorded after {lastBoardDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


// ─── TAB: WEEKLY SNAPSHOT ────────────────────────────────────────────────────
function TabWeekly() {
  const snap = WEEKLY_SNAPSHOT;
  const weekEndingFmt = new Date(snap.weekEnding).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div>
      {/* Header callout */}
      <div style={{ background: T.accentFaint, border: `1px solid rgba(14,165,233,0.25)`, borderRadius: 10, padding: "14px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.accentSoft, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Weekly Hiring Snapshot</div>
          <div style={{ fontSize: 13, color: T.text }}>Week ending {weekEndingFmt} · Thursday internal review</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Badge color="accent">Thurs → Emily + Russell</Badge>
          <Badge color="dim">Fri → Leadership</Badge>
        </div>
      </div>

      {/* Top stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <StatTile label="Hires This Week" value={snap.hiresThisWeek.length} accent={T.green} animate={0} />
        <StatTile label="Hires Since Board" value={snap.hiresSinceBoard} accent={T.green} sub={`${snap.engHiresSinceBoard} Engineering`} animate={1} />
        <StatTile label="Open Reqs" value={snap.openReqs} animate={2} />
        <StatTile label="Offers Out" value={snap.offersOut} accent={T.yellow} animate={3} />
        <StatTile label="Final-Stage Candidates" value={snap.finalStage.length} accent={T.accentSoft} animate={4} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Hires this week */}
        <Card animate={5}>
          <CardLabel>Hires This Week</CardLabel>
          {snap.hiresThisWeek.length === 0 ? (
            <div style={{ color: T.textDim, fontSize: 13 }}>No new hires this week.</div>
          ) : snap.hiresThisWeek.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < snap.hiresThisWeek.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{h.name}</div>
                <div style={{ fontSize: 11, color: T.textMid }}>{h.title}</div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{h.recruiter}</div>
              </div>
              <Badge color={h.dept === "Engineering" ? "accent" : "purple"}>{h.dept}</Badge>
            </div>
          ))}
        </Card>

        {/* Final stage */}
        <Card animate={6}>
          <CardLabel>Final-Stage Candidates</CardLabel>
          {snap.finalStage.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < snap.finalStage.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 12, color: T.textMid }}>{c.role}</div>
                <div style={{ fontSize: 11, color: T.textDim }}>Unnamed candidate</div>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMid }}>{c.days}d in stage</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* At Risk */}
        <Card animate={7}>
          <CardLabel>Roles at Risk</CardLabel>
          {snap.atRisk.map((r, i) => (
            <div key={i} style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 8,
              background: r.urgency === "critical" ? T.redFaint : T.yellowFaint,
              border: `1px solid ${r.urgency === "critical" ? "rgba(239,68,68,0.25)" : "rgba(234,179,8,0.2)"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{r.role}</div>
                <Badge color={r.urgency === "critical" ? "red" : "yellow"}>{r.urgency}</Badge>
              </div>
              <div style={{ fontSize: 11, color: T.textMid }}>{r.reason}</div>
            </div>
          ))}
        </Card>

        {/* Blocked */}
        <Card animate={8}>
          <CardLabel>Blocked — Requires Leadership Input</CardLabel>
          {snap.blocked.map((b, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: T.textMid }}>{b}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Top 3 priorities */}
      <Card animate={9}>
        <CardLabel>Top 3 Priorities — Next Week</CardLabel>
        {snap.top3.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "10px 0", borderBottom: i < snap.top3.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: T.accentFaint, minWidth: 28, lineHeight: 1.3 }}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{item}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── TAB: 2025 YEAR IN REVIEW ────────────────────────────────────────────────
function Tab2025() {
  const { sortKey: sqKey25, sortDir: sqDir25, handleSort: sqSort25, SortIcon: SqIcon25 } = useSortState("source_2025", "advanceRate", "desc");

  // ── Planned vs actual ──
  const planned25    = PLAN_2025.filter(r => r.planned).length;
  const filled25     = PLAN_2025.filter(r => r.status === "filled").length;
  const missed25     = PLAN_2025.filter(r => r.status === "missed").length;
  const unplanned25  = PLAN_2025.filter(r => !r.planned && r.status === "filled").length;
  const pct25        = Math.round((filled25 / planned25) * 100);

  // 2026 for comparison
  const planned26    = PLAN_DATA.length;
  const filled26     = PLAN_DATA.filter(r => r.status === "filled").length;
  const pct26        = Math.round((filled26 / planned26) * 100);

  // By department 2025
  const depts25 = [...new Set(PLAN_2025.map(r => r.dept))].map(dept => {
    const roles = PLAN_2025.filter(r => r.dept === dept);
    return {
      dept,
      planned: roles.filter(r => r.planned).length,
      filled:  roles.filter(r => r.status === "filled").length,
      missed:  roles.filter(r => r.status === "missed").length,
    };
  });

  // ── Source quality 2025 ──
  const source2025Rows = SOURCES.map(src => {
    const get = (data, idx) => data[idx][src.key] || 0;
    const applied25     = get(FUNNEL_2025_ENG, 0) + get(FUNNEL_2025_NONENG, 0);
    const hmInterview25 = get(FUNNEL_2025_ENG, 2) + get(FUNNEL_2025_NONENG, 2);
    const hired25       = get(FUNNEL_2025_ENG, 5) + get(FUNNEL_2025_NONENG, 5);
    const applied26     = get(FUNNEL_ENG, 0) + get(FUNNEL_NONENG, 0);
    const hmInterview26 = get(FUNNEL_ENG, 2) + get(FUNNEL_NONENG, 2);
    const hired26       = get(FUNNEL_ENG, 5) + get(FUNNEL_NONENG, 5);
    const advanceRate25 = applied25 > 0 ? Math.round((hmInterview25 / applied25) * 100) : 0;
    const advanceRate26 = applied26 > 0 ? Math.round((hmInterview26 / applied26) * 100) : 0;
    const delta         = advanceRate26 - advanceRate25;
    return { ...src, applied25, hmInterview25, hired25, advanceRate25, advanceRate26: advanceRate26, hired26, delta };
  }).sort((a, b) => {
    const av = a[sqKey25] ?? 0; const bv = b[sqKey25] ?? 0;
    if (typeof av === "string") return sqDir25 === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sqDir25 === "asc" ? av - bv : bv - av;
  });

  // ── Recruiter arc comparison ──
  const arcComparison = Object.entries(ARC_2025).map(([name, data]) => {
    const arc26 = RECRUITER_ARC[name];
    const total25 = data.h1.hired + data.h2.hired;
    const total26 = arc26 ? arc26.buckets.reduce((s, b) => s + b.outcomes.hired, 0) : 0;
    const avgTTH25 = Math.round((data.h1.avgTimeToHire + data.h2.avgTimeToHire) / 2);
    const avgTTH26 = arc26?.signals.avgTimeToHire || 0;
    const offerDecline25 = Math.round((data.h1.offerDeclineRate + data.h2.offerDeclineRate) / 2);
    const offerDecline26 = arc26?.signals.offerDeclineRate || 0;
    return { name, total25, total26, avgTTH25, avgTTH26, offerDecline25, offerDecline26,
      color: arc26?.color || T.textMid };
  });

  const Delta = ({ val, invert = false, unit = "" }) => {
    if (val === 0) return <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 11 }}>—</span>;
    const positive = invert ? val < 0 : val > 0;
    return (
      <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: positive ? T.green : T.yellow }}>
        {val > 0 ? "+" : ""}{val}{unit}
      </span>
    );
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", color: T.accentSoft, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font, marginBottom: 6 }}>
          Full Year · January – December 2025
        </div>
        <div style={{ fontSize: 11, color: T.textDim }}>
          Complete Ashby history · comparing against 2026 YTD where applicable
        </div>
      </div>

      {/* ── Planned vs Actual summary tiles ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "2025 Plan",        value: planned25,   accent: T.textMid,   sub: "Roles planned" },
          { label: "Hired",            value: filled25,    accent: T.green,     sub: `${pct25}% of plan` },
          { label: "Missed",           value: missed25,    accent: T.yellow,    sub: "Rolled to 2026 or cancelled" },
          { label: "Unplanned Hires",  value: unplanned25, accent: T.purple,    sub: "Backfills not in original plan" },
          { label: "2026 YTD Hired",   value: filled26,    accent: T.green,     sub: `${pct26}% of plan · pace comparison` },
        ].map((tile, i) => (
          <StatTile key={i} label={tile.label} value={tile.value} accent={tile.accent} sub={tile.sub} animate={i} />
        ))}
      </div>

      {/* ── Progress bar comparison ── */}
      <Card animate={5} style={{ marginBottom: 20 }}>
        <CardLabel>Plan Attainment — 2025 Full Year vs 2026 YTD</CardLabel>
        {[
          { label: "2025 Full Year", pct: pct25, color: T.purple, count: `${filled25} / ${planned25}` },
          { label: "2026 YTD",       pct: pct26, color: T.accent, count: `${filled26} / ${planned26}` },
        ].map((bar, i) => (
          <div key={i} style={{ marginBottom: i === 0 ? 14 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: T.textMid }}>{bar.label}</span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: bar.color, fontWeight: 700 }}>{bar.count} · {bar.pct}%</span>
            </div>
            <div style={{ height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${bar.pct}%`, background: bar.color, borderRadius: 4, transition: "width 1s ease", opacity: 0.85 }} />
            </div>
          </div>
        ))}
      </Card>

      {/* ── By department ── */}
      <SectionDivider label="2025 Planned vs Actual — by Department" />
      <Card animate={6} style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
              {["Department", "Planned", "Hired", "Missed", "Fill Rate", "vs 2026 YTD"].map(h => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 9, letterSpacing: "0.12em", color: T.textDim, fontWeight: 700, textTransform: "uppercase", fontFamily: T.font }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {depts25.map((d, i) => {
              const fillRate = Math.round((d.filled / (d.planned || 1)) * 100);
              const dept26 = PLAN_DATA.filter(r => r.dept === d.dept);
              const hired26Dept = dept26.filter(r => r.status === "filled").length;
              const rate26 = Math.round((hired26Dept / (dept26.length || 1)) * 100);
              const delta = rate26 - fillRate;
              return (
                <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 20px", fontSize: 12, fontWeight: 600, color: T.text }}>{d.dept}</td>
                  <td style={{ padding: "11px 20px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{d.planned}</td>
                  <td style={{ padding: "11px 20px", fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.green }}>{d.filled}</td>
                  <td style={{ padding: "11px 20px", fontFamily: T.mono, fontSize: 12, color: d.missed > 0 ? T.yellow : T.textDim }}>{d.missed || "—"}</td>
                  <td style={{ padding: "11px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 50, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${fillRate}%`, background: fillRate >= 80 ? T.green : T.yellow, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: fillRate >= 80 ? T.green : T.yellow }}>{fillRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 20px" }}>
                    <Delta val={delta} unit="%" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* ── Source quality YoY ── */}
      <SectionDivider label="Source Quality — 2025 vs 2026 YTD" />
      <Card animate={7} style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textDim }}>
            Click any column to sort · Advance Rate = Applied → HM Interview · Delta shows 2026 improvement over 2025
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
              {[
                { key: "label",        label: "Source" },
                { key: "applied25",    label: "Applied '25" },
                { key: "hmInterview25",label: "HM Int. '25" },
                { key: "hired25",      label: "Hired '25" },
                { key: "advanceRate25",label: "Adv. Rate '25" },
                { key: "advanceRate26",label: "Adv. Rate '26" },
                { key: "delta",        label: "Δ Rate" },
                { key: "hired26",      label: "Hired '26 YTD" },
              ].map(col => (
                <th key={col.key} onClick={() => sqSort25(col.key)} style={{
                  padding: "10px 16px", textAlign: "left", fontSize: 9, letterSpacing: "0.1em",
                  color: sqKey25 === col.key ? T.accent : T.textDim,
                  fontWeight: 700, textTransform: "uppercase", fontFamily: T.font,
                  whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", transition: "color 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accentSoft}
                  onMouseLeave={e => e.currentTarget.style.color = sqKey25 === col.key ? T.accent : T.textDim}
                >
                  {col.label} <SortIcon col={col.key} sortKey={sqKey25} sortDir={sqDir25} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {source2025Rows.map(s => (
              <tr key={s.key} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "11px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{s.label}</span>
                  </div>
                </td>
                <td style={{ padding: "11px 16px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{s.applied25}</td>
                <td style={{ padding: "11px 16px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{s.hmInterview25}</td>
                <td style={{ padding: "11px 16px", fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: s.hired25 > 0 ? T.green : T.textDim }}>{s.hired25}</td>
                <td style={{ padding: "11px 16px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{s.advanceRate25}%</td>
                <td style={{ padding: "11px 16px", fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{s.advanceRate26}%</td>
                <td style={{ padding: "11px 16px" }}><Delta val={s.delta} unit="%" /></td>
                <td style={{ padding: "11px 16px", fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: s.hired26 > 0 ? T.green : T.textDim }}>{s.hired26}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── Recruiter arc YoY ── */}
      <SectionDivider label="Recruiter Performance — 2025 Full Year vs 2026 Arc" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {arcComparison.map((r, i) => (
          <Card key={i} animate={8 + i}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.name}</div>
            </div>

            {/* Metric comparison rows */}
            {[
              { label: "Total Hires",         v25: r.total25,        v26: r.total26,        unit: "",  invert: false },
              { label: "Avg Time-to-Hire",    v25: r.avgTTH25,       v26: r.avgTTH26,       unit: "d", invert: true  },
              { label: "Offer Decline Rate",  v25: r.offerDecline25, v26: r.offerDecline26, unit: "%", invert: true  },
            ].map(({ label, v25, v26, unit, invert }) => {
              const delta = v26 - v25;
              return (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ fontSize: 12, color: T.textMid }}>{label}</span>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: T.textDim, marginBottom: 1 }}>2025</div>
                      <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.textMid }}>{v25}{unit}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: T.textDim, marginBottom: 1 }}>2026</div>
                      <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: r.color }}>{v26}{unit}</div>
                    </div>
                    <div style={{ minWidth: 40, textAlign: "right" }}>
                      <Delta val={delta} unit={unit} invert={invert} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* H1 vs H2 2025 hire cadence */}
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, color: T.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>2025 Hire Cadence</div>
              <div style={{ display: "flex", gap: 20 }}>
                {[["H1 (Jan–Jun)", ARC_2025[r.name].h1.hired], ["H2 (Jul–Dec)", ARC_2025[r.name].h2.hired]].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 9, color: T.textDim }}>{label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.green }}>{val}</div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 9, color: T.textDim }}>2026 Arc (Oct–Mar)</div>
                  <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: r.color }}>{r.total26}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Missed roles carried forward ── */}
      <SectionDivider label="2025 Misses — Rolled Into 2026 Plan" />
      <Card animate={10}>
        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 14 }}>
          These roles were planned in 2025, not filled, and are now active in the 2026 plan.
          Knowing the history matters — some of these have already been stalled for 12+ months.
        </div>
        {PLAN_2025.filter(r => r.status === "missed").map((r, i) => {
          const match26 = PLAN_DATA.find(p => p.dept === r.dept && p.title.includes(r.title.split(",")[0]));
          return (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: 8, marginBottom: 8,
              background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.title}</div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{r.dept} · {r.recruiter}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {match26 ? (
                  <Badge color={match26.status === "filled" ? "green" : match26.status === "in_progress" ? "accent" : "yellow"}>
                    2026: {match26.status === "filled" ? "Filled" : match26.status === "in_progress" ? "In Progress" : "Still Open"}
                  </Badge>
                ) : (
                  <Badge color="dim">Not in 2026 plan</Badge>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "exec",    label: "Executive Overview", icon: "◈" },
  { id: "plan",    label: "2026 Hiring Plan",   icon: "◎" },
  { id: "pipeline",label: "Pipeline by Stage",  icon: "◫" },
  { id: "board",   label: "Board Tracker",      icon: "◉" },
  { id: "weekly",  label: "Weekly Snapshot",    icon: "◷" },
  { id: "2025",    label: "2025 Year in Review", icon: "◑" },
];

export default function RecruitingDashboard() {
  const [activeTab, setActiveTab] = useState("exec");
  const [pulse, setPulse] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [stageCounts, setStageCounts] = useState(null);
  const [deptSummary, setDeptSummary] = useState(null);
  const [hiringPlan, setHiringPlan] = useState(null);

  const fetchAshby = () => {
    fetch("/.netlify/functions/ashby")
      .then(r => r.json())
      .then(data => {
        if (data.stageCounts) setStageCounts(data.stageCounts);
        if (data.deptSummary) setDeptSummary(data.deptSummary);
      })
      .catch(() => {});
  };

  const fetchAshbyPlan = () => {
    fetch("/.netlify/functions/ashby-plan")
      .then(r => r.json())
      .then(data => {
        if (data.hiringPlan) setHiringPlan(data.hiringPlan);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAshby();
    const id = setInterval(() => {
      fetchAshby();
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeTab === "plan" && hiringPlan === null) {
      fetchAshbyPlan();
    }
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case "exec":     return <TabExecutive hiringPlan={hiringPlan} stageCounts={stageCounts} />;
      case "plan":     return <TabHiringPlan hiringPlan={hiringPlan} />;
      case "pipeline": return <TabPipeline stageCounts={stageCounts} />;
      case "board":    return <TabBoard />;
      case "weekly":   return <TabWeekly />;
      case "2025":     return <Tab2025 />;
      default:
      break;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text, padding: "28px 36px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blip { 0%,100% { opacity:1; box-shadow: 0 0 6px #22c55e; } 50% { opacity:0.3; box-shadow:none; } }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: T.accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
            Substack
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Recruiting Operations
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: T.mono }}>
              {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: T.greenFaint, border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, padding: "5px 12px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: pulse ? "blip 0.6s ease" : "none", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "9px 16px", fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
            fontFamily: T.font, cursor: "pointer", letterSpacing: "0.03em",
            background: "none", border: "none", color: activeTab === tab.id ? T.text : T.textDim,
            borderBottom: `2px solid ${activeTab === tab.id ? T.accent : "transparent"}`,
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
            marginBottom: -1,
          }}>
            <span style={{ fontSize: 14, color: activeTab === tab.id ? T.accent : T.textDim }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div key={activeTab} style={{ animation: "fadeUp 0.3s ease" }}>
        {renderTab()}
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: 36, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: T.mono }}>recruiting-ops · ashby integration v1 · mock data</div>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: T.mono }}>refreshes every 30s · replace MOCK_* constants with Ashby API calls</div>
      </div>
    </div>
  );
}


