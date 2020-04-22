import { Shitbot, all } from '.'
import { LogLevel } from '@slack/logger'

const token = process.env.SLACKBOT_TOKEN

export const bot = new Shitbot(token, {
  logLevel: LogLevel.DEBUG,
  // rtmLogLevel: LogLevel.INFO,
  // webLogLevel: LogLevel.DEBUG,
})

bot.handle(
  // Only if they do: `@bot hi` or `/msg @bot hi`
  all.directedAtBot.contains('hi'),
  msg => `hi to you too ${msg.userName} 🤘`,
)

bot.handle(
  // Only if it hasn't been mentioned to by this user or in this channel for the last 4 hours
  all.contains('you guys').throttledByConversation.throttledByUser,
  msg =>
    'Not a big deal but consider using “y’all”, "everyone", or “folks” instead. It’s more inclusive than “guys”. 👍',
)

const teams: { [k: string]: string } = { ops: '@ops-team', security: '@sec' }
for (let channel in teams) {
  const group = teams[channel]
  bot.handle(
    // In the given channel and the message has either @channel or @here
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
  msg.ephemeralResponse('That looks like a time'),
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

bot.handle(all.directedAtBot.startsWith('heyo'), msg => {
  return msg.reply({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'You can add an image next to text in this block.',
        },
        accessory: {
          type: 'image',
          image_url:
            'https://api.slack.com/img/blocks/bkb_template_images/plants.png',
          alt_text: 'plants',
        },
      },
    ],
  })
})

// If there's an error an ephemeral message will be sent to the person who caused it
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

bot.onReaction(
  /.+/,
  all,
  (targetMsg, reaction) =>
    `That's great <@${targetMsg.userId}> ${reaction.emoji} :${reaction.emoji}:`,
)

function wrapWithTicks(str: string) {
  return ['```', str, '```'].join('\n')
}

bot.onReaction(
  'thread-please',
  all.inChannel('bottest-wat'),
  async (targetMsg, reaction) => {
    const channel = await bot.data.channelNamed('bottest-wat')

    if (!channel) throw `cannot find channel named bottest-wat`

    await bot.web.chat.delete({
      ts: targetMsg.ts,
      channel: targetMsg.conversationId,
    })

    const text = `${reaction.emoji} Deleted message from <@${
      targetMsg.userId
    }>, reported by user <@${reaction.byUserId}>\n${wrapWithTicks(
      targetMsg.text,
    )}`

    await bot.web.chat.postMessage({
      channel: channel.id,
      text,
      as_user: true,
    })

    return targetMsg.ephemeralResponse(
      `Your message was deleted because it should be a thread instead:\n${wrapWithTicks(
        targetMsg.text,
      )}`,
    )
  },
)

bot.handle(
  all.url({ host: 'twitter.com', pathLike: /^\/(.+?)\/status\/(\d+)/ }),
  (msg, urls) => {
    return wrapWithTicks(JSON.stringify(urls, null, 2))
  },
)

// Makes sure that it works in private channels
bot.handle(
  all.inChannel('prive'),
  msg => 'sssshhhhhh ' + JSON.stringify(msg.channel),
)

bot.handle(all.directedAtBot.startsWith('multiple'), msg => [
  msg.reply('First Message'),
  msg.reply('Second Message'),
])

bot.handle(all.directedAtBot.contains('match without response'), msg => {
  console.log('matched without result')
})

bot.handle(all.directedAtBot.contains('who am i'), async msg => {
  const user = await bot.data.user(msg.userId)

  return ['```', JSON.stringify(user, null, 2), '```'].join('\n')
})

bot.handle(all.directedAtBot.matches(/(\d+) times/i), (msg, match) => {
  const [, numStr] = match
  const num = parseInt(numStr, 10)

  // const results: ReturnType<typeof msg.reply>[] = []
  const results: string[] = []

  for (let i = 0; i < num; i += 1) {
    // results.push(msg.reply(`count: ${i + 1}`))
    results.push(`count: ${i + 1}`)
  }

  return results
})

bot.fallthrough(
  all.directedAtBot,
  msg => "Sorry I don't know how to handle that",
)

bot.start()
