type RTMEventType =
  | 'message'
  | 'hello'
  | 'goodbye'
  | 'pin_added'
  | 'emoji_changed'

type RTMMessageSubtype =
  | 'bot_message'
  | 'channel_archive'
  | 'channel_join'
  | 'channel_leave'
  | 'channel_name'
  | 'channel_purpose'
  | 'channel_topic'
  | 'channel_unarchive'
  | 'file_comment'
  | 'file_mention'
  | 'file_share'
  | 'group_archive'
  | 'group_join'
  | 'group_leave'
  | 'group_name'
  | 'group_purpose'
  | 'group_topic'
  | 'group_unarchive'
  | 'me_message'
  | 'message_changed'
  | 'message_deleted'
  | 'message_replied'
  | 'pinned_item'
  | 'reply_broadcast'
  | 'thread_broadcast'
  | 'unpinned_item'

interface RTMEvent {
  ts: string
  type: RTMEventType
}

export interface Attachment {
  fallback: string
  ts: string
  channel_id: string
  channel_name: string
  is_msg_unfurl: boolean
  text: string
  author_name: string
  author_link: string
  author_icon: string
  author_id: string
  author_subname: string
  mrkdwn_in: string[]
  color: string
  from_url: string
  is_share: boolean
  footer: string
  pretext?: string

  fields?: {
    title: string
    value: string
    short: boolean
  }[]
}

export interface RTMMessageEvent extends RTMEvent {
  type: 'message'
  text: string
  user: string
  channel: string
  subtype: RTMMessageSubtype
  event_ts?: string
  attachments?: Attachment[]
}
