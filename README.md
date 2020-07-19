# ohlc-candle-generator

# Documentation

## Fsm.js

Arguments are a settings object which keys debug and timeInterval. debug is a flag true/false and timeInterval is a time in milliseconds which says how often to send out new bars.

Contains the class which keeps track of a bar char for one ticker. This means it holds an array of bars, which together make up a chart.
Recorded data for each bar in the list is:

bar := {
open, high, low, close, timeStart, timeEnd, trades
}

All values in the object are JS numbers.
timeStart: timestamp (number) of close in milliseconds
timeEnd: timestamp (number) of open in milliseconds
trades: Number of trades in the period, can be 0

The `processTrade` method handles a trade by updating the bar it belongs to, and if it doesn't belong to the current bar it created a new one.

Which bar a trade belongs to is calculated by using the time of the first trade for the asset. The method used for this is called `tsToBarIdx`, which takes in a timestamp (in nanoseconds), and finds which index in the bar array it belongs.

## TradeHandler

Arguments are a settings object which has keys timeInterval and callback. timeInterval is the time between bars being crated and callback is the function which deals with sending bar-objects to the websocket.

Holds an Object of instances of Fsm, once instance for each ticker that has been found (from stock ticks). Each ticker has a key in the Object.
Also holds an Object of numbers which keeps track of the current bar number for each ticker.

For example:
symbolTable["XETHZUSD"] is the instance of Fsm which holds the OHLC values for the ticker "XETHZUSD"
numberTable["XETHZUSD"] holds the current bar number for the ticker.

The TradeHandler class takes in a callback method which is used to send finished bar-objects to a websocket. This is done in the `sendBarToWS` method.

The Objects sent to the websocket look like this for example:
`{"symbol":"XETHZUSD","barNum":282,"open":226.85,"high":226.85,"low":226.85,"close":226.85,"timeStart":1538410300812.3457,"timeEnd":1538410302812.3457,"trades":0}`
Next object after that will have `barNum=283`, and so on. This is sent on the endpoint /XETHZUSD to subscribers of that websocket channel.

## pubsub event bus

Consists of two components:

- receivers
- emitters

### Receivers

This is where we define what topics the server is going to interact with. These listeners receive events (updates) from `emitters` and subsequently send them to all subscribers of the corresponding topic (e.g. `/BTCUSD`)

### Emitters

The other part of the story. These can be used from almost anywhere (as long as the eventBus reference is in scope).

These publish a message payload to a topic receiver, which then prompts the server to publish that message to all subscribed peers (websocket clients).

### Usage

Let's say we have a new symbol, `ASSET`. We want all subscribing peers of `asset` to be notified when there is a change to its value. This is how we do it using the `receivers` and `emitters`.

1. Open a topic: `registerTopic("ASSET")`
2. Publish some data to the recently created topic: `publishMessage("ASSET", "Hi, this is a message that will be sent to all subscribing peers")
3. Watch all subscribers (websocket clients) receive an update


### To run the code

1. npm install
2. node src/index.js OR node . OR npm start
