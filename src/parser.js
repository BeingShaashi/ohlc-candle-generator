const readline = require("readline")
//const barHandler = new Fsm({ debug: true })
//const settingsObj = { timeInterval: ms("2s") }
//const tradeHandler = new TradeHandler(settingsObj)

module.exports = jsonStream => {
  let arr = []

  const rl = readline.createInterface({
    input: jsonStream,
    output: process.stdout,
    terminal: false
  })

  return new Promise(resolve => {
    rl.on("line", function(line) {
      arr.push(JSON.parse(line))
    })

    rl.on("close", () => resolve(arr))
  })
}
