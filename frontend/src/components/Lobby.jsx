import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Coins, Fingerprint, Hash, Plus, Shuffle, Users, Zap } from 'lucide-react';
import { Brand, ConnectionBadge } from './Brand.jsx';

export default function Lobby({ connection, onCreate, onJoin, onRandom, error, onDismissError }) {
  const [name, setName] = useState(localStorage.getItem('auction-player-name') || '');
  const [budget, setBudget] = useState('20');
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  const rememberName = (value) => {
    setName(value);
    localStorage.setItem('auction-player-name', value);
  };

  const run = async (action) => {
    setBusy(true);
    onDismissError();
    try {
      await action();
    } catch {
      // The shared socket hook owns and displays the server error state.
    } finally {
      setBusy(false);
    }
  };

  const validName = name.trim().length >= 2;

  return (
    <main className="lobby-shell min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <ConnectionBadge status={connection} />
        </header>

        {error && <div className="alert-error mt-6" role="alert"><span>{error}</span><button onClick={onDismissError}>Dismiss</button></div>}

        <section className="grid items-center gap-12 pb-12 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:pb-20 lg:pt-20">
          <div className="relative z-10">
            <div className="eyebrow"><span className="eyebrow-dot" /> FOUR PLAYERS. ONE WINNER.</div>
            <h1 className="hero-title mt-6 max-w-3xl">DON'T JUST<br /><span>COLLECT.</span><br />OUTBID.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Build a five-card lineup through a live auction. Read the table, manage your wallet, and discover the hidden strength of your deck when the battle begins.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <div className="feature-chip"><Users size={15} /> UP TO 4 PLAYERS</div>
              <div className="feature-chip"><Zap size={15} /> 10-SECOND ROUNDS</div>
              <div className="feature-chip"><Fingerprint size={15} /> HIDDEN STATS</div>
            </div>
          </div>

          <div className="lobby-card-wrap">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="lobby-card relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.28em] text-cyan">PLAYER TERMINAL</div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">Enter the arena</h2>
                </div>
                <div className="terminal-icon"><Zap size={20} /></div>
              </div>

              <label className="field-label mt-7">YOUR CALLSIGN</label>
              <input className="arena-input mt-2" value={name} onChange={(event) => rememberName(event.target.value)} maxLength={18} placeholder="e.g. Shadow striker" autoComplete="nickname" />

              <div className="mt-6 flex rounded-xl bg-[#080e19] p-1">
                <button className={`mode-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}><Plus size={15} /> Create</button>
                <button className={`mode-tab ${activeTab === 'join' ? 'active' : ''}`} onClick={() => setActiveTab('join')}><Hash size={15} /> Join code</button>
              </div>

              {activeTab === 'create' ? (
                <div className="mt-5">
                  <label className="field-label">STARTING WALLET</label>
                  <div className="input-with-icon mt-2"><Coins size={17} /><input type="number" min="1" max="100000" step="1" value={budget} onChange={(event) => setBudget(event.target.value)} /><span>credits</span></div>
                  <button className="primary-button mt-5 w-full" disabled={!validName || busy || connection !== 'connected'} onClick={() => run(() => onCreate(name.trim(), Number(budget)))}>
                    {busy ? 'CREATING ROOM...' : 'CREATE PRIVATE ROOM'} <ArrowUpRight size={17} />
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-500">You become admin and control the game start.</p>
                </div>
              ) : (
                <div className="mt-5">
                  <label className="field-label">SIX-CHARACTER ROOM CODE</label>
                  <input className="arena-input mt-2 font-display tracking-[.35em] uppercase" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().slice(0, 6))} placeholder="A7K2Q9" />
                  <button className="primary-button mt-5 w-full" disabled={!validName || roomCode.trim().length !== 6 || busy || connection !== 'connected'} onClick={() => run(() => onJoin(name.trim(), roomCode.trim()))}>
                    {busy ? 'JOINING ROOM...' : 'JOIN ROOM'} <ArrowRight size={17} />
                  </button>
                </div>
              )}

              <div className="relative my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-800" /><span className="text-[10px] font-bold tracking-[.2em] text-slate-600">OR</span><div className="h-px flex-1 bg-slate-800" /></div>
              <button className="secondary-button w-full" disabled={!validName || busy || connection !== 'connected'} onClick={() => run(() => onRandom(name.trim()))}>
                <Shuffle size={16} /> FIND A RANDOM ROOM
              </button>
              <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-[10px] uppercase tracking-[.18em] text-slate-600">
                <span>Server-authoritative auctions</span><span>v1.0.0</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-slate-800/70 py-5 text-[10px] uppercase tracking-[.2em] text-slate-600 sm:flex-row">
          <span>Strategy beats luck. Spend like it.</span><span>LOCAL ASSETS · NO AI API · REAL-TIME SOCKETS</span>
        </footer>
      </div>
    </main>
  );
}
