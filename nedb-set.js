const datastore = require('nedb-promise')

class NedbSet {
    constructor (filename = './store.db') {
        this.db = datastore({ filename, autoload: true })
        this.init = this.db.ensureIndex({ fieldName: 'chatId', unique: true })
    }

    forEach (fn) {
        return this.init
            .then(() => this.db.find({}))
            .then(docs => docs.map(doc => doc.chatId).forEach(fn))
    }

    delete (chatId) {
        return this.init.then(() => this.db.remove({ chatId }))
    }

    add (chatId) {
        return this.init.then(() => this.db.update({ chatId }, { chatId }, { upsert: true }))
    }
}

module.exports = NedbSet