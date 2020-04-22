import { Shitbot } from '../shitbot'

export abstract class OutboundMessage {
  constructor(
    public readonly conversationId: string,
    public readonly threadTS?: string,
  ) {}

  abstract doIt(bot: Shitbot): Promise<any> | any
}
