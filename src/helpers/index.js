const { uuid } = require("uuidv4")

module.exports = ({ subscribers }) => {
  const getTopics = () => Object.keys(subscribers).map(channel => channel)

  const assignUniqueId = ws => {
    ws.id = uuid()
  }

  const unsubscribeTopics = id => {
    Object.values(subscribers).forEach(subscribers => {
      delete subscribers[id]
    })
  }

  const assignTopic = (ws, req) => {
    const topic = req.url.slice(1)

    if (!topic) {
      throw Error("missing topic")
    }

    // create topic if missing
    if (!subscribers[topic]) {
      subscribers[topic] = {}
    }

    subscribers[topic][ws.id] = ws
  }

  return {
    getTopics,
    assignUniqueId,
    assignTopic,
    unsubscribeTopics
  }
}
