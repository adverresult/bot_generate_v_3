import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

// Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7669255606:AAGPXEBWpbIbKw6ARdcnS1GLpRHUcPfRJL0';
const OPENAI_TOKEN = process.env.OPENAI_TOKEN || '===';

// Initialize bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Track user states
const userStates = new Map();

// Image style options
const imageStyles = [
    'Реализм',
    'Цифровое искусство',
    'Комикс',
    'Акварель',
    'Аниме', 
    'Картина маслом',
    '3D'
];

// Main menu options
const mainMenuMarkup = {
    reply_markup: {
        inline_keyboard: [
            [{ text: 'Сгенерируй изображение для поста', callback_data: 'gen_image' }],
            [{ text: '⁠Сгенерируй текст для поста', callback_data: 'gen_text' }],
            [{ text: '⁠Сгенерируй целый пост на тему', callback_data: 'gen_both' }]
        ]
    }
};

// Image style keyboard
const styleMarkup = {
    reply_markup: {
        inline_keyboard: imageStyles.map(style => ([
            { text: style, callback_data: `style_${style}` }
        ]))
    }
};

// Regeneration options for image
const imageRegenerationMarkup = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '🗺️ Сгенерировать изображение повторно', callback_data: 'regen_image' }],
            [{ text: '👨‍💼 В главное меню', callback_data: 'main_menu' }]
        ]
    }
};

// Regeneration options for text
const textRegenerationMarkup = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '✍🏾 Сгенерировать текст повторно', callback_data: 'regen_text' }],
            [{ text: '👨‍💼 В главное меню', callback_data: 'main_menu' }]
        ]
    }
};

// Regeneration options for combined
const combinedRegenerationMarkup = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '👨‍💼 В главное меню', callback_data: 'main_menu' }]
        ]
    }
};

// Start command handler
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userStates.set(chatId, { step: 'main_menu' });
    bot.sendMessage(chatId, '🤝 Привет, мой друг! Это Генерей Адверрезалтович - твой личный помощник с контентом! Выбирай, чем я полезен тебе в данную минуту: ', mainMenuMarkup);
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const state = userStates.get(chatId);

    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(callbackQuery.id);

    if (state?.step === 'generating') {
        bot.sendMessage(chatId, 'Идет генерация, пожалуйста подождите...');
        return;
    }

    if (data === 'main_menu') {
        userStates.set(chatId, { step: 'main_menu' });
        bot.sendMessage(chatId, 'Что бы вы хотели создать?', mainMenuMarkup);
        return;
    }

    // Handle generation type selection
    if (data.startsWith('gen_')) {
        switch (data) {
            case 'gen_image':
                userStates.set(chatId, { step: 'image_description' });
                bot.sendMessage(chatId, '😉 Определись пожалуйста с темой и опиши максимально точно задачу для генерации изображения. Пиши понятно и максимально просто, чтобы я тебя правильно понял! Благодарю!');
                break;
            case 'gen_text':
                userStates.set(chatId, { step: 'text_description' });
                bot.sendMessage(chatId, '😇 Отлично! Теперь нужен текст, из основы которого, я создам для тебя логическое описание к посту для твоей компании! Уже ожидаю!');
                break;
            case 'gen_both':
                userStates.set(chatId, { step: 'combined_image_description' });
                bot.sendMessage(chatId, '😉 Определись пожалуйста с темой и опиши максимально точно задачу для генерации изображения. Пиши понятно и максимально просто, чтобы я тебя правильно понял! Благодарю!');
                break;
        }
        return;
    }

    // Handle style selection
    if (data.startsWith('style_')) {
        const style = data.replace('style_', '');
        if (state.step === 'combined_style') {
            await handleCombinedStyle(chatId, style);
        } else {
            await handleImageStyle(chatId, style);
        }
        return;
    }

    // Handle regeneration
    if (data.startsWith('regen_')) {
        switch (data) {
            case 'regen_image':
                if (state.lastImageDescription && state.lastImageStyle) {
                    await handleImageStyle(chatId, state.lastImageStyle);
                }
                break;
            case 'regen_text':
                if (state.lastTextDescription) {
                    await handleTextDescription(chatId, state.lastTextDescription);
                }
                break;
            case 'regen_both':
                if (state.lastImageDescription && state.lastTextDescription) {
                    await handleCombinedTextDescription(chatId, state.lastTextDescription);
                }
                break;
        }
    }
});

// Message handler
bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) return; // Ignore commands
    
    const chatId = msg.chat.id;
    const text = msg.text;
    const currentState = userStates.get(chatId) || { step: 'main_menu' };

    if (currentState.step === 'generating') {
        bot.sendMessage(chatId, 'Идет генерация, пожалуйста подождите...');
        return;
    }

    switch (currentState.step) {
        case 'image_description':
            await handleImageDescription(chatId, text);
            break;
        case 'text_description':
            await handleTextDescription(chatId, text);
            break;
        case 'combined_image_description':
            await handleCombinedImageDescription(chatId, text);
            break;
        case 'combined_text_description':
            await handleCombinedTextDescription(chatId, text);
            break;
    }
});

// Handle image description input
async function handleImageDescription(chatId, text) {
    const state = userStates.get(chatId);
    userStates.set(chatId, { 
        ...state,
        step: 'image_style',
        imageDescription: text,
        lastImageDescription: text
    });
    bot.sendMessage(chatId, 'Выберете стиль в котором вам нужно изображение:', styleMarkup);
}

// Handle image style selection
async function handleImageStyle(chatId, style) {
    const state = userStates.get(chatId);
    userStates.set(chatId, { 
        ...state,
        step: 'generating',
        lastImageStyle: style 
    });
    
    try {
        bot.sendMessage(chatId, '🗺️ Генерируем изображения! Нужно немного времени!')
        const imageUrl = await generateImage(`${state.imageDescription} in style: ${style}`);
        await bot.sendPhoto(chatId, imageUrl);
        userStates.set(chatId, { ...state, step: 'regeneration' });
        bot.sendMessage(chatId, 'Что бы вы хотели сделать дальше?', combinedRegenerationMarkup);
    } catch (error) {
        handleError(chatId, error);
    }
}

// Handle text description input
async function handleTextDescription(chatId, text) {
    const state = userStates.get(chatId);
    userStates.set(chatId, { 
        ...state,
        step: 'generating',
        lastTextDescription: text 
    });
    
    try {
        bot.sendMessage(chatId, 'Идет генерация текста')
        const generatedText = await generateText(text);
        bot.sendMessage(chatId, generatedText);
        userStates.set(chatId, { ...state, step: 'regeneration' });
        bot.sendMessage(chatId, 'Что бы вы хотели сделать дальше?', combinedRegenerationMarkup);
    } catch (error) {
        handleError(chatId, error);
    }
}

// Handle combined generation steps
async function handleCombinedImageDescription(chatId, text) {
    const state = userStates.get(chatId);
    userStates.set(chatId, {
        ...state,
        step: 'combined_style',
        imageDescription: text,
        lastImageDescription: text
    });
    bot.sendMessage(chatId, 'Выберете стиль в котором вам нужно изображение:', styleMarkup);
}

async function handleCombinedStyle(chatId, style) {
    const state = userStates.get(chatId);
    userStates.set(chatId, {
        ...state,
        step: 'combined_text_description',
        imageStyle: style,
        lastImageStyle: style
    });
    bot.sendMessage(chatId, '😇 Отлично! Теперь нужен текст, из основы которого, я создам для тебя логическое описание к посту для твоей компании! Уже ожидаю!');
}

async function handleCombinedTextDescription(chatId, text) {
    const state = userStates.get(chatId);
    userStates.set(chatId, { 
        ...state,
        step: 'generating',
        lastTextDescription: text
    });
    
    try {
        bot.sendMessage(chatId, 'Идет генерация поста, пожалуйста подождите')
        const [imageUrl, generatedText] = await Promise.all([
            generateImage(`${state.imageDescription} in style: ${state.imageStyle}`),
            generateText(text)
        ]);
        
        await bot.sendPhoto(chatId, imageUrl);
        await bot.sendMessage(chatId, generatedText);
        
        userStates.set(chatId, { ...state, step: 'regeneration' });
        bot.sendMessage(chatId, 'Что бы вы хотели сделать дальше?', combinedRegenerationMarkup);
    } catch (error) {
        handleError(chatId, error);
    }
}

// OpenAI API functions
async function generateImage(prompt) {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_TOKEN}`
        },
        body: JSON.stringify({
            model: "dall-e-3",
            quality: 'hd',
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        })
    });

    if (!response.ok) {
        throw new Error('Не удалось сгенерировать изображение');
    }

    const data = await response.json();
    return data.data[0].url;
}

async function generateText(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_TOKEN}`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: `Создай текст для поста на тему "${prompt}". Так же добавь смайликов и красиво оформь его.`
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error('Не удалось сгенерировать текст');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Error handler
function handleError(chatId, error) {
    console.error('Error:', error);
    userStates.set(chatId, { step: 'main_menu' });
    bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте еще раз:', mainMenuMarkup);
}

// Start the bot
console.log('Bot is running...');  
