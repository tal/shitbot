import { Shitbot, all } from '.'

const token = process.env.SLACKBOT_TOKEN

export const bot = new Shitbot(token)
bot.start()

bot.handle(all.directedAtBot.contains('heyo'), msg =>
  msg.emojiReaction('+1111'),
)
