import { WebClient, WebAPICallResult } from '@slack/web-api'
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

interface ChannelList extends WebAPICallResult {
  channels: Channel[]
}

interface UserList extends WebAPICallResult {
  members: User[]
}

interface IMList extends WebAPICallResult {
  ims: IM[]
}

export class Manager {
  private channelStore = new DataStore(() => {
    return this.web.channels.list({
      exclude_archived: true,
      exclude_members: true,
    }) as Promise<ChannelList>
  })

  private imStore = new DataStore(() => {
    return this.web.im.list() as Promise<IMList>
  })

  private userStore = new DataStore(() => {
    return this.web.users.list() as Promise<UserList>
  })

  constructor(private readonly web: WebClient) {}

  async channels() {
    const data = await this.channelStore.data()
    return data.channels
  }

  async ims() {
    const data = await this.imStore.data()
    return data.ims
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

  async users() {
    const data = await this.userStore.data()
    return data.members
  }

  async user(id: string) {
    const users = await this.users()

    return users.find(user => user.id === id)
  }

  async userNamed(name: string) {
    const users = await this.users()

    return users.find(user => user.name === name)
  }

  private get allStores() {
    return [this.channelStore, this.imStore, this.userStore]
  }

  ensureAllTalky() {
    return Promise.all([this.channels(), this.ims()]).then(() => undefined)
  }

  resetAll() {
    return Promise.all(
      this.allStores.map((store: { reset: () => Promise<any> }) =>
        store.reset(),
      ),
    ).then(() => undefined)
  }
}
