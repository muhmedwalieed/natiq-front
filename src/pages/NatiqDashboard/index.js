import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import logo from "../../assets/logo.png";
import { agentApi } from "../../services/agentApi";
import "./NatiqDashboard.css";
import {
    Squares2X2Icon,
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    MagnifyingGlassIcon,
    EnvelopeIcon,
    BellIcon,
    ArrowTopRightOnSquareIcon,
    ArrowUpRightIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    StarIcon,
    PlusIcon,
    MicrophoneIcon,
    PaperAirplaneIcon,
    EllipsisHorizontalIcon,
    HashtagIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    NoSymbolIcon,
    PhoneIcon,
    PhoneXMarkIcon,
    CheckCircleIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

/* ── Helper: get logged-in agent from localStorage ── */
function getAgentUser() {
    try {
        const raw = localStorage.getItem("agent_user");
        if (raw) {
            const u = JSON.parse(raw);
            const nameParts = (u.name || "Agent").split(" ");
            const initials = nameParts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
            return {
                name: u.name || "Agent",
                email: u.email || "",
                initials,
                avatar: u.profileImage || null,
                id: u._id || u.id || null,
            };
        }
    } catch (e) { /* ignore */ }
    return { name: "Agent", email: "", initials: "AG", avatar: null, id: null };
}

const CHANNELS_LIST = ["instagram", "whatsapp", "telegram", "facebook"];

const MENU_KEYS = [
    { key: "Dashboard", Icon: Squares2X2Icon },
    { key: "Tickets", Icon: ClipboardDocumentListIcon, hasBadge: true },
    { key: "Calls", Icon: PhoneIcon, hasCallBadge: true },
    { key: "Calendar", Icon: CalendarDaysIcon },
];

/* SVG brand icons for each channel */
function ChannelIcon({ channel, className }) {
    if (channel === "instagram") return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#fdf497" />
                    <stop offset="10%" stopColor="#fdf497" />
                    <stop offset="50%" stopColor="#fd5949" />
                    <stop offset="68%" stopColor="#d6249f" />
                    <stop offset="100%" stopColor="#285AEB" />
                </radialGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
            <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" fill="none" />
            <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
        </svg>
    );
    if (channel === "whatsapp") return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="#25D366" />
            <path d="M12 6.5a5.5 5.5 0 0 1 4.77 8.22l.67 2.45-2.52-.66A5.5 5.5 0 1 1 12 6.5z" fill="#fff" />
            <path d="M10 10.5c.2.4.42.8.7 1.14l.7.7c.35.27.73.5 1.14.67l.38-.38c.15-.15.37-.2.57-.13.44.17.9.28 1.37.32.25.02.44.23.44.48v1.2c0 .26-.21.47-.47.46A6.5 6.5 0 0 1 8.5 9.47c0-.26.2-.47.46-.47h1.2c.25 0 .46.2.48.44.04.47.15.93.32 1.37.07.2.02.42-.13.57l-.33.32z" fill="#25D366" />
        </svg>
    );
    if (channel === "telegram") return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="#0088cc" />
            <path d="M7 12.35l5.5 2.1 2.3-1.15V13.3l-2.3 1.15-5.5-2.1V11.2l9-3.4 1.2 5.6-2.2 1.1-1-.55L7 11.2v1.15z" fill="#fff" opacity="0.4"/>
            <path d="M17.2 8L7 11.8l3 1.4.7 3.2 1.6-1.5 3.3 2.5 1.6-9.4z" fill="#fff" />
        </svg>
    );
    if (channel === "facebook") return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="#1877F2" />
            <path d="M13.5 12.5h1.75l.25-2H13.5v-1c0-.55.27-1 1.13-1H15.5V6.72A13.7 13.7 0 0 0 13.7 6.5c-1.84 0-3.04 1.1-3.04 3.1v1.9H9v2h1.66V18h2.34v-5.5z" fill="#fff" />
        </svg>
    );
    return null;
}

/* Sparkline-style SVG polyline chart (static points) */
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

function StatCardLight({ title, value, note, badge, period, onPeriodChange }) {
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
                {badge !== undefined && <span className="cd-note-badge">{badge}</span>} {note}
            </p>
        </div>
    );
}

function StatCardDark({ title, value, note, badge, period, onPeriodChange }) {
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
                {badge !== undefined && <span className="cd-note-badge cd-note-badge-lime">{badge}</span>} {note}
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════
   CALENDAR VIEW
═══════════════════════════════════════ */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function CalendarView() {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(today);
    const [tasksByDate, setTasksByDate] = useState({});
    const [taskTitle, setTaskTitle] = useState("");
    const [taskTime, setTaskTime] = useState("");
    const [daySheetOpen, setDaySheetOpen] = useState(false);
    const [addingTask, setAddingTask] = useState(false);
    const storageKey = "natiq_calendar_tasks";

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const goToToday = () => {
        setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    };

    // Build calendar grid (6 rows × 7 cols)
    const cells = [];
    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ day: daysInPrevMonth - i, outside: true, prev: true });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, outside: false });
    }
    // Next month leading days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, outside: true, next: true });
    }

    const isToday = (day) =>
        !day.outside && day.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = (day) =>
        !day.outside && day.day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    const toDateKey = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const d = String(dateObj.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setTasksByDate(JSON.parse(saved));
            }
        } catch (err) {
            console.error("Failed to load calendar tasks:", err);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(tasksByDate));
    }, [tasksByDate]);

    const selectedKey = toDateKey(selectedDate);
    const selectedTasks = tasksByDate[selectedKey] || [];

    const closeDaySheet = useCallback(() => {
        setDaySheetOpen(false);
        setAddingTask(false);
        setTaskTitle("");
        setTaskTime("");
    }, []);

    useEffect(() => {
        if (!daySheetOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") closeDaySheet();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [daySheetOpen, closeDaySheet]);

    const getTaskCountForDay = (day) => {
        if (day.outside) return 0;
        const key = toDateKey(new Date(year, month, day.day));
        return (tasksByDate[key] || []).length;
    };

    const addTask = () => {
        const cleanTitle = taskTitle.trim();
        if (!cleanTitle) return;
        const newTask = {
            id: Date.now(),
            title: cleanTitle,
            time: taskTime || null,
            done: false,
        };
        setTasksByDate((prev) => ({
            ...prev,
            [selectedKey]: [...(prev[selectedKey] || []), newTask],
        }));
        setTaskTitle("");
        setTaskTime("");
        setAddingTask(false);
    };

    const toggleTaskDone = (taskId) => {
        setTasksByDate((prev) => ({
            ...prev,
            [selectedKey]: (prev[selectedKey] || []).map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task
            ),
        }));
    };

    const deleteTask = (taskId) => {
        setTasksByDate((prev) => ({
            ...prev,
            [selectedKey]: (prev[selectedKey] || []).filter((task) => task.id !== taskId),
        }));
    };

    return (
        <div className="cd-calendar-layout">
            <div className="cd-page-heading cd-calendar-heading">
                <h1>Calendar</h1>
                <p>Track your schedule and upcoming tasks with Natiq.</p>
            </div>

            <div className="cd-calendar-card">
                <div className="cd-calendar-workspace">
                    <div className="cd-calendar-main">
                        <div className="cd-calendar-header">
                            <div className="cd-calendar-nav">
                                <button className="cd-cal-nav-btn" onClick={prevMonth}>
                                    <ChevronLeftIcon className="cd-cal-nav-icon" />
                                </button>
                                <h2 className="cd-cal-month-title">{MONTH_NAMES[month]} {year}</h2>
                                <button className="cd-cal-nav-btn" onClick={nextMonth}>
                                    <ChevronRightIcon className="cd-cal-nav-icon" />
                                </button>
                            </div>
                            <button className="cd-cal-today-btn" onClick={goToToday}>Today</button>
                        </div>

                        <div className="cd-calendar-grid cd-calendar-weekdays">
                            {WEEKDAYS.map((w) => (
                                <div key={w} className="cd-cal-weekday">{w}</div>
                            ))}
                        </div>

                        <div className="cd-calendar-grid cd-calendar-days">
                            {cells.map((cell, idx) => {
                                const taskCount = getTaskCountForDay(cell);
                                return (
                                    <div
                                        key={idx}
                                        className={`cd-cal-day${cell.outside ? " cd-cal-day-outside" : ""}${isToday(cell) ? " cd-cal-day-today" : ""}${isSelected(cell) && daySheetOpen ? " cd-cal-day-selected" : ""}`}
                                        onClick={() => {
                                            if (cell.outside) return;
                                            const d = new Date(year, month, cell.day);
                                            setSelectedDate(d);
                                            setDaySheetOpen(true);
                                            setAddingTask(false);
                                            setTaskTitle("");
                                            setTaskTime("");
                                        }}
                                    >
                                        <span className="cd-cal-day-number">{cell.day}</span>
                                        {!cell.outside && taskCount > 0 && (
                                            <span className="cd-cal-task-pill">{taskCount}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <p className="cd-cal-hint">Click a day to view tasks and add new ones.</p>
                    </div>
                </div>
            </div>

            {daySheetOpen && (
                <>
                    <button
                        type="button"
                        className="cd-cal-day-sheet-backdrop"
                        aria-label="Close"
                        onClick={closeDaySheet}
                    />
                    <div
                        className="cd-cal-day-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cd-cal-day-sheet-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cd-cal-day-sheet-head">
                            <div>
                                <h2 id="cd-cal-day-sheet-title">
                                    {selectedDate.toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </h2>
                                <p className="cd-cal-day-sheet-meta">
                                    {selectedTasks.length === 0
                                        ? "No tasks scheduled"
                                        : `${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"}`}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="cd-cal-day-sheet-close"
                                onClick={closeDaySheet}
                                aria-label="Close"
                            >
                                <XMarkIcon className="cd-cal-day-sheet-close-icon" />
                            </button>
                        </div>

                        <div className="cd-cal-day-sheet-body">
                            <div className="cd-cal-task-list">
                                {selectedTasks.length === 0 && !addingTask ? (
                                    <div className="cd-cal-task-empty cd-cal-task-empty--sheet">
                                        Nothing here yet. Use the button below to add a task.
                                    </div>
                                ) : (
                                    selectedTasks.map((task) => (
                                        <div key={task.id} className={`cd-cal-task-item${task.done ? " cd-cal-task-item-done" : ""}`}>
                                            <button
                                                type="button"
                                                className="cd-cal-task-check"
                                                onClick={() => toggleTaskDone(task.id)}
                                                title="Mark complete"
                                            >
                                                <CheckCircleIcon />
                                            </button>
                                            <div className="cd-cal-task-info">
                                                <p>{task.title}</p>
                                                <span>{task.time || "No time set"}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="cd-cal-task-delete"
                                                onClick={() => deleteTask(task.id)}
                                                title="Delete task"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="cd-cal-day-sheet-foot">
                            {!addingTask ? (
                                <button
                                    type="button"
                                    className="cd-cal-day-sheet-primary"
                                    onClick={() => setAddingTask(true)}
                                >
                                    <PlusIcon className="cd-cal-task-plus" />
                                    Add task
                                </button>
                            ) : (
                                <div className="cd-cal-task-form cd-cal-task-form--sheet">
                                    <p className="cd-cal-task-prompt">What do you want to add for this day?</p>
                                    <label className="cd-cal-task-field-label" htmlFor="cd-cal-task-title">Task</label>
                                    <input
                                        id="cd-cal-task-title"
                                        type="text"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        placeholder="Describe the task…"
                                        autoFocus
                                    />
                                    <label className="cd-cal-task-field-label" htmlFor="cd-cal-task-time">
                                        Time <span className="cd-cal-task-optional">(optional)</span>
                                    </label>
                                    <input
                                        id="cd-cal-task-time"
                                        type="time"
                                        value={taskTime}
                                        onChange={(e) => setTaskTime(e.target.value)}
                                    />
                                    <div className="cd-cal-task-form-row">
                                        <button
                                            type="button"
                                            className="cd-cal-task-secondary"
                                            onClick={() => {
                                                setAddingTask(false);
                                                setTaskTitle("");
                                                setTaskTime("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button type="button" className="cd-cal-task-primary" onClick={addTask}>
                                            Save task
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ══════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
══════════════════════════════════════ */
function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    const ToastContainer = () => (
        <div className="cd-toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`cd-toast cd-toast-${t.type}`}>
                    <span className="cd-toast-icon">
                        {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    {t.message}
                </div>
            ))}
        </div>
    );
    return { show, ToastContainer };
}

/* ═══════════════════════════════════════
   TICKETS VIEW
═══════════════════════════════════════ */
function TicketsView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filter = searchParams.get("filter") || "Pending";
    const channel = searchParams.get("channel") || "all";
    
    const setFilter = (val) => {
        const params = { filter: val };
        if (channel !== 'all') params.channel = channel;
        setSearchParams(params);
    };
    
    const setChannel = (val) => {
        const params = { filter };
        if (val !== 'all') params.channel = val;
        setSearchParams(params);
    };

    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const messagesEndRef = useRef(null);
    const activeTicketRef = useRef(null);
    const chatInputRef = useRef(null);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const { show: showToast, ToastContainer } = useToast();

    // Auto-focus input when ticket selection changes
    useEffect(() => {
        if (selectedTicket && selectedTicket.status !== 'closed' && chatInputRef.current) {
            // Focus when messages finish loading or ticket is selected
            if (!loadingMessages) {
                setTimeout(() => {
                    chatInputRef.current?.focus();
                }, 100);
            }
        }
    }, [selectedTicket, loadingMessages]);

    useEffect(() => {
        activeTicketRef.current = selectedTicket;
    }, [selectedTicket]);

    const [socketInstance, setSocketInstance] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('agent_token');
        if (!token) return;

        const socket = io(`${process.env.REACT_APP_SOCKET_URL || ''}/admin`, {
            auth: { token }
        });

        socket.on('ticket:message:new', (payload) => {
            if (activeTicketRef.current && activeTicketRef.current._id === payload.ticketId) {
                if (payload.role !== 'agent') {
                    setMessages(prev => [...prev, payload]);
                }
            }
            setRefreshTrigger(prev => prev + 1);
        });

        socket.on('ticket:new', () => {
            setRefreshTrigger(prev => prev + 1);
        });

        setSocketInstance(socket);

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socketInstance && selectedTicket) {
            socketInstance.emit('ticket:watch', selectedTicket._id);
            return () => {
                socketInstance.emit('ticket:unwatch', selectedTicket._id);
            };
        }
    }, [socketInstance, selectedTicket]);

    const filters = ["Pending", "Opened", "Closed"];

    const fetchTickets = useCallback(async (silent = false) => {
        if (!silent) setLoadingTickets(true);
        try {
            let queryParams = "";
            const parts = [];
            if (filter === "Pending") parts.push("queue=unassigned");
            else if (filter === "Opened") parts.push("status=in_progress");
            else if (filter === "Closed") parts.push("status=closed");
            
            if (channel !== 'all') parts.push(`channel=${channel}`);
            
            if (parts.length > 0) queryParams = "?" + parts.join("&");

            const data = await agentApi.getTickets(queryParams);
            const returnedTickets = data.tickets || [];
            setTickets(returnedTickets);
        } catch (error) {
            console.error("Fetch tickets error:", error);
        } finally {
            if (!silent) setLoadingTickets(false);
        }
    }, [filter, channel]);

    const fetchMessages = useCallback(async (ticketId) => {
        setLoadingMessages(true);
        try {
            const data = await agentApi.getTicketMessages(ticketId);
            setMessages(data.messages || []);
        } catch (error) {
            console.error("Fetch messages error:", error);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        // Only clear selected ticket if it's a manual filter change, 
        // not an automatic selection from claim
        if (!selectedTicket || (selectedTicket.status !== 'in_progress' && filter === 'Opened')) {
            setSelectedTicket(null);
        }
        fetchTickets();
    }, [filter, channel, selectedTicket, fetchTickets]);

    // Use a separate effect for refresh triggered by sockets (debounced)
    useEffect(() => {
        if (refreshTrigger > 0) {
            const timer = setTimeout(() => {
                fetchTickets(true); // silent refresh for sockets
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [refreshTrigger, fetchTickets]);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket._id);
        }
    }, [selectedTicket, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!inputMsg.trim() || !selectedTicket) return;
        try {
            // Optimistic update
            const newMsg = { id: Date.now(), role: 'agent', content: inputMsg };
            setMessages(prev => [...prev, newMsg]);
            const msgToSend = inputMsg;
            setInputMsg("");

            await agentApi.replyToTicket(selectedTicket._id, msgToSend);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleClaim = async () => {
        if (!selectedTicket) return;
        try {
            await agentApi.claimTicket(selectedTicket._id);
            showToast('Ticket claimed successfully!', 'success');
            // Update the local status immediately so the UI doesn't clear it
            setSelectedTicket(prev => ({ ...prev, status: 'in_progress' }));
            setFilter("Opened");
        } catch (error) {
            console.error("Claim failed:", error);
            showToast('Failed to claim ticket.', 'error');
        }
    };

    const handleClose = async () => {
        if (!selectedTicket) return;
        try {
            await agentApi.closeTicket(selectedTicket._id);
            showToast('Ticket closed successfully!', 'success');
            setFilter("Closed");
        } catch (error) {
            console.error("Close failed:", error);
            showToast('Failed to close ticket.', 'error');
        }
    };

    // Helper: format relative time
    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    };

    const priorityIcon = (p) => {
        const level = (p || 'normal').toLowerCase();
        if (level === 'urgent' || level === 'high') return 'cd-priority-high';
        if (level === 'low') return 'cd-priority-low';
        return 'cd-priority-normal';
    };

    return (
        <div className="cd-wa-layout">
            <ToastContainer />
            <div className="cd-wa-rail">
                <button 
                    className={`cd-wa-rail-btn ${channel === 'all' ? 'cd-wa-rail-active' : ''}`}
                    onClick={() => setChannel('all')}
                    title="All Channels"
                >
                    <span className="cd-wa-rail-all-text">All</span>
                </button>
                {CHANNELS_LIST.map(ch => (
                    <button 
                        key={ch}
                        className={`cd-wa-rail-btn ${channel === ch ? 'cd-wa-rail-active' : ''}`}
                        onClick={() => setChannel(ch)}
                        title={ch}
                    >
                        <ChannelIcon channel={ch} className="cd-wa-rail-icon" />
                    </button>
                ))}
            </div>

            {/* ── 2. Middle Sidebar (Chats) ── */}
            <div className="cd-wa-sidebar">
                <div className="cd-wa-sidebar-header">
                    <h2>Chats</h2>
                </div>
                
                <div className="cd-wa-search-wrap">
                    <div className="cd-wa-search-box">
                        <MagnifyingGlassIcon className="cd-wa-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search or start a new chat"
                            className="cd-wa-search-input"
                        />
                    </div>
                </div>

                <div className="cd-wa-pills-row">
                    {filters.map((f) => (
                        <button
                            key={f}
                            className={`cd-wa-pill ${filter === f ? "cd-wa-pill-active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="cd-wa-list">
                    {loadingTickets ? (
                        <div className="cd-tkt-loading">
                            <div className="cd-spinner-small" />
                            <span>Syncing conversations...</span>
                        </div>
                    ) : (
                        <>
                            {tickets.map((t) => (
                                <TicketCard
                                    key={t._id}
                                    ticket={t}
                                    isActive={selectedTicket?._id === t._id}
                                    onClick={() => setSelectedTicket(t)}
                                    formatRelativeTime={formatRelativeTime}
                                    priorityIcon={priorityIcon}
                                />
                            ))}
                            {tickets.length === 0 && (
                                <div className="cd-tkt-empty-modern">
                                    <div className="cd-empty-icon-glow">
                                        <ClipboardDocumentListIcon className="cd-tkt-empty-icon-m" />
                                    </div>
                                    <p className="cd-tkt-empty-text-m">No chats found</p>
                                    <p className="cd-tkt-empty-sub-m">Try changing your filters.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── 3. Right Main Area (chat view) ── */}
            <div className="cd-wa-chat-area">
                {!selectedTicket ? (
                    <div className="cd-chat-placeholder">
                        <div className="cd-placeholder-icon-wrap">
                            <ChatBubbleLeftRightIcon className="cd-placeholder-icon" />
                        </div>
                        <h3 className="cd-placeholder-title">Your Conversations</h3>
                        <p className="cd-placeholder-text">Select a ticket from the list on the left to start messaging or view history.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="cd-chat-header">
                            <div className="cd-chat-header-left">
                                <div className={`cd-chat-avatar cd-chat-avatar-active`}>
                                    {selectedTicket.userId?.name?.substring(0, 2).toUpperCase() || 'CU'}
                                </div>
                                <div className="cd-chat-user-info">
                                    <div className="cd-chat-name-row">
                                        <span className="cd-chat-name">{selectedTicket.userId?.name || 'Customer'}</span>
                                        {selectedTicket?.channel && <ChannelIcon channel={selectedTicket.channel} className="cd-chat-channel-badge" />}
                                    </div>
                                    <div className="cd-chat-meta-row">
                                        <span className={`cd-chat-status-pill cd-chat-status-${selectedTicket.status?.replace('_', '-')}`}>
                                            {selectedTicket.status?.replace('_', ' ')}
                                        </span>
                                        <span className="cd-chat-ticket-num">#{selectedTicket.ticketNumber}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="cd-chat-header-actions">
                                {filter === "Pending" && (
                                    <button className="cd-chat-action-btn cd-chat-claim-btn" onClick={handleClaim}>
                                        <PlusIcon className="cd-chat-btn-icon" />
                                        Claim
                                    </button>
                                )}
                                {filter === "Opened" && (
                                    <button className="cd-chat-action-btn cd-chat-close-btn" onClick={handleClose}>
                                        Close Ticket
                                    </button>
                                )}
                                <button className="cd-chat-more-btn">
                                    <EllipsisHorizontalIcon className="cd-chat-more-icon" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="cd-chat-messages">
                            {loadingMessages ? (
                                <div className="cd-chat-loading">
                                    <div className="cd-spinner" />
                                    <span>Retrieving messages...</span>
                                </div>
                            ) : (
                                <>
                                    {messages.length === 0 && (
                                        <div className="cd-chat-empty-state">
                                            <EnvelopeIcon className="cd-chat-empty-icon" />
                                            <p>No messages yet</p>
                                        </div>
                                    )}
                                    {messages.map((msg, idx) => (
                                        <MessageItem
                                            key={idx}
                                            msg={msg}
                                            idx={idx}
                                            selectedTicket={selectedTicket}
                                        />
                                    ))}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input bar or Closed status */}
                        {selectedTicket.status === 'closed' ? (
                            <div className="cd-chat-closed-notice">
                                <div className="cd-closed-icon-wrap">
                                    <NoSymbolIcon className="cd-closed-icon" />
                                </div>
                                <p className="cd-closed-text">Sending or receiving messages in this ticket is not allowed</p>
                            </div>
                        ) : (
                            <div className="cd-chat-input-bar">
                                <button className="cd-chat-attach-btn">
                                    <PlusIcon className="cd-chat-attach-icon" />
                                </button>
                                <div className="cd-chat-input-wrap">
                                    <input
                                        ref={chatInputRef}
                                        className="cd-chat-input"
                                        type="text"
                                        placeholder={selectedTicket.status === 'in_progress' ? "Type your message..." : "Claim this ticket to reply..."}
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        disabled={selectedTicket.status !== 'in_progress'}
                                    />
                                    <button className="cd-chat-mic-btn">
                                        <MicrophoneIcon className="cd-chat-mic-icon" />
                                    </button>
                                </div>
                                <button
                                    className={`cd-chat-send-btn ${inputMsg.trim() ? 'cd-chat-send-active' : ''}`}
                                    onClick={handleSend}
                                    disabled={!inputMsg.trim() || selectedTicket.status !== 'in_progress'}
                                >
                                    <PaperAirplaneIcon className="cd-chat-send-icon" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS (Memoized for Performance)
═══════════════════════════════════════ */

const TicketCard = memo(({ ticket, isActive, onClick, formatRelativeTime, priorityIcon }) => {
    const initials = ticket?.userId?.name?.substring(0, 2).toUpperCase() || 'CU';
    const pClass = priorityIcon(ticket?.priority);

    return (
        <div
            className={`cd-tkt-card${isActive ? " cd-tkt-card-active" : ""}`}
            onClick={onClick}
        >
            <div className="cd-tkt-card-top">
                <div className="cd-tkt-card-left">
                    <div className="cd-tkt-avatar-wrap">
                        <div className={`cd-tkt-avatar ${isActive ? 'cd-tkt-avatar-active' : ''}`}>{initials}</div>
                        {ticket.channel && <ChannelIcon channel={ticket.channel} className="cd-tkt-card-chan-icon" />}
                    </div>
                    <div className="cd-tkt-info">
                        <span className="cd-tkt-name">{ticket?.userId?.name || 'Customer'}</span>
                        <span className="cd-tkt-preview-line">
                            <HashtagIcon className="cd-tkt-hash-icon" />
                            {ticket?.ticketNumber}
                            <span className={`cd-tkt-priority-dot ${pClass}`} />
                            <span className="cd-tkt-priority-text">{ticket?.priority || 'normal'}</span>
                        </span>
                    </div>
                </div>
                <div className="cd-tkt-card-right">
                    <span className="cd-tkt-time-ago">
                        <ClockIcon className="cd-tkt-clock-icon" />
                        {formatRelativeTime(ticket?.createdAt)}
                    </span>
                    {ticket?.channel && <ChannelIcon channel={ticket.channel} className="cd-tkt-channel-chip" />}
                </div>
            </div>
            {isActive && <div className="cd-tkt-card-indicator" />}
        </div>
    );
});

const CallQueueCard = memo(({ call, isActive, onClick, formatRelativeTime }) => {
    const initials = (call.customerName || "CU").substring(0, 2).toUpperCase();
    const ts = call.startedAt || call.createdAt;

    return (
        <div
            className={`cd-tkt-card${isActive ? " cd-tkt-card-active" : ""}`}
            onClick={onClick}
        >
            <div className="cd-tkt-card-top">
                <div className="cd-tkt-card-left">
                    <div className="cd-tkt-avatar-wrap">
                        <div className={`cd-tkt-avatar ${isActive ? "cd-tkt-avatar-active" : ""}`}>{initials}</div>
                    </div>
                    <div className="cd-tkt-info">
                        <span className="cd-tkt-name">{call.customerName || "Customer"}</span>
                        <span className="cd-tkt-preview-line">
                            <PhoneIcon className="cd-tkt-hash-icon" />
                            Incoming call
                        </span>
                    </div>
                </div>
                <div className="cd-tkt-card-right">
                    <span className="cd-tkt-time-ago">
                        <ClockIcon className="cd-tkt-clock-icon" />
                        {formatRelativeTime(ts)}
                    </span>
                </div>
            </div>
            {isActive && <div className="cd-tkt-card-indicator" />}
        </div>
    );
});

const MessageItem = memo(({ msg, idx, selectedTicket }) => {
    let source = 'customer';
    if (msg.role === 'agent') source = 'agent';
    if (msg.role === 'assistant' || msg.role === 'system') source = 'assistant';

    const showTime = msg.createdAt || msg.timestamp;

    return (
        <div className={`cd-msg-row cd-msg-${source}`}>
            {source !== 'agent' && (
                <div className="cd-msg-avatar-sm">
                    {source === 'assistant' ? 'AI' : (selectedTicket?.userId?.name?.substring(0, 2).toUpperCase() || 'CU')}
                </div>
            )}
            <div className="cd-msg-content-wrap">
                <div className={`cd-msg-bubble cd-bubble-${source}`}>
                    {msg.content}
                </div>
                {showTime && (
                    <span className={`cd-msg-time cd-msg-time-${source}`}>
                        {new Date(showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </div>
    );
});

function formatCallDuration(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Maps agent microphone frequency energy to bar heights (0–1 per band). */
function useMicLevelBands(mediaStream, bandCount) {
    const [levels, setLevels] = useState(null);
    const smoothRef = useRef([]);

    useEffect(() => {
        if (!mediaStream) {
            smoothRef.current = [];
            setLevels(null);
            return undefined;
        }
        if (!mediaStream.getAudioTracks().length) {
            setLevels(null);
            return undefined;
        }

        let audioCtx;
        let source;
        let analyser;
        let rafId;
        let cancelled = false;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaStreamSource(mediaStream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.72;
            source.connect(analyser);
        } catch (e) {
            console.warn("[Mic viz] setup failed:", e);
            setLevels(null);
            return undefined;
        }

        if (smoothRef.current.length !== bandCount) {
            smoothRef.current = Array.from({ length: bandCount }, () => 0.06);
        }

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const timeData = new Uint8Array(analyser.fftSize);
        /* First FFT bins = DC / rumble; on mic they often read “full” even in silence — skip them. */
        const skipLowBins = 20;

        const tick = () => {
            if (cancelled || !analyser) return;
            if (audioCtx.state === "suspended") {
                audioCtx.resume().catch(() => {});
            }
            analyser.getByteTimeDomainData(timeData);
            let sumSq = 0;
            for (let i = 0; i < timeData.length; i++) {
                const x = (timeData[i] - 128) / 128;
                sumSq += x * x;
            }
            const rms = Math.sqrt(sumSq / timeData.length);
            const micOpen = mediaStream.getAudioTracks().some((t) => t.readyState === "live" && t.enabled);
            /* How much real signal is on the mic (time domain). Kills false “full bars” when quiet. */
            const speechGain = !micOpen
                ? 0
                : Math.min(1, Math.max(0, (rms - 0.012) / 0.055));

            analyser.getByteFrequencyData(freqData);
            const maxBin = Math.min(freqData.length - 1, Math.floor(freqData.length * 0.92));
            const span = Math.max(bandCount * 2, maxBin - skipLowBins);

            const next = [];
            for (let i = 0; i < bandCount; i++) {
                const startBin = Math.min(maxBin, skipLowBins + Math.floor((i / bandCount) * span));
                const endBin = Math.min(
                    maxBin,
                    Math.max(startBin, skipLowBins + Math.floor(((i + 1) / bandCount) * span))
                );
                let peak = 0;
                for (let j = startBin; j <= endBin; j++) {
                    peak = Math.max(peak, freqData[j] / 255);
                }
                let boosted = Math.min(1, peak * 2.05);
                boosted *= 0.1 + 0.9 * speechGain;
                const prev = smoothRef.current[i] ?? 0.06;
                const smooth = prev * 0.62 + boosted * 0.38;
                smoothRef.current[i] = smooth;
                const v = micOpen ? smooth : Math.min(smooth * 0.12, 0.07);
                next.push(v);
            }
            setLevels(next);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            try {
                source?.disconnect();
                analyser?.disconnect();
            } catch (_) {
                /* noop */
            }
            if (audioCtx) {
                audioCtx.close().catch(() => {});
            }
        };
    }, [mediaStream, bandCount]);

    return levels;
}

/** Smoothed 0–1 envelope from remote (customer) audio — drives avatar rings. */
function useRemoteAudioEnvelope(mediaStream) {
    const [level, setLevel] = useState(0);
    const smoothRef = useRef(0);

    useEffect(() => {
        if (!mediaStream || !mediaStream.getAudioTracks().length) {
            smoothRef.current = 0;
            setLevel(0);
            return undefined;
        }

        let audioCtx;
        let source;
        let analyser;
        let rafId;
        let cancelled = false;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaStreamSource(mediaStream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.78;
            source.connect(analyser);
        } catch (e) {
            console.warn("[Remote audio viz] setup failed:", e);
            return undefined;
        }

        const buf = new Uint8Array(analyser.fftSize);

        const tick = () => {
            if (cancelled || !analyser) return;
            if (audioCtx.state === "suspended") {
                audioCtx.resume().catch(() => {});
            }
            analyser.getByteTimeDomainData(buf);
            let sumSq = 0;
            for (let i = 0; i < buf.length; i++) {
                const x = (buf[i] - 128) / 128;
                sumSq += x * x;
            }
            const rms = Math.sqrt(sumSq / buf.length);
            const inst = Math.min(1, rms * 5.5);
            smoothRef.current = smoothRef.current * 0.74 + inst * 0.26;
            setLevel(smoothRef.current);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            try {
                source?.disconnect();
                analyser?.disconnect();
            } catch (_) {
                /* noop */
            }
            if (audioCtx) {
                audioCtx.close().catch(() => {});
            }
        };
    }, [mediaStream]);

    return level;
}

function CallWaveBars({ count = 9, levels = null }) {
    const live = Array.isArray(levels) && levels.length >= count;
    return (
        <div className="cd-call-session-wave" aria-hidden>
            {Array.from({ length: count }, (_, i) => {
                const lv = live ? Math.max(0, Math.min(1, levels[i])) : 0;
                return (
                    <span
                        key={i}
                        className={`cd-call-session-wave-bar${live ? " cd-call-session-wave-bar-live" : ""}`}
                        style={
                            live
                                ? {
                                      height: `${6 + lv * 54}px`,
                                      opacity: 0.4 + lv * 0.6,
                                      animation: "none",
                                  }
                                : { animationDelay: `${i * 0.07}s` }
                        }
                    />
                );
            })}
        </div>
    );
}

function CallSessionLive({ activeCall, callMuted, micStream, customerAudioStream, onHangup, onToggleMute }) {
    const [elapsed, setElapsed] = useState(0);
    const bandLevels = useMicLevelBands(micStream, 9);
    const remoteEnvelope = useRemoteAudioEnvelope(customerAudioStream);
    const ringsFollowCustomer = !!customerAudioStream;

    useEffect(() => {
        if (!activeCall?.answeredAt) return undefined;
        const start = new Date(activeCall.answeredAt).getTime();
        const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeCall?.callId, activeCall?.answeredAt]);

    const name = activeCall.customerName || "Customer";
    const initials = name.substring(0, 2).toUpperCase();

    return (
        <div className="cd-call-session cd-call-session-live">
            <div className="cd-call-session-bg" aria-hidden />
            <div className="cd-call-session-vignette" aria-hidden />
            <div className="cd-call-session-inner">
                <p className="cd-call-session-kicker">On air</p>
                <div className="cd-call-session-avatar-stage">
                    <span
                        className={`cd-call-session-ring cd-call-session-ring-1${ringsFollowCustomer ? " cd-call-session-ring-live" : ""}`}
                        style={
                            ringsFollowCustomer
                                ? {
                                      transform: `translate(-50%, -50%) scale(${0.88 + remoteEnvelope * 0.2})`,
                                      opacity: 0.22 + remoteEnvelope * 0.68,
                                  }
                                : undefined
                        }
                    />
                    <span
                        className={`cd-call-session-ring cd-call-session-ring-2${ringsFollowCustomer ? " cd-call-session-ring-live" : ""}`}
                        style={
                            ringsFollowCustomer
                                ? {
                                      transform: `translate(-50%, -50%) scale(${0.88 + remoteEnvelope * 0.28})`,
                                      opacity: 0.12 + remoteEnvelope * 0.58,
                                  }
                                : undefined
                        }
                    />
                    <div className="cd-call-session-avatar">{initials}</div>
                </div>
                <h2 className="cd-call-session-title">{name}</h2>
                <p className="cd-call-session-sub">Voice session · you are connected</p>
                <CallWaveBars levels={bandLevels} />
                <p className="cd-call-session-timer">{formatCallDuration(elapsed)}</p>
                <div className="cd-call-session-dock">
                    <div className="cd-call-session-dock-item">
                        <button
                            type="button"
                            className={`cd-call-session-round cd-call-session-round-mic${callMuted ? " is-muted" : ""}`}
                            onClick={onToggleMute}
                            title={callMuted ? "Unmute microphone" : "Mute microphone"}
                        >
                            <MicrophoneIcon className="cd-call-session-round-icon" />
                        </button>
                        <span className="cd-call-session-dock-label">{callMuted ? "Muted" : "Mic"}</span>
                    </div>
                    <div className="cd-call-session-dock-item">
                        <button
                            type="button"
                            className="cd-call-session-round cd-call-session-round-end"
                            onClick={onHangup}
                            title="End call"
                        >
                            <PhoneXMarkIcon className="cd-call-session-round-icon" />
                        </button>
                        <span className="cd-call-session-dock-label">End</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CallSessionRinging({ call, onAccept }) {
    const name = call.customerName || "Customer";
    const initials = name.substring(0, 2).toUpperCase();

    return (
        <div className="cd-call-session cd-call-session-ringing">
            <div className="cd-call-session-bg cd-call-session-bg-ringing" aria-hidden />
            <div className="cd-call-session-vignette" aria-hidden />
            <div className="cd-call-session-inner">
                <p className="cd-call-session-kicker cd-call-session-kicker-amber">Incoming</p>
                <div className="cd-call-session-avatar-stage">
                    <span className="cd-call-session-ring cd-call-session-ring-1 cd-call-session-ring-amber" />
                    <span className="cd-call-session-ring cd-call-session-ring-2 cd-call-session-ring-amber" />
                    <div className="cd-call-session-avatar cd-call-session-avatar-amber">{initials}</div>
                </div>
                <h2 className="cd-call-session-title">{name}</h2>
                <p className="cd-call-session-sub">Waiting on you — pick up</p>
                <CallWaveBars count={7} />
                <div className="cd-call-session-dock cd-call-session-dock-wide">
                    <button type="button" className="cd-call-btn cd-call-answer" onClick={onAccept} title="Accept">
                        <PhoneIcon style={{ width: 28, height: 28 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   CALLS VIEW
═══════════════════════════════════════ */
function CallsView({
    availableCalls = [],
    activeCall,
    callMuted,
    agentMicStream,
    customerAudioStream,
    onAcceptCall,
    onHangup,
    onToggleMute,
}) {
    const [selectedCallId, setSelectedCallId] = useState(null);

    const sortedCalls = useMemo(
        () =>
            [...availableCalls].sort(
                (a, b) =>
                    new Date(a.startedAt || a.createdAt || Date.now()) - new Date(b.startedAt || b.createdAt || Date.now())
            ),
        [availableCalls]
    );

    const selectedQueueCall = useMemo(
        () => sortedCalls.find((c) => c.callId === selectedCallId) || null,
        [sortedCalls, selectedCallId]
    );

    useEffect(() => {
        if (activeCall) setSelectedCallId(null);
    }, [activeCall]);

    useEffect(() => {
        if (selectedCallId && !sortedCalls.some((c) => c.callId === selectedCallId)) {
            setSelectedCallId(null);
        }
    }, [selectedCallId, sortedCalls]);

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    };

    const handleAcceptSelected = () => {
        if (!selectedQueueCall) return;
        onAcceptCall(selectedQueueCall.callId);
    };

    return (
        <div className="cd-wa-layout">
            <div className="cd-wa-sidebar cd-wa-sidebar-calls">
                <div className="cd-wa-sidebar-header">
                    <h2>Calls</h2>
                </div>

                <div className="cd-wa-list">
                    {sortedCalls.length === 0 ? (
                        <div className="cd-tkt-empty-modern">
                            <div className="cd-empty-icon-glow">
                                <PhoneIcon className="cd-tkt-empty-icon-m" />
                            </div>
                            <p className="cd-tkt-empty-text-m">No calls in queue</p>
                            <p className="cd-tkt-empty-sub-m">New calls appear here when someone rings.</p>
                        </div>
                    ) : (
                        sortedCalls.map((call) => (
                            <CallQueueCard
                                key={call.callId}
                                call={call}
                                isActive={selectedCallId === call.callId}
                                formatRelativeTime={formatRelativeTime}
                                onClick={() => setSelectedCallId(call.callId)}
                            />
                        ))
                    )}
                </div>
            </div>

            <div
                className={`cd-wa-chat-area${activeCall || selectedQueueCall ? " cd-wa-chat-area-call-immersive" : ""}`}
            >
                {activeCall ? (
                    <CallSessionLive
                        activeCall={activeCall}
                        callMuted={callMuted}
                        micStream={agentMicStream}
                        customerAudioStream={customerAudioStream}
                        onHangup={onHangup}
                        onToggleMute={onToggleMute}
                    />
                ) : selectedQueueCall ? (
                    <CallSessionRinging
                        call={selectedQueueCall}
                        onAccept={handleAcceptSelected}
                    />
                ) : (
                    <div className="cd-chat-placeholder">
                        <div className="cd-placeholder-icon-wrap">
                            <PhoneIcon className="cd-placeholder-icon" />
                        </div>
                        <h3 className="cd-placeholder-title">Your calls</h3>
                        <p className="cd-placeholder-text">
                            Select a call from the list on the left to accept.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   ANALYTICS VIEW
═══════════════════════════════════════ */
function AnalyticsView() {
    const [filter, setFilter] = useState("All Tickets");
    const [filterOpen, setFilterOpen] = useState(false);
    const [analyticsData, setAnalyticsData] = useState([]);

    const fetchAnalytics = useCallback(async () => {
        try {
            let queryParams = "";
            if (filter === "Resolved") queryParams = "?status=resolved";
            else if (filter === "Pending") queryParams = "?status=unresolved";
            else if (filter === "High Emotion") queryParams = "?sentiment=positive";
            else if (filter === "Low Emotion") queryParams = "?sentiment=negative";

            const data = await agentApi.getQAAutomatedResults(queryParams);
            const formatted = (data.results || []).map(r => ({
                id: r._id,
                name: r.customerId?.name || "Customer",
                address: "-",
                phone: "-",
                email: r.customerId?.email || "-",
                emotion: r.customerSentiment || "Neutral",
                behavior: `Professionalism: ${r.scores?.professionalism || 0}/10`,
                status: r.resolutionStatus || "Unknown",
                clarity: r.scores?.quality || 0,
                churn: "N/A",
                summary: `Ticket #${r.ticketNumber} - ${r.category || 'General'} on ${r.channel || 'chat'}`
            }));
            setAnalyticsData(formatted);
        } catch (error) {
            console.error("Fetch analytics failed:", error);
        }
    }, [filter]);

    useEffect(() => {
        fetchAnalytics();
    }, [filter, fetchAnalytics]);

    const filterOptions = ["All Tickets", "Resolved", "Pending", "High Emotion", "Low Emotion"];

    return (
        <div className="cd-analytics-layout">
            <div className="cd-page-heading cd-analytics-heading">
                <h1>Analytics</h1>
                <p>Plan, prioritize, and accomplish your tasks with Natiq.</p>
            </div>

            <div className="cd-table-card">
                <div className="cd-table-header-block">
                    <div style={{ position: "relative" }}>
                        <button
                            className="cd-table-filter-btn"
                            onClick={() => setFilterOpen(!filterOpen)}
                        >
                            {filter} <ChevronDownIcon className="cd-chevron-sm" style={{ marginLeft: 4 }} />
                        </button>
                        {filterOpen && (
                            <div className="cd-period-dropdown" style={{ top: "100%", right: 0, marginTop: 4, width: "160px" }}>
                                {filterOptions.map((f) => (
                                    <div
                                        key={f}
                                        className={`cd-period-option ${filter === f ? 'cd-period-active' : ''}`}
                                        onClick={() => { setFilter(f); setFilterOpen(false); }}
                                    >
                                        {f}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="cd-table-responsive">
                    <table className="cd-analytics-table">
                        <thead>
                            <tr>
                                <th>Tickets</th>
                                <th>Customer Emotion</th>
                                <th>Agent Behavior</th>
                                <th>Resolution Status</th>
                                <th>Communication clarity</th>
                                <th>Churn Prob</th>
                                <th>Summary For Dashboard</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyticsData.map((row) => (
                                <tr key={row.id}>
                                    <td className="cd-td-user">
                                        <p className="cd-td-name">{row.name}</p>
                                        <p className="cd-td-sub">Address: {row.address} Phone Number: {row.phone}</p>
                                        <p className="cd-td-sub">Email: {row.email}</p>
                                    </td>
                                    <td><span className={`cd-pill cd-pill-${row.emotion.toLowerCase().replace('_', '-')}`}>{row.emotion}</span></td>
                                    <td>{row.behavior}</td>
                                    <td><span className={`cd-pill cd-pill-${row.status.toLowerCase().replace('_', '-')}`}>{row.status}</span></td>
                                    <td style={{ textAlign: "center", fontWeight: 700 }}>{row.clarity}</td>
                                    <td style={{ textAlign: "center", fontWeight: 700 }}>{row.churn}</td>
                                    <td className="cd-td-summary">{row.summary}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
/* ═══════════════════════════════════════
   PROFILE VIEW
 ═══════════════════════════════════════ */
function ProfileView({ user }) {
    return (
        <div className="cd-profile-layout">
            <div className="cd-page-heading">
                <h1>My Profile</h1>
                <p>Manage your professional account and performance statistics.</p>
            </div>
            
            <div className="cd-profile-card">
                <div className="cd-profile-header">
                    <div className="cd-profile-avatar-large">
                        {user.avatar ? <img src={user.avatar} alt="Profile" /> : user.initials}
                    </div>
                    <div className="cd-profile-summary">
                        <h2>{user.name}</h2>
                        <p>{user.email}</p>
                        <span className="cd-role-badge">Agent</span>
                    </div>
                </div>
                
                <div className="cd-profile-stats-grid">
                    <div className="cd-p-stat">
                        <span className="cd-p-stat-val">Today</span>
                        <span className="cd-p-stat-label">Shift Status: Active</span>
                    </div>
                    <div className="cd-p-stat">
                        <span className="cd-p-stat-val">Level</span>
                        <span className="cd-p-stat-label">Senior Support Agent</span>
                    </div>
                </div>
            </div>
            
            <style>{`
                .cd-profile-layout { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .cd-profile-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 24px; padding: 40px; box-shadow: 0 12px 40px rgba(4, 40, 53, 0.05); margin-top: 24px; transition: transform 0.3s ease; }
                .cd-profile-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(4, 40, 53, 0.08); }
                .cd-profile-header { display: flex; align-items: center; gap: 32px; margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid rgba(4, 40, 53, 0.08); }
                .cd-profile-avatar-large { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #042835, #084960); color: #CAF301; display: flex; align-items: center; justify-content: center; fontSize: 40px; fontWeight: 700; overflow: hidden; box-shadow: 0 8px 24px rgba(4, 40, 53, 0.2); border: 4px solid rgba(255, 255, 255, 0.5); }
                .cd-profile-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
                .cd-profile-summary h2 { font-size: 32px; color: #042835; margin: 0 0 8px 0; letter-spacing: -0.5px; }
                .cd-profile-summary p { font-size: 16px; color: #666; margin: 0 0 16px 0; }
                .cd-role-badge { background: #CAF301; color: #042835; padding: 6px 16px; border-radius: 30px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(202, 243, 1, 0.4); }
                .cd-profile-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
                .cd-p-stat { padding: 24px; background: rgba(255, 255, 255, 0.5); border-radius: 16px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.8); }
                .cd-p-stat-val { font-size: 20px; font-weight: 700; color: #042835; }
                .cd-p-stat-label { font-size: 14px; color: #666; }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   INCOMING CALL OVERLAY
═══════════════════════════════════════ */
function IncomingCallOverlay({ callInfo, onAnswer }) {
    return (
        <div className="cd-call-overlay">
            <div className="cd-call-overlay-card">
                <div className="cd-call-pulse-ring" />
                <div className="cd-call-avatar-big">
                    {(callInfo.customerName || 'CU').substring(0, 2).toUpperCase()}
                </div>
                <p className="cd-call-overlay-label">Incoming Call</p>
                <p className="cd-call-overlay-name">{callInfo.customerName || 'Customer'}</p>
                <p className="cd-call-overlay-sub">Voice Call • Now</p>
                <div className="cd-call-overlay-actions">
                    <button className="cd-call-btn cd-call-answer" onClick={onAnswer} title="Answer">
                        <PhoneIcon style={{ width: 26, height: 26 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   ACTIVE CALL PANEL
═══════════════════════════════════════ */
function ActiveCallPanel({ callInfo, muted, onToggleMute }) {
    const [elapsed, setElapsed] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    if (isExpanded) {
        return (
            <div className="cd-call-overlay">
                <div className="cd-call-overlay-card" style={{ padding: '40px' }}>
                    <button 
                        className="cd-btn-icon" 
                        style={{ position: 'absolute', top: 16, right: 16, color: '#fff', background: 'transparent', border: 'none' }}
                        onClick={() => setIsExpanded(false)}
                        title="Minimize"
                    >
                        <ChevronDownIcon style={{ width: 24, height: 24 }} />
                    </button>
                    
                    <div className="cd-call-avatar-big" style={{ marginBottom: 16 }}>
                        <div className="cd-call-pulse-ring active-ring" />
                        {(callInfo.customerName || 'CU').substring(0, 2).toUpperCase()}
                    </div>
                    
                    <p className="cd-call-overlay-name">{callInfo.customerName || 'Customer'}</p>
                    <p className="cd-call-overlay-sub" style={{ fontSize: '28px', color: '#CAF301', margin: '16px 0', fontWeight: '300', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px' }}>
                        {fmt(elapsed)}
                    </p>

                    <div className="cd-active-call-wave" style={{ justifyContent: 'center', marginBottom: '32px', height: '40px' }}>
                        {[...Array(7)].map((_, i) => <span key={i} className="cd-wave-bar" style={{ animationDelay: `${i * 0.12}s`, width: '4px', margin: '0 2px' }} />)}
                    </div>

                    <div className="cd-call-overlay-actions">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <button className={`cd-call-btn cd-active-ctrl-btn${muted ? ' cd-ctrl-muted' : ''}`} onClick={onToggleMute} title={muted ? 'Unmute Mic' : 'Mute Mic'} style={{ background: muted ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255,255,255,0.1)', color: muted ? '#ff4757' : '#fff' }}>
                                <MicrophoneIcon style={{ width: 26, height: 26, position: 'relative' }} />
                                {muted && <div style={{ position: 'absolute', width: '30px', height: '2px', background: '#ff4757', transform: 'rotate(45deg)' }} />}
                            </button>
                            <span style={{ fontSize: '12px', color: '#888' }}>{muted ? 'Unmute Mic' : 'Mute Mic'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cd-active-call-bar" onClick={() => setIsExpanded(true)} style={{ cursor: 'pointer' }}>
            <div className="cd-active-call-wave">
                {[...Array(5)].map((_, i) => <span key={i} className="cd-wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />)}
            </div>
            <div className="cd-active-call-info" style={{ flexGrow: 1 }}>
                <PhoneIcon style={{ width: 18, height: 18, color: '#22c55e' }} />
                <span className="cd-active-call-name">{callInfo.customerName || 'Customer'}</span>
                <span className="cd-active-call-timer">{fmt(elapsed)}</span>
            </div>
            <div className="cd-active-call-controls" onClick={(e) => e.stopPropagation()}>
                <button className={`cd-active-ctrl-btn${muted ? ' cd-ctrl-muted' : ''}`} style={{ position: 'relative' }} onClick={onToggleMute} title={muted ? 'Unmute Mic' : 'Mute Mic'}>
                    <MicrophoneIcon style={{ width: 18, height: 18 }} />
                    {muted && <div style={{ position: 'absolute', left: '50%', top: '50%', width: '22px', height: '2px', background: '#ff4757', transform: 'translate(-50%, -50%) rotate(45deg)' }} />}
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════ */
function NatiqDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const getActiveNavFromPath = (path) => {
        if (path.startsWith("/tickets")) return "Tickets";
        if (path.startsWith("/calls")) return "Calls";
        if (path.startsWith("/calendar")) return "Calendar";
        if (path.startsWith("/profile")) return "Profile";
        if (path.startsWith("/settings")) return "Settings";
        return "Dashboard";
    };

    const activeNav = getActiveNavFromPath(location.pathname);
    const [period, setPeriod] = useState("Monthly");
    const [agentUser, setAgentUser] = useState(getAgentUser());

    // ── Dynamic dashboard data ──
    const [dashData, setDashData] = useState(null);
    const [dashLoading, setDashLoading] = useState(true);

    // ── Dynamic pending tickets count for badge ──
    const [pendingCount, setPendingCount] = useState(0);

    const [trackerTime, setTrackerTime] = useState(() => {
        const savedDate = localStorage.getItem("tracker_date");
        const today = new Date().toISOString().split("T")[0];
        if (savedDate !== today) {
            localStorage.setItem("tracker_date", today);
            localStorage.setItem("tracker_time", "0");
            return 0;
        }
        return parseInt(localStorage.getItem("tracker_time") || "0", 10);
    });
    const [trackerActive, setTrackerActive] = useState(true);

    // ── Call state ──
    const [availableCalls, setAvailableCalls] = useState([]); // only currently available/ringing calls
    const [activeCall, setActiveCall] = useState(null);       // same shape + answeredAt
    const [callMuted, setCallMuted] = useState(false);
    const [agentMicStream, setAgentMicStream] = useState(null);
    const [customerAudioStream, setCustomerAudioStream] = useState(null);
    const callSocketRef = useRef(null);
    const peerRef = useRef(null);           // RTCPeerConnection
    const localStreamRef = useRef(null);    // local MediaStream
    const remoteAudioRef = useRef(null);    // <audio> element for remote stream
    const callStartedAtRef = useRef(null);
    const activeCallRef = useRef(null);
    const availableCallsRef = useRef([]);
    const incomingCall = availableCalls[0] || null;
    
    // Recording Refs
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const audioContextRef = useRef(null);

    // Ringtone Refs
    const ringtoneAudioCtxRef = useRef(null);
    const ringtoneIntervalRef = useRef(null);

    // Fetch dashboard data from backend
    const fetchDashboard = useCallback(async () => {
        try {
            setDashLoading(true);
            const data = await agentApi.getDashboardOverview();
            setDashData(data.dashboard || data);
            // Update agent user info from profile returned by dashboard
            const prof = (data.dashboard || data)?.profile;
            if (prof) {
                const nameParts = (prof.name || "Agent").split(" ");
                const initials = nameParts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
                setAgentUser({
                    name: prof.name || "Agent",
                    email: prof.email || "",
                    initials,
                    avatar: prof.profileImage || null,
                    id: prof._id || null,
                });
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setDashLoading(false);
        }
    }, []);

    // Fetch pending ticket count for sidebar badge
    const fetchPendingCount = useCallback(async () => {
        try {
            const data = await agentApi.getTickets("?queue=unassigned");
            const count = data.tickets?.length || data.total || 0;
            setPendingCount(count);
        } catch (err) {
            console.error("Pending count fetch error:", err);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
        fetchPendingCount();
        // Refresh periodically
        const interval = setInterval(() => {
            fetchPendingCount();
        }, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [fetchDashboard, fetchPendingCount]);

    useEffect(() => {
        let interval = null;
        if (trackerActive) {
            interval = setInterval(() => {
                setTrackerTime((t) => {
                    const nextTime = t + 1;
                    localStorage.setItem("tracker_time", nextTime.toString());
                    
                    // Periodic check for day change (e.g., if user leaves tab open overnight)
                    const savedDate = localStorage.getItem("tracker_date");
                    const today = new Date().toISOString().split("T")[0];
                    if (savedDate !== today) {
                        localStorage.setItem("tracker_date", today);
                        return 0;
                    }
                    
                    return nextTime;
                });
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [trackerActive]);

    const formatTime = (totalSecs) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // ── Extract dynamic values from dashData ──
    const uiKpis = dashData?.uiKpis || {};
    const channelDist = dashData?.channelDistribution || [];
    const goalTickets = uiKpis?.goalTickets || {};
    const avgFeedback = uiKpis?.avgFeedback || 0;
    const csatScore = uiKpis?.csatScore || 0;
    const tasks = dashData?.tasks || {};

    // Build channel bar data from backend or fallback
    const channelBarData = channelDist.length > 0
        ? channelDist.map(c => ({ name: c.channel || "Unknown", percent: c.percentage || 0 }))
        : [{ name: "No data", percent: 0 }];

    const stopRingtone = useCallback(() => {
        if (ringtoneIntervalRef.current) {
            clearInterval(ringtoneIntervalRef.current);
            ringtoneIntervalRef.current = null;
        }
    }, []);

    // Sync refs with state so that closures can access the latest values
    useEffect(() => {
        activeCallRef.current = activeCall;
        availableCallsRef.current = availableCalls;
    }, [activeCall, availableCalls]);

    useEffect(() => {
        if (!activeCall && availableCalls.length === 0) {
            stopRingtone();
        }
    }, [activeCall, availableCalls, stopRingtone]);

    // ── Synthetic Ringtone ──
    const playRingtone = useCallback(() => {
        try {
            stopRingtone(); // one interval only — multiple call:incoming was stacking intervals
            if (!ringtoneAudioCtxRef.current) {
                ringtoneAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = ringtoneAudioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const playBeeps = () => {
                const playSingleBeep = (startTime) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, startTime);
                    osc.frequency.setValueAtTime(480, startTime); // dual tone classic SIP ring

                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05); // fade in
                    gain.gain.setValueAtTime(0.5, startTime + 0.4);
                    gain.gain.linearRampToValueAtTime(0, startTime + 0.5); // fade out

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.start(startTime);
                    osc.stop(startTime + 0.5);
                };

                const now = ctx.currentTime;
                playSingleBeep(now);
                playSingleBeep(now + 0.6); // second beep after 0.1s gap
            };

            playBeeps();
            ringtoneIntervalRef.current = setInterval(playBeeps, 3000); // repeat every 3s
        } catch (e) {
            console.error('[Ringtone] Failed to play:', e);
        }
    }, [stopRingtone]);

    // ── Call socket setup ──
    useEffect(() => {
        const token = localStorage.getItem('agent_token');
        if (!token) return;

        const socket = io(`${process.env.REACT_APP_SOCKET_URL || ''}/calls`, { auth: { token } });
        callSocketRef.current = socket;

        socket.on('connect', () => console.log('[Calls] socket connected'));
        socket.on('connect_error', (err) => console.error('[Calls] connect error:', err.message));

        // Incoming call from a customer
        socket.on('call:incoming', (data) => {
            console.log('[Calls] incoming:', data);
            setAvailableCalls((prev) => {
                const exists = prev.some((c) => c.callId === data.callId);
                if (exists) return prev;
                const next = [...prev, data].sort((a, b) => new Date(a.startedAt || a.createdAt || Date.now()) - new Date(b.startedAt || b.createdAt || Date.now()));
                return next;
            });
            if (!activeCallRef.current) playRingtone();
        });

        // Customer accepted our 'accept' → start WebRTC as answerer
        socket.on('call:offer', async ({ callId, sdp }) => {
            if (!peerRef.current) return;
            try {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await peerRef.current.createAnswer();
                await peerRef.current.setLocalDescription(answer);
                socket.emit('call:answer', { callId, sdp: answer });
            } catch (err) {
                console.error('[Calls] SDP answer error:', err);
            }
        });

        socket.on('call:ice-candidate', ({ candidate }) => {
            if (peerRef.current && candidate) {
                peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
            }
        });

        socket.on('call:ended', ({ callId, endedBy, duration }) => {
            console.log('[Calls] ended', callId, 'by', endedBy, 'duration', duration);
            setAvailableCalls((prev) => prev.filter((call) => call.callId !== callId));
            cleanupCall(duration || 0, endedBy || 'customer');
        });

        socket.on('call:rejected', ({ callId }) => {
            setAvailableCalls((prev) => prev.filter((call) => call.callId !== callId));
        });

        return () => { socket.disconnect(); };
    // eslint-disable-next-line
    }, []);

    // Setup Call Recording
    const startRecording = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = ctx;
            const dest = ctx.createMediaStreamDestination();

            if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
                const localSource = ctx.createMediaStreamSource(localStreamRef.current);
                localSource.connect(dest);
            }

            if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
                const remoteSource = ctx.createMediaStreamSource(remoteAudioRef.current.srcObject);
                remoteSource.connect(dest);
            }

            const recorder = new MediaRecorder(dest.stream);
            mediaRecorderRef.current = recorder;
            recordedChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };
            recorder.start(1000); // collect 1s chunks
            console.log('[Recording] Started');
        } catch (err) {
            console.error('[Recording] Failed to start:', err);
        }
    }, []);

    const stopAndUploadRecording = useCallback(async (callId) => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
        
        return new Promise((resolve) => {
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                recordedChunksRef.current = [];
                console.log(`[Recording] Stopped. Blob size: ${blob.size}`);
                
                if (blob.size > 0 && callId) {
                    try {
                        await agentApi.uploadRecording(callId, blob);
                        console.log('[Recording] Uploaded successfully');
                    } catch (err) {
                        console.error('[Recording] Upload failed:', err);
                    }
                }
                
                if (audioContextRef.current) {
                    audioContextRef.current.close().catch(console.error);
                    audioContextRef.current = null;
                }
                resolve();
            };
            mediaRecorderRef.current.stop();
        });
    }, []);

    const cleanupCall = useCallback(async (duration, endedBy) => {
        console.log('[Calls] Cleanup WebRTC, duration =', duration);

        const callSnap = activeCallRef.current;
        const currentCallId = callSnap?.callId;
        
        // Save to backend FIRST so it doesn't fail if recording fails
        if (callSnap) {
            try {
                await agentApi.saveCall({
                    callId: callSnap.callId,
                    customerId: callSnap.customerId,
                    customerName: callSnap.customerName,
                    status: duration > 0 ? 'ended' : 'missed',
                    startedAt: callSnap.startedAt,
                    answeredAt: callSnap.answeredAt || null,
                    endedAt: new Date().toISOString(),
                    duration: Math.round(duration),
                    endedBy,
                });
                console.log('[Calls] saveCall successful');
            } catch (e) {
                console.error('saveCall error:', e);
            }
        }

        // Stop recording and upload
        if (currentCallId) {
            await stopAndUploadRecording(currentCallId).catch(console.error);
        }

        setAgentMicStream(null);
        setCustomerAudioStream(null);

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        // Close peer
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        
        setActiveCall(null);
        setCallMuted(false);
        callStartedAtRef.current = null;
        if ((availableCallsRef.current || []).length === 0) stopRingtone();
    }, [stopAndUploadRecording, stopRingtone]);

    const handleAnswerCall = useCallback(async (targetCallId = null) => {
        const targetCall = targetCallId
            ? (availableCallsRef.current || []).find((call) => call.callId === targetCallId)
            : (availableCallsRef.current || [])[0];
        if (!targetCall) return;
        const call = { ...targetCall, answeredAt: new Date().toISOString() };
        setActiveCall(call);
        setAvailableCalls((prev) => prev.filter((item) => item.callId !== call.callId));
        callStartedAtRef.current = Date.now();
        if ((availableCallsRef.current || []).length <= 1) stopRingtone();

        // Emit accept so server notifies customer
        callSocketRef.current?.emit('call:accept', { callId: call.callId });

        // Setup WebRTC
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setAgentMicStream(stream);

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerRef.current = pc;

            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (remoteStream) {
                    setCustomerAudioStream(remoteStream);
                }
                if (remoteAudioRef.current && remoteStream) {
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.play().catch(console.warn);
                }
                if (remoteStream) {
                    setTimeout(() => startRecording(), 500);
                }
            };

            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    callSocketRef.current?.emit('call:ice-candidate', { callId: call.callId, candidate });
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log('[Calls] ICE state:', pc.iceConnectionState);
            };
        } catch (err) {
            console.error('[Calls] getUserMedia error:', err);
            alert('Could not access microphone. Please allow microphone access.');
            setActiveCall(null);
            setAvailableCalls((prev) => [targetCall, ...prev].sort((a, b) => new Date(a.startedAt || a.createdAt || Date.now()) - new Date(b.startedAt || b.createdAt || Date.now())));
        }
    }, [startRecording, stopRingtone]);

    const handleToggleMute = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => {
                t.enabled = callMuted; // toggle
            });
        }
        setCallMuted(m => !m);
    }, [callMuted]);

    const handleHangup = useCallback(() => {
        const duration = callStartedAtRef.current
            ? Math.round((Date.now() - callStartedAtRef.current) / 1000)
            : 0;
        callSocketRef.current?.emit('call:end', {
            callId: activeCall?.callId,
            endedBy: 'agent',
            duration,
        });
        cleanupCall(duration, 'agent');
    }, [activeCall, cleanupCall]);

    // Handle logout
    const handleNavClick = (key) => {
        if (key === "Logout") {
            localStorage.removeItem("agent_token");
            localStorage.removeItem("agent_user");
            window.location.href = "/";
            return;
        }
        
        const pathMap = {
            Dashboard: "/dashboard",
            Tickets: "/tickets",
            Calls: "/calls",
            Calendar: "/calendar",
            Profile: "/profile",
            Settings: "/settings"
        };
        
        if (pathMap[key]) {
            navigate(pathMap[key]);
        }
    };

    return (
        <div className="cd-layout">
            {/* Hidden audio element for remote stream */}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

            {/* Incoming overlay only off the Calls page — on /calls the queue handles accept */}
            {incomingCall && !activeCall && activeNav !== "Calls" && (
                <IncomingCallOverlay
                    callInfo={incomingCall}
                    onAnswer={handleAnswerCall}
                />
            )}

            {/* Bottom bar only when not on Calls page — Calls view has its own immersive session UI */}
            {activeCall && activeNav !== "Calls" && (
                <ActiveCallPanel
                    callInfo={activeCall}
                    muted={callMuted}
                    onToggleMute={handleToggleMute}
                />
            )}

            {/* ── Main Panel ── */}
            <div className="cd-right-panel">
 
                {/* ── Top Bar ── */}
                <header className="cd-topbar">
                    <div className="cd-topbar-left">
                        <div className="cd-topbar-logo" onClick={() => navigate("/dashboard")} style={{ cursor: 'pointer' }}>
                            <img src={logo} alt="NATIQ" />
                        </div>
                        
                        <nav className="cd-horizontal-nav">
                            {MENU_KEYS.map(({ key, Icon, hasBadge, hasCallBadge }) => (
                                <div
                                    key={key}
                                    className={`cd-h-nav-item${activeNav === key ? " cd-h-nav-active" : ""}`}
                                    onClick={() => handleNavClick(key)}
                                >
                                    <Icon className="cd-h-nav-icon" />
                                    <span className="cd-h-nav-text">{key}</span>
                                    {hasBadge && pendingCount > 0 && (
                                        <span className="cd-h-badge">+{pendingCount}</span>
                                    )}
                                    {hasCallBadge && availableCalls.length > 0 && (
                                        <span className="cd-h-badge cd-h-badge-call">{availableCalls.length}</span>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    <div className="cd-topbar-actions">
                        <div className="cd-h-nav-item cd-h-nav-settings" onClick={() => handleNavClick("Settings")}>
                            <Cog6ToothIcon className="cd-h-nav-icon" />
                        </div>
                        
                        <button className="cd-icon-btn" aria-label="Mail">
                            <EnvelopeIcon className="cd-topbar-icon" />
                        </button>
                        <button className="cd-icon-btn" aria-label="Notifications">
                            <BellIcon className="cd-topbar-icon" />
                        </button>
                        
                        <div className="cd-user-info" onClick={() => navigate("/profile")} style={{ cursor: 'pointer' }}>
                            <div className="cd-avatar">
                                {agentUser.avatar
                                    ? <img src={agentUser.avatar} alt="avatar" />
                                    : agentUser.initials}
                            </div>
                            <div className="cd-user-text">
                                <span className="cd-user-name">{agentUser.name}</span>
                                <span className="cd-user-email">{agentUser.email}</span>
                            </div>
                        </div>

                        <div className="cd-icon-btn cd-logout-btn" onClick={() => handleNavClick("Logout")} title="Logout">
                            <ArrowRightOnRectangleIcon className="cd-topbar-icon" />
                        </div>
                    </div>
                </header>

                {/* ── Main Content ── */}
                <main className="cd-main">

                    {/* ── Tickets view ── */}
                    {activeNav === "Tickets" && <TicketsView />}

                    {/* ── Calls view ── */}
                    {activeNav === "Calls" && (
                        <CallsView
                            availableCalls={availableCalls}
                            activeCall={activeCall}
                            callMuted={callMuted}
                            agentMicStream={agentMicStream}
                            customerAudioStream={customerAudioStream}
                            onAcceptCall={handleAnswerCall}
                            onHangup={handleHangup}
                            onToggleMute={handleToggleMute}
                        />
                    )}

                    {/* ── Analytics view ── */}
                    {activeNav === "Analytics" && <AnalyticsView />}

                    {/* ── Calendar view ── */}
                    {activeNav === "Calendar" && <CalendarView />}

                    {/* ── Profile view ── */}
                    {activeNav === "Profile" && <ProfileView user={agentUser} />}

                    {/* ── Dashboard view ── */}
                    {activeNav !== "Tickets" && activeNav !== "Calls" && activeNav !== "Analytics" && activeNav !== "Calendar" && activeNav !== "Profile" && <>
                        <div className="cd-bento-layout">
                            {/* ── Welcome Header ── */}
                            <div className="cd-bento-header">
                                <div>
                                    <h1>Welcome back, {agentUser.name.split(" ")[0]}!</h1>
                                    <p>Here is what's happening with your tasks today.</p>
                                </div>
                                <div className="cd-bento-date">
                                    {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            {/* ── KPIs Row ── */}
                            <div className="cd-bento-kpis">
                                <StatCardDark
                                    title="Flagged Tickets"
                                    value={dashLoading ? "..." : (uiKpis.flaggedTickets ?? 0).toLocaleString()}
                                    note="Flagged urgent & high priority"
                                    badge={tasks.inProgressTicketsCount ?? ""}
                                />
                                <StatCardLight
                                    title="Pending Tickets"
                                    value={dashLoading ? "..." : (uiKpis.pendingTickets ?? 0).toString()}
                                    note="Awaiting assignment"
                                    badge={pendingCount > 0 ? `${pendingCount}+` : "0"}
                                />
                                <StatCardLight
                                    title="Avg. Response Time"
                                    value={dashLoading ? "..." : (uiKpis.avgLateReplyString || "0s")}
                                    note="First response time"
                                    badge={uiKpis.avgLateReplySec ?? ""}
                                />
                                <StatCardLight
                                    title="Avg. Call Duration"
                                    value={dashLoading ? "..." : (uiKpis.avgCallDurationString || "0:00s")}
                                    note="Average resolution time"
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
                                                <p className="cd-chart-big-title">Performance Trend</p>
                                                <p className="cd-chart-big-sub">Tickets vs Calls processed</p>
                                            </div>
                                            <PeriodDropdown value={period} onChange={setPeriod} />
                                        </div>
                                        <div className="cd-chart-area">
                                            <svg viewBox="0 0 390 140" className="cd-line-chart" preserveAspectRatio="none">
                                                {CHART_Y.map((v, i) => <text key={i} x="0" y={10 + i * 26} fontSize="9" fill="#aaa">{v}</text>)}
                                                <polyline points={CHART_POINTS_DARK} fill="none" stroke="#042835" strokeWidth="2" strokeLinejoin="round" />
                                                <polyline points={CHART_POINTS_LIME} fill="none" stroke="#CAF301" strokeWidth="2" strokeLinejoin="round" />
                                                <circle cx="150" cy="85" r="4" fill="#042835" />
                                                <rect x="128" y="68" width="44" height="16" rx="4" fill="#042835" />
                                                <text x="150" y="80" fontSize="9" fill="#fff" textAnchor="middle">Fri: 2500</text>
                                            </svg>
                                            <div className="cd-chart-xaxis">
                                                {CHART_MONTHS.map((m) => <span key={m}>{m}</span>)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-split: Tickets Stats & Goals */}
                                    <div className="cd-bento-split">
                                        <div className="cd-chart-card">
                                            <p className="cd-chart-title">Channels Breakdown</p>
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
                                                <p className="cd-goal-tickets-title">Goal Tickets {goalTickets.total || 500}</p>
                                                <button className="cd-goal-link"><ArrowUpRightIcon className="cd-icon-link" /></button>
                                            </div>
                                            <div className="cd-goal-tickets-value">
                                                {dashLoading ? "..." : (goalTickets.current ?? tasks.resolvedTicketsCount ?? 0)}
                                            </div>
                                            <div className="cd-goal-tickets-footer">
                                                <p className="cd-goal-note"><span className="cd-note-badge">{tasks.resolvedTicketsCount ?? 0}</span> Resolved</p>
                                                <span className="cd-goal-tickets-pct">{goalTickets.percentageCompleted ?? 0}% completed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Right Column ── */}
                                <div className="cd-bento-right">
                                    
                                    {/* Time Tracker */}
                                    <div className="cd-timetracker-card cd-timetracker-sleek">
                                        <div className="cd-tt-info">
                                            <p className="cd-timetracker-title">Current Shift Time</p>
                                            <p className="cd-timetracker-time">{formatTime(trackerTime)}</p>
                                        </div>
                                        <div className="cd-timetracker-actions">
                                            <button className="cd-tt-btn cd-tt-pause" onClick={() => setTrackerActive(!trackerActive)}>
                                                {trackerActive ? <><b className="cd-tt-pause-bar"></b><b className="cd-tt-pause-bar"></b></> : <b className="cd-tt-play-triangle"></b>}
                                            </button>
                                            <button className="cd-tt-btn cd-tt-stop" onClick={() => { setTrackerActive(false); setTrackerTime(0); }}>
                                                <b className="cd-tt-stop-square"></b>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sub-split: Feedback & CSAT */}
                                    <div className="cd-bento-split" style={{ flex: 1 }}>
                                        <div className="cd-feedback-card">
                                            <div className="cd-feedback-header">
                                                <p className="cd-feedback-title">Avg. Feedback</p>
                                            </div>
                                            <p className="cd-feedback-rating-text">{avgFeedback || 0} <span className="cd-feedback-max">/ 5</span></p>
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
                                                    const rating = avgFeedback || 3.5;
                                                    if (s <= Math.floor(rating)) return <StarSolid key={s} className="cd-star" style={{ fill: "url(#star-grad)" }} />;
                                                    if (s === Math.ceil(rating) && rating % 1 !== 0) return (
                                                        <div key={s} className="cd-star-half-wrap">
                                                            <StarIcon className="cd-star cd-star-empty" style={{ position: "absolute", zIndex: 2 }} />
                                                            <div style={{ width: `${(rating % 1) * 100}%`, overflow: "hidden", position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 1 }}>
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
                                                <p className="cd-cast-title">CSAT Status</p>
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
                    </>}

                </main>
            </div>

        </div>
    );
}

export default NatiqDashboard;
