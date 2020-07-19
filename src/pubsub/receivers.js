module.exports = ({ eventBus, subscribers }) => {
  const broadcastMessage = (channel, data) => {
    Object.values(subscribers[channel]).forEach(subscriber => {
      subscriber.send(data)
    })
  }

  const registerTopic = topic => {
    if (subscribers[topic]) return

    subscribers[topic] = {}

    eventBus.on(topic, data => {
      broadcastMessage(topic, data)
    })
  }

  return {
    registerTopic
  }
}
