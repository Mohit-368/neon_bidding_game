import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Award, Clock3, Coins, Crown, EyeOff, Gavel, LockKeyhole, Radio, Shield, Sparkles, Swords, TrendingUp, Wallet, Zap } from 'lucide-react';
import { Brand, ConnectionBadge } from './Brand.jsx';

function PlayerPanel({ player, index, me, highBidderId }) {
  const isMe = player?.id === me?.id;
  const isLeader = player?.id === highBidderId;
  if (!player) {
    return <div className={`player-panel player-seat-${index} vacant`}><div className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-700">SEAT {index + 1}</div><div className="mt-2 text-sm text-slate-600">Unoccupied</div></div>;
  }
  const deckPercent = Math.min(100, (player.deckCount / 5) * 100);
  return (
    <div className={`player-panel player-seat-${index} ${isMe ? 'is-me' : ''} ${isLeader ? 'is-leading' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={`player-avatar ${isMe ? 'mine' : ''}`}>{player.name.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0"><div className="flex items-center gap-1.5"><span className="truncate text-sm font-bold text-white">{player.name}</span>{player.isAdmin && <Crown size={12} className="shrink-0 text-amber-300" />}</div><div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-slate-500">{isMe ? 'YOU' : 'PLAYER'} <span className={player.connected ? 'online-led' : 'offline-led'} />{player.connected ? 'ONLINE' : 'OFFLINE'}</div></div>
        </div>
        {isLeader && <div className="leader-pill"><Zap size={10} fill="currentColor" /> LEADING</div>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="wallet-metric"><div className="metric-label"><Wallet size={11} /> AVAILABLE</div><div className="metric-value">${player.wallet.available}</div></div>
        <div className="wallet-metric"><div className="metric-label"><Coins size={11} /> SPENT</div><div className="metric-value">${player.wallet.spent}</div></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500"><span>DECK CAPACITY</span><span className="font-bold text-slate-300">{player.deckCount}/5</span></div>
      <div className="deck-track mt-2"><div className="deck-fill" style={{ width: `${deckPercent}%` }} /></div>
    </div>
  );
}

function TierFrame({ tier, children, className = '' }) {
  return <div className={`tier-frame tier-${(tier || 'Common').toLowerCase()} ${className}`}>{children}</div>;
}

export default function AuctionArena({ room, me, connection, timer, lastAward, notice, onPlaceBid, onLeave }) {
  const [bidAmount, setBidAmount] = useState('1');
  const [placing, setPlacing] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const activeIndex = room.players.findIndex((player) => player.id === me?.id);
  const activeItem = room.currentItem;
  const endsAt = timer?.endsAt || room.timerEndsAt;
  const remainingMs = endsAt ? Math.max(0, endsAt - clock) : 0;
  const durationMs = (room.auctionDurationSeconds || 10) * 1000;
  const progress = Math.max(0, Math.min(100, (remainingMs / durationMs) * 100));
  const leadingPlayer = room.players.find((player) => player.id === room.highBidderId);
  const isLeading = room.highBidderId === me?.id;
  const maximumBid = isLeading ? (me?.wallet.balance || 0) : (me?.wallet.available || 0);
  const minimumBid = room.currentBid + 1;
  const canBid = room.phase === 'bidding' && Boolean(activeItem) && Boolean(me?.connected) && (me?.deckCount || 0) < 5 && maximumBid >= minimumBid && remainingMs > 0;

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 80);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setBidAmount(String(Math.max(1, room.currentBid + 1)));
  }, [room.itemNumber, room.currentBid]);

  const playerSlots = useMemo(() => [0, 1, 2, 3].map((index) => room.players[index] || null), [room.players]);
  const submitBid = async () => {
    const amount = Number(bidAmount);
    if (!Number.isSafeInteger(amount) || amount < minimumBid || amount > maximumBid || !canBid) return;
    setPlacing(true);
    try { await onPlaceBid(amount); } catch { /* Shared game state displays the request error. */ } finally { setPlacing(false); }
  };

  return (
    <main className="arena-shell min-h-screen px-3 py-4 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <Brand compact />
          <div className="flex items-center gap-2 sm:gap-4"><div className="room-code-mini"><span>ROOM</span><strong>{room.roomCode}</strong></div><div className="phase-tag"><span className="pulse-dot" /> LIVE AUCTION</div><ConnectionBadge status={connection} /><button className="icon-action" title="Leave game" onClick={onLeave}><DoorOpenIcon /></button></div>
        </header>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div><div className="text-[9px] font-bold uppercase tracking-[.28em] text-cyan">PHASE 01 / ACQUISITION</div><h1 className="mt-1 font-display text-xl font-bold tracking-wide text-white sm:text-2xl">THE AUCTION FLOOR</h1></div>
          <div className="flex gap-2"><div className="top-stat"><span>ITEM</span><strong>{room.itemNumber || 0}<small> / {room.totalItems || 0}</small></strong></div><div className="top-stat"><span>YOUR DECK</span><strong>{me?.deckCount || 0}<small> / 5</small></strong></div><div className="top-stat"><span>WALLET</span><strong>${me?.wallet.available ?? 0}</strong></div></div>
        </div>

        <section className="arena-grid mt-5">
          {playerSlots.map((player, index) => <PlayerPanel key={player?.id || `seat-${index}`} player={player} index={index} me={me} highBidderId={room.highBidderId} />)}

          <div className="main-stage">
            <div className="stage-topline"><span><Activity size={13} /> LIVE LOT / {String(room.itemNumber || 0).padStart(2, '0')}</span><span className="classified-tag"><LockKeyhole size={11} /> POWER CLASSIFIED</span></div>
            {activeItem ? (
              <div className="current-card-wrap">
                <TierFrame tier={activeItem.tier} className="current-card">
                  <div className="card-tier-label">{activeItem.tier} CLASS</div>
                  <img className="current-card-image" src={activeItem.image} alt={`${activeItem.name} card artwork`} />
                  <div className="current-card-caption"><div className="font-display text-xl font-bold text-white sm:text-2xl">{activeItem.name}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-[.28em] text-slate-400">AUTHENTICATED CARD ASSET</div></div>
                </TierFrame>
              </div>
            ) : (
              <div className="card-transition"><div className="scan-loader" /><div className="mt-4 font-display text-lg font-bold tracking-widest text-white">SETTLING THE LOT</div><div className="mt-2 text-xs text-slate-500">The next card is being prepared.</div></div>
            )}

            <div className="auction-control-panel">
              <div className="timer-head"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400"><Clock3 size={13} /> TIME REMAINING</div><div className={`timer-digits ${remainingMs < 3000 ? 'urgent' : ''}`}>{Math.ceil(remainingMs / 1000).toString().padStart(2, '0')}<span>s</span></div></div>
              <div className="timer-track"><div className={`timer-fill ${remainingMs < 3000 ? 'urgent' : ''}`} style={{ width: `${progress}%` }} /></div>
              <div className="mt-4 flex items-end justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[.22em] text-slate-500">CURRENT HIGH BID</div><div className="mt-1 font-display text-3xl font-bold text-white">${room.currentBid || 0}</div><div className="mt-1 text-xs text-slate-500">{leadingPlayer ? `Leading: ${leadingPlayer.name}` : 'No bids placed yet'}</div></div><div className="bid-status-chip">{isLeading ? 'YOU ARE LEADING' : leadingPlayer ? 'OUTBID THE LEADER' : 'OPEN FOR BIDS'}</div></div>
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                <div className="bid-input-wrap"><span>$</span><input aria-label="Bid amount" type="number" min={minimumBid} max={maximumBid} step="1" value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} disabled={!canBid || placing} /></div>
                <button className="bid-button" onClick={submitBid} disabled={!canBid || placing || Number(bidAmount) < minimumBid || Number(bidAmount) > maximumBid}>{placing ? 'BIDDING...' : <><Gavel size={16} /> PLACE BID</>}</button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500"><span>Minimum next bid: <b className="text-slate-300">${minimumBid}</b></span><span>Available to bid: <b className="text-cyan">${maximumBid}</b></span></div>
              {!canBid && me?.deckCount >= 5 && <div className="mt-3 text-xs text-amber-300">Your five-card hand is complete. You cannot bid on more cards.</div>}
              {canBid && <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600"><EyeOff size={12} /> Card power remains hidden until the battle results.</div>}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="activity-panel"><div className="panel-kicker"><Radio size={13} /> AUCTION ACTIVITY</div>{lastAward ? <div className="mt-3 flex items-center gap-3"><div className="activity-icon"><Award size={16} /></div><div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{lastAward.sold ? `${lastAward.winner.name} won ${lastAward.card.name}` : `${lastAward.card.name} went unsold`}</div><div className="mt-1 text-xs text-slate-500">{lastAward.sold ? `Closed at $${lastAward.amount}` : 'No valid bid before the timer expired'}</div></div></div> : <div className="mt-3 text-sm text-slate-600">Auction events will appear here.</div>}</div>
          <div className="activity-panel"><div className="panel-kicker"><Shield size={13} /> BIDDING PROTOCOL</div><div className="mt-3 grid grid-cols-3 gap-2"><div className="protocol-bit"><b>01</b><span>Highest bid wins</span></div><div className="protocol-bit"><b>02</b><span>Wallet is reserved</span></div><div className="protocol-bit"><b>03</b><span>Power stays hidden</span></div></div></div>
        </section>
        <div className="mt-5 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[.22em] text-slate-700"><TrendingUp size={12} /> Server clock is authoritative · local bar is a visual estimate</div>
      </div>
    </main>
  );
}

function DoorOpenIcon() {
  return <span className="text-xs font-bold tracking-widest">EXIT</span>;
}
