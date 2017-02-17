const TelegramBot = require('node-telegram-bot-api');
const Twit = require('twit')

const NedbSet = require('./nedb-set')

const config = require('./config.json');

// replace the value below with the Telegram token you receive from @BotFather
const token = config.TelegramBotToken;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
const chatIds = new NedbSet()

// start
bot.onText(/^\/start$/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    const chatId = msg.chat.id
    chatIds.add(chatId).then(() => {
            bot.sendMessage(chatId, 'ChatIDを追加しました，botが起動します。\n登録を解除したい時は、/leave_kcsを入力してください。');
        })
        .catch(console.err)
})

//leave
bot.onText(/\/leave_kcs/, (msg, match) => {
    const chatId = msg.chat.id
    chatIds.delete(chatId).then(() => {
            bot.sendMessage(chatId, 'かしこまりました。登録を解除する。')
        })
        .catch(console.err)
})

//streamTwitter

var T = new Twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    timeout_ms: config.timeout_ms, // optional HTTP request timeout to apply to all requests.
    access_token: config.access_token,
    access_token_secret: config.access_token_secret
})

T.get('/users/show', { screen_name: config.screen_name }, (err, data) => {
    if (err) {
        console.error(err)
        return
    }

    const id = data.id
    const stream = T.stream('statuses/filter', { follow: id })
    stream.on('tweet', (tweet) => {
        if (id !== tweet.user.id) {
            return
        }
        chatIds.forEach((chatId) => {
                console.log(id, chatId, tweet.text)
                bot.sendMessage(chatId, tweet.text)
            })
            .catch(console.err)
    });

    stream.on('error', (error) => {
        console.error(error)
        chatIds.forEach((chatId) => {
            bot.sendMessage(chatId, 'Error.')
        })
    })
})