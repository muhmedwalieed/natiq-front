import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { teamLeaderApi } from "../../services/teamLeaderApi";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import {
    Squares2X2Icon,
    UserGroupIcon,
    QueueListIcon,
    ArrowTopRightOnSquareIcon,
    ArrowUpRightIcon,
    ChevronDownIcon,
    StarIcon,
    TicketIcon,
    PhoneIcon,
    ChatBubbleLeftRightIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import logo from "../../assets/logo.png";
import "../NatiqDashboard/NatiqDashboard.css";

function getAgentUser() {
    try {
        const raw = localStorage.getItem("agent_user");
        if (raw) {
            const u = JSON.parse(raw);
            const nameParts = (u.name || "Supervisor").split(" ");
            const initials = nameParts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
            return {
                name: u.name || "Supervisor",
                email: u.email || "",
                initials,
                avatar: u.profileImage || null,
                id: u._id || u.id || null,
            };
        }
    } catch (e) { /* ignore */ }
    return { name: "Supervisor", email: "", initials: "SV", avatar: null, id: null };
}

const MENU_KEYS = [
    { key: "Dashboard", Icon: Squares2X2Icon },
    { key: "Team", Icon: UserGroupIcon },
    { key: "Queue", Icon: QueueListIcon },
    { key: "Tickets", Icon: TicketIcon },
    { key: "Calls", Icon: PhoneIcon },
];

const CHART_POINTS_DARK = "30,110 60,90 90,100 120,80 150,70 180,85 210,60 240,55 270,40 300,50 330,35 360,30";
const CHART_POINTS_LIME = "30,120 60,105 90,95 120,100 150,85 180,75 210,80 240,65 270,50 300,45 330,55 360,40";
const CHART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const CHART_Y = [2500, 2000, 1500, 1000, 500, "00"];
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

function StatCardLight({ title, value, note, badge }) {
    return (
        <div className="cd-stat-card">
            <div className="cd-stat-card-header">
                <p className="cd-stat-title">{title}</p>
                <div className="cd-stat-header-right">
                    <span className="cd-stat-ext-link">
                        <ArrowTopRightOnSquareIcon className="cd-ext-icon" />
                    </span>
                </div>
            </div>
            <p className="cd-stat-value">{value}</p>
            <p className="cd-stat-note">
                {badge !== undefined && <span className="cd-note-badge">{badge}</span>} {note}
            </p>
        </div>
    );
}

function StatCardDark({ title, value, note, badge }) {
    return (
        <div className="cd-stat-card cd-stat-card-dark">
            <div className="cd-stat-card-header">
                <p className="cd-stat-title">{title}</p>
                <div className="cd-stat-header-right">
                    <span className="cd-stat-ext-link">
                        <ArrowTopRightOnSquareIcon className="cd-ext-icon" />
                    </span>
                </div>
            </div>
            <p className="cd-stat-value">{value}</p>
            <p className="cd-stat-note">
                {badge !== undefined && <span className="cd-note-badge cd-note-badge-lime">{badge}</span>} {note}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEWS
// ─────────────────────────────────────────────────────────────────────────────

function DashboardView({ dashboardData, loading }) {
    const tlUser = getAgentUser();
    const [period, setPeriod] = useState("Monthly");

    const channelBarData = [
        { name: 'WhatsApp', percent: 65 },
        { name: 'Telegram', percent: 20 },
        { name: 'Facebook', percent: 10 },
        { name: 'Instagram', percent: 5 }
    ];

    const csatScore = 92;
    const avgFeedback = 4.8;
    const goalTickets = { total: 500, current: dashboardData?.resolvedToday || 0, percentageCompleted: dashboardData?.resolvedToday ? Math.round((dashboardData.resolvedToday / 500) * 100) : 0 };

    return (
        <div className="cd-bento-layout">
            {/* ── Welcome Header ── */}
            <div className="cd-bento-header">
                <div>
                    <h1>Welcome back, {tlUser.name.split(" ")[0]}!</h1>
                    <p>Here is what's happening with your team's tasks today.</p>
                </div>
                <div className="cd-bento-date">
                    {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* ── KPIs Row ── */}
            <div className="cd-bento-kpis">
                <StatCardDark
                    title="Active Agents"
                    value={loading ? "..." : dashboardData?.totalAgents || 0}
                    note="Total agents in your company"
                    badge="Online"
                />
                <StatCardLight
                    title="Open Tickets"
                    value={loading ? "..." : dashboardData?.activeTickets || 0}
                    note="Currently in progress or open"
                    badge="Active"
                />
                <StatCardLight
                    title="Unassigned Queue"
                    value={loading ? "..." : dashboardData?.unassignedTickets || 0}
                    note="Waiting to be picked up"
                    badge={(dashboardData?.unassignedTickets || 0) > 0 ? "Action Req" : "Clear"}
                />
                <StatCardLight
                    title="Resolved Today"
                    value={loading ? "..." : dashboardData?.resolvedToday || 0}
                    note="Closed in the last 24h"
                    badge="🎉"
                />
            </div>

            {/* ── Main Bento Grid ── */}
            <div className="cd-bento-main">
                
                {/* ── Left Column ── */}
                <div className="cd-bento-left">
                    {/* Big Line Chart */}
                    <div className="cd-chart-big-card">
                        <div className="cd-chart-big-header">
                            <div>
                                <p className="cd-chart-big-title">Team Resolution Volume</p>
                                <p className="cd-chart-big-sub">Resolved vs Unassigned Tickets</p>
                            </div>
                            <PeriodDropdown value={period} onChange={setPeriod} />
                        </div>
                        <div className="cd-chart-area">
                            <svg viewBox="0 0 390 140" className="cd-line-chart" preserveAspectRatio="none">
                                {CHART_Y.map((v, i) => <text key={i} x="0" y={10 + i * 26} fontSize="9" fill="#aaa">{v}</text>)}
                                <polyline points={CHART_POINTS_DARK} fill="none" stroke="#042835" strokeWidth="2" strokeLinejoin="round" />
                                <polyline points={CHART_POINTS_LIME} fill="none" stroke="#CAF301" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                            <div className="cd-chart-xaxis">
                                {CHART_MONTHS.map((m) => <span key={m}>{m}</span>)}
                            </div>
                        </div>
                    </div>

                    {/* Sub-split: Tickets Stats & Goals */}
                    <div className="cd-bento-split">
                        <div className="cd-chart-card">
                            <p className="cd-chart-title">Queue by Channel</p>
                            {channelBarData.map((ch) => (
                                <div key={ch.name} className="cd-bar-row">
                                    <span className="cd-bar-label">{ch.name}</span>
                                    <div className="cd-bar-track">
                                        <div className="cd-bar-fill" style={{ width: ch.percent + "%" }} />
                                    </div>
                                    <span className="cd-bar-pct">{ch.percent}%</span>
                                </div>
                            ))}
                        </div>

                        <div className="cd-goal-tickets-card">
                            <div className="cd-goal-tickets-header">
                                <p className="cd-goal-tickets-title">Team Daily Goal {goalTickets.total}</p>
                                <button className="cd-goal-link"><ArrowUpRightIcon className="cd-icon-link" /></button>
                            </div>
                            <div className="cd-goal-tickets-value">
                                {loading ? "..." : goalTickets.current}
                            </div>
                            <div className="cd-goal-tickets-footer">
                                <p className="cd-goal-note"><span className="cd-note-badge">{dashboardData?.resolvedToday || 0}</span> Resolved</p>
                                <span className="cd-goal-tickets-pct">{goalTickets.percentageCompleted}% completed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Column ── */}
                <div className="cd-bento-right">
                    
                    {/* Time Tracker */}
                    <div className="cd-timetracker-card cd-timetracker-sleek">
                        <div className="cd-tt-info">
                            <p className="cd-timetracker-title">AVG. RESPONSE TIME</p>
                            <p className="cd-timetracker-time">00:15:30</p>
                        </div>
                    </div>

                    {/* Sub-split: Feedback & CSAT */}
                    <div className="cd-bento-split" style={{ flex: 1 }}>
                        <div className="cd-feedback-card">
                            <div className="cd-feedback-header">
                                <p className="cd-feedback-title">Team Avg. Feedback</p>
                            </div>
                            <p className="cd-feedback-rating-text">{avgFeedback} <span className="cd-feedback-max">/ 5</span></p>
                            <div className="cd-stars">
                                <svg width="0" height="0" style={{ position: "absolute" }}>
                                    <defs>
                                        <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#3e622b" />
                                            <stop offset="100%" stopColor="#8ac33f" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                {[1, 2, 3, 4, 5].map((s) => {
                                    if (s <= Math.floor(avgFeedback)) return <StarSolid key={s} className="cd-star" style={{ fill: "url(#star-grad)" }} />;
                                    if (s === Math.ceil(avgFeedback) && avgFeedback % 1 !== 0) return (
                                        <div key={s} className="cd-star-half-wrap">
                                            <StarIcon className="cd-star cd-star-empty" style={{ position: "absolute", zIndex: 2 }} />
                                            <div style={{ width: `${(avgFeedback % 1) * 100}%`, overflow: "hidden", position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 1 }}>
                                                <StarSolid className="cd-star" style={{ fill: "url(#star-grad)", position: "absolute", left: 0 }} />
                                            </div>
                                        </div>
                                    );
                                    return <StarIcon key={s} className="cd-star cd-star-empty" />;
                                })}
                            </div>
                        </div>

                        <div className="cd-cast-card">
                            <div className="cd-cast-header">
                                <p className="cd-cast-title">Team CSAT Status</p>
                            </div>
                            <div className="cd-cast-body">
                                <div className="cd-cast-chart-wrap" style={{ marginTop: 10 }}>
                                    <svg viewBox="0 0 120 120" className="cd-cast-svg" style={{ width: 64, height: 64 }}>
                                        <circle cx="60" cy="60" r="46" fill="none" stroke="#e6e9ed" strokeWidth="15" />
                                        <circle cx="60" cy="60" r="46" fill="none" stroke="#137c9f" strokeWidth="15" strokeLinecap="round" strokeDasharray={`${Math.round(289 * (csatScore / 100))} 289`} />
                                        <circle cx="60" cy="60" r="46" fill="none" stroke="#042835" strokeWidth="15" strokeLinecap="round" strokeDasharray={`${Math.round(289 * (csatScore / 100) * 0.6)} 289`} />
                                    </svg>
                                    <div className="cd-cast-chart-info" style={{ marginLeft: 16 }}>
                                        <p className="cd-cast-chart-val" style={{ fontSize: 22 }}>{csatScore}%</p>
                                        <p className="cd-cast-chart-sub">Score</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeamView({ agents, loading, onSelectAgent }) {
    if (loading) {
        return (
            <div className="cd-bento-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="cd-spinner" />
            </div>
        );
    }
    if (!agents.length) {
        return (
            <div className="cd-bento-layout">
                <div className="cd-bento-header">
                    <div>
                        <h1>Team Members</h1>
                        <p>No agents are assigned to your team yet.</p>
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e6e9ed', color: '#667085', fontSize: 14, lineHeight: 1.6 }}>
                    Ask your company manager to assign agents to you.
                </div>
            </div>
        );
    }
    return (
        <div className="cd-bento-layout">
             <div className="cd-bento-header">
                <div>
                    <h1>Team Members</h1>
                    <p>Monitor your agents' active workloads.</p>
                </div>
            </div>

            {/* Simple grid for agents */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {agents.map(agent => (
                    <div key={agent._id} style={{ background: '#fff', borderRadius: '16px', cursor: 'pointer', border: '1px solid #e6e9ed', padding: '24px', transition: 'box-shadow 0.2s' }} 
                         onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 24px rgba(4, 40, 53, 0.05)'}
                         onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                         onClick={() => onSelectAgent(agent)}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div className="cd-tkt-avatar cd-tkt-avatar-active" style={{ width: '48px', height: '48px', fontSize: '18px', background: '#042835', color: '#fff' }}>
                                {agent.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#042835', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</p>
                                <p style={{ fontSize: '13px', color: '#97a3b6', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.email}</p>
                            </div>
                            <div>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: agent.isOnline ? '#25D366' : '#FF4B4B' }} title={agent.isOnline ? 'Online' : 'Offline'}></span>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #f0f2f5', paddingTop: '16px' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#97a3b6', margin: '0 0 4px 0' }}>Active Tickets</p>
                                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#042835', margin: 0 }}>{agent.activeTickets}</p>
                            </div>
                            <div>
                                <button style={{ background: 'transparent', padding: '0', border: 'none', color: '#137c9f', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    View Performance
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function QueueManagementView({ agents }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [assigningTo, setAssigningTo] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    const fetchUnassigned = useCallback(async () => {
        setLoading(true);
        try {
            const data = await teamLeaderApi.getUnassignedQueue();
            setTickets(data.tickets || []);
        } catch (e) {
            console.error("Error fetching queue", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnassigned();
    }, [fetchUnassigned]);

    const handleAssign = async () => {
        if (!assigningTo || selectedTickets.length === 0) return;
        setIsAssigning(true);
        try {
            await teamLeaderApi.bulkAssignTickets(selectedTickets, assigningTo);
            alert("Tickets assigned successfully!");
            setSelectedTickets([]);
            setAssigningTo("");
            fetchUnassigned();
        } catch (e) {
            console.error(e);
            alert("Failed to assign tickets");
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleTicket = (id) => {
        setSelectedTickets(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    return (
        <div className="cd-bento-layout">
            <div className="cd-bento-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1>Queue Management</h1>
                    <p>Assign pending tickets to available agents.</p>
                </div>
                {selectedTickets.length > 0 && (
                     <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedTickets.length} Selected</span>
                         <select 
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            value={assigningTo} 
                            onChange={(e) => setAssigningTo(e.target.value)}
                         >
                             <option value="">Select Agent...</option>
                             {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.activeTickets} active)</option>)}
                         </select>
                         <button 
                            style={{ padding: '8px 16px', background: '#042835', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: (!assigningTo || isAssigning) ? 0.7 : 1 }}
                            disabled={!assigningTo || isAssigning}
                            onClick={handleAssign}
                         >
                             Assign
                         </button>
                     </div>
                )}
            </div>

            {loading ? (
                <div className="cd-spinner" />
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e6e9ed', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e6e9ed', fontSize: '13px', color: '#6b7280' }}>
                            <tr>
                                <th style={{ padding: '16px' }} width="50"><input type="checkbox" onChange={(e) => setSelectedTickets(e.target.checked ? tickets.map(t => t._id) : [])} checked={selectedTickets.length === tickets.length && tickets.length > 0}/></th>
                                <th style={{ padding: '16px' }}>Ticket #</th>
                                <th style={{ padding: '16px' }}>Customer</th>
                                <th style={{ padding: '16px' }}>Channel</th>
                                <th style={{ padding: '16px' }}>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No unassigned tickets found.</td>
                                </tr>
                            ) : tickets.map(t => (
                                <tr key={t._id} style={{ borderBottom: '1px solid #e6e9ed', fontSize: '14px' }}>
                                    <td style={{ padding: '16px' }}><input type="checkbox" checked={selectedTickets.includes(t._id)} onChange={() => toggleTicket(t._id)} /></td>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>#{t.ticketNumber}</td>
                                    <td style={{ padding: '16px' }}>{t.userId?.name || 'Unknown'}</td>
                                    <td style={{ padding: '16px', textTransform: 'capitalize' }}>{t.channel}</td>
                                    <td style={{ padding: '16px' }}><span className={`cd-tkt-priority-dot ${t.priority === 'urgent' ? 'cd-priority-high' : 'cd-priority-normal'}`}></span> {t.priority}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}




// ─────────────────────────────────────────────────────────────────────────────
// TICKETS VIEW — Read messages + QA analysis per ticket
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_COLORS = { open: '#f59e0b', in_progress: '#3b82f6', resolved: '#25D366', closed: '#97a3b6' };
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const CHANNEL_ICONS = { telegram: '📤', whatsapp: '💬', instagram: '📷', facebook: '👍', web: '🌐' };
const ANALYSIS_STATUS_STYLE = {
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Analysis pending' },
    completed: { bg: '#dcfce7', color: '#166534', label: 'AI analyzed' },
    failed: { bg: '#fee2e2', color: '#991b1b', label: 'Analysis failed' },
    not_applicable: { bg: '#f3f4f6', color: '#6b7280', label: '—' },
};

function pickFullAnalysis(qaRecord) {
    if (!qaRecord) return null;
    return qaRecord.fullAnalysis || qaRecord.analysis || null;
}

function TicketsView({ agents = [] }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [qaData, setQaData] = useState(null);
    const [loadingQA, setLoadingQA] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [activePanel, setActivePanel] = useState('messages');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [agentFilter, setAgentFilter] = useState('');

    const fetchTicketList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (statusFilter) q.set('status', statusFilter);
            if (agentFilter) q.set('agentId', agentFilter);
            const qs = q.toString();
            const data = await teamLeaderApi.getCompanyTickets(qs ? `?${qs}` : '');
            setTickets(data.tickets || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [statusFilter, agentFilter]);

    useEffect(() => {
        fetchTicketList();
    }, [fetchTicketList]);

    const openTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setMessages([]);
        setQaData(null);
        setNoteDraft('');
        setActivePanel('messages');
        setLoadingMsgs(true);
        try {
            const data = await teamLeaderApi.getTicketMessages(ticket._id);
            setMessages(data.messages || []);
            if (data.ticket) {
                setSelectedTicket((prev) => ({ ...prev, ...data.ticket }));
            }
        } catch (e) { console.error(e); }
        setLoadingMsgs(false);
    };

    const refreshQADetail = async (analysisId) => {
        const detail = await teamLeaderApi.getQADetail(analysisId);
        setQaData(detail);
    };

    const loadExistingQA = async () => {
        if (!selectedTicket) return;
        setLoadingQA(true);
        try {
            const existing = await teamLeaderApi.getQAResults(`?ticketId=${selectedTicket._id}&limit=1`);
            const items = existing?.results || [];
            if (items.length > 0) {
                await refreshQADetail(items[0]._id);
            } else {
                setQaData(null);
            }
        } catch (e) {
            console.error(e);
            setQaData(null);
        }
        setLoadingQA(false);
    };

    const openQAPanel = async () => {
        if (!selectedTicket) return;
        setActivePanel('qa');
        await loadExistingQA();
    };

    const runRegenerateQA = async () => {
        if (!selectedTicket) return;
        setRegenerating(true);
        try {
            await teamLeaderApi.analyzeTicket(selectedTicket._id);
            await loadExistingQA();
            fetchTicketList();
        } catch (e) {
            console.error(e);
            alert(e.message || 'Analysis failed');
        }
        setRegenerating(false);
    };

    const submitTeamNote = async () => {
        if (!selectedTicket || !noteDraft.trim()) return;
        setSavingNote(true);
        try {
            await teamLeaderApi.patchTicketQANotes(selectedTicket._id, noteDraft.trim());
            setNoteDraft('');
            const existing = await teamLeaderApi.getQAResults(`?ticketId=${selectedTicket._id}&limit=1`);
            const items = existing?.results || [];
            if (items.length > 0) await refreshQADetail(items[0]._id);
        } catch (e) {
            alert(e.message || 'Could not save note');
        }
        setSavingNote(false);
    };

    const filtered = tickets.filter((t) =>
        t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.channel?.toLowerCase().includes(search.toLowerCase())
    );

    const fa = pickFullAnalysis(qaData);
    const scores = qaData?.scores || {};
    const overallNum = fa?.quality_assessment?.conversation_quality_score ?? scores.quality ?? null;

    return (
        <div style={{ display: 'flex', height: '100%', gap: 0 }}>
            <div style={{ width: 340, minWidth: 300, borderRight: '1px solid #e6e9ed', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #e6e9ed' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#042835', margin: '0 0 12px' }}>Tickets</h2>
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                        <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#97a3b6' }} />
                        <input
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tickets..."
                            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1px solid #e6e9ed', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <select
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                        style={{ width: '100%', marginBottom: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid #e6e9ed', fontSize: 13, background: '#fff' }}
                    >
                        <option value="">All agents</option>
                        {agents.map((a) => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                    </select>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['', 'open', 'in_progress', 'resolved'].map((s) => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                                    background: statusFilter === s ? '#042835' : '#f0f2f5',
                                    color: statusFilter === s ? '#CAF301' : '#667085' }}>
                                {s === '' ? 'All' : STATUS_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading ? <p style={{ padding: 20, color: '#97a3b6', fontSize: 13 }}>Loading...</p> :
                        filtered.length === 0 ? <p style={{ padding: 20, color: '#97a3b6', fontSize: 13 }}>No tickets found.</p> :
                        filtered.map((ticket) => {
                            const ast = ticket.context?.analysisStatus || 'not_applicable';
                            const astStyle = ANALYSIS_STATUS_STYLE[ast] || ANALYSIS_STATUS_STYLE.not_applicable;
                            return (
                            <div key={ticket._id}
                                onClick={() => openTicket(ticket)}
                                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f2f5',
                                    background: String(selectedTicket?._id) === String(ticket._id) ? '#f5f9ff' : 'transparent',
                                    borderLeft: String(selectedTicket?._id) === String(ticket._id) ? '3px solid #137c9f' : '3px solid transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#042835' }}>#{ticket.ticketNumber}</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: STATUS_COLORS[ticket.status] + '20', color: STATUS_COLORS[ticket.status] }}>
                                        {STATUS_LABELS[ticket.status] || ticket.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: astStyle.bg, color: astStyle.color }}>{astStyle.label}</span>
                                </div>
                                <div style={{ fontSize: 12, color: '#667085', marginBottom: 3 }}>
                                    {CHANNEL_ICONS[ticket.channel] || '🎫'} {ticket.channel}
                                    {ticket.assignedTo ? ` · ${ticket.assignedTo.name}` : ' · Unassigned'}
                                </div>
                                <div style={{ fontSize: 11, color: '#b0b8c4' }}>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                            </div>
                            );
                        })
                    }
                </div>
            </div>

            {selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                    <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e6e9ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <p style={{ fontSize: 12, color: '#97a3b6', margin: 0 }}>Ticket #{selectedTicket.ticketNumber}</p>
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#042835', margin: '2px 0 0' }}>
                                {CHANNEL_ICONS[selectedTicket.channel]} {selectedTicket.channel?.toUpperCase()} — {selectedTicket.priority?.toUpperCase()} Priority
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setActivePanel('messages')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: activePanel === 'messages' ? '#042835' : '#f0f2f5',
                                    color: activePanel === 'messages' ? '#CAF301' : '#667085', fontSize: 13, fontWeight: 600 }}>
                                <ChatBubbleLeftRightIcon style={{ width: 15, height: 15 }} /> Messages
                            </button>
                            <button type="button" onClick={openQAPanel}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: activePanel === 'qa' ? '#042835' : '#f0f2f5',
                                    color: activePanel === 'qa' ? '#CAF301' : '#667085', fontSize: 13, fontWeight: 600 }}>
                                <SparklesIcon style={{ width: 15, height: 15 }} /> QA Analysis
                            </button>
                        </div>
                    </div>

                    {activePanel === 'messages' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {loadingMsgs ? <p style={{ color: '#97a3b6', fontSize: 13 }}>Loading messages...</p> :
                                messages.length === 0 ? <p style={{ color: '#97a3b6', fontSize: 13 }}>No messages found for this ticket.</p> :
                                messages.map((msg, i) => {
                                    const isAgent = msg.role === 'agent';
                                    const isSystem = msg.role === 'system';
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : isSystem ? 'center' : 'flex-start' }}>
                                            {isSystem ? (
                                                <span style={{ fontSize: 11, color: '#b0b8c4', background: '#f0f2f5', padding: '4px 10px', borderRadius: 20 }}>{msg.content}</span>
                                            ) : (
                                                <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isAgent ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                                    background: isAgent ? '#042835' : '#fff', color: isAgent ? '#fff' : '#042835',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 14, lineHeight: 1.5 }}>
                                                    <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, marginBottom: 4, textTransform: 'uppercase' }}>{msg.role}</div>
                                                    {msg.content || (msg.mediaUrl && <a href={resolveMediaUrl(msg.mediaUrl)} target="_blank" rel="noreferrer" style={{ color: isAgent ? '#CAF301' : '#137c9f' }}>📎 Attachment</a>)}
                                                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}

                    {activePanel === 'qa' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                <button type="button" onClick={runRegenerateQA} disabled={regenerating}
                                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: regenerating ? 'wait' : 'pointer', background: '#042835', color: '#CAF301', fontSize: 13, fontWeight: 600, opacity: regenerating ? 0.7 : 1 }}>
                                    {regenerating ? 'Running…' : 'Run / refresh AI analysis'}
                                </button>
                            </div>
                            {loadingQA ? (
                                <div style={{ textAlign: 'center', color: '#97a3b6', paddingTop: 40 }}>
                                    <SparklesIcon style={{ width: 32, margin: '0 auto 12px', opacity: 0.4 }} />
                                    <p>Loading analysis…</p>
                                </div>
                            ) : qaData && fa ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e6e9ed', display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#042835' }}>
                                            {overallNum != null ? Math.round(overallNum) : '—'}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 13, color: '#97a3b6' }}>Conversation quality</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#042835' }}>{fa.quality_assessment?.qa_verdict || '—'}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#667085' }}>{fa.ticket_summary?.short_summary || ''}</p>
                                        </div>
                                    </div>

                                    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed' }}>
                                        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Scores</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, fontSize: 13 }}>
                                            <div>Professionalism: <strong>{scores.professionalism ?? fa.agent_analysis?.agent_professionalism_score ?? '—'}</strong></div>
                                            <div>Empathy: <strong>{scores.empathy ?? fa.agent_analysis?.agent_empathy_score ?? '—'}</strong></div>
                                            <div>Quality: <strong>{scores.quality ?? fa.quality_assessment?.conversation_quality_score ?? '—'}</strong></div>
                                        </div>
                                    </div>

                                    {fa.resolution_analysis && (
                                        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed' }}>
                                            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Resolution</p>
                                            <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.5 }}>
                                                <strong>{fa.resolution_analysis.resolution_status}</strong>
                                                {fa.resolution_analysis.resolution_reasoning ? ` — ${fa.resolution_analysis.resolution_reasoning}` : ''}
                                            </p>
                                            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#97a3b6' }}>
                                                Ticket closed correctly: {fa.resolution_analysis.ticket_closed_correctly ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                    )}

                                    {fa.agent_analysis && (
                                        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed' }}>
                                            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Agent behavior</p>
                                            <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.5 }}>{fa.agent_analysis.tone_reasoning || fa.agent_analysis.overall_tone}</p>
                                            {((fa.quality_assessment?.main_failures || fa.agent_analysis?.issues || [])).length > 0 && (
                                                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#991b1b' }}>
                                                    {(fa.quality_assessment?.main_failures || fa.agent_analysis?.issues || []).slice(0, 8).map((x, i) => (
                                                        <li key={i}>{typeof x === 'string' ? x : x.message || JSON.stringify(x)}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed' }}>
                                        <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Your notes</p>
                                        {(qaData.teamLeaderNotes || []).length > 0 && (
                                            <div style={{ marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
                                                {(qaData.teamLeaderNotes || []).map((n, i) => (
                                                    <div key={i} style={{ fontSize: 12, color: '#667085', padding: '8px 0', borderBottom: '1px solid #f0f2f5' }}>
                                                        {n.content}
                                                        <div style={{ fontSize: 10, color: '#97a3b6', marginTop: 4 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <textarea
                                            value={noteDraft}
                                            onChange={(e) => setNoteDraft(e.target.value)}
                                            placeholder="Add coaching or escalation notes for this ticket…"
                                            rows={3}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #e6e9ed', fontSize: 13, marginBottom: 8 }}
                                        />
                                        <button type="button" onClick={submitTeamNote} disabled={savingNote || !noteDraft.trim()}
                                            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: savingNote ? 'wait' : 'pointer', background: '#137c9f', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                                            {savingNote ? 'Saving…' : 'Save note'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#97a3b6', paddingTop: 24 }}>
                                    <SparklesIcon style={{ width: 32, margin: '0 auto 12px', opacity: 0.3 }} />
                                    <p style={{ fontSize: 14 }}>No saved QA analysis yet. Run AI analysis on resolved tickets, or click the button above.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#97a3b6' }}>
                    <TicketIcon style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: 15 }}>Select a ticket to view messages and analysis</p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLS VIEW — Listen to recordings and browse call history
// ─────────────────────────────────────────────────────────────────────────────
const CALL_STATUS_LABEL = {
    ringing: 'Ringing',
    active: 'Active',
    ended: 'Ended',
    missed: 'Missed',
    rejected: 'Rejected',
};

function CallsView({ agents = [] }) {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [agentFilter, setAgentFilter] = useState('');
    const [playingUrl, setPlayingUrl] = useState(null);

    useEffect(() => {
        const fetchCalls = async () => {
            setLoading(true);
            try {
                const data = await teamLeaderApi.getCompanyCalls('?limit=100');
                setCalls(Array.isArray(data) ? data : (data?.calls || []));
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchCalls();
    }, []);

    const formatDuration = (sec) => {
        if (!sec) return '—';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    const filtered = calls.filter((c) => {
        const agentName = (c.agentId?.name || '').toLowerCase();
        const channel = (c.channel || '').toLowerCase();
        const q = search.toLowerCase();
        const matchSearch = !q || agentName.includes(q) || channel.includes(q);
        const matchAgent = !agentFilter || String(c.agentId?._id || c.agentId) === String(agentFilter);
        return matchSearch && matchAgent;
    });

    const playRecording = (url) => {
        setPlayingUrl(resolveMediaUrl(url));
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#042835', margin: '0 0 6px' }}>Call History</h2>
                <p style={{ fontSize: 13, color: '#97a3b6', margin: 0 }}>Team calls — listen to recordings and review details.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
                    <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, color: '#97a3b6' }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agent or channel…"
                        style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid #e6e9ed', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #e6e9ed', fontSize: 13, minWidth: 180, background: '#fff' }}
                >
                    <option value="">All agents</option>
                    {agents.map((a) => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                </select>
            </div>

            {playingUrl && (
                <div style={{ background: '#042835', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <PhoneIcon style={{ width: 20, color: '#CAF301' }} />
                    <div style={{ flex: 1 }}>
                        <audio controls autoPlay src={playingUrl} style={{ width: '100%', height: 36 }} />
                    </div>
                    <button type="button" onClick={() => setPlayingUrl(null)} style={{ background: 'none', border: 'none', color: '#CAF301', cursor: 'pointer', fontSize: 20 }}>✕</button>
                </div>
            )}

            {loading ? <p style={{ color: '#97a3b6' }}>Loading calls...</p> :
                filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: 60, color: '#97a3b6' }}>
                        <PhoneIcon style={{ width: 48, margin: '0 auto 16px', opacity: 0.3 }} />
                        <p>No calls found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map((call) => {
                            const st = call.status || 'ended';
                            const endedOk = st === 'ended';
                            return (
                            <div key={call._id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e6e9ed', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PhoneIcon style={{ width: 20, color: '#042835' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#042835' }}>{call.agentId?.name || 'Unknown Agent'}</p>
                                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#97a3b6' }}>
                                        {(call.channel || 'voice')} · {formatDuration(call.duration)} · {new Date(call.startedAt || call.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: endedOk ? '#dcfce7' : '#fef3c7', color: endedOk ? '#166534' : '#92400e' }}>
                                        {CALL_STATUS_LABEL[st] || st}
                                    </span>
                                    {call.recordingUrl && (
                                        <button type="button" onClick={() => playRecording(call.recordingUrl)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#042835', color: '#CAF301', fontSize: 12, fontWeight: 600 }}>
                                            <PlayCircleIcon style={{ width: 15 }} /> Listen
                                        </button>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )
            }
        </div>
    );
}


function AgentPerformanceView({ agent, onBack }) {

    const [period, setPeriod] = useState('Weekly');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agentProfile, setAgentProfile] = useState(null);
    const [supervisorDraft, setSupervisorDraft] = useState('');
    const [savingSupervisor, setSavingSupervisor] = useState(false);

    useEffect(() => {
        const fetchPerf = async () => {
            setLoading(true);
            try {
                const perf = await teamLeaderApi.getAgentPerformance(agent._id, period);
                setData({ ...agent, ...perf });
                const prof = await teamLeaderApi.getAgentProfile(agent._id);
                const p = prof.agent || prof;
                setAgentProfile(p);
            } catch (e) {
                console.error("Failed to load agent perf", e);
            }
            setLoading(false);
        };
        fetchPerf();
    }, [agent._id, period]);

    const submitSupervisorNote = async () => {
        if (!supervisorDraft.trim()) return;
        setSavingSupervisor(true);
        try {
            await teamLeaderApi.patchAgentSupervisorNotes(agent._id, supervisorDraft.trim());
            setSupervisorDraft('');
            const prof = await teamLeaderApi.getAgentProfile(agent._id);
            const p = prof.agent || prof;
            setAgentProfile(p);
        } catch (e) {
            alert(e.message || 'Could not save note');
        }
        setSavingSupervisor(false);
    };

    const ui = data || agent;
    
    // Dynamic Chart Computation
    let trendPoints = "30,120 360,120"; // flat default
    let chartYLabels = [10, 5, 0];
    let chartXLabels = ["-", "-", "-"];
    let latestTrendVal = 0;
    
    if (data && data.trendData && data.trendData.length > 0) {
        const tData = data.trendData;
        const maxVal = Math.max(...tData.map(d => d.value), 4); // min height 4
        
        chartYLabels = [Math.ceil(maxVal), Math.ceil(maxVal/2), 0];
        chartXLabels = tData.map(d => d.label);
        
        trendPoints = tData.map((d, i) => {
            const x = 30 + i * (330 / Math.max(1, tData.length - 1));
            const y = 120 - ((d.value / maxVal) * 90);
            return `${x},${y}`;
        }).join(' ');
        
        latestTrendVal = tData[tData.length - 1].value;
    }

    const channelData = (data && data.channelDistribution && data.channelDistribution.length > 0) ? data.channelDistribution : [{name: 'No data', percent: 0}];
    const estimatedCsat = data ? Math.min(100, Math.max(0, 100 - (data.avgResolutionTimeMs / 600000) * 5)) : 0; // rough metric mapping fast response to high CSAT
    const avgScoreDisplay = (estimatedCsat / 20).toFixed(1);

    return (
        <div className="cd-view-container">
            <div className="cd-bento-layout">
                <div className="cd-bento-header">
                <div>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#137c9f', fontWeight: '500', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '6px' }}>←</span> Back to Team
                    </button>
                    <h1>{agent.name}'s Analysis</h1>
                    <p>Detailed performance breakdown for {period}.</p>
                </div>
            </div>

            {/* ── KPIs Row ── */}
            <div className="cd-bento-kpis" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                <StatCardDark
                    title="Resolved Tickets"
                    value={loading ? "..." : (ui.totalResolved || 0)}
                    note={`Resolved within ${period.toLowerCase()} period`}
                />
                <StatCardLight
                    title="Avg Response Time"
                    value={loading ? "..." : (ui.avgResponseTimeMs > 0 ? `${Math.round(ui.avgResponseTimeMs / 60000)}m` : '0m')}
                    note="Time to first reply"
                    badge="SLA: < 15m"
                />
                <StatCardLight
                    title="Avg Resolution Time"
                    value={loading ? "..." : (ui.avgResolutionTimeMs > 0 ? `${Math.round(ui.avgResolutionTimeMs / 3600000)}h` : '0h')}
                    note="Time to ticket closure"
                />
                <StatCardLight
                    title="Escalated Tickets"
                    value={loading ? "..." : (ui.escalatedCount || 0)}
                    note="High & Urgent Priority"
                    badge={(ui.escalatedCount || 0) > 0 ? 'Warning' : 'Good'}
                />
            </div>

            {/* ── Main Bento Grid ── */}
            <div className="cd-bento-main" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                <div className="cd-bento-left">
                    <div className="cd-chart-big-card">
                        <div className="cd-chart-big-header">
                            <div>
                                <p className="cd-chart-big-title">Resolution Volume</p>
                                <p className="cd-chart-big-sub">Tickets processed over time</p>
                            </div>
                            <PeriodDropdown value={period} onChange={setPeriod} />
                        </div>
                        <div className="cd-chart-area">
                            <svg viewBox="0 0 390 140" className="cd-line-chart" preserveAspectRatio="none">
                                {chartYLabels.map((v, i) => <text key={i} x="0" y={30 + i * 45} fontSize="9" fill="#aaa">{v}</text>)}
                                <polyline points={trendPoints} fill="none" stroke="#CAF301" strokeWidth="2" strokeLinejoin="round" />
                                {data?.trendData?.length > 0 && (
                                    <>
                                        <circle cx="360" cy={120 - ((latestTrendVal / Math.max(...data.trendData.map(d=>d.value), 4)) * 90)} r="4" fill="#042835" />
                                        <rect x="338" y={103 - ((latestTrendVal / Math.max(...data.trendData.map(d=>d.value), 4)) * 90)} width="44" height="16" rx="4" fill="#042835" />
                                        <text x="360" y={115 - ((latestTrendVal / Math.max(...data.trendData.map(d=>d.value), 4)) * 90)} fontSize="9" fill="#fff" textAnchor="middle">{latestTrendVal}</text>
                                    </>
                                )}
                            </svg>
                            <div className="cd-chart-xaxis">
                                {chartXLabels.slice(0, 8).map((m, i) => <span key={i}>{m}</span>)}
                            </div>
                        </div>
                    </div>

                        <div className="cd-bento-split">
                            <div className="cd-chart-card" style={{ flex: 1 }}>
                                <p className="cd-chart-title">Resolved by Channel</p>
                                {channelData.map((ch, idx) => (
                                    <div key={idx} className="cd-bar-row">
                                        <span className="cd-bar-label">{ch.name}</span>
                                        <div className="cd-bar-track">
                                            <div className="cd-bar-fill" style={{ width: Math.max(0, ch.percent) + "%" }} />
                                        </div>
                                        <span className="cd-bar-pct">{ch.percent}%</span>
                                    </div>
                                ))}
                            </div>
                            <div className="cd-chart-card" style={{ flex: 1 }}>
                                <p className="cd-chart-title">Priority Impact</p>
                                <div className="cd-bar-row" style={{ marginTop: 16 }}>
                                    <span className="cd-bar-label" style={{ minWidth: 80 }}>Escalated</span>
                                    <div className="cd-bar-track">
                                        <div className="cd-bar-fill" style={{ background: '#FF4B4B', width: Math.max(0, ((ui.escalatedCount || 0) / Math.max(1, ui.totalResolved || 1)) * 100) + "%" }} />
                                    </div>
                                    <span className="cd-bar-pct">{ui.escalatedCount || 0}</span>
                                </div>
                                <div className="cd-bar-row">
                                    <span className="cd-bar-label" style={{ minWidth: 80 }}>Standard</span>
                                    <div className="cd-bar-track">
                                        <div className="cd-bar-fill" style={{ background: '#25D366', width: Math.max(0, (((ui.totalResolved || 0) - (ui.escalatedCount || 0)) / Math.max(1, ui.totalResolved || 1)) * 100) + "%" }} />
                                    </div>
                                    <span className="cd-bar-pct">{(ui.totalResolved || 0) - (ui.escalatedCount || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cd-bento-right">
                    <div className="cd-feedback-card" style={{ flex: 1 }}>
                        <div className="cd-feedback-header">
                            <p className="cd-feedback-title">Est. Customer Satisfaction</p>
                        </div>
                        <p className="cd-feedback-rating-text">{(!data || isNaN(avgScoreDisplay)) ? "N/A" : avgScoreDisplay} <span className="cd-feedback-max">/ 5</span></p>
                        <div className="cd-stars">
                            <svg width="0" height="0" style={{ position: "absolute" }}>
                                <defs>
                                    <linearGradient id="star-grad-perf" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3e622b" />
                                        <stop offset="100%" stopColor="#8ac33f" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            {[1, 2, 3, 4, 5].map((s) => {
                                const score = Number(avgScoreDisplay) || 0;
                                if (s <= Math.floor(score)) return <StarSolid key={s} className="cd-star" style={{ fill: "url(#star-grad-perf)" }} />;
                                if (s === Math.ceil(score) && score % 1 !== 0) return (
                                    <div key={s} className="cd-star-half-wrap">
                                        <StarIcon className="cd-star cd-star-empty" style={{ position: "absolute", zIndex: 2 }} />
                                        <div style={{ width: `${(score % 1) * 100}%`, overflow: "hidden", position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 1 }}>
                                            <StarSolid className="cd-star" style={{ fill: "url(#star-grad-perf)", position: "absolute", left: 0 }} />
                                        </div>
                                    </div>
                                );
                                return <StarIcon key={s} className="cd-star cd-star-empty" />;
                            })}
                        </div>
                    </div>

                    <div className="cd-cast-card" style={{ flex: 1 }}>
                        <div className="cd-cast-header">
                            <p className="cd-cast-title">Overall Score</p>
                        </div>
                        <div className="cd-cast-body">
                            <div className="cd-cast-chart-wrap" style={{ marginTop: 10 }}>
                                <svg viewBox="0 0 120 120" className="cd-cast-svg" style={{ width: 80, height: 80 }}>
                                    <circle cx="60" cy="60" r="46" fill="none" stroke="#e6e9ed" strokeWidth="15" />
                                    <circle cx="60" cy="60" r="46" fill="none" stroke="#137c9f" strokeWidth="15" strokeLinecap="round" strokeDasharray={`${Math.round(289 * ((estimatedCsat||0) / 100))} 289`} />
                                </svg>
                                <div className="cd-cast-chart-info" style={{ marginLeft: 16 }}>
                                    <p className="cd-cast-chart-val" style={{ fontSize: 24 }}>{Math.round(estimatedCsat||0)}%</p>
                                    <p className="cd-cast-chart-sub">CSAT</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cd-chart-card" style={{ flex: '1 1 100%', minWidth: '100%', marginTop: 8 }}>
                        <p className="cd-chart-title">Supervisor coaching notes</p>
                        <p style={{ fontSize: 12, color: '#97a3b6', margin: '4px 0 12px' }}>
                            Visible to managers and team leads; persisted on the agent profile.
                        </p>
                        {(agentProfile?.supervisorNotes || []).length > 0 ? (
                            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                                {(agentProfile.supervisorNotes || []).map((n, idx) => (
                                    <div key={idx} style={{ fontSize: 13, color: '#042835', padding: '10px 0', borderBottom: '1px solid #f0f2f5' }}>
                                        {n.content}
                                        <div style={{ fontSize: 11, color: '#97a3b6', marginTop: 6 }}>
                                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: 13, color: '#97a3b6', marginBottom: 12 }}>No notes yet.</p>
                        )}
                        <textarea
                            value={supervisorDraft}
                            onChange={(e) => setSupervisorDraft(e.target.value)}
                            placeholder="Add feedback for this employee…"
                            rows={3}
                            style={{
                                width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8,
                                border: '1px solid #e6e9ed', fontSize: 13, marginBottom: 8,
                            }}
                        />
                        <button type="button" onClick={submitSupervisorNote} disabled={savingSupervisor || !supervisorDraft.trim()}
                            style={{
                                padding: '8px 16px', borderRadius: 8, border: 'none',
                                cursor: savingSupervisor ? 'wait' : 'pointer',
                                background: '#042835', color: '#CAF301', fontSize: 13, fontWeight: 600,
                                opacity: savingSupervisor ? 0.75 : 1,
                            }}>
                            {savingSupervisor ? 'Saving…' : 'Save note'}
                        </button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}   


// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function TeamLeaderDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeNav = searchParams.get("tab") || "Dashboard";
    
    const setActiveNav = (tab) => {
        setSearchParams({ tab });
    };

    const tlUser = getAgentUser();
    
    // Data States
    const [dashboardData, setDashboardData] = useState(null);
    const [agents, setAgents] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const [selectedAgentPerformance, setSelectedAgentPerformance] = useState(null);

    const loadDashboard = useCallback(async () => {
        setLoadingData(true);
        try {
            const [dash, agts] = await Promise.all([
                teamLeaderApi.getDashboard(),
                teamLeaderApi.getAgents()
            ]);
            setDashboardData(dash);
            setAgents(agts);
        } catch (e) {
            console.error("Failed to load TL dashboard", e);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Handle URL agent syncing
    useEffect(() => {
        const agentId = searchParams.get('agentId');
        if (agentId && agents.length > 0) {
            const agt = agents.find(a => String(a._id) === String(agentId));
            if (agt) {
                setSelectedAgentPerformance(agt);
            }
        } else if (!agentId) {
            setSelectedAgentPerformance(null);
        }
    }, [searchParams, agents]);

    const handleSelectAgent = (agent) => {
        setSearchParams({ tab: 'Team', agentId: agent._id });
    };

    return (
        <div className="cd-layout">
            <div className="cd-right-panel" style={{ width: '100%', marginLeft: 0 }}>
                {/* ── TOP HEADER ── */}
                <header className="cd-topbar">
                    <div className="cd-topbar-left">
                        <div className="cd-topbar-logo" style={{ cursor: 'pointer' }} onClick={() => setSearchParams({})}>
                            <img src={logo} alt="NATIQ TL" style={{ height: "24px" }} />
                        </div>
                        <nav className="cd-horizontal-nav">
                            {MENU_KEYS.map((item) => (
                                <div
                                    key={item.key}
                                    className={`cd-h-nav-item${activeNav === item.key ? " cd-h-nav-active" : ""}`}
                                    onClick={() => setActiveNav(item.key)}
                                    title={item.key}
                                >
                                    <item.Icon className="cd-h-nav-icon" />
                                    <span className="cd-h-nav-text">{item.key}</span>
                                </div>
                            ))}
                        </nav>
                    </div>

                    <div className="cd-topbar-actions">
                        <div className="cd-user-info" style={{ cursor: 'pointer' }}>
                            <div className="cd-avatar">
                                {tlUser.initials}
                            </div>
                            <div className="cd-user-text">
                                <span className="cd-user-name">{tlUser.name}</span>
                                <span className="cd-user-email">Supervisor</span>
                            </div>
                        </div>

                        <button className="cd-icon-btn cd-logout-btn" onClick={() => { localStorage.clear(); window.location.href = '/'; }} title="Logout">
                            <ArrowTopRightOnSquareIcon className="cd-topbar-icon" />
                        </button>
                    </div>
                </header>

                {/* ── VIEWS ── */}
                <main className="cd-main" style={{ overflow: activeNav === 'Tickets' ? 'hidden' : undefined, padding: activeNav === 'Tickets' ? 0 : undefined }}>
                    {selectedAgentPerformance ? (
                        <AgentPerformanceView agent={selectedAgentPerformance} onBack={() => setSearchParams({ tab: 'Team' })} />
                    ) : (
                        <>
                            {activeNav === "Dashboard" && <DashboardView dashboardData={dashboardData} loading={loadingData} />}
                            {activeNav === "Team" && <TeamView agents={agents} loading={loadingData} onSelectAgent={handleSelectAgent} />}
                            {activeNav === "Queue" && <QueueManagementView agents={agents} />}
                            {activeNav === "Tickets" && <TicketsView agents={agents} />}
                            {activeNav === "Calls" && <CallsView agents={agents} />}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
