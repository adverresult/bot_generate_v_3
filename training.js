const fs = require('fs');
const path = require('path');

// Путь к файлу с данными для обучения
const trainingDataPath = path.join(__dirname, 'trainingData.json');

// Функция для загрузки данных для обучения
const loadTrainingData = () => {
  try {
    const data = fs.readFileSync(trainingDataPath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при загрузке данных для обучения:', error.message);
    return [];
  }
};

// Функция для обучения бота на основе темы изображения
const trainBot = async ({ imageTheme }) => {
  const trainingData = loadTrainingData();
  
  const trainingExample = trainingData.find(item => item.theme === imageTheme);
  
  if (trainingExample) {
    console.log(`Обучение бота на основе темы: "${imageTheme}"`);
    console.log(`Текст: ${trainingExample.description}`);
    console.log(`Изображения: ${trainingExample.examples.join(', ')}`);
    
    // Здесь можно добавить код для обучения бота на основе примеров
    // Например, использовать текст и изображения для улучшения модели генерации
  } else {
    console.log(`Нет данных для обучения по теме: "${imageTheme}"`);
  }
};

module.exports = { trainBot };