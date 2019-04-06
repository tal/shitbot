# Shitbot
## A simple bot for shitposting

For now check out [`src/_responders.ts`](https://github.tumblr.net/Tumblr/shitbot/blob/master/src/_responders.ts) for where to make more responders.

## Matcher
Responders have a matcher, that filters what messages it'll respond to. They are a builder
pattern that you can add more filters.

` `all` - matches all messages, must be the seed for all matchers
- `startsWith('string')` - only matches messages that start with the supplied string
- `contains('string')` - matches any message that has the supplied string anywhre in it
- `matches(/prefix: (.+)/i)` - matches to a regex, any capture groups are then passed along
to the handler
- `messageIs('string')` - only matches if the whole message is only the supplied string
- `directedAtBot` - only match if the user `@mentions` the bot or if they IM the bot
- `mentionsBot` - matches only if the message starts with `@shitbot`
- `isIM` - only matches if message is sent via an IM
- `inChannels('new_york', 'tumblr')` - matches any of supplied channels

You can chain these to combine matchers like this:

```js
all.startsWith('foo').isIM
```

Matchers are defined in [`src/matcher.ts`]((https://github.tumblr.net/Tumblr/shitbot/blob/master/src/matcher.ts)).

## Handlers
The second part of responding is the handler, this is a function that is called iff the matcher
succeeds.

Handlers are just functions that take in a message and return a response, in their simplest form

```js
(msg) => `echo ${msg.text}`
```

### Message
The message supplies the following pieces of information
- `msg.text` - the body of the message, if you `@shitbot` it will automatically remove that from the text
- `msg.userName` - the user that sent the message
- `msg.channelName` - the channel name that the message was posted in

### Handler Result
The handler can return a string, that's a quick alias for just replying in the same channel that the original
message was sent.

Otherwise you can have the handler respond using methods on the message itself.

- `msg.reply('text')` - Same as plain text, replies in whatever cahnnel.
- `msg.emojiWordReaction('word')` - Adds emoji reaction that spells out the supplied word
- `msg.emojiReaction('emoji1','emoji2'...)` - Adds any emoji reactions to the message that was sent
- `msg.ephemoralResponse('message')` - Sends the message to the person who wrote the original message, only
that author can see this.
- `msg.replyThread('message')` - replies but in a new thread on the existing message

## Advanced
### Acting on others messages
If someone posts something that you want to act on you can have the bot act on that fairly magically.
If you send the bot a link to a message with content in that body, the content provided will act on the
shared post rather than the IM itself. Share it like this:
![share message ui](./share-message-ui.png)
