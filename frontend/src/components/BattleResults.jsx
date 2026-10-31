import { useMemo } from 'react';
import { ArrowLeft, Award, Crown, Medal, RotateCcw, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { Brand, ConnectionBadge } from './Brand.jsx';

export default function BattleResults({ room, results = [], me, connection, onLeave }) {
  const champion = useMemo(() => results.find((player) => player.rank === 1) || results[0], [results]);
  return (
    <main className="lobby-shell min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between"><Brand /><div className="flex items-center gap-3"><ConnectionBadge status={connection} /><div className="room-code-mini"><span>ROOM</span><strong>{room.roomCode}</strong></div></div></header>
        <section className="results-hero mt-10 overflow-hidden rounded-3xl border border-amber-300/20 p-6 text-center sm:p-10">
          <div className="champion-glow" />
          <div className="relative z-10"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/30 bg-amber-300/10 text-amber-200"><Trophy size={25} /></div><div className="mt-5 text-[10px] font-bold uppercase tracking-[.35em] text-amber-200/80">PHASE 02 / BATTLE COMPLETE</div><h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">THE POWER <span className="text-amber-200">REVEAL.</span></h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">Hidden card power has been evaluated on the server. The final leaderboard is now public.</p>
            {champion && <div className="mx-auto mt-8 max-w-md rounded-2xl border border-amber-200/20 bg-black/25 px-5 py-5"><div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.25em] text-amber-200"><Crown size={14} /> ARENA CHAMPION</div><div className="mt-2 font-display text-3xl font-bold text-white">{champion.name}</div><div className="mt-1 text-sm text-slate-400">{champion.totalPower} total power</div></div>}
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="panel-card p-5 sm:p-7"><div className="flex items-center justify-between"><div><div className="field-label">FINAL STANDINGS</div><h2 className="mt-1 font-display text-2xl font-bold text-white">Leaderboard</h2></div><div className="results-badge"><ShieldCheck size={13} /> VERIFIED</div></div>
            <div className="mt-5 space-y-2">{results.map((player, index) => <div className={`result-row ${player.rank === 1 ? 'first-place' : ''}`} key={player.playerId}><div className={`rank-number rank-${player.rank}`} >{player.rank === 1 ? <Crown size={15} /> : player.rank === 2 ? <Medal size={15} /> : player.rank === 3 ? <Award size={15} /> : `0${player.rank}`}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-bold text-white">{player.name}</span>{player.playerId === me?.id && <span className="you-tag">YOU</span>}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{player.deckCount} cards · ${player.remainingBudget} left</div></div><div className="text-right"><div className="font-display text-2xl font-bold text-white">{player.totalPower}</div><div className="text-[9px] uppercase tracking-widest text-slate-500">POWER</div></div></div>)}</div>
          </div>

          <div className="panel-card p-5 sm:p-7"><div className="field-label">YOUR COLLECTION</div><h2 className="mt-1 font-display text-2xl font-bold text-white">{me?.name || 'Your deck'}</h2><div className="mt-1 text-xs text-slate-500">Power values are revealed in the final score only.</div>
            {me?.deck?.length ? <div className="mt-5 grid grid-cols-2 gap-3">{me.deck.map((card) => <div className={`collection-card tier-${card.tier.toLowerCase()}`} key={card.id}><img src={card.image} alt={card.name} /><div className="mt-2 truncate text-xs font-bold text-white">{card.name}</div><div className="mt-1 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500"><span>{card.tier}</span><span>${card.paidPrice}</span></div></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">No cards were acquired.</div>}
            <div className="mt-5 grid grid-cols-2 gap-2"><div className="wallet-metric"><div className="metric-label">TOTAL SPENT</div><div className="metric-value">${me?.wallet.spent ?? 0}</div></div><div className="wallet-metric"><div className="metric-label">BALANCE LEFT</div><div className="metric-value">${me?.wallet.balance ?? 0}</div></div></div>
          </div>
        </section>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"><button className="primary-button min-w-56" onClick={onLeave}><RotateCcw size={16} /> RETURN TO LOBBY</button><p className="text-xs text-slate-600">Create a new room to start another auction.</p></div>
        <div className="mt-8 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[.2em] text-slate-700"><Sparkles size={12} /> Final totals computed and ranked by the server</div>
      </div>
    </main>
  );
}
