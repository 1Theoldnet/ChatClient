export type User = {
    id: number,
    avatarBase64: string,
    name: string,
    gmail: string,
    password: string,
    chats: Chat[],
    createdAt: string,
    updatedAt: string
}

export type Chat = {
    id: number,
    avatarBase64: string,
    chatName: string,
    users: number[],
    isGroup: boolean,
    messages: Message[],
    createdUser: number
}

export type Message = {
    id: number,
    userId: number,
    text: string,
    time: string
}