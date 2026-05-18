import { useEffect, useState, type FC, useRef } from "react"
import {
    AppBar,
    Box,
    Typography,
    Toolbar,
    TextField,
    IconButton,
    Avatar,
    Badge,
    Button,
    CircularProgress,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ListItemIcon,
    ListItemText
} from "@mui/material"
import {
    Send as SendIcon,
    ArrowBack as BackIcon,
    MoreVert as MenuIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { socket } from "../../utils"
import type { User, Chat as ChatType, Message } from "../types"

interface ChatProps {
    currentUser?: User
}

export const Chat: FC<ChatProps> = ({ currentUser }) => {
    const navigate = useNavigate()
    const { id: chatId } = useParams()
    const [chat, setChat] = useState<ChatType | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [otherUser, setOtherUser] = useState<User | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [otherUserTyping, setOtherUserTyping] = useState(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout>()
    const [isTyping, setIsTyping] = useState(false)
    const [isUserOnline, setIsUserOnline] = useState(false)
    const [onlineUsers, setOnlineUsers] = useState<number[]>([])
    
    // Для редактирования сообщения
    const [editingMessage, setEditingMessage] = useState<Message | null>(null)
    const [editText, setEditText] = useState("")
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    
    // Для меню сообщения
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        message: Message | null;
    } | null>(null)

    // Проверка авторизации
    useEffect(() => {
        if (!currentUser) {
            navigate('/login')
        }
    }, [currentUser, navigate])

    // Загружаем данные чата
    useEffect(() => {
        if (!currentUser || !chatId) return

        const fetchChat = async () => {
            setLoading(true)
            try {
                const response = await fetch(`https://chatserver-ood9.onrender.com/chat/${chatId}`)
                const data = await response.json()
                
                if (data.error) {
                    console.error("Чат не найден")
                    navigate('/')
                    return
                }
                
                setChat(data)
                setMessages(data.messages || [])
                
                // Находим другого пользователя в личном чате
                if (!data.isGroup && data.users) {
                    const otherUserId = data.users.find((id: number) => id !== currentUser.id)
                    if (otherUserId) {
                        const userResponse = await fetch(`${API}users/${otherUserId}`)
                        const userData = await userResponse.json()
                        setOtherUser(userData)
                        
                        // Проверяем онлайн статус сразу после загрузки
                        const onlineResponse = await fetch(`${API}users/online`)
                        const onlineData = await onlineResponse.json()
                        setOnlineUsers(onlineData)
                        setIsUserOnline(onlineData.includes(otherUserId))
                    }
                }
            } catch (error) {
                console.error("Ошибка загрузки чата:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchChat()
        
        // Присоединяемся к комнате чата
        if (chatId) {
            socket.emit('joinChat', parseInt(chatId))
        }
        
        return () => {
            if (chatId) {
                socket.emit('leaveChat', parseInt(chatId))
            }
        }
    }, [chatId, currentUser, navigate])

    // Слушаем новые сообщения и статус онлайн
    useEffect(() => {
        const handleNewMessage = ({ chatId: receivedChatId, message }: { chatId: number; message: Message }) => {
            if (receivedChatId === parseInt(chatId!)) {
                setMessages(prev => [...prev, message])
            }
        }

        const handleMessageEdited = ({ chatId: receivedChatId, messageId, newText }: { chatId: number; messageId: number; newText: string }) => {
            if (receivedChatId === parseInt(chatId!)) {
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
                ))
            }
        }

        const handleMessageDeleted = ({ chatId: receivedChatId, messageId }: { chatId: number; messageId: number }) => {
            if (receivedChatId === parseInt(chatId!)) {
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId ? { ...msg, text: "Сообщение удалено", isDeleted: true } : msg
                ))
            }
        }

        const handleUserTyping = ({ userId, isTyping: typing }: { userId: number; isTyping: boolean }) => {
            if (userId !== currentUser?.id) {
                setOtherUserTyping(typing)
            }
        }

        const handleUsersOnline = (users: number[]) => {
            setOnlineUsers(users)
            if (otherUser) {
                setIsUserOnline(users.includes(otherUser.id))
            }
        }

        socket.on('newMessage', handleNewMessage)
        socket.on('messageEdited', handleMessageEdited)
        socket.on('messageDeleted', handleMessageDeleted)
        socket.on('userTyping', handleUserTyping)
        socket.on('usersOnline', handleUsersOnline)

        return () => {
            socket.off('newMessage', handleNewMessage)
            socket.off('messageEdited', handleMessageEdited)
            socket.off('messageDeleted', handleMessageDeleted)
            socket.off('userTyping', handleUserTyping)
            socket.off('usersOnline', handleUsersOnline)
        }
    }, [chatId, currentUser?.id, otherUser])

    // Автоскролл к последнему сообщению
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Отправка сообщения
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !chatId || sending) return

        setSending(true)
        
        try {
            const response = await fetch('https://chatserver-ood9.onrender.com/chats/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: parseInt(chatId),
                    userId: currentUser.id,
                    text: newMessage
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                setNewMessage("")
            } else {
                console.error("Ошибка отправки")
            }
        } catch (error) {
            console.error("Ошибка:", error)
        } finally {
            setSending(false)
        }
    }

    // Редактирование сообщения
    const handleEditMessage = async () => {
        if (!editingMessage || !editText.trim() || !currentUser || !chatId) return

        try {
            const response = await fetch('https://chatserver-ood9.onrender.com/chats/edit-message', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: parseInt(chatId),
                    messageId: editingMessage.id,
                    userId: currentUser.id,
                    text: editText
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                setEditDialogOpen(false)
                setEditingMessage(null)
                setEditText("")
            }
        } catch (error) {
            console.error("Ошибка редактирования:", error)
        }
    }

    // Удаление сообщения
    const handleDeleteMessage = async (message: Message) => {
        if (!currentUser || !chatId) return

        try {
            const response = await fetch('https://chatserver-ood9.onrender.com/chats/delete-message', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: parseInt(chatId),
                    messageId: message.id,
                    userId: currentUser.id
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                setContextMenu(null)
            }
        } catch (error) {
            console.error("Ошибка удаления:", error)
        }
    }

    // Открыть меню редактирования
    const openEditMenu = (event: React.MouseEvent, message: Message) => {
        event.preventDefault()
        if (message.userId === currentUser?.id && !message.isDeleted) {
            setContextMenu({
                mouseX: event.clientX - 2,
                mouseY: event.clientY - 4,
                message
            })
        }
    }

    const handleCloseMenu = () => {
        setContextMenu(null)
    }

    const handleEditClick = () => {
        if (contextMenu?.message) {
            setEditingMessage(contextMenu.message)
            setEditText(contextMenu.message.text)
            setEditDialogOpen(true)
            handleCloseMenu()
        }
    }

    const handleDeleteClick = () => {
        if (contextMenu?.message) {
            handleDeleteMessage(contextMenu.message)
        }
    }

    // Обработка набора текста
    const handleTyping = () => {
        if (!isTyping && currentUser && chatId) {
            setIsTyping(true)
            socket.emit('typing', { 
                chatId: parseInt(chatId), 
                userId: currentUser.id, 
                isTyping: true 
            })
        }
        
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            if (currentUser && chatId) {
                setIsTyping(false)
                socket.emit('typing', { 
                    chatId: parseInt(chatId), 
                    userId: currentUser.id, 
                    isTyping: false 
                })
            }
        }, 1000)
    }

    // Получить имя чата
    const getChatName = () => {
        if (chat?.isGroup) {
            return chat.chatName || "Групповой чат"
        }
        return otherUser?.name || "Пользователь"
    }

    // Получить аватар чата
    const getChatAvatar = () => {
        if (chat?.isGroup) {
            return chat.avatarBase64 || ""
        }
        return otherUser?.avatarBase64 || ""
    }

    // Получить первую букву
    const getFirstLetter = () => {
        const name = getChatName()
        return name.charAt(0)
    }

    if (!currentUser) {
        return null
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: '#f5f5f5'
        }}>
            {/* Верхняя панель */}
            <AppBar position="static" sx={{ bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton edge="start" onClick={() => navigate('/')} sx={{ color: '#000000' }}>
                            <BackIcon />
                        </IconButton>
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                                '& .MuiBadge-badge': {
                                    bgcolor: isUserOnline ? '#44b700' : '#9e9e9e',
                                    boxShadow: '0 0 0 2px #ffffff',
                                }
                            }}
                        >
                            <Avatar src={getChatAvatar()} sx={{ bgcolor: '#1976d2' }}>
                                {getFirstLetter()}
                            </Avatar>
                        </Badge>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000000' }}>
                                {getChatName()}
                            </Typography>
                            {!chat?.isGroup && (
                                <Typography variant="caption" sx={{ color: isUserOnline ? '#44b700' : '#9e9e9e', fontWeight: 500 }}>
                                    {isUserOnline ? "● Онлайн" : "○ Офлайн"}
                                </Typography>
                            )}
                            {otherUserTyping && !chat?.isGroup && (
                                <Typography variant="caption" sx={{ color: '#1976d2', ml: 1 }}>
                                    печатает...
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Box>
                        <IconButton sx={{ color: '#000000' }}>
                            <MenuIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Область сообщений */}
            <Box 
                sx={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1526784408922-5877a417af64?q=80&w=725&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        bgcolor: '#e0e0e0',
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: '#1976d2',
                        borderRadius: '3px',
                    },
                }}
            >
                {messages.map((message, index) => (
                    <Box
                        key={message.id || index}
                        sx={{
                            display: 'flex',
                            justifyContent: message.userId === currentUser?.id ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <Box
                            onContextMenu={(e) => openEditMenu(e, message)}
                            sx={{
                                maxWidth: '70%',
                                bgcolor: message.userId === currentUser?.id ? '#1976d2' : '#ffffff',
                                color: message.userId === currentUser?.id ? '#ffffff' : '#000000',
                                p: 1.5,
                                borderRadius: message.userId === currentUser?.id 
                                    ? '18px 18px 4px 18px' 
                                    : '18px 18px 18px 4px',
                                position: 'relative',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                cursor: message.userId === currentUser?.id && !message.isDeleted ? 'context-menu' : 'default',
                                opacity: message.isDeleted ? 0.7 : 1,
                                fontStyle: message.isDeleted ? 'italic' : 'normal'
                            }}
                        >
                            <Typography variant="body1" sx={{ wordWrap: 'break-word' }}>
                                {message.text}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                                {message.isEdited && !message.isDeleted && (
                                    <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.6rem' }}>
                                        (ред.)
                                    </Typography>
                                )}
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        opacity: 0.7,
                                        fontSize: '0.7rem',
                                        color: message.userId === currentUser?.id ? '#ffffff' : '#666666'
                                    }}
                                >
                                    {message.time}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                ))}
                {otherUserTyping && !chat?.isGroup && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Box sx={{ 
                            bgcolor: '#ffffff', 
                            p: 1.5, 
                            borderRadius: '18px 18px 18px 4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                Печатает...
                            </Typography>
                        </Box>
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Контекстное меню для сообщения */}
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Редактировать</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDeleteClick}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Удалить</ListItemText>
                </MenuItem>
            </Menu>

            {/* Диалог редактирования сообщения */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать сообщение</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        fullWidth
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        multiline
                        rows={3}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleEditMessage} variant="contained" disabled={!editText.trim()}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Поле ввода сообщения */}
            <Box sx={{ 
                p: 1.5, 
                bgcolor: '#ffffff',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                gap: 1.5,
                alignItems: 'center'
            }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Написать сообщение..."
                    size="small"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !sending && newMessage.trim()) {
                            handleSendMessage()
                        }
                    }}
                    disabled={sending}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: '#f5f5f5',
                            borderRadius: '25px',
                            '& fieldset': {
                                borderColor: '#e0e0e0',
                            },
                            '&:hover fieldset': {
                                borderColor: '#1976d2',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: '#000000',
                        }
                    }}
                />
                <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    sx={{
                        bgcolor: '#1976d2',
                        minWidth: 40,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                            bgcolor: '#1565c0'
                        }
                    }}
                >
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 20 }} />}
                </Button>
            </Box>
        </Box>
    )
}