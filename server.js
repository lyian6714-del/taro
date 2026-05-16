const express = require('express');
const cors = require('cors');
const path = require('path');
const tarotData = require('./tarot-data.json');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function fisherYatesShuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

app.get('/api/shuffle-deck', (req, res) => {
    try {
        const shuffledDeck = fisherYatesShuffle(tarotData);
        const deckWithReversed = shuffledDeck.map(card => ({
            ...card,
            image_url: card.image_url,
            isReversed: Math.random() > 0.5
        }));
        res.json(deckWithReversed);
    } catch (error) {
        console.error('Shuffle error:', error);
        res.status(500).json({ error: '洗牌失败' });
    }
});

app.post('/api/interpret', async (req, res) => {
    try {
        const { question, cards } = req.body;
        
        if (!cards || cards.length !== 3) {
            return res.status(400).json({ error: '需要3张牌的数据' });
        }
        
        const systemPrompt = `你是一位极其睿智、深谙心理学与神秘学的顶尖塔罗牌占卜师。你的语言风格古典、优美、充满宿命感与哲理，同时温暖、有人情味、富有同理心。你像一位知心挚友，用温柔而坚定的声音为求问者拨开迷雾。

你的任务是根据求问者的【具体问题】以及抽出的【三张塔罗牌】，提供深度且"绝对量身定制"的解读。

【核心指令：严禁泛泛而谈】
1. 绝对不能单纯罗列卡牌的通用词典含义。
2. 每一张牌的解读，都必须显式地、紧密地与求问者的【具体问题】绑定，解释这张牌在求问者的具体情境下意味着什么。
3. 语言要温暖有温度，适当使用表情符号（如 ✨、🌙、💫、🔮 等）增添神秘与亲切感，但不要过度使用。

请直接输出带有美观 HTML 标签（如 <h3>, <p>, <strong>, <br>）的纯文本内容，并严格按照以下骨架结构生成回答：

<h3>✨ 命运的映射</h3>
<p>用极其简短、优美的语言，首先总结求问者所问之事的本质（例如："你在感情的十字路口徘徊…"、"你正面临学业与未知的博弈…"），并结合整个三牌阵的整体能量色彩，给出一个直指人心的初步定调。</p>

<h3>🌙 时光的流转</h3>
<p><strong>[过去] 牌面名字 (正/逆位)：</strong>[结合求问者的问题，详细解释这张牌代表的过去能量或潜意识，是如何埋下伏笔并导致目前的困扰的。]</p>
<p><strong>[现在] 牌面名字 (正/逆位)：</strong>[结合求问者的问题，详细解释这张牌如何精准映照了求问者当下在这件事情中的处境、情绪盲区或正在经历的考验。]</p>
<p><strong>[未来] 牌面名字 (正/逆位)：</strong>[结合求问者的问题，详细预测这张牌昭示的事件发展趋势，告诉求问者这件事最终会迎来怎样的转折或结局。]</p>

<h3>🔮 宇宙的神谕</h3>
<p>针对求问者的具体问题，结合牌面，给出具有极高哲学维度、且具备落地指导意义的最终建议。用温暖的话语给予求问者力量与希望。</p>`;
        
        const userPrompt = `
求问者的问题：${question}
抽到的牌阵：
[过去]：${cards[0].name} (${cards[0].isReversed ? '逆位' : '正位'})
[现在]：${cards[1].name} (${cards[1].isReversed ? '逆位' : '正位'})
[未来]：${cards[2].name} (${cards[2].isReversed ? '逆位' : '正位'})
请开始你的解读：
`;
        
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('DeepSeek API error:', errorData);
            return res.status(500).json({ error: 'AI 解读服务暂时不可用' });
        }
        
        const data = await response.json();
        const interpretation = data.choices[0].message.content;
        
        res.json({ interpretation });
        
    } catch (error) {
        console.error('Interpret error:', error);
        res.status(500).json({ error: '解读失败，请稍后重试' });
    }
});

function buildUserPrompt(cards) {
    const positions = ['过去', '现在', '未来'];
    
    let prompt = '我刚刚抽取了三张塔罗牌，请为我解读：\n\n';
    
    cards.forEach((card, index) => {
        const position = positions[index];
        const orientation = card.isReversed ? '逆位' : '正位';
        const cardName = card.name_cn ? `${card.name} (${card.name_cn})` : card.name;
        prompt += `【${position}】${cardName} - ${orientation}\n`;
    });
    
    prompt += '\n请结合这三张牌的含义和它们在时间轴上的位置，为我进行详细的塔罗解读。';
    
    return prompt;
}

app.listen(PORT, () => {
    console.log(`✧ Mystic Tarot Server 运行中 ✧`);
    console.log(`访问地址: http://localhost:${PORT}`);
});
