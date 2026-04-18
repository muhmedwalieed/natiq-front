/* Client-facing analytics dashboard. Full grid layout matching the Natiq dashboard design.
   Sidebar nav, topbar, 4 top stat cards, statistics chart row, bottom row with meetings/feedback/agents/worked-time.
   Tickets nav item shows a two-panel chat/ticket-list view.
   All data is static/mock. Uses @heroicons/react for icons. */
import { useState, useRef, useEffect } from "react";
import logo from "../../assets/logo.png";
import "./ClientDashboard.css";
import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  BellIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  StarIcon,
  PlusIcon,
  PencilSquareIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const MOCK_USER = {
  name: "Mohamed Haitham",
  email: "Mohamedziad921@gmail.com",
  initials: "MH",
  avatar: null,
};

const MOCK_CHANNELS = [
  { name: "Instagram",   percent: 40 },
  { name: "Whats's app", percent: 50 },
  { name: "Facebook",    percent: 10 },
];

const MOCK_AGENTS = [
  { id: 1, name: "Chris Friedkly", company: "Supermarket Villanova", initials: "CF", online: true },
  { id: 2, name: "Chris Friedkly", company: "Supermarket Villanova", initials: "CF", online: false },
  { id: 3, name: "Chris Friedkly", company: "Supermarket Villanova", initials: "CF", online: true },
];

const MENU_ITEMS = [
  { key: "Dashboard", Icon: Squares2X2Icon },
  { key: "Tickets",   Icon: ClipboardDocumentListIcon, badge: "+17" },
  { key: "Calendar",  Icon: CalendarDaysIcon },
  { key: "Analytics", Icon: ChartBarIcon },
  { key: "Team",      Icon: UserGroupIcon },
];

const CHANNELS = ["instagram", "whatsapp", "facebook"];

const MOCK_TICKETS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: "Mohamed Haitham",
  preview: "I want to talk to your manger please",
  time: `10:${String(30 + i).padStart(2, "0")}`,
  unread: i % 4 === 0,
  status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "opened" : "closed",
  initials: "MH",
  channel: CHANNELS[i % 3],
}));

/* SVG brand icons for each channel */
function ChannelIcon({ channel, className }) {
  if (channel === "instagram") return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="10%" stopColor="#fdf497"/>
          <stop offset="50%" stopColor="#fd5949"/>
          <stop offset="68%" stopColor="#d6249f"/>
          <stop offset="100%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)"/>
      <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff"/>
    </svg>
  );
  if (channel === "whatsapp") return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#25D366"/>
      <path d="M12 6.5a5.5 5.5 0 0 1 4.77 8.22l.67 2.45-2.52-.66A5.5 5.5 0 1 1 12 6.5z" fill="#fff"/>
      <path d="M10 10.5c.2.4.42.8.7 1.14l.7.7c.35.27.73.5 1.14.67l.38-.38c.15-.15.37-.2.57-.13.44.17.9.28 1.37.32.25.02.44.23.44.48v1.2c0 .26-.21.47-.47.46A6.5 6.5 0 0 1 8.5 9.47c0-.26.2-.47.46-.47h1.2c.25 0 .46.2.48.44.04.47.15.93.32 1.37.07.2.02.42-.13.57l-.33.32z" fill="#25D366"/>
    </svg>
  );
  if (channel === "facebook") return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#1877F2"/>
      <path d="M13.5 12.5h1.75l.25-2H13.5v-1c0-.55.27-1 1.13-1H15.5V6.72A13.7 13.7 0 0 0 13.7 6.5c-1.84 0-3.04 1.1-3.04 3.1v1.9H9v2h1.66V18h2.34v-5.5z" fill="#fff"/>
    </svg>
  );
  return null;
}

const MOCK_MESSAGES = [
  { id: 1, from: "customer", text: "Hi, I booked a ticket but I didn't receive the confirmation email." },
  { id: 2, from: "agent",    text: "No problem. Could you please share your booking number or email?" },
  { id: 3, from: "customer", text: "I used this email: example@email.com" },
  { id: 4, from: "agent",    text: "Thank you. I've found your booking and I'll resend the confirmation now." },
  { id: 5, from: "customer", text: "Great, thank you." },
  { id: 6, from: "agent",    text: "You're welcome! Let us know if you need any further help. 😊" },
  { id: 7, from: "customer", text: "I want to talk to your manger please." },
];

const GENERAL_ITEMS = [
  { key: "Settings", Icon: Cog6ToothIcon },
  { key: "Logout",   Icon: ArrowRightOnRectangleIcon },
];

/* Sparkline-style SVG polyline chart (static points) */
const CHART_POINTS_DARK = "30,110 60,90 90,100 120,80 150,70 180,85 210,60 240,55 270,40 300,50 330,35 360,30";
const CHART_POINTS_LIME = "30,120 60,105 90,95 120,100 150,85 180,75 210,80 240,65 270,50 300,45 330,55 360,40";
const CHART_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"];
const CHART_Y = [2500,2000,1500,1000,500,"00"];

/* Week days for meetings mini-calendar */
const WEEK_DAYS = [
  { day: "Mon", date: "03", dots: ["green","green","gray"] },
  { day: "Tue", date: "04", dots: ["green"] },
  { day: "Wed", date: "05", dots: ["green","green"], active: true },
  { day: "Thu", date: "06", dots: ["green"] },
  { day: "Fri", date: "07", dots: ["green","green"] },
];

const PERIOD_OPTIONS = ["Monthly", "Weekly", "Yearly"];

function PeriodDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cd-period-wrap">
      <span className="cd-sort-label" onClick={() => setOpen((o) => !o)}>
        Sort by: <strong>{value}</strong> <ChevronDownIcon className="cd-chevron-xs" />
      </span>
      {open && (
        <div className="cd-period-dropdown">
          {PERIOD_OPTIONS.map((o) => (
            <div
              key={o}
              className={`cd-period-option${value === o ? " cd-period-active" : ""}`}
              onClick={() => { onChange(o); setOpen(false); }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCardLight({ title, value, note, period, onPeriodChange }) {
  return (
    <div className="cd-stat-card">
      <div className="cd-stat-card-header">
        <p className="cd-stat-title">{title}</p>
        <div className="cd-stat-header-right">
          {period && <PeriodDropdown value={period} onChange={onPeriodChange} />}
          <span className="cd-stat-ext-link">
            <ArrowTopRightOnSquareIcon className="cd-ext-icon" />
          </span>
        </div>
      </div>
      <p className="cd-stat-value">{value}</p>
      <p className="cd-stat-note">
        <span className="cd-note-badge">6+</span> {note}
      </p>
    </div>
  );
}

function StatCardDark({ title, value, note, period, onPeriodChange }) {
  return (
    <div className="cd-stat-card cd-stat-card-dark">
      <div className="cd-stat-card-header">
        <p className="cd-stat-title">{title}</p>
        <div className="cd-stat-header-right">
          {period && <PeriodDropdown value={period} onChange={onPeriodChange} />}
          <span className="cd-stat-ext-link">
            <ArrowTopRightOnSquareIcon className="cd-ext-icon" />
          </span>
        </div>
      </div>
      <p className="cd-stat-value">{value}</p>
      <p className="cd-stat-note">
        <span className="cd-note-badge cd-note-badge-lime">6+</span> {note}
      </p>
    </div>
  );
}

function TicketsView() {
  const [filter, setFilter]           = useState("Pending");
  const [view, setView]               = useState("Tickets");
  const [selectedId, setSelectedId]   = useState(1);
  const [inputMsg, setInputMsg]       = useState("");
  const messagesEndRef                = useRef(null);

  const filters = ["Pending", "Opened", "Closed"];
  const filterColor = { Pending: "cd-pill-pending", Opened: "cd-pill-opened", Closed: "cd-pill-closed" };

  const selectedTicket = MOCK_TICKETS.find((t) => t.id === selectedId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId]);

  return (
    <div className="cd-tkt-layout">

      {/* ── Left: ticket list ── */}
      <div className="cd-tkt-left">
        <div className="cd-tkt-list-header">
          <div className="cd-tkt-filters">
            {filters.map((f) => (
              <button
                key={f}
                className={`cd-tkt-pill ${filterColor[f]}${filter === f ? " cd-tkt-pill-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="cd-tkt-view-toggle">
            {["Tickets", "All"].map((v) => (
              <button
                key={v}
                className={`cd-tkt-toggle-btn${view === v ? " cd-tkt-toggle-active" : ""}`}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="cd-tkt-list">
          {MOCK_TICKETS.map((t) => (
            <div
              key={t.id}
              className={`cd-tkt-row${selectedId === t.id ? " cd-tkt-row-active" : ""}`}
              onClick={() => setSelectedId(t.id)}
            >
              <div className="cd-tkt-avatar">{t.initials}</div>
              <div className="cd-tkt-info">
                <span className="cd-tkt-name">{t.name}</span>
                <span className="cd-tkt-preview">{t.preview}</span>
              </div>
              <div className="cd-tkt-meta">
                <span className="cd-tkt-time">{t.time}</span>
                <div className="cd-tkt-icons">
                  {t.unread && <span className="cd-tkt-unread-dot" />}
                  <EnvelopeIcon className="cd-tkt-icon" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: chat view ── */}
      <div className="cd-tkt-right">
        {/* Chat header */}
        <div className="cd-chat-header">
          <div className="cd-chat-header-user">
            <div className="cd-chat-avatar">{selectedTicket?.initials}</div>
            <div className="cd-chat-user-info">
              <span className="cd-chat-name">{selectedTicket?.name}</span>
              <span className="cd-chat-status">Online</span>
            </div>
          </div>
          <ChannelIcon channel={selectedTicket?.channel} className="cd-chat-channel-icon" />
        </div>

        {/* Messages */}
        <div className="cd-chat-messages">
          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`cd-msg-row cd-msg-${msg.from}`}>
              <div className={`cd-msg-bubble cd-bubble-${msg.from}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="cd-chat-input-bar">
          <button className="cd-chat-plus-btn">
            <PlusIcon className="cd-chat-plus-icon" />
          </button>
          <input
            className="cd-chat-input"
            type="text"
            placeholder="Type a meesage"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
          />
          <div className="cd-chat-input-actions">
            <button className="cd-icon-btn"><PencilSquareIcon className="cd-chat-action-icon" /></button>
            <button className="cd-icon-btn"><MicrophoneIcon className="cd-chat-action-icon" /></button>
          </div>
        </div>
      </div>

    </div>
  );
}

function ClientDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [period, setPeriod] = useState("Monthly");

  return (
    <div className="cd-layout">

      {/* ── Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-sidebar-logo">
          <img src={logo} alt="NATIQ" />
        </div>

        <nav className="cd-sidebar-nav">
          <p className="cd-nav-label">MENU</p>
          <ul className="cd-nav-list">
            {MENU_ITEMS.map(({ key, Icon, badge }) => (
              <li
                key={key}
                className={`cd-nav-item${activeNav === key ? " cd-nav-active" : ""}`}
                onClick={() => setActiveNav(key)}
              >
                <Icon className="cd-nav-icon" />
                <span className="cd-nav-text">{key}</span>
                {badge && <span className="cd-badge">{badge}</span>}
              </li>
            ))}
          </ul>

          <p className="cd-nav-label">GENERAL</p>
          <ul className="cd-nav-list">
            {GENERAL_ITEMS.map(({ key, Icon }) => (
              <li
                key={key}
                className={`cd-nav-item${activeNav === key ? " cd-nav-active" : ""}`}
                onClick={() => setActiveNav(key)}
              >
                <Icon className="cd-nav-icon" />
                <span className="cd-nav-text">{key}</span>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* ── Right Panel ── */}
      <div className="cd-right-panel">

        {/* ── Top Bar ── */}
        <header className="cd-topbar">
          <div className="cd-search-wrap">
            <MagnifyingGlassIcon className="cd-search-icon" />
            <input className="cd-search" type="text" placeholder="Search task" />
          </div>

          <div className="cd-topbar-actions">
            <button className="cd-icon-btn" aria-label="Mail">
              <EnvelopeIcon className="cd-topbar-icon" />
            </button>
            <button className="cd-icon-btn" aria-label="Notifications">
              <BellIcon className="cd-topbar-icon" />
            </button>
            <div className="cd-user-info">
              <div className="cd-avatar">
                {MOCK_USER.avatar
                  ? <img src={MOCK_USER.avatar} alt="avatar" />
                  : MOCK_USER.initials}
              </div>
              <div className="cd-user-text">
                <span className="cd-user-name">{MOCK_USER.name}</span>
                <span className="cd-user-email">{MOCK_USER.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="cd-main">

          {/* ── Tickets view ── */}
          {activeNav === "Tickets" && <TicketsView />}

          {/* ── Dashboard view ── */}
          {activeNav !== "Tickets" && <>
          <div className="cd-page-heading">
            <h1>Dashboard</h1>
            <p>Plan, prioritize, and accomplish your tasks with Natiq.</p>
          </div>

          {/* ── Row 1: 4 stat cards ── */}
          <div className="cd-row1">
            <StatCardDark
              title="All Tickets"
              value="1,744"
              note="Increased from last month"
              period={period}
              onPeriodChange={setPeriod}
            />
            <StatCardLight
              title="Incoming Tickets"
              value="1500"
              note="Increased from last month"
              period={period}
              onPeriodChange={setPeriod}
            />
            <StatCardLight
              title="Avg. Late replay for the MSG"
              value="5s"
              note="Increased from last month"
            />
            <StatCardLight
              title="Avg. Call Durationt"
              value="1:36s"
              note="Increased from last month"
            />
          </div>

          {/* ── Row 2: Statistics chart + Tickets assigned + Statistics tickets ── */}
          <div className="cd-row2">

            {/* Statistics line chart */}
            <div className="cd-chart-big-card">
              <div className="cd-chart-big-header">
                <div>
                  <p className="cd-chart-big-title">Statistics</p>
                  <p className="cd-chart-big-sub">May 2022</p>
                </div>
                <PeriodDropdown value={period} onChange={setPeriod} />
              </div>
              <div className="cd-chart-area">
                <svg viewBox="0 0 390 140" className="cd-line-chart" preserveAspectRatio="none">
                  {/* Y-axis labels */}
                  {CHART_Y.map((v, i) => (
                    <text key={i} x="0" y={10 + i * 26} fontSize="9" fill="#aaa">{v}</text>
                  ))}
                  {/* Dark line */}
                  <polyline
                    points={CHART_POINTS_DARK}
                    fill="none"
                    stroke="#042835"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Lime line */}
                  <polyline
                    points={CHART_POINTS_LIME}
                    fill="none"
                    stroke="#CAF301"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Tooltip dot on lime line */}
                  <circle cx="150" cy="85" r="4" fill="#042835" />
                  <rect x="128" y="68" width="44" height="16" rx="4" fill="#042835" />
                  <text x="150" y="80" fontSize="9" fill="#fff" textAnchor="middle">Fri: 2500</text>
                </svg>
                {/* X-axis months */}
                <div className="cd-chart-xaxis">
                  {CHART_MONTHS.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tickets Assigned */}
            <div className="cd-assigned-card">
              <p className="cd-assigned-label">Tickets Assigned This Month</p>
              <p className="cd-assigned-value">5000</p>
              <button className="cd-goal-btn">Goal 25000</button>
            </div>

            {/* Statistics Tickets bar chart */}
            <div className="cd-chart-card">
              <p className="cd-chart-title">Statistics Tickets</p>
              {MOCK_CHANNELS.map((ch) => (
                <div key={ch.name} className="cd-bar-row">
                  <span className="cd-bar-label">{ch.name}</span>
                  <div className="cd-bar-track">
                    <div className="cd-bar-fill" style={{ width: ch.percent + "%" }} />
                  </div>
                  <span className="cd-bar-pct">{ch.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Row 3: Meetings + Feedback + Agents + Worked Time ── */}
          <div className="cd-row3">

            {/* Today's Meetings */}
            <div className="cd-meetings-card">
              <div className="cd-meetings-header">
                <p className="cd-meetings-title">Today, Meetings</p>
                <PeriodDropdown value={period} onChange={setPeriod} />
              </div>
              <div className="cd-week-row">
                {WEEK_DAYS.map((d) => (
                  <div key={d.date} className={`cd-day-col${d.active ? " cd-day-active" : ""}`}>
                    <span className="cd-day-name">{d.day}</span>
                    <span className="cd-day-num">{d.date}</span>
                    <div className="cd-day-dots">
                      {d.dots.map((color, i) => (
                        <span key={i} className={`cd-day-dot cd-dot-${color}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="cd-meeting-count">
                <span className="cd-meeting-badge">10</span> Meeting Per Week
              </p>
            </div>

            {/* Avg Feedback */}
            <div className="cd-feedback-card">
              <div className="cd-feedback-header">
                <p className="cd-feedback-title">Avg. Feedback</p>
                <span className="cd-stat-ext-link">
                  <ArrowTopRightOnSquareIcon className="cd-ext-icon" />
                </span>
              </div>
              <div className="cd-stars">
                {[1,2,3,4,5].map((s) => (
                  s <= 3
                    ? <StarSolid key={s} className="cd-star cd-star-filled" />
                    : <StarIcon key={s} className="cd-star cd-star-empty" />
                ))}
              </div>
              <p className="cd-stat-note" style={{ marginTop: 8 }}>
                <span className="cd-note-badge">6+</span> Increased from last month
              </p>
            </div>

            {/* Agents */}
            <div className="cd-agents-card">
              <div className="cd-agents-header">
                <p className="cd-agents-title">Agents</p>
                <span className="cd-agents-sort">
                  Sort by Newest <ChevronDownIcon className="cd-chevron-sm" />
                </span>
              </div>
              <div className="cd-agents-list">
                {MOCK_AGENTS.map((agent) => (
                  <div key={agent.id} className="cd-agent-row">
                    <div className="cd-agent-avatar">{agent.initials}</div>
                    <div className="cd-agent-info">
                      <span className="cd-agent-name">{agent.name}</span>
                      <span className="cd-agent-company">{agent.company}</span>
                    </div>
                    <span className={`cd-online-dot ${agent.online ? "cd-dot-on" : "cd-dot-off"}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Avg Worked Time */}
            <div className="cd-workedtime-card">
              <p className="cd-workedtime-label">Avg. Worked Time</p>
              <p className="cd-workedtime-sublabel">Per Hour</p>
              <p className="cd-workedtime-value">1200/h</p>
              <p className="cd-workedtime-note">
                <span className="cd-note-badge cd-note-badge-lime">6+</span> Increased from last month
              </p>
            </div>

          </div>
          {/* end row 3 */}
          </>}

        </main>
      </div>

    </div>
  );
}

export default ClientDashboard;
