markdown# Recruiting Operations Dashboard

A real-time recruiting intelligence dashboard built with React, designed to give 
leadership clear visibility into hiring pipeline, recruiter performance, and 
headcount progress — without waiting for a weekly email update.

## What it does

Most recruiting data lives in an ATS and never makes it to leadership in a useful 
form. This dashboard pulls live data from the Ashby API and surfaces it in a way 
that is actually readable — with the right context, the right framing, and no 
manual updates required.

## Features

- **Executive Overview** — hiring plan progress, bottleneck identification, and 
  recruiter workload at a glance
- **2026 Hiring Plan** — all approved headcount with status, department, and 
  target dates pulled directly from Ashby
- **Pipeline by Stage** — live candidate counts at every stage, source quality 
  analysis, and conversion funnel broken down by Engineering vs Non-Engineering
- **Board Tracker** — automatically calculates all hires between board meetings. 
  Update two dates, everything else updates itself
- **Weekly Snapshot** — the Thursday internal review view; hires, offers out, 
  at-risk roles, and top 3 priorities for the week
- **2025 Year in Review** — full historical analysis with year-over-year 
  comparisons on source quality, recruiter performance, and plan attainment

## Why I built it

ATS systems are great at tracking candidates. They are not great at telling a 
leadership team what is actually happening, where the friction is, or whether a 
recruiter is performing well or being blocked by the hiring team. This dashboard 
separates those two things clearly.

It also reframes how recruiter performance gets measured — moving away from 
output-only metrics toward a fuller picture of activity, system factors, and 
lagging quality signals like 90-day retention.

## Tech stack

- **React** + **Vite**
- **Recharts** for data visualization
- **Ashby API** for live ATS data
- Designed for deployment on **Netlify** with serverless functions handling 
  the API layer

## Design philosophy

Built for a non-technical audience. Every number has context. Every metric 
explains who owns it — the recruiter, the hiring team, or the candidate. 
Color, layout, and information hierarchy are intentional.

## Status

Actively in development. Currently running with live Ashby integration and 
mock data fallbacks for demo purposes.
