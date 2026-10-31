import { useMemo, useState } from 'react';
import { Check, Clipboard, Crown, DoorOpen, Play, Settings2, ShieldCheck, UserPlus, Wifi } from 'lucide-react';
import { Brand, ConnectionBadge } from './Brand.jsx';

export default function WaitingRoom({ room, me, connection, onStart, onUpdateBudget, onLeave }) {
  const [budget, setBudget] = useState(String(room.startingBudget));
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const connectedCount = useMemo(() => room.players.filter((player) => player.connected).length, [room.players]);
  const canStart = Boolean(me?.isAdmin) && connectedCount >= 2;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const saveBudget = async () => {
    setSaving(true);
    try { await onUpdateBudget(Number(budget)); } catch { /* Shared game state displays the request error. */ } finally { setSaving(false); }
  };

  const start = async () => {
    setStarting(true);
    try { await onStart(); } catch { /* Shared game state displays the request error. */ } finally { setStarting(false); }
  };

  return (
    <main className="lobby-shell min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between"><Brand /><ConnectionBadge status={connection} /></header>
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> LOBBY / WAITING FOR PLAYERS</div><h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Assemble your table.</h1><p className="mt-3 text-sm text-slate-400">Share your room code. The admin starts the auction when the table is ready.</p></div>
            <button className="text-button" onClick={onLeave}><DoorOpen size={16} /> Leave room</button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-[1.15fr_.85fr]">
            <section className="panel-card p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3"><div><div className="field-label">YOUR ROOM CODE</div><div className="mt-2 font-display text-4xl font-bold tracking-[.18em] text-white">{room.roomCode}</div></div><button className="copy-code" onClick={copyCode}>{copied ? <Check size={17} /> : <Clipboard size={17} />}<span>{copied ? 'COPIED' : 'COPY CODE'}</span></button></div>
              <div className="mt-6 h-px bg-slate-800" />
              <div className="mt-5 flex items-center justify-between"><div><div className="font-display text-lg font-bold text-white">Player lineup</div><div className="mt-1 text-xs text-slate-500">{connectedCount} connected · 4 seats maximum</div></div><div className="seat-counter">{room.players.length}<span>/4</span></div></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((index) => {
                  const player = room.players[index];
                  return player ? (
                    <div className={`player-slot ${player.id === me?.id ? 'is-self' : ''}`} key={player.id}>
                      <div className="avatar-orb">{player.name.slice(0, 1).toUpperCase()}</div>
                      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-semibold text-white">{player.name}</span>{player.id === me?.id && <span className="you-tag">YOU</span>}</div><div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">{player.isAdmin ? <><Crown size={11} className="text-amber-300" /> ADMIN</> : <><Wifi size={11} /> PLAYER</>}{!player.connected && <span className="text-rose-400">· OFFLINE</span>}</div></div>
                      {player.isAdmin && <ShieldCheck size={16} className="text-amber-300" />}
                    </div>
                  ) : (
                    <div className="player-slot empty" key={`empty-${index}`}><div className="empty-avatar"><UserPlus size={17} /></div><div><div className="text-sm font-semibold text-slate-500">Open seat</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-700">Share code to invite</div></div></div>
                  );
                })}
              </div>
            </section>

            <aside className="panel-card p-5 sm:p-7">
              <div className="flex items-center gap-2 text-cyan"><Settings2 size={17} /><span className="field-label text-cyan">MATCH SETTINGS</span></div>
              <div className="mt-5"><label className="field-label" htmlFor="budget">STARTING WALLET</label><div className="input-with-icon mt-2"><span className="text-cyan font-bold">$</span><input id="budget" type="number" min="1" max="100000" step="1" value={budget} onChange={(event) => setBudget(event.target.value)} disabled={!me?.isAdmin} /><span>credits</span></div></div>
              {me?.isAdmin ? <button className="secondary-button mt-3 w-full" disabled={saving || Number(budget) === room.startingBudget || !Number.isSafeInteger(Number(budget)) || Number(budget) < 1 || Number(budget) > 100000} onClick={saveBudget}>{saving ? 'SAVING...' : 'UPDATE WALLET FOR ALL PLAYERS'}</button> : <p className="mt-3 text-xs leading-5 text-slate-500">Only the room admin can change the starting wallet.</p>}
              <div className="mt-6 space-y-3 border-t border-slate-800 pt-5">
                <div className="rule-row"><span>Players per room</span><strong>2–4</strong></div>
                <div className="rule-row"><span>Cards per hand</span><strong>5 max</strong></div>
                <div className="rule-row"><span>Bid timer</span><strong>10 seconds</strong></div>
                <div className="rule-row"><span>Hidden stat</span><strong>Power</strong></div>
              </div>
              {me?.isAdmin ? <button className="primary-button mt-7 w-full" disabled={!canStart || starting || connection !== 'connected'} onClick={start}>{starting ? 'STARTING AUCTION...' : 'START AUCTION'} <Play size={16} fill="currentColor" /></button> : <div className="waiting-indicator mt-7"><span className="pulse-dot" /> Waiting for admin to start</div>}
              {me?.isAdmin && connectedCount < 2 && <p className="mt-3 text-center text-xs text-amber-300/80">At least 2 connected players are required.</p>}
            </aside>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.2em] text-slate-600"><ShieldCheck size={13} /> Server validates every bid and protects hidden card stats</div>
        </div>
      </div>
    </main>
  );
}
