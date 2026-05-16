const shuffleBtn = document.getElementById('shuffle-btn');
const spreadArea = document.getElementById('spread-area');
const resultsArea = document.getElementById('reading-results');
const questionInput = document.getElementById('question-input');

let deckData = [];
let pickedCards = [];
let pickedDOMs = [];
let userQuestion = "";

shuffleBtn.addEventListener('click', async () => {
    userQuestion = questionInput.value.trim() || "关于我近期的整体运势与指引";
    questionInput.disabled = true;
    questionInput.style.opacity = '0.7';

    shuffleBtn.disabled = true;
    shuffleBtn.innerText = "洗牌中 (Shuffling...)";
    
    const response = await fetch('/api/shuffle-deck');
    deckData = await response.json();
    
    spreadArea.innerHTML = '';
    spreadArea.classList.remove('hidden');
    resultsArea.classList.add('hidden');
    pickedCards = [];
    pickedDOMs = [];
    
    const totalCards = 78;
    deckData.forEach((card, index) => {
        const cardDOM = document.createElement('div');
        cardDOM.classList.add('spread-card');
        
        cardDOM.innerHTML = `
            <div class="fixed-card-label"></div>
            <div class="card-visual-wrapper">
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    <img src="" class="card-img">
                </div>
            </div>
        `;
        
        const offset = (index - totalCards / 2) * 14;
        const rotation = (index - totalCards / 2) * 0.8;
        
        cardDOM.style.setProperty('--tx', `${offset}px`);
        cardDOM.style.setProperty('--rot', `${rotation}deg`);
        cardDOM.style.setProperty('--z', index);

        cardDOM.addEventListener('click', () => pickCard(cardDOM, card));
        spreadArea.appendChild(cardDOM);
    });
    
    shuffleBtn.innerText = "请凭直觉抽取三张牌";
});

function pickCard(cardDOM, cardData) {
    if (pickedCards.length >= 3 || cardDOM.classList.contains('picked')) return;
    
    cardDOM.classList.add('picked');
    const positions = ["过去", "现在", "未来"];
    cardDOM.querySelector('.fixed-card-label').innerText = positions[pickedCards.length];
    
    pickedCards.push(cardData);
    pickedDOMs.push(cardDOM);

    if (pickedCards.length === 3) {
        shuffleBtn.innerText = "命运解析中 (Reading Fate...)";
        setTimeout(revealCardsAndInterpret, 1000);
    }
}

async function revealCardsAndInterpret() {
    const finalTX = [-220, 0, 220];
    const finalRot = [8, 0, -8];

    pickedDOMs.forEach((cardDOM, i) => {
        cardDOM.style.setProperty('--tx', `${finalTX[i]}px`);
        cardDOM.style.setProperty('--rot', `${finalRot[i]}deg`);
        if (pickedCards[i].isReversed) {
            cardDOM.classList.add('is-reversed');
        }
    });

    pickedDOMs.forEach((cardDOM, i) => {
        setTimeout(() => {
            cardDOM.querySelector('.card-img').src = pickedCards[i].image_url;
            cardDOM.classList.add('is-flipped');
        }, 600 + (i * 600));
    });

    setTimeout(() => {
        pickedDOMs.forEach(cardDOM => cardDOM.classList.add('moved-down'));
    }, 2800);

    setTimeout(async () => {
        resultsArea.innerHTML = `
            <div class="interpreting-msg">
                ✧ 正在调谐星辰之力，为您解读命运之书... ✧ <br>
                <span style="font-size: 0.9rem; opacity: 0.8;">DeepSeek 正在与阿卡西记录连接，请静候启示 ✨🔮✨</span>
            </div>`;
        resultsArea.classList.remove('hidden');

        try {
            const response = await fetch('/api/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userQuestion, cards: pickedCards })
            });
            const data = await response.json();
            
            resultsArea.innerHTML = `<h2 class="glow-text" style="font-size: 2rem; margin-bottom: 20px; text-align:center;">命运的启示</h2>${data.interpretation}`;
        } catch (error) {
            resultsArea.innerHTML = `<div style="color: red; text-align:center;">星辰连结中断，请稍后再试。</div>`;
        }
        
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "重新占卜 (Restart)";
        questionInput.disabled = false;
        questionInput.style.opacity = '1';
    }, 3500);
}
