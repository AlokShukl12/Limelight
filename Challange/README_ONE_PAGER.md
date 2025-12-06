# LimelightIT — Device Stream Challenge (One‑Pager)
**Goal (1 page):** Show a live-ish dashboard from a simple device data stream and surface meaningful KPIs + 3 insights.

**Use either** (your call): 
- **SSE live**: read `http://localhost:8080/stream` (1 record/sec), or 
- **Replay**: load the JSONL and play at 1×.


**KPI definitions (pin these in your README)

*All KPIs computed over the currently visible window (e.g., last 5/15/30 min):

*Uptime %, Idle %, Off %
= (sum of durations with state=RUN/IDLE/OFF) ÷ (window duration) × 100.

*Average kW (power)
= mean of kw over samples in window (or time-weighted if you resample).

*Energy (kWh)
= max(kwh_total) − min(kwh_total) in window. (Do not sum kW; use the energy register.)

*PF average
= arithmetic mean of pf over RUN + IDLE samples (ignore OFF) — state the method in README.

*Throughput (units/min)
= (Δcount_total) ÷ (window minutes).
Tip: show also a rolling 60 s rate (counts in last 60 s × 60).

*Phase imbalance % (current)
= (max(ir,iy,ib) − min(ir,iy,ib)) ÷ avg(ir,iy,ib) × 100.

**Auto-insights (pick any 3 and justify)

*Idle > 30 min: detect contiguous IDLE stretches ≥ 30 min (if not present in 20 min sample, allow shorter threshold and note it).

*Peak 15-min demand: rolling 15-min average of kw; report max value & timestamp.

*Low PF window: any continuous span with pf < 0.8 for ≥ 5 min.

*Phase imbalance: % imbalance > 15% for ≥ 2 min.

*Base-load (when OFF/IDLE): median kw during non-RUN periods; show monthly ₹ at ₹8/kWh (configurable).


Must-have visuals & behaviours

*Charts: kW trend + an aligned state band (RUN/IDLE/OFF), mini-charts for ir/iy/ib and vr/vy/vb, units/min bar or sparkline. (The brief already requires these elements.)

*Gap detector: if no messages for > 10 s, show a red badge (“No data >10 s”).

*Export: CSV for the visible window (include all raw fields you use).

*Performance & a11y (unchanged)

*Lighthouse (Desktop) ≥ 90, responsive, semantic landmarks, alt text, contrast ≥ 4.5:1.




**Performance:** Desktop Lighthouse ≥90. Responsive. Basic a11y.

**Deliverables:** Live URL + GitHub + README + Lighthouse screenshot + 2–3 min video.

We value **grasping power, decoding the task, smart scoping, and creativity within constraints.** Good luck!
