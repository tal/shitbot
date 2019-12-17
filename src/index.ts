import { Logger, LogLevel } from '@slack/logger'

import { MessageHandler } from './handler-set'
import { RandomAccessSet } from './random-access-set'
import { RoundRobinSet } from './round-robin-set'
import { Matcher } from './matcher'
import { Shitbot } from './shitbot'
import { Message } from './message'

const all = new Matcher()

export {
  Shitbot,
  RandomAccessSet,
  RoundRobinSet,
  all,
  MessageHandler, // Mainly for typings
  Matcher, // Mainly for typings
  Message,
  Logger,
  LogLevel,
}
