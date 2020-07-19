module.exports = class TradesToBar {
  //this.bar = {open: null, high: null, low: null, close: null}
  constructor({ debug = false, timeInterval = 15000 }) {
    this.debug = debug
    this.barHasTrades = false
    this.barNum = 0
    this.timeInterval = timeInterval
    this.firstTradeTimestamp = null
    this.defaultBar = {
      open: null,
      high: null,
      low: null,
      close: null,
      timeStart: null,
      timeEnd: null,
      trades: 0
    }
    this.bars = []
    this.prevBar = { ...this.defaultBar }
  }
  resetBar() {
    this.barHasTrades = false
  }

  incrementBarNum() {
    this.barNum++
  }

  tsToBarIdx(timestamp) {
    const diff = timestamp - this.firstTradeTimestamp
    const diffMs = this.nsToMs(diff)
    this.debug && console.log("Time diff: ", diffMs)
    const floatIntervals = diffMs / this.timeInterval
    return Math.floor(floatIntervals)
  }

  firstTradeSetup(timestamp) {
    this.firstTradeTimestamp = timestamp
  }

  nsToMs(ns) {
    return ns / 1e6
  }

  /**
   *
   * @param {*} jsonObj JSON data for a trade
   */
  processTrade(jsonObj) {
    const price = jsonObj.P
    const timestamp = jsonObj.TS2

    if (this.barNum === 0) {
      this.firstTradeSetup(timestamp)
    }
    //console.log(timestamp)
    const barIdx = this.tsToBarIdx(timestamp)
    //console.log(barIdx)

    this.addBarIfIndexOutOfRange(barIdx)

    if (this.barNum === 1) {
      this.setCandleTime(0, timestamp)
    }

    // if this is the first bar, set startTime = timestamp
    this.debug && console.log("Trade logged at index = ", barIdx)

    this.barHasTrades = true
    this.updateBar(price)
  }

  addBarIfIndexOutOfRange(idx) {
    idx = Math.max(idx, 0)
    if (this.bars.length <= idx) {
      // should be === for exact function
      this.addBarsUpToIdx(idx)
      //this.addBar()

      this.resetBar()
      //this.incrementBarNum()
      this.barNum = idx + 1
    }
  }

  addBar() {
    this.bars.push({
      ...this.defaultBar
    })
  }

  addBarsUpToIdx(idx) {
    const len = this.bars.length
    if (idx >= len) {
      const itemsToAdd = idx - len + 1
      for (var i = 0; i < itemsToAdd; i++) {
        this.addBar()
      }
    }
  }

  initializeBarFromPrevious(idx) {
    if (this.validBar(idx - 1)) {
      const prevBar = this.bars[idx - 1]
      this.bars[idx] = this.newBarFromPrevious(prevBar)
    } else {
      throw new Error(
        "New bar could not be initialized from previous given idx: ",
        idx
      )
    }
  }

  setCandleTime(idx, timestamp) {
    this.bars[idx].timeStart = this.nsToMs(timestamp)
    this.bars[idx].timeEnd = this.bars[idx].timeStart + this.timeInterval
  }

  newBarFromPrevious(bar) {
    const newStartTime = bar.timeStart + this.timeInterval
    const newEndTime = bar.timeEnd + this.timeInterval
    const open = bar.close,
      high = bar.close,
      low = bar.close,
      close = bar.close
    const newBar = { ...this.defaultBar }

    newBar.timeStart = newStartTime
    newBar.timeEnd = newEndTime
    newBar.open = open
    newBar.high = high
    newBar.low = low
    newBar.close = close

    return newBar
  }

  validBar(idx) {
    if (idx < this.bars.length && idx >= 0) {
      const bar = this.bars[idx]
      if (!bar) return false
      // return false if any values are null in bar object
      return Object.values(bar).every(value => value !== null)
    }
    throw new Error("Bar out of range given idx: " + idx)
  }

  scheduledTick(barNum) {
    if (barNum === this.barNum) {
      return this.tick()
    } else {
      const idx = barNum - 1
      if (this.validBar(idx)) {
        return this.bars[idx]
      } else {
        //console.log(idx)
        //console.log(this.bars[idx])
        this.initializeBarFromPrevious(idx)
        return this.bars[idx]
      }
    }
  }

  tick() {
    const bar = this.getFinalizedBar()
    //console.log(barNum, { ...bar })
    this.incrementBarNum()
    this.resetBar()
    // make space for next bar
    this.addBarIfIndexOutOfRange(this.barNum - 1)
    return bar
  }

  updateBar(tradePrice) {
    // update bar given the price a trade has happened on
    // runs when a trade happens
    const currentBar = this.bars[this.barNum - 1]
    // special case: bar is empty and this is the first trade
    if (currentBar.open === null) {
      currentBar.open = tradePrice
      currentBar.high = tradePrice
      currentBar.low = tradePrice
    }
    // this always runs as closing price is the last price it traded at
    currentBar.close = tradePrice

    // these conditions are mutually exclusive
    if (tradePrice > currentBar.high) {
      currentBar.high = tradePrice
    } else if (tradePrice < currentBar.low) {
      currentBar.low = tradePrice
    }
    currentBar.trades++
  }

  setBar(o, h, l, c) {
    //const currentBar = //{ open: o, high: h, low: l, close: c }
    //this.bars[this.barNum - 1] = currentBar
    const currentBar = this.bars[this.barNum - 1]
    currentBar.open = o
    currentBar.high = h
    currentBar.low = l
    currentBar.close = c
  }

  setEmptyBar(prevClose) {
    this.setBar(prevClose, prevClose, prevClose, prevClose)
  }

  getBar() {
    return this.bars[this.barNum - 1]
  }

  getBarAt(idx) {
    return this.bars[idx]
  }

  getBarNum() {
    return this.barNum
  }

  getFinalizedBar() {
    if (!this.barHasTrades) {
      this.setEmptyBar(this.getPrevClose())
    }
    return { ...this.bars[this.barNum - 1] }
  }

  getPrevClose() {
    return this.bars[this.barNum - 2].close
  }

  getWholeBarChart() {
    return this.bars
  }
}
