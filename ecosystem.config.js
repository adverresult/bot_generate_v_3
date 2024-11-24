module.exports = {
    apps: [{
      name: "my-app",              // Название вашего приложения
      script: "./index.js",        // Путь к вашему индексному файлу
      env: {
        NODE_ENV: "production",     // Переменная окружения для режима
        API_KEY: "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",      // Ваш API токен
      },
      // Дополнительные опции
      instances: "max",            // Использовать все доступные CPU
      exec_mode: "cluster",        // Режим кластеризации
    }],
  };