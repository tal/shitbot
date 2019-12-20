import { Shitbot } from '../shitbot'

export abstract class OutboundMessage {
  constructor(public readonly conversationId: string) {}

  abstract doIt(bot: Shitbot): Promise<any> | any
}
