import { Shitbot, all } from '.'

const token = ocess.env.SLACKBOT_TOKEN

export const bot = new Shitbot(token)

bot.handle(
  // Only if they do: `@bot hi` or `/msg @bot hi`
  all.directedAtBot.contains('hi'),
  msg => `hi to you too ${msg.userName} 🤘`,
)

bot.handle(
  all
    .contains('you guys')
    // Only if it hasnt been mentioned to by this user or in this channel for the last 4 hours
    .and(all.throttledByConversation, all.throttledByUser),
  msg =>
    'Not a big deal but consider using “y’all”, "everyone", or “folks” instead. It’s more inclusive than “guys”. 👍',
)

const teams: { [k: string]: string } = { ops: '@ops-team', security: '@sec' }
for (let channel in teams) {
  const group = teams[channel]
  bot.handle(
    // In the given chann and the message has either @channel or @here
    all.inChannel(channel).or(all.contains('@channel'), all.contains('@here')),
    msg =>
      // add a thread to the triggered message with this text
      msg.replyThread(
        `Lots of other people in this channel, use ${group} to only talk to the relevant people`,
      ),
  )
}

bot.handle(all.matches(/\d{1,2}\:\d{2}/), msg =>
  // Show this message only to the person who sent the message
  msg.ephemporalResponse('That looks like a time'),
)

bot.handle(
  all.inChannel('incidents').matches(/\.start (.+)/),
  async (msg, match) => {
    await fetch('https://myserver.com/start?n=${match[1]}')
    return `Started Incident: ${match[1]}`
  },
)

// This is the same as above, but with starts with instead of match
bot.handle(
  all.inChannel('incidents').startsWith('.start'),
  async (msg, rest) => {
    await fetch('https://myserver.com/start?n=${rest}')
    return `Started Incident: ${rest}`
  },
)

// If there's an error an ephemoral message will be sent to the person who cuased it
// to help debug
bot.handle(all.directedAtBot.contains('bad emoji error'), msg =>
  msg.emojiReaction('+1111'),
)
bot.handle(all.contains('opx'), msg =>
  // adds 3 reactions to the message
  msg.emojiReaction('zero', 'parking', 'x'),
)

bot.setEmojiLetters({
  // If l-train is already used, fall back to the legacy l-train
  l: [['l-train'], ['l-train-3877']],
  i: ['information_source'],
  o: ['zero'],
  p: ['parking'],
  // Randomly pick between x and heavy multiplication, if a 3rd x is used go to cross mark
  x: [['x', 'heavy_multiplication_x'], ['negative_squared_cross_mark']],
})
// Will convert the word `xox` to an emoji reaction to spell out the word
bot.handle(all.contains('xox'), msg => msg.emojiWordReaction('xox'))

bot.start()
