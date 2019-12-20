import { WebAPICallResult } from '@slack/web-api'

export type SlackTeam = {
  id: string
  name: string
  /**
   * Subdomain for the team
   */
  domain: string
}
export type SlackRTMUser = { id: string; name: string }

export type RTMStartResponse = WebAPICallResult & {
  team: SlackTeam
  self: SlackRTMUser
}

type RTMEventType =
  | 'message'
  | 'hello'
  | 'goodbye'
  | 'pin_added'
  | 'emoji_changed'
  | 'reaction_added'

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

/**
 * An object containing some text, formatted either as plain_text or using Slack's "mrkdwn".
 *
 * https://api.slack.com/reference/messaging/composition-objects#text
 */
interface TextCompositionObject {
  type: 'mrkdown' | 'plain_text'
  text: string
  emoji?: boolean
  verbatim?: boolean
}

interface PlainTextCompositionObject extends TextCompositionObject {
  type: 'plain_text'
}

/**
 * An object that defines a dialog that provides a confirmation step to any interactive element. This dialog will ask the user to confirm their action by offering a confirm and deny buttons.
 *
 * https://api.slack.com/reference/messaging/composition-objects#confirm
 */
interface ConfirmationCompositionObject {
  /**
   * A plain_text-only text object that defines the dialog's title. Maximum length for this field is 100 characters.
   */
  title: PlainTextCompositionObject

  /**
   * A text object that defines the explanatory text that appears in the confirm dialog. Maximum length for the text in this field is 300 characters.
   */
  text: TextCompositionObject

  /**
   * A plain_text-only text object to define the text of the button that confirms the action. Maximum length for the text in this field is 30 characters.
   */
  confirm: PlainTextCompositionObject

  /**
   * A plain_text-only text object to define the text of the button that cancels the action. Maximum length for the text in this field is 30 characters.
   */
  deny: PlainTextCompositionObject
}

/**
 * An object that represents a single selectable item in a select menu.
 *
 * https://api.slack.com/reference/messaging/composition-objects#option
 */
interface OptionCompositionObject {
  /**
   * 	A plain_text only text object that defines the text shown in the option on the menu. Maximum length for the text in this field is 75 characters.
   */
  text: PlainTextCompositionObject

  /**
   * The string value that will be passed to your app when this option is chosen. Maximum length for this field is 75 characters.
   */
  value: string
}

/**
 * Provides a way to group options in a select menu.
 *
 * https://api.slack.com/reference/messaging/composition-objects#option-group
 */
interface OptionGroupCompositionObject {
  /**
   * A plain_text only text object that defines the label shown above this group of options. Maximum length for the text in this field is 75 characters.
   */
  label: PlainTextCompositionObject

  /**
   * An array of option objects that belong to this specific group. Maximum of 100 items.
   */
  options: OptionCompositionObject[]
}

type BlockElementTypes = 'image' | 'button' | SelectMenuTypeBlockElement

/**
 * https://api.slack.com/reference/messaging/block-elements
 */
interface BlockElement {
  type: BlockElementTypes
}

/**
 * An element to insert an image - this element can be used in section and context blocks only. If you want a block with only an image in it, you're looking for the image block.
 *
 * https://api.slack.com/reference/messaging/block-elements#image
 */
interface ImageBlockElement extends BlockElement {
  type: 'image'
  /**
   * The URL of the image to be displayed.
   */
  image_url: string
  /**
   * A plain-text summary of the image. This should not contain any markup.
   */
  alt_text: string
}

/**
 * An interactive element that inserts a button. The button can be a trigger for anything from opening a simple link to starting a complex workflow.

To use interactive elements, you will need to make some changes to prepare your app. Read our [guide to enabling interactivity](https://api.slack.com/messaging/interactivity/enabling).
 *
 * https://api.slack.com/reference/messaging/block-elements#button
 */
interface ButtonBlockElement extends BlockElement {
  type: 'button'
  /**
   * A text object that defines the button's text. Can only be of type: plain_text. Maximum length for the text in this field is 75 characters.
   */
  text: PlainTextCompositionObject

  /**
   * An identifier for this action. You can use this when you receive an interaction payload to [identify the source of the action](https://api.slack.com/messaging/interactivity/enabling#understanding-payloads). Should be unique among all other action_ids used elsewhere by your app. Maximum length for this field is 255 characters.
   */
  action_id: string

  /**
   * A URL to load in the user's browser when the button is clicked. Maximum length for this field is 3000 characters.
   */
  url?: string

  /**
   * The value to send along with the [interaction payload](https://api.slack.com/messaging/interactivity/enabling#understanding-payloads). Maximum length for this field is 75 characters.
   */
  value?: string

  /**
   * A [confirm object](https://api.slack.com/reference/messaging/composition-objects#confirm) that defines an optional confirmation dialog after the button is clicked.
   */
  confirm?: ConfirmationCompositionObject
}

type SelectMenuTypeBlockElement =
  | 'static_select'
  | 'external_select'
  | 'users_select'
  | 'conversations_select'
  | 'channels_select'
  | 'overflow'
  | 'datepicker'

/**
 * A select menu, just as with a standard HTML `<select>` tag, creates a drop down menu with a list of options for a user to choose. The select menu also includes type-ahead functionality, where a user can type a part or all of an option string to filter the list.
 *
 * To use interactive elements, you will need to make some changes to prepare your app. Read our [guide to enabling interactivity](https://api.slack.com/messaging/interactivity/enabling).
 *
 * There are different types of select menu that depend on different data sources for their lists of options:
 *
 * - [Menu with static options](https://api.slack.com/reference/messaging/block-elements#static-select)
 * - [Menu with external data source](https://api.slack.com/reference/messaging/block-elements#external-select)
 * - [Menu with user list](https://api.slack.com/reference/messaging/block-elements#users-select)
 * - [Menu with conversations list](https://api.slack.com/reference/messaging/block-elements#conversation-select)
 * - [Menu with channels list](https://api.slack.com/reference/messaging/block-elements#channel-select)
 *
 * https://api.slack.com/reference/messaging/block-elements#button
 */
interface SelectMenuBlockElement extends BlockElement {
  type: SelectMenuTypeBlockElement
  /**
   * A plain_text only text object that defines the placeholder text shown on the menu. Maximum length for the text in this field is 150 characters.
   */
  placeholder: PlainTextCompositionObject
  /**
   * 	An identifier for the action triggered when a menu option is selected. You can use this when you receive an interaction payload to identify the source of the action. Should be unique among all other action_ids used elsewhere by your app. Maximum length for this field is 255 characters.
   */
  action_id: string
}

/**
 * This is the simplest form of select menu, with a static list of options passed in when defining the element.
 *
 * https://api.slack.com/reference/messaging/block-elements#static-select
 */
interface StaticSelectMenuBlockElement extends SelectMenuBlockElement {
  type: 'static_select'

  /**
   * 	A plain_text only text object that defines the placeholder text shown on the menu. Maximum length for the text in this field is 150 characters.
   */
  placeholder: PlainTextCompositionObject

  /**
   * An array of option objects. Maximum number of options is 100. If option_groups is specified, this field should not be.
   */
  options?: OptionCompositionObject[]

  /**
   * An array of option group objects. Maximum number of option groups is 100. If options is specified, this field should not be.
   */
  option_groups?: OptionGroupCompositionObject[]

  /**
   * A single option that exactly matches one of the options within options or option_groups. This option will be selected when the menu initially loads.
   */
  initial_option?: OptionCompositionObject

  /**
   * A confirm object that defines an optional confirmation dialog that appears after a menu item is selected.
   */
  confirm?: ConfirmationCompositionObject
}

/**
 * This select menu will load its options from an external data source, allowing for a dynamic list of options.
 *
 * ## Setup
 * To use this menu type, you'll need to configure your app first:
 *
 * 1. Goto your app's settings page and choose the Interactive Components feature menu.
 * 2. Add a URL to the Options Load URL under Message Menus.
 * 3. Save changes.
 * Each time a select menu of this type is opened or the user starts typing in the typeahead field, we'll send a request to your specified URL. Your app should return an HTTP 200 OK response, along with an application/json post body with an object containing either an options array, or an option_groups array. Here's an example response:
 */
interface ExternalSelectMenuBlockElement extends SelectMenuBlockElement {
  type: 'external_select'

  /**
   * A single option that exactly matches one of the options within the options or option_groups loaded from the external data source. This option will be selected when the menu initially loads.
   */
  initial_option?: OptionCompositionObject

  /**
   * When the typeahead field is used, a request will be sent on every character change. If you prefer fewer requests or more fully ideated queries, use the min_query_length attribute to tell Slack the fewest number of typed characters required before dispatch.
   */
  min_query_length?: number

  /**
   * A confirm object that defines an optional confirmation dialog that appears after a menu item is selected.
   */
  confirm?: ConfirmationCompositionObject
}

/**
 * This select menu will populate its options with a list of Slack users visible to the current user in the active workspace.
 */
interface UserSelectMenuBlockElement extends SelectMenuBlockElement {
  type: 'users_select'
  /**
   * The user ID of any valid user to be pre-selected when the menu loads.
   */
  initial_user?: string

  /**
   * A confirm object that defines an optional confirmation dialog that appears after a menu item is selected.
   */
  confirm?: ConfirmationCompositionObject
}

/**
 * This select menu will populate its options with a list of public and private channels, DMs, and MPIMs visible to the current user in the active workspace.
 */
interface ConversationSelectMenuBlockElment extends SelectMenuBlockElement {
  type: 'conversations_select'

  /**
   * The ID of any valid conversation to be pre-selected when the menu loads.
   */
  initial_conversation?: string

  /**
   * A confirm object that defines an optional confirmation dialog that appears after a menu item is selected.
   */
  confirm?: ConfirmationCompositionObject
}

/**
 * This select menu will populate its options with a list of public channels visible to the current user in the active workspace.
 */
interface ChannelSelectMenuBlockElment extends SelectMenuBlockElement {
  type: 'channels_select'

  /**
   * The ID of any valid conversation to be pre-selected when the menu loads.
   */
  initial_channel?: string

  /**
   * A confirm object that defines an optional confirmation dialog that appears after a menu item is selected.
   */
  confirm?: ConfirmationCompositionObject
}

/**
 * This is like a cross between a button and a select menu - when a user clicks on this overflow button, they will be presented with a list of options to choose from. Unlike the select menu, there is no typeahead field, and the button always appears with an ellipsis ("…") rather than customisable text.
 *
 * As such, it is usually used if you want a more compact layout than a select menu, or to supply a list of less visually important actions after a row of buttons.
 *
 * To use interactive elements like this, you will need to make some changes to prepare your app. Read our guide to enabling interactivity.
 */
interface OverflowMenuBlockElement extends SelectMenuBlockElement {
  type: 'overflow'

  /**
   * An array of option objects to display in the menu. Maximum number of options is 5, minimum is 2.
   */
  options: OptionCompositionObject[]

  /**
   * A confirm object that defines an optional confirmation dialog that appears after a menu item is selected.
   */
  confirm?: ConfirmationCompositionObject
}

/**
 * An element which lets users easily select a date from a calendar style UI. Date picker elements can be used inside of section and actions blocks.
 *
 * To use interactive elements like this, you will need to make some changes to prepare your app. Read our guide to enabling interactivity.
 */
interface DatePickerBlockElement extends SelectMenuBlockElement {
  type: 'datepicker'

  /**
   * The initial date that is selected when the element is loaded. This should be in the format `YYYY-MM-DD`.
   */
  initial_date?: string

  /**
   * A confirm object that defines an optional confirmation dialog that appears after a menu item is selected.
   */
  confirm?: ConfirmationCompositionObject
}

type BlockType = 'section' | 'divider' | 'image' | 'actions' | 'context'

/**
 * https://api.slack.com/reference/messaging/blocks
 */
interface Block {
  // The type of block.
  type: BlockType
  /**
   * A string acting as a unique identifier for a block. You can use this block_id when you receive an interaction payload to [identify the source of the action](https://api.slack.com/messaging/interactivity/enabling#understanding-payloads). If not specified, one will be generated. Maximum length for this field is 255 characters.
   */
  block_id?: string
}

/**
 * A  content divider, like an <hr>, to split up different blocks inside of a message. The divider block is nice and neat, requiring only a type.
 * https://api.slack.com/reference/messaging/blocks#divider
 */
interface DividerBlock extends Block {
  type: 'divider'
}

/**
 * A section is one of the most flexible blocks available - it can be used as a simple text block, in combination with text fields, or side-by-side with any of the available [block elements](https://api.slack.com/reference/messaging/block-elements).
 * https://api.slack.com/reference/messaging/blocks#section
 */
interface SectionBlock extends Block {
  type: 'section'
  /**
   * The text for the block, in the form of a [text object](https://api.slack.com/reference/messaging/composition-objects#text).
   * Maximum length for the text in this field is 3000 characters.
   */
  text: TextCompositionObject
  /**
   * An array of text objects. Any text objects included with fields will be rendered in a compact format that allows for 2 columns of side-by-side text. Maximum number of items is 10. Maximum length for the text in each item is 2000 characters.
   */
  fields?: TextCompositionObject[]
  accessory?: BlockElement
}

/**
 * A simple image block, designed to make those cat photos really pop.
 * https://api.slack.com/reference/messaging/blocks#image
 */
interface ImageBlock extends Block {
  type: 'image'
  /**
   * The URL of the image to be displayed. Maximum length for this field is 3000 characters.
   */
  image_url: string
  /**
   * A plain-text summary of the image. This should not contain any markup. Maximum length for this field is 2000 characters.
   */
  alt_text: string

  /**
   * An optional title for the image in the form of a text object that can only be of type: plain_text. Maximum length for the text in this field is 2000 characters.
   */
  title?: PlainTextCompositionObject
}

/**
 * A block that is used to hold interactive [elements](https://api.slack.com/reference/messaging/block-elements).
 * https://api.slack.com/reference/messaging/blocks#actions
 */
interface ActionsBlock extends Block {
  type: 'actions'
  /**
   * An array of interactive element objects - buttons, select menus, overflow menus, or date pickers. There is a maximum of 5 elements in each action block.
   */
  elements: BlockElement[]
}

/**
 * Displays message context, which can include both images and text.
 * https://api.slack.com/reference/messaging/blocks#context
 */
interface ContextBlock extends Block {
  type: 'context'

  /**
   * 	An array of [image elements](https://api.slack.com/reference/messaging/block-elements#image) and [text objects](https://api.slack.com/reference/messaging/composition-objects#text). Maximum number of items is 10.
   */
  elements: (TextCompositionObject | ImageBlockElement)[]
}

export interface RTMReactionAddedEvent extends RTMEvent {
  type: 'reaction_added'
  user: string
  item_user: string
  ts: string
  event_ts: string
  item: {
    channel: string
    ts: string
    type: 'message'
  }
  reaction: string
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
