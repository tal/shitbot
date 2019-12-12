import {
  WebClient,
  WebAPICallResult,
  ConversationsListArguments,
  CursorPaginationEnabled,
  IMListArguments,
  UsersListArguments,
} from '@slack/web-api'
import { DataStore } from './data-store'

export interface TalkyPlace {
  created: number
  id: string
  is_org_shared: boolean
  is_shared: boolean
  is_channel?: boolean
  is_im?: boolean
  name?: string
}

export interface Channel extends TalkyPlace {
  creator: string
  is_archived: boolean
  is_channel: boolean
  is_general: boolean
  is_member: boolean
  is_mpim: boolean
  is_private: boolean
  is_im: false
  name: string
  name_normalized: string
  num_members: number
  previous_names: string[]
  purpose: {
    creator: string
    last_set: number
    value: string
  }
  topic: {
    creator: string
    last_set: number
    value: string
  }
}

export interface IM extends TalkyPlace {
  user: string
  priority: number
  is_user_deleted: boolean
  is_im: true
}

export interface User {
  color: string
  deleted: boolean
  id: string
  is_admin: boolean
  is_app_user: boolean
  is_bot: boolean
  is_owner: boolean
  is_primary_owner: boolean
  is_restricted: boolean
  is_ultra_restricted: boolean
  name: string
  real_name: string
  tz: string
  tz_label: string
  tz_offset: number
  updated: number
  profile: { [k: string]: string }
}

interface ConversationList extends WebAPICallResult {
  channels: Channel[]
}

interface UserList extends WebAPICallResult {
  members: User[]
}

interface IMList extends WebAPICallResult {
  ims: IM[]
}

function paginateFn<
  T,
  F extends WebAPICallResult = WebAPICallResult,
  Props extends CursorPaginationEnabled = CursorPaginationEnabled
>(
  fetcher: (options?: Props) => Promise<WebAPICallResult>,
  dataCollector: (reponse: F) => T[],
) {
  return async (props: Props) => {
    let response = await fetcher(props)
    if (!response.ok) {
      throw response.error
    }

    let data = dataCollector(response as F)

    while (
      response.ok &&
      response.response_metadata &&
      response.response_metadata.next_cursor
    ) {
      let cursor = response.response_metadata.next_cursor

      response = await fetcher({
        ...props,
        cursor,
      })

      if (!response.ok) {
        throw response.error
      }

      data = data.concat(dataCollector(response as F))
    }

    return data
  }
}

export class Manager {
  private channelStore = new DataStore(async () => {
    const props: ConversationsListArguments = {
      exclude_archived: true,
      types: 'public_channel,private_channel',
      limit: 999,
    }

    return paginateFn(
      this.web.conversations.list,
      (resp: ConversationList) => resp.channels,
    )(props)
  })

  private imStore = new DataStore(() => {
    const props: IMListArguments = { limit: 999 }
    return paginateFn(this.web.im.list, (resp: IMList) => resp.ims)(props)
  })

  private userStore = new DataStore(() => {
    const props: UsersListArguments = { limit: 999 }
    return paginateFn(
      this.web.users.list,
      (resp: UserList) => resp.members,
    )(props)
  })

  constructor(private readonly web: WebClient) {}

  channels() {
    return this.channelStore.data()
  }

  ims() {
    return this.imStore.data()
  }

  async channel(id: string) {
    this.ensureAllTalky()
    const channels = await this.channels()
    return channels.find(channel => channel.id === id)
  }

  async channelNamed(name: string) {
    this.ensureAllTalky()
    const channels = await this.channels()
    return channels.find(channel => channel.name === name)
  }

  async im(id: string) {
    this.ensureAllTalky()
    const channels = await this.ims()
    return channels.find(channel => channel.id === id)
  }

  users() {
    return this.userStore.data()
  }

  async user(id: string) {
    const users = await this.users()

    return users.find(user => user.id === id)
  }

  async userNamed(name: string) {
    const users = await this.users()

    return users.find(user => user.name === name)
  }

  private get allStores(): DataStore<any>[] {
    return [this.channelStore, this.imStore, this.userStore]
  }

  ensureAllTalky(): Promise<void> {
    return Promise.all([this.channels(), this.ims()]).then(() => undefined)
  }

  resetAll(): Promise<void> {
    return Promise.all(this.allStores.map(store => store.reset())).then(
      () => undefined,
    )
  }
}
