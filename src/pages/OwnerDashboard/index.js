import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '../../services/ownerApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './OwnerDashboard.css';
import {
    ArrowPathIcon,
    ArrowRightOnRectangleIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    EyeIcon,
    EyeSlashIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    TicketIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

function getOwnerUser() {
    try {
        const raw = localStorage.getItem('agent_user');
        if (raw) return JSON.parse(raw);
    } catch {
        // no-op
    }
    return { name: 'Owner', email: '' };
}

const settingsDefaults = {
    name: '',
    slug: '',
    industry: 'telecom',
    settings: { aiEnabled: true, escalationThreshold: 0.5 },
    channelsConfig: {
        telegram: { isActive: false, botToken: '', webhookUrl: '' },
        whatsapp: { isActive: false, phoneNumberId: '', accessToken: '' },
        webChat: { isActive: true, color: '#042835', welcomeMessage: 'Welcome! How can we help you today?' }
    }
};

const formatDelta = (value) => {
    const amount = Math.abs(value || 0);
    if ((value || 0) === 0) return '0%';
    return `${value > 0 ? '+' : '-'}${amount}%`;
};

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const ownerUser = getOwnerUser();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [managers, setManagers] = useState([]);
    const [settings, setSettings] = useState(settingsDefaults);
    const [savingSettings, setSavingSettings] = useState(false);
    const [checkingBot, setCheckingBot] = useState(false);
    const [botStatus, setBotStatus] = useState(null);
    const [settingsTab, setSettingsTab] = useState('general');
    const [showTgToken, setShowTgToken] = useState(false);
    const [showWaToken, setShowWaToken] = useState(false);
    const [managerQuery, setManagerQuery] = useState('');
    const [managerFilter, setManagerFilter] = useState('all');

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ownerApi.getDashboardSummary();
            setSummary(data);
        } catch {
            toast.error('Failed to load dashboard summary');
        }
        setLoading(false);
    }, []);

    const loadManagers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ownerApi.listManagers();
            setManagers(data);
        } catch {
            toast.error('Failed to load managers');
        }
        setLoading(false);
    }, []);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ownerApi.getCompanySettings();
            setSettings({
                name: data.name || settingsDefaults.name,
                slug: data.slug || '',
                industry: data.industry || settingsDefaults.industry,
                settings: {
                    aiEnabled: data.settings?.aiEnabled ?? settingsDefaults.settings.aiEnabled,
                    escalationThreshold: data.settings?.escalationThreshold ?? settingsDefaults.settings.escalationThreshold
                },
                channelsConfig: {
                    telegram: {
                        isActive: data.channelsConfig?.telegram?.isActive ?? false,
                        botToken: data.channelsConfig?.telegram?.botToken || '',
                        webhookUrl: data.channelsConfig?.telegram?.webhookUrl || ''
                    },
                    whatsapp: {
                        isActive: data.channelsConfig?.whatsapp?.isActive ?? false,
                        phoneNumberId: data.channelsConfig?.whatsapp?.phoneNumberId || '',
                        accessToken: data.channelsConfig?.whatsapp?.accessToken || ''
                    },
                    webChat: {
                        isActive: data.channelsConfig?.webChat?.isActive ?? true,
                        color: data.channelsConfig?.webChat?.color || settingsDefaults.channelsConfig.webChat.color,
                        welcomeMessage: data.channelsConfig?.webChat?.welcomeMessage || settingsDefaults.channelsConfig.webChat.welcomeMessage
                    }
                }
            });
        } catch {
            toast.error('Failed to load company settings');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'dashboard') loadDashboard();
        if (activeTab === 'managers') loadManagers();
        if (activeTab === 'settings') loadSettings();
    }, [activeTab, loadDashboard, loadManagers, loadSettings]);

    const filteredManagers = useMemo(() => {
        return managers.filter((manager) => {
            const textMatch = `${manager.name || ''} ${manager.email || ''} ${manager.phone || ''}`
                .toLowerCase()
                .includes(managerQuery.toLowerCase().trim());
            const statusMatch =
                managerFilter === 'all' ||
                (managerFilter === 'active' && manager.isActive) ||
                (managerFilter === 'inactive' && !manager.isActive);
            return textMatch && statusMatch;
        });
    }, [managers, managerQuery, managerFilter]);

    const handleLogout = () => {
        localStorage.removeItem('agent_token');
        localStorage.removeItem('agent_user');
        navigate('/');
    };

    const handleSettingsSubmit = async (event) => {
        event.preventDefault();
        setSavingSettings(true);
        try {
            await ownerApi.updateCompanySettings(settings);
            toast.success('Company settings updated successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to update settings');
        }
        setSavingSettings(false);
    };

    const checkBotStatus = async () => {
        const token = settings.channelsConfig.telegram?.botToken;
        if (!token) {
            toast.warn('Please enter a bot token first');
            return;
        }
        setCheckingBot(true);
        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const data = await response.json();
            if (data.ok) {
                setBotStatus({ success: true, ...data.result });
                toast.success('Bot is active and connected');
            } else {
                setBotStatus({ success: false, error: data.description });
                toast.error('Bot token is invalid');
            }
        } catch {
            setBotStatus({ success: false, error: 'Connection failed' });
            toast.error('Failed to connect to Telegram API');
        }
        setCheckingBot(false);
    };

    const applyTelegramWebhook = async () => {
        const url = (settings.channelsConfig.telegram?.webhookUrl || '').trim();
        if (!url) {
            toast.warn('Please enter a Telegram webhook URL');
            return;
        }
        setSavingSettings(true);
        try {
            await ownerApi.updateTelegramWebhook(url);
            toast.success('Telegram webhook applied successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to apply Telegram webhook');
        }
        setSavingSettings(false);
    };

    const renderDashboard = () => {
        if (loading || !summary) return <div className="owner-loader">Loading summary...</div>;

        return (
            <div className="owner-dashboard-modern">
                <div className="owner-hero">
                    <div>
                        <h2>Welcome back, {ownerUser.name || 'Owner'}</h2>
                        <p>Snapshot for {settings.name || 'your company'} with live workload and operational trends.</p>
                    </div>
                    <button className="owner-ghost-btn" onClick={loadDashboard}>
                        <ArrowPathIcon width={18} /> Refresh data
                    </button>
                </div>

                <div className="owner-kpi-grid">
                    <div className="owner-kpi-card">
                        <div className="owner-kpi-icon primary"><UserGroupIcon width={22} /></div>
                        <p className="owner-kpi-title">Workforce</p>
                        <p className="owner-kpi-value">{summary.users?.totalWorkforce || 0}</p>
                        <p className="owner-kpi-sub">Agents {summary.users?.agents || 0} - TL/Managers {(summary.users?.teamLeaders || 0) + (summary.users?.managers || 0)}</p>
                    </div>
                    <div className="owner-kpi-card">
                        <div className="owner-kpi-icon warning"><TicketIcon width={22} /></div>
                        <p className="owner-kpi-title">Resolution Rate</p>
                        <p className="owner-kpi-value">{summary.tickets?.resolutionRate || 0}%</p>
                        <p className="owner-kpi-sub">{summary.tickets?.resolved || 0} resolved from {summary.tickets?.total || 0}</p>
                    </div>
                    <div className="owner-kpi-card">
                        <div className="owner-kpi-icon"><ChatBubbleLeftRightIcon width={22} /></div>
                        <p className="owner-kpi-title">Active Chats</p>
                        <p className="owner-kpi-value">{summary.chats?.active || 0}</p>
                        <p className="owner-kpi-sub">Out of {summary.chats?.total || 0} total sessions</p>
                    </div>
                    <div className="owner-kpi-card">
                        <div className="owner-kpi-icon primary"><Cog6ToothIcon width={22} /></div>
                        <p className="owner-kpi-title">Live Channels</p>
                        <p className="owner-kpi-value">{summary.insights?.activeChannels || 0}/3</p>
                        <p className="owner-kpi-sub">Telegram, WhatsApp, Web Widget</p>
                    </div>
                </div>

                <div className="owner-insights-grid">
                    <div className="owner-panel">
                        <h3>Last 7 days trends</h3>
                        <div className="owner-trend-row">
                            <span>Tickets created</span>
                            <strong>{summary.insights?.trends?.tickets?.current || 0}</strong>
                            <em className={(summary.insights?.trends?.tickets?.delta || 0) >= 0 ? 'up' : 'down'}>
                                {formatDelta(summary.insights?.trends?.tickets?.delta)}
                            </em>
                        </div>
                        <div className="owner-trend-row">
                            <span>Chats started</span>
                            <strong>{summary.insights?.trends?.chats?.current || 0}</strong>
                            <em className={(summary.insights?.trends?.chats?.delta || 0) >= 0 ? 'up' : 'down'}>
                                {formatDelta(summary.insights?.trends?.chats?.delta)}
                            </em>
                        </div>
                    </div>
                    <div className="owner-panel">
                        <h3>Quick actions</h3>
                        <button className="owner-quick-action" onClick={() => setActiveTab('settings')}>Review integrations</button>
                        <button className="owner-quick-action" onClick={() => setActiveTab('managers')}>Check manager roster</button>
                        <button className="owner-quick-action" onClick={loadDashboard}>Sync latest metrics</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderManagers = () => {
        if (loading) return <div className="owner-loader">Loading managers...</div>;
        return (
            <div>
                <div className="owner-section-head">
                    <h2>Company Managers</h2>
                    <p>{filteredManagers.length} shown from {managers.length}</p>
                </div>
                <div className="owner-managers-toolbar">
                    <div className="owner-search">
                        <MagnifyingGlassIcon width={18} />
                        <input
                            value={managerQuery}
                            onChange={(event) => setManagerQuery(event.target.value)}
                            placeholder="Search by name, email, or phone"
                        />
                    </div>
                    <select value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)}>
                        <option value="all">All</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>
                </div>
                <div className="owner-table-card">
                    <table className="owner-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredManagers.length === 0 ? (
                                <tr><td colSpan="4" className="owner-empty-row">No managers match your filter.</td></tr>
                            ) : (
                                filteredManagers.map((manager) => (
                                    <tr key={manager._id}>
                                        <td className="owner-manager-name">{manager.name}</td>
                                        <td>{manager.email}</td>
                                        <td>{manager.phone || '-'}</td>
                                        <td>
                                            <span className={`owner-status-badge ${manager.isActive ? '' : 'inactive'}`}>
                                                {manager.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSettings = () => {
        if (loading || !settings) return <div className="owner-loader">Loading settings...</div>;
        const apiDomain = window.location.origin;
        const widgetScript = `<script src="${apiDomain}/widget.js?id=${settings.slug || 'your-company'}"></script>`;
        const recommendedWebhookUrl = `${apiDomain}/api/v1/channels/telegram/webhook?companySlug=${settings.slug || 'your-slug'}`;

        return (
            <div>
                <div className="settings-tabs">
                    <button type="button" className={`settings-tab-btn ${settingsTab === 'general' ? 'active' : ''}`} onClick={() => setSettingsTab('general')}>General</button>
                    <button type="button" className={`settings-tab-btn ${settingsTab === 'channels' ? 'active' : ''}`} onClick={() => setSettingsTab('channels')}>Channels</button>
                    <button type="button" className={`settings-tab-btn ${settingsTab === 'ai' ? 'active' : ''}`} onClick={() => setSettingsTab('ai')}>AI</button>
                </div>
                <form onSubmit={handleSettingsSubmit}>
                    {settingsTab === 'general' && (
                        <div className="owner-settings-card owner-settings-max">
                            <h3>Company Information</h3>
                            <div className="owner-form-group">
                                <label>Company name</label>
                                <input type="text" value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} required />
                            </div>
                            <div className="owner-form-group">
                                <label>Industry</label>
                                <select value={settings.industry} onChange={(event) => setSettings({ ...settings, industry: event.target.value })}>
                                    <option value="sports_retail">Sports & Football Retail</option>
                                    <option value="telecom">Telecom</option>
                                    <option value="banking">Banking</option>
                                    <option value="ecommerce">E-commerce</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {settingsTab === 'ai' && (
                        <div className="owner-settings-card owner-settings-max">
                            <h3>AI & Automation</h3>
                            <label className="owner-check-wrap">
                                <input
                                    type="checkbox"
                                    checked={settings.settings.aiEnabled}
                                    onChange={(event) => setSettings({
                                        ...settings,
                                        settings: { ...settings.settings, aiEnabled: event.target.checked }
                                    })}
                                />
                                <span>Enable Smart AI Responder</span>
                            </label>
                            <div className="owner-form-group">
                                <label>Escalation threshold ({settings.settings.escalationThreshold})</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.settings.escalationThreshold}
                                    onChange={(event) => setSettings({
                                        ...settings,
                                        settings: { ...settings.settings, escalationThreshold: parseFloat(event.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                    )}

                    {settingsTab === 'channels' && (
                        <div className="owner-integrations">
                            <div className="integration-card">
                                <div className="integration-card-header"><strong>Web Chat Widget</strong></div>
                                <div className="integration-card-content">
                                    <label className="owner-check-wrap">
                                        <input
                                            type="checkbox"
                                            checked={settings.channelsConfig.webChat?.isActive}
                                            onChange={(event) => setSettings({
                                                ...settings,
                                                channelsConfig: {
                                                    ...settings.channelsConfig,
                                                    webChat: { ...settings.channelsConfig.webChat, isActive: event.target.checked }
                                                }
                                            })}
                                        />
                                        <span>Enable widget</span>
                                    </label>
                                    <div className="owner-form-group">
                                        <label>Primary color</label>
                                        <input
                                            type="text"
                                            value={settings.channelsConfig.webChat?.color || '#042835'}
                                            onChange={(event) => setSettings({
                                                ...settings,
                                                channelsConfig: {
                                                    ...settings.channelsConfig,
                                                    webChat: { ...settings.channelsConfig.webChat, color: event.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div className="owner-form-group">
                                        <label>Welcome message</label>
                                        <input
                                            type="text"
                                            value={settings.channelsConfig.webChat?.welcomeMessage || ''}
                                            onChange={(event) => setSettings({
                                                ...settings,
                                                channelsConfig: {
                                                    ...settings.channelsConfig,
                                                    webChat: { ...settings.channelsConfig.webChat, welcomeMessage: event.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div className="owner-code-row">
                                        <code>{widgetScript}</code>
                                        <button type="button" className="copy-badge" onClick={() => navigator.clipboard.writeText(widgetScript)}>Copy</button>
                                    </div>
                                </div>
                            </div>

                            <div className="integration-card">
                                <div className="integration-card-header"><strong>WhatsApp Business</strong></div>
                                <div className="integration-card-content">
                                    <label className="owner-check-wrap">
                                        <input
                                            type="checkbox"
                                            checked={settings.channelsConfig.whatsapp?.isActive}
                                            onChange={(event) => setSettings({
                                                ...settings,
                                                channelsConfig: {
                                                    ...settings.channelsConfig,
                                                    whatsapp: { ...settings.channelsConfig.whatsapp, isActive: event.target.checked }
                                                }
                                            })}
                                        />
                                        <span>Enable WhatsApp</span>
                                    </label>
                                    <div className="owner-form-group">
                                        <label>Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={settings.channelsConfig.whatsapp?.phoneNumberId || ''}
                                            onChange={(event) => setSettings({
                                                ...settings,
                                                channelsConfig: {
                                                    ...settings.channelsConfig,
                                                    whatsapp: { ...settings.channelsConfig.whatsapp, phoneNumberId: event.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div className="owner-form-group">
                                        <label>Access Token</label>
                                        <div className="owner-password-wrap">
                                            <input
                                                type={showWaToken ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                value={settings.channelsConfig.whatsapp?.accessToken || ''}
                                                onChange={(event) => setSettings({
                                                    ...settings,
                                                    channelsConfig: {
                                                        ...settings.channelsConfig,
                                                        whatsapp: { ...settings.channelsConfig.whatsapp, accessToken: event.target.value }
                                                    }
                                                })}
                                            />
                                            <button type="button" onClick={() => setShowWaToken(!showWaToken)}>
                                                {showWaToken ? <EyeSlashIcon width={18} /> : <EyeIcon width={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="integration-card">
                                <div className="integration-card-header"><strong>Telegram Bot</strong></div>
                                <div className="integration-card-content">
                                    <label className="owner-check-wrap">
                                        <input
                                            type="checkbox"
                                            checked={settings.channelsConfig.telegram?.isActive}
                                            onChange={(event) => setSettings({
                                                ...settings,
                                                channelsConfig: {
                                                    ...settings.channelsConfig,
                                                    telegram: { ...settings.channelsConfig.telegram, isActive: event.target.checked }
                                                }
                                            })}
                                        />
                                        <span>Enable Telegram</span>
                                    </label>
                                    <div className="owner-form-group">
                                        <label>Bot Token</label>
                                        <div className="owner-password-wrap">
                                            <input
                                                type={showTgToken ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                value={settings.channelsConfig.telegram?.botToken || ''}
                                                onChange={(event) => setSettings({
                                                    ...settings,
                                                    channelsConfig: {
                                                        ...settings.channelsConfig,
                                                        telegram: { ...settings.channelsConfig.telegram, botToken: event.target.value }
                                                    }
                                                })}
                                            />
                                            <button type="button" onClick={() => setShowTgToken(!showTgToken)}>
                                                {showTgToken ? <EyeSlashIcon width={18} /> : <EyeIcon width={18} />}
                                            </button>
                                        </div>
                                        <button type="button" className="check-status-btn" onClick={checkBotStatus} disabled={checkingBot || !settings.channelsConfig.telegram?.botToken}>
                                            {checkingBot ? 'Verifying...' : 'Verify Bot'}
                                        </button>
                                    </div>
                                    {botStatus && (
                                        <div className={`bot-info-box ${botStatus.success ? 'ok' : 'bad'}`}>
                                            {botStatus.success ? `Connected as @${botStatus.username}` : botStatus.error}
                                        </div>
                                    )}
                                    <div className="owner-code-row">
                                        <code>{recommendedWebhookUrl}</code>
                                        <button type="button" className="copy-badge" onClick={() => navigator.clipboard.writeText(recommendedWebhookUrl)}>Copy URL</button>
                                    </div>
                                    <div className="owner-form-group" style={{ marginTop: 14 }}>
                                        <label>Webhook URL</label>
                                        <input
                                            type="text"
                                            placeholder={recommendedWebhookUrl}
                                            value={settings.channelsConfig.telegram?.webhookUrl || ''}
                                            onChange={(event) => setSettings({
                                                ...settings,
                                                channelsConfig: {
                                                    ...settings.channelsConfig,
                                                    telegram: { ...settings.channelsConfig.telegram, webhookUrl: event.target.value }
                                                }
                                            })}
                                        />
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                className="check-status-btn"
                                                onClick={applyTelegramWebhook}
                                                disabled={savingSettings || !settings.channelsConfig.telegram?.botToken || !settings.channelsConfig.telegram?.webhookUrl}
                                                title={!settings.channelsConfig.telegram?.botToken ? 'Set bot token first' : 'Apply webhook on Telegram'}
                                            >
                                                Apply to Telegram
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="owner-submit-row">
                        <button type="submit" className="owner-btn-primary" disabled={savingSettings}>
                            {savingSettings ? 'Saving...' : 'Save settings'}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <div className="owner-dashboard">
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            <aside className="owner-sidebar">
                <div className="owner-sidebar-header">
                    <span className="owner-company-name">{settings?.name || 'Company'}</span>
                </div>
                <nav className="owner-nav">
                    <button className={`owner-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <Squares2X2Icon className="owner-nav-icon" /> Overview
                    </button>
                    <button className={`owner-nav-item ${activeTab === 'managers' ? 'active' : ''}`} onClick={() => setActiveTab('managers')}>
                        <UserGroupIcon className="owner-nav-icon" /> Managers
                    </button>
                    <button className={`owner-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <Cog6ToothIcon className="owner-nav-icon" /> Settings
                    </button>
                </nav>
            </aside>
            <main className="owner-main">
                <header className="owner-header">
                    <h1 className="owner-header-title">
                        {activeTab === 'dashboard' && 'Owner Command Center'}
                        {activeTab === 'managers' && 'Manager Administration'}
                        {activeTab === 'settings' && 'Platform Settings'}
                    </h1>
                    <div className="owner-profile">
                        <div className="owner-avatar">{ownerUser.name?.substring(0, 2).toUpperCase() || 'CO'}</div>
                        <div className="owner-profile-meta">
                            <span>{ownerUser.name}</span>
                            <small>Company Owner</small>
                        </div>
                        <button onClick={handleLogout} className="owner-logout" title="Logout">
                            <ArrowRightOnRectangleIcon width={20} />
                        </button>
                    </div>
                </header>
                <div className="owner-content">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'managers' && renderManagers()}
                    {activeTab === 'settings' && renderSettings()}
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
