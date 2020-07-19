//Worker_2

const Fsm = require("./fsm")
const ms = require("ms")
//const EventEmitter = require("events")
const log = console.log
const subscriberRefreshInternal = "15s"; //Can be anything, currently 15 seconds

class TradeHandler {
  
  constructor({ timeInterval = ms(subscriberRefreshInternal), formatOHLC = true, callback }) {
    this.timeInterval = timeInterval
    this.symbolTable = {}
    this.numTable = {}
    this.callback = callback
    this.formatOHLC = formatOHLC
  }

  processTrade(tradeJson) {
    const symbol = tradeJson.sym
    if (this.addSymbolIfNotExists(symbol)) {
      // this is the first trade with this symbol
      // start from this time
      // schedule bar close
      //setInterval(() => this.sendBarToWS(symbol), this.timeInterval)
      this.numTable[symbol] = 1
      setInterval(() => this.sendBarToWS(symbol), this.timeInterval)
    }
    this.symbolTable[symbol].processTrade(tradeJson)
  }
  // return true if symbol was added
  addSymbolIfNotExists(symbol) {
    if (!this.symbolTable[symbol]) {
      this.symbolTable[symbol] = new Fsm({
        debug: true,
        timeInterval: this.timeInterval
      })
      return true
    }
    return false
  }

  sendBarToWS(symbol) {
    const barHandler = this.symbolTable[symbol]
    const expectedBarNum = this.numTable[symbol]
    const bar = barHandler.scheduledTick(expectedBarNum)

    const wsObj = { symbol, barNum: expectedBarNum, ...bar }
    log(`OHLC bar ==>`,JSON.stringify(wsObj)) //Worker_3 part

    // send formatted object if OHLC formatting is on
    if (this.formatOHLC) {
    	//if client side needs user readable date strings
      const wsObjFormatted = this.formattedBarObject(wsObj)
      this.callback(wsObjFormatted)
    } else {
      this.callback(wsObj)
    }

    this.numTable[symbol]++
  }

  formattedBarObject(barObject) {
    /* 
    If open,high,low,close
    needs to be without scientific notation.
    But then they will be strings and not numbers
    */
    // Copy bar
    let barCopy = { ...barObject }

    // format ohlc numbers to readable string (no scientific notation)
    barCopy.open = this.numberToReadableString(barObject.open)
    barCopy.high = this.numberToReadableString(barObject.high)
    barCopy.low = this.numberToReadableString(barObject.low)
    barCopy.close = this.numberToReadableString(barObject.close)

    return barCopy
  }

  // Return string representation of number with no scientific notation
  numberToReadableString(num) {
    return num.toLocaleString("fullwide", { useGrouping: false })
  }
}

module.exports = TradeHandler
