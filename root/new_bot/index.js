const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const tokenBot = '7669255606:AAGPXEBWpbIbKw6ARdcnS1GLpRHUcPfRJL0';
const openaiApiKey = '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';

const bot = new TelegramBot(tokenBot, { polling: true });
let userRequestData = {}; // Хранение данных пользователя

// Функция для показа главного меню с кнопками
const showMainMenu = (chatId) => {
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Сгенерируй изображение для поста', callback_data: 'generate_image' }],
        [{ text: '⁠Сгенерируй текст для поста', callback_data: 'generate_text' }],
        [{ text: '⁠Сгенерируй целый пост на тему', callback_data: 'generate_post' }],
      ],
    },
  };
  bot.sendMessage(chatId, '🤝 Привет, мой друг! Это Генерей Адверрезалтович - твой личный помощник с контентом! Выбирай, чем я полезен тебе в данную минуту: ', options);
};

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  showMainMenu(chatId);
});

// Функция для обработки выбора количества изображений
const selectImageCount = (chatId, callbackAction) => {
  bot.sendMessage(chatId, '👍 Выбери количество изображений и определись с наилучшим! Я уже запустил работу! Совсем скоро получишь шедевр!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '1', callback_data: `${callbackAction}_count_1` }, { text: '2', callback_data: `${callbackAction}_count_2` }],
        [{ text: '3', callback_data: `${callbackAction}_count_3` }, { text: '4', callback_data: `${callbackAction}_count_4` }, { text: '5', callback_data: `${callbackAction}_count_5` }],
      ],
    },
  });
};

// Функция для генерации изображения
const generateImages = async (chatId, imageTheme, imageCount) => {
  bot.sendMessage(chatId, '🗺️ Генерируем изображения! Нужно немного времени!');
  try {
    const openaiImageResponse = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt: `Создайте высококачественное фотореалистичное изображение на тему "${imageTheme}", с яркими деталями и четкими текстурами. Изображение должно передавать атмосферу успешного бизнеса, быть привлекательным для постов в социальных сетях и вызывать интерес у зрителей. Включите элементы, которые создают ощущение завершенности и эстетики, например, гармоничные цвета и сбалансированные композиции.`,
        n: imageCount,
        size: '1024x1024', // Используем максимальное поддерживаемое разрешение
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const imageUrls = openaiImageResponse.data.data.map((image) => image.url);
    return imageUrls; // Возвращаем массив URL изображений
  } catch (error) {
    console.error('Ошибка при генерации изображения:', error.response?.data || error.message);
    bot.sendMessage(chatId, 'Произошла ошибка при создании изображений. Попробуйте еще раз.');
    return null;
  }
};

// Функция для генерации текста
const generateText = async (chatId, postText) => {
  bot.sendMessage(chatId, '✍🏾 Генерируем текст! Уже заканчиваем!');
  try {
    const openaiTextResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: `Создай текст для поста на тему "${postText}".` }],
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const generatedText = openaiTextResponse.data.choices[0].message.content;
    return generatedText;
  } catch (error) {
    console.error('Ошибка при генерации текста:', error.response?.data || error.message);
    bot.sendMessage(chatId, 'Произошла ошибка при создании текста. Попробуйте еще раз.');
    return null;
  }
};

// Функция для генерации полного поста (изображение + текст)
const generatePost = async (chatId, imageTheme, postText, imageCount) => {
  const imageUrls = await generateImages(chatId, imageTheme, imageCount);
  if (!imageUrls) return;

  const generatedText = await generateText(chatId, postText);
  if (!generatedText) return;

  const media = imageUrls.map((url) => ({ type: 'photo', media: url }));
  await bot.sendMediaGroup(chatId, media);

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📦 Сгенерировать пост заново', callback_data: 'regenerate_post' }],
        [{ text: '👨‍💼 В главное меню', callback_data: 'main_menu' }],
      ],
    },
  };
  bot.sendMessage(chatId, generatedText, options);
};

// Функция для генерации только изображений
const generateOnlyImages = async (chatId, imageTheme, imageCount) => {
  const imageUrls = await generateImages(chatId, imageTheme, imageCount);
  if (!imageUrls) return;

  const media = imageUrls.map((url) => ({ type: 'photo', media: url }));
  await bot.sendMediaGroup(chatId, media);

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🗺️ Сгенерировать изображение повторно', callback_data: 'regenerate_image' }],
        [{ text: '👨‍💼 В главное меню', callback_data: 'main_menu' }],
      ],
    },
  };
  bot.sendMessage(chatId, 'Изображения успешно сгенерированы!', options);
};

// Обработка кнопок главного меню
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;

  if (action === 'generate_post') {
    userRequestData[chatId] = { action: 'post' };
    bot.sendMessage(chatId, '😉 Определись пожалуйста с темой и опиши максимально точно задачу для генерации изображения. Пиши понятно и максимально просто, чтобы я тебя правильно понял! Благодарю!');
  } else if (action === 'generate_image') {
    userRequestData[chatId] = { action: 'image' };
    bot.sendMessage(chatId, '😉 Определись пожалуйста с темой и опиши максимально точно задачу для генерации изображения. Пиши понятно и максимально просто, чтобы я тебя правильно понял! Благодарю!');
  } else if (action === 'generate_text') {
    userRequestData[chatId] = { action: 'text' };
    bot.sendMessage(chatId, '😇 Отлично! Теперь нужен текст, из основы которого, я создам для тебя логическое описание к посту для твоей компании! Уже ожидаю!:');
  } else if (action.startsWith('post_count_')) {
    const count = parseInt(action.split('_')[2]);
    userRequestData[chatId].imageCount = count;
    await generatePost(chatId, userRequestData[chatId].imageTheme, userRequestData[chatId].postText, count);
  } else if (action.startsWith('image_count_')) {
    const count = parseInt(action.split('_')[2]);
    await generateOnlyImages(chatId, userRequestData[chatId].imageTheme, count);
  } else if (action === 'regenerate_post') {
    const { imageTheme, postText, imageCount } = userRequestData[chatId];
    await generatePost(chatId, imageTheme, postText, imageCount);
  } else if (action === 'regenerate_image') {
    const { imageTheme } = userRequestData[chatId];
    selectImageCount(chatId, 'image');
  } else if (action === 'regenerate_text') {
    const { postText } = userRequestData[chatId];
    const generatedText = await generateText(chatId, postText); // Используем уже сохранённую тему
    if (generatedText) {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✍🏾 Сгенерировать текст повторно', callback_data: 'regenerate_text' }],
            [{ text: '👨‍💼 В главное меню', callback_data: 'main_menu' }],
          ],
        },
      };
      bot.sendMessage(chatId, generatedText, options);
    }
  } else if (action === 'main_menu') {
    showMainMenu(chatId);
  }
});

// Обработка сообщений от пользователя
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const action = userRequestData[chatId]?.action;

  if (action === 'post') {
    if (!userRequestData[chatId].imageTheme) {
      userRequestData[chatId].imageTheme = text;
      bot.sendMessage(chatId, '😇 Отлично! Теперь нужен текст, из основы которого, я создам для тебя логическое описание к посту для твоей компании! Уже ожидаю!');
    } else if (!userRequestData[chatId].postText) {
      userRequestData[chatId].postText = text;
      selectImageCount(chatId, 'post'); // Селектируем количество изображений после ввода текста
    }
  } else if (action === 'image') {
    if (!userRequestData[chatId].imageTheme) {
      userRequestData[chatId].imageTheme = text;
      selectImageCount(chatId, 'image');
    }
  } else if (action === 'text') {
    userRequestData[chatId].postText = text; // Сохраняем тему текста
    const generatedText = await generateText(chatId, text);
    if (generatedText) {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✍🏾 Сгенерировать текст повторно', callback_data: 'regenerate_text' }],
            [{ text: '👨‍💼 В главное меню', callback_data: 'main_menu' }],
          ],
        },
      };
      bot.sendMessage(chatId, generatedText, options);
    }
  }
});
