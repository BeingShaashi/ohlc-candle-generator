module.exports = ({ eventBus }) => {
  return {
    publishMessage: (topic, message) => {
      eventBus.emit(topic, message)
    }
  }
}
