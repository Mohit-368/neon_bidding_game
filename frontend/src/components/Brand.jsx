import { Gavel, Radio } from 'lucide-react';

export function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark"><Gavel size={19} strokeWidth={2.3} /></div>
      <div>
        <div className="font-display text-lg font-bold tracking-[0.14em] text-white">AUCTION<span className="text-cyan">//</span>ARENA</div>
        {!compact && <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">Real-time card showdown</div>}
      </div>
    </div>
  );
}

export function ConnectionBadge({ status }) {
  const connected = status === 'connected';
  return (
    <div className={`connection-badge ${connected ? 'is-online' : 'is-offline'}`}>
      <Radio size={13} />
      <span>{connected ? 'LIVE SOCKET' : status === 'connecting' ? 'CONNECTING' : 'RECONNECTING'}</span>
    </div>
  );
}
