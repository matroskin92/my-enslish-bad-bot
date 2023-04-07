const { Telegraf } = require('telegraf');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const modelEngine = 'text-davinci-002';
const bot = new Telegraf(process.env.TELEGRAPH_API_KEY);

// Создаем экземпляр API OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Обработчик команды /start
bot.start((ctx) => {
  ctx.reply('Привет! Я могу исправлять грамматические ошибки в тексте. Попробуй отправить мне что-то на английском!');
});

function checkText(text, ctx) {
  if (!text) {
    ctx.reply('Пожалуйста, отправьте мне текст на английском языке или воспользуйтесь командой /correct');
    return false;
  }
  return true;
}

// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {
  const text = ctx.message.text;

  if (!text) {
    return ctx.reply('Пожалуйста, отправьте мне текст на английском языке.');
  }

  // Запрос к API ChatGPT для исправления грамматических ошибок
  const result = await openai.createCompletion({
    model: modelEngine,
    prompt: `Please correct the following text: "${text}"\n\nCorrected text:`,
    max_tokens: 256,
    n: 1,
    stop: '\n\n',
    temperature: 0.7,
  });

  const answer = result.data.choices[0].text.trim();
  if (!answer) {
    return;
  }

  // Отправляем исправленный текст пользователю или в группу
  const chatType = ctx.chat.type;
  if (chatType === 'private') {
    ctx.reply(answer);
  } else if (chatType === 'group' || chatType === 'supergroup') {
    ctx.telegram.sendMessage(ctx.chat.id, answer);
  }
});

// Обработчик сообщений (для работы в группах)
bot.command('correct', async (ctx) => {

  const text = ctx.message.text.split(' ')[1];

  if (checkText(text, ctx)) {
    // Запрос к API ChatGPT для исправления грамматических ошибок
    const result = await openai.createCompletion({
      model: modelEngine,
      prompt: `Please correct the following text: "${text}"\n\nCorrected text:`,
      max_tokens: 50,
      n: 1,
      stop: '\n\n',
      temperature: 0.7,
    });

    const answer = result.data.choices[0].text.trim();
    if (!answer) {
      return;
    }

    // Отправляем исправленный текст в группу
    ctx.telegram.sendMessage(ctx.chat.id, answer);
  }

});

bot.launch();
