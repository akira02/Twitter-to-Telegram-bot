const EventEmitter = require('events')
const datastore = require('nedb-promise')

class Store extends EventEmitter {
    constructor (filename = './store.db') {
        super()
        this.db = datastore({ filename, autoload: true })
        this.inited = this.init()
    }

    async init () {
        await this.db.ensureIndex({ fieldName: 'screenName', unique: true })
        const docs = await this.db.find({}, {screenName: 1})
        docs.forEach(({screenName}) => {
            this.emit('follow', screenName)
        })
    }

    async follow (screenName, chatId) {
        await this.inited
        
        const query = { screenName }
        const doc = { $addToSet: { chatIds: chatId } }
        
        const [numAffected, {chatIds}] = await this.db.update(query, doc, { upsert: true, returnUpdatedDocs: true })
        if (chatIds.length === 1) {
            this.emit('follow', screenName)
        }
    }

    async unfollow (screenName, chatId) {
        await this.inited
        
        const query = { screenName }
        const doc = { $pull: { chatIds: chatId } }
        const [numAffected, {chatIds}] = await this.db.update(query, doc, { returnUpdatedDocs: true })
        
        if (chatIds.length === 0) {
            this.emit('unfollow', screenName)
        }
    }

    async leave (chatId) {
        await this.inited

        const docs = await this.db.find({ $elemMatch: { chatIds: chatId } }, { screenName: 1 })
        await Promise.all(docs.map(async ({screenName}) => this.unfollow(screenName, chatId)))
    }

    async following (screenName) {
        await this.inited

        const docs = await this.db.find({ screenName }, { chatIds: 1 })

        return docs.length === 0 ? [] : docs[0].chatIds
    }
}

module.exports = Store