const { getCardCount } = require('../repositories/card.repository');

function getHealth(_request, response) {
  response.status(200).json({
    status: 'ok',
    service: 'auction-arena-api',
    timestamp: new Date().toISOString(),
    cardCount: getCardCount()
  });
}

module.exports = { getHealth };
