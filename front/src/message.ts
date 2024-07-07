export interface DiscordMessage {
    id: string
    channel_id: string
    guild_id: string
    content: string
    timestamp: string
    edited_timestamp: any
    mention_roles: any[]
    tts: boolean
    mention_everyone: boolean
    author: Author
    attachments: Attachment[]
    embeds: any[]
    mentions: Mention[]
    reactions: any
    pinned: boolean
    type: number
    webhook_id: string
    member: Member
    mention_channels: any
    activity: any
    application: any
    message_reference: any
    referenced_message: any
    interaction: any
    flags: number
    sticker_items: any
  }

  export interface Mention {
    id: string
    email: string
    username: string
    avatar: string
    locale: string
    discriminator: string
    global_name: string
    token: string
    verified: boolean
    mfa_enabled: boolean
    banner: string
    accent_color: number
    bot: boolean
    public_flags: number
    premium_type: number
    system: boolean
    flags: number
  }

  export interface Attachment {
    id: string
    url: string
    proxy_url: string
    filename: string
    content_type: string
    width: number
    height: number
    size: number
    ephemeral: boolean
  }
  export interface Author {
    id: string
    email: string
    username: string
    avatar: string
    locale: string
    discriminator: string
    global_name: string
    token: string
    verified: boolean
    mfa_enabled: boolean
    banner: string
    accent_color: number
    bot: boolean
    public_flags: number
    premium_type: number
    system: boolean
    flags: number
  }

  export interface Member {
    guild_id: string
    joined_at: string
    nick: string
    deaf: boolean
    mute: boolean
    avatar: string
    user: any
    roles: string[]
    premium_since: string
    flags: number
    pending: boolean
    permissions: string
    communication_disabled_until: any
  }
