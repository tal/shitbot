import { Shitbot, all } from '.'
import { timeout, seconds } from './helpers'

const token = process.env.SLACKBOT_TOKEN

export const bot = new Shitbot(token)
bot.start()

bot.handle(all.directedAtBot.contains('heyo'), async msg => {
  await timeout(2 * seconds)
  return msg.emojiReaction('+1111')
})
