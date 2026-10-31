import Lobby from './components/Lobby.jsx';
import WaitingRoom from './components/WaitingRoom.jsx';
import AuctionArena from './components/AuctionArena.jsx';
import BattleResults from './components/BattleResults.jsx';
import { useAuctionGame } from './hooks/useAuctionGame.js';

export default function App() {
  const game = useAuctionGame();

  if (!game.room) {
    return (
      <Lobby
        connection={game.connection}
        onCreate={game.createRoom}
        onJoin={game.joinRoom}
        onRandom={game.joinRandomRoom}
        error={game.error}
        onDismissError={game.dismissError}
      />
    );
  }

  if (game.room.phase === 'waiting') {
    return (
      <>
        {game.error && <div className="global-toast error-toast" role="alert"><span>{game.error}</span><button onClick={game.dismissError}>×</button></div>}
        <WaitingRoom
          room={game.room}
          me={game.me}
          connection={game.connection}
          onStart={game.startGame}
          onUpdateBudget={game.updateBudget}
          onLeave={game.leaveRoom}
        />
      </>
    );
  }

  if (game.room.phase === 'bidding') {
    return (
      <>
        {game.error && <div className="global-toast error-toast" role="alert"><span>{game.error}</span><button onClick={game.dismissError}>×</button></div>}
        {game.notice && <div className="global-toast notice-toast" role="status"><span>{game.notice}</span><button onClick={game.dismissNotice}>×</button></div>}
        <AuctionArena
          room={game.room}
          me={game.me}
          connection={game.connection}
          timer={game.timer}
          lastAward={game.lastAward}
          notice={game.notice}
          onPlaceBid={game.placeBid}
          onLeave={game.leaveRoom}
        />
      </>
    );
  }

  return (
    <BattleResults
      room={game.room}
      results={game.battleResults || game.room.leaderboard || []}
      me={game.me}
      connection={game.connection}
      onLeave={game.leaveRoom}
    />
  );
}
