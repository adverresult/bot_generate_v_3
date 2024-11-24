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
