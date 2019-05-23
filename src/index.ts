import { MessageHandler } from './handler-set'
import { RandomAccessSet } from './random-access-set'
import { RoundRobinSet } from './round-robin-set'
import { Matcher } from './matcher'
import { Shitbot } from './shitbot'

const all = new Matcher()

export {
  Shitbot,
  RandomAccessSet,
  RoundRobinSet,
  all,
  MessageHandler, // Mainly for typings
  Matcher, // Mainly for typings
}
