import { Shitbot } from '..'

export abstract class OutboundMessage {
  constructor(public readonly conversationId: string) {}

  abstract doIt(bot: Shitbot): void
}
