const { AppError } = require('../utils/errors');

function validateBid({ player, amount, currentBid, highBidderId, now, itemEndsAt }) {
  if (!player || !player.connected) throw new AppError('You are not connected to this room.', 403, 'PLAYER_OFFLINE');
  if (itemEndsAt === null || now >= itemEndsAt) throw new AppError('The bidding timer has expired.', 409, 'BIDDING_CLOSED');
  if (player.deck.length >= 5) throw new AppError('Your 5-card hand is already full.', 409, 'HAND_FULL');
  if (!Number.isSafeInteger(amount) || amount < 1) throw new AppError('Bid must be a positive whole number.');
  if (amount <= currentBid) throw new AppError(`Your bid must be higher than $${currentBid}.`, 409, 'BID_TOO_LOW');

  // The current leader may raise their own held bid. Everyone else must fit within free balance.
  const availableToBid = player.id === highBidderId
    ? player.balance
    : player.balance - player.reservedAmount;
  if (amount > availableToBid) {
    throw new AppError(`Your maximum available bid is $${Math.max(0, availableToBid)}.`, 409, 'INSUFFICIENT_BUDGET');
  }
  return true;
}

module.exports = { validateBid };
