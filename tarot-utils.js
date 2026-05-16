const tarotData = require('./tarot-data.json');

function fisherYatesShuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function drawCards(count = 3) {
    const shuffled = fisherYatesShuffle(tarotData);
    const selected = shuffled.slice(0, count);
    
    return selected.map(card => ({
        id: card.id,
        name: card.name,
        name_cn: card.name_cn,
        imageUrl: card.image_url,
        type: card.type,
        suit: card.suit,
        isReversed: Math.random() < 0.5
    }));
}

module.exports = {
    tarotData,
    fisherYatesShuffle,
    drawCards
};
