//Worker_1
const WebSocket = require("ws")
const fs = require("fs")
const EventEmitter = require("events")
const parser = require("./parser")

const helpers = require("./helpers")
const receivers = require("./pubsub/receivers")
const emitters = require("./pubsub/emitters")
const TradeHandler = require("./tradeHandler")

const eventBus = new EventEmitter()
const wss = new WebSocket.Server({ port: 8080 })

const log = console.log
const subscribers = {} //Any

const { assignUniqueId, assignTopic, unsubscribeTopics } = helpers({
  subscribers
})

wss.on("connection", (ws, req) => {
  try {
    assignUniqueId(ws)
    assignTopic(ws, req)
    log(`${ws.id} connected`)
  } catch (error) {
    ws.send(error.message)
    ws.close()
  }

  ws.on("message", message => {
    log("received: %s", message)
    log(subscribers)
  })

  ws.on("close", () => {
    log(`${ws.id} disconnected`)
    unsubscribeTopics(ws.id)
  })
})

const { registerTopic } = receivers({ eventBus, subscribers })
const { publishMessage } = emitters({ eventBus })

const publishUpdate = data => {
  if (!subscribers[data.symbol]) {
    registerTopic(data.symbol)
  }

  publishMessage(data.symbol, JSON.stringify(data))
}

const tHandler = new TradeHandler({
  callback: publishUpdate
})

const tradeStream = fs.createReadStream("dataset.json")

parser(tradeStream).then(trades => {
  trades.forEach(trade => {
    tHandler.processTrade(trade)
  })
})
