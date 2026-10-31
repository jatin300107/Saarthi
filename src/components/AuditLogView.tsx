import React, { useState } from 'react';
import { AuditEvent } from '../types';
import { Clock, Shield, Search, RefreshCw, FileText, CheckCircle, XCircle } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditEvent[];
  onRefresh: () => void;
  loading: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onRefresh, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      log.summary.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.actor.name.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVED')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('REJECTED')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (action.includes('DOCUMENT') || action.includes('UPLOAD')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('AI_EXTRACTION')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-blue-700" />
            <span>Immutable Regulatory Audit Trail</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            System Event & Version Governance Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Every document ingestion, AI extraction, parameter edit, and reviewer sign-off is logged with cryptographic timestamps.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter audit events by action, actor name, or target ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Event Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No matching audit events found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{log.actor.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{log.actor.role}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                      {log.targetId}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      {log.summary}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
