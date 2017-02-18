const TelegramBot = require('node-telegram-bot-api')
const Twit = require('twit')
const escape = require('escape-html')

const Store = require('./store')

const config = require('./config.json')

// replace the value below with the Telegram token you receive from @BotFather
const token = config.TelegramBotToken

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })

const store = new Store()

// start
bot.onText(/^\/start$/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    const chatId = msg.chat.id
    store.follow(config.screen_name, chatId).then(() => {
        bot.sendMessage(chatId, 'ChatIDを追加しました，botが起動します。\n登録を解除したい時は、/leave_kcsを入力してください。')
    })
    .catch(console.error)
})

// follow
bot.onText(/^\/follow\s+([a-zA-Z][a-zA-Z0-9]*)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    const chatId = msg.chat.id
    const screenName = match[1]
    store.follow(screenName, chatId).then(() => {
        bot.sendMessage(chatId, 'ChatIDを追加しました，botが起動します。\n登録を解除したい時は、/leave_kcsを入力してください。')
    })
    .catch(console.error)
})

// unfollow
bot.onText(/^\/unfollow\s+([a-zA-Z][a-zA-Z0-9]*)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    const chatId = msg.chat.id
    const screenName = match[1]
    store.unfollow(screenName, chatId)
    .catch(console.error)
})

//leave
bot.onText(/\/leave_kcs/, (msg, match) => {
    const chatId = msg.chat.id
    store.leave(chatId)
    .catch(console.error)
})

//streamTwitter

var T = new Twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    timeout_ms: config.timeout_ms, // optional HTTP request timeout to apply to all requests.
    access_token: config.access_token,
    access_token_secret: config.access_token_secret
})

const streams = new Map()

store.on('follow', screenName => {
    T.get('/users/show', { screen_name: screenName }, (err, data) => {
        if (err) {
            console.error(err)
            return
        }

        const id = data.id
        const username = data.name

        const stream = T.stream('statuses/filter', { follow: id })

        stream.on('tweet', (tweet) => {
            if (id !== tweet.user.id) {
                return
            }
            store.following(screenName).then(chatIds => {
                chatIds.forEach((chatId) => {
                    console.log(id, chatId, tweet.text)
                    const html = '<b>' + escape(username) + '</b>' + '\n' + escape(tweet.text)
                    bot.sendMessage(chatId, html, { parse_mode: html })
                })
            })
            .catch(console.error)
        })

        stream.on('error', console.error)

        streams.set(screenName, stream)
    })
})

store.on('unfollow', screenName => {
    const stream = streams.get(screenName)
    if (stream == null) return
    stream.stop()
    streams.delete(screenName)
})