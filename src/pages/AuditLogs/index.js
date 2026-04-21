// Audit log viewer and CSV export shortcuts for company managers
import { useEffect, useState, useCallback } from "react";
import { managementApi } from "../../services/managementApi";
import "./AuditLogs.css";

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function AuditLogs() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await managementApi.getAuditLogs({ page, limit: 25 });
            setItems(data.items || []);
            setTotalPages(data.pages || 1);
        } catch (e) {
            setError(e.message || "Failed to load audit logs");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    async function runExport(kind, filename) {
        setExporting(kind);
        try {
            const blob = await managementApi.downloadExport(kind);
            triggerDownload(blob, filename);
        } catch (e) {
            setError(e.message || "Export failed");
        } finally {
            setExporting(null);
        }
    }

    return (
        <div className="audit-outer">
            <h1 className="audit-title">Compliance &amp; exports</h1>
            <p className="audit-desc">
                Audit trail of administrative actions. CSV exports include the full company dataset for the optional date range.
            </p>

            <div className="audit-export-row">
                <button
                    type="button"
                    className="audit-btn"
                    disabled={!!exporting}
                    onClick={() => runExport("calls", "calls-export.csv")}
                >
                    {exporting === "calls" ? "Preparing…" : "Export calls (CSV)"}
                </button>
                <button
                    type="button"
                    className="audit-btn"
                    disabled={!!exporting}
                    onClick={() => runExport("tickets", "tickets-export.csv")}
                >
                    {exporting === "tickets" ? "Preparing…" : "Export tickets (CSV)"}
                </button>
                <button
                    type="button"
                    className="audit-btn"
                    disabled={!!exporting}
                    onClick={() => runExport("analytics-summary", "analytics-summary.csv")}
                >
                    {exporting === "analytics-summary" ? "Preparing…" : "Export analytics summary (CSV)"}
                </button>
            </div>

            {error && <div className="audit-error">{error}</div>}

            <h2 className="audit-subtitle">Recent audit events</h2>
            {loading ? (
                <p className="audit-muted">Loading…</p>
            ) : (
                <div className="audit-table-wrap">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>When (UTC)</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Resource</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="audit-muted">
                                        No audit entries yet.
                                    </td>
                                </tr>
                            ) : (
                                items.map((row) => (
                                    <tr key={row._id}>
                                        <td>
                                            {row.createdAt
                                                ? new Date(row.createdAt).toISOString().replace("T", " ").slice(0, 19)
                                                : "—"}
                                        </td>
                                        <td>{row.actorName || row.actorEmail || "—"}</td>
                                        <td><code className="audit-code">{row.action}</code></td>
                                        <td>{row.resourceType}</td>
                                        <td className="audit-details">
                                            {row.details && Object.keys(row.details).length
                                                ? JSON.stringify(row.details)
                                                : "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="audit-pagination">
                <button
                    type="button"
                    className="audit-page-btn"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    Previous
                </button>
                <span className="audit-page-info">
                    Page {page} of {totalPages}
                </span>
                <button
                    type="button"
                    className="audit-page-btn"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
