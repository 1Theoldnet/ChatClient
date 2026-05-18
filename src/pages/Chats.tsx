import { useEffect, useState, type FC } from "react"
import { 
  AppBar, Box, Typography, Toolbar, Avatar, Button, List, ListItem, 
  ListItemAvatar, ListItemText, Divider, Skeleton, IconButton, 
  Modal, TextField, Chip, CircularProgress, Alert, Badge
} from "@mui/material"
import { 
  Add as AddIcon, 
  Close as CloseIcon,
  GroupAdd as GroupIcon,
  PersonAdd as PersonIcon
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { socket } from "../../utils"
import type { User, Chat as ChatType } from "../types"

interface ChatsProps {
  currentUser?: User
  setCurrentUser?: (user: User | null) => void
}

export const Chats: FC<ChatsProps> = ({ currentUser, setCurrentUser }) => {
  const navigate = useNavigate()
  const [chats, setChats] = useState<ChatType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [chatType, setChatType] = useState<'private' | 'group'>('private')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [groupName, setGroupName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<number[]>([])

  // Проверка авторизации
  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
    }
  }, [currentUser, navigate])

  // Подключаемся к Socket.IO и отправляем ID пользователя
  useEffect(() => {
    if (currentUser) {
      socket.emit('userOnline', currentUser.id)
    }

    // Слушаем обновления статуса онлайн
    const handleUsersOnline = (users: number[]) => {
      setOnlineUsers(users)
    }

    socket.on('usersOnline', handleUsersOnline)

    return () => {
      socket.off('userOnline')
      socket.off('usersOnline')
    }
  }, [currentUser])

  // Слушаем новые сообщения и чаты
  useEffect(() => {
    const handleNewMessage = ({ chatId, message }: { chatId: number; message: any }) => {
      setChats(prevChats => {
        if (!Array.isArray(prevChats)) return prevChats
        return prevChats.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...(chat.messages || []), message]
            }
          }
          return chat
        })
      })
    }

    const handleChatCreated = ({ chat }: { chat: ChatType }) => {
      setChats(prev => {
        const prevArray = Array.isArray(prev) ? prev : []
        return [chat, ...prevArray]
      })
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('chatCreated', handleChatCreated)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('chatCreated', handleChatCreated)
    }
  }, [])

  // Загружаем чаты пользователя
  useEffect(() => {
    if (!currentUser) return

    const fetchChats = async () => {
      setLoading(true)
      try {
        const response = await fetch(`https://chatserver-ood9.onrender.com/chats/${currentUser.id}`)
        const data = await response.json()
        
        if (Array.isArray(data)) {
          setChats(data)
        } else if (data.error) {
          console.error('Ошибка от сервера:', data.error)
          setChats([])
        } else {
          console.error('Неожиданный формат данных:', data)
          setChats([])
        }
      } catch (error) {
        console.error('Ошибка загрузки чатов:', error)
        setChats([])
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [currentUser])

  // Загружаем список пользователей для создания чата
  useEffect(() => {
    if (!modalOpen) return

    const fetchUsers = async () => {
      try {
        const response = await fetch('https://chatserver-ood9.onrender.com/users')
        const data = await response.json()
        // Исключаем текущего пользователя и добавляем статус онлайн
        const otherUsers = data
          .filter((user: User) => user.id !== currentUser?.id)
          .map((user: User) => ({
            ...user,
            isOnline: onlineUsers.includes(user.id)
          }))
        setUsers(otherUsers)
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
      }
    }

    fetchUsers()
  }, [modalOpen, currentUser, onlineUsers])

  // Фильтрация пользователей по поиску
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.gmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Выбор пользователя для личного чата
  const selectUserForPrivate = (userId: number) => {
    setSelectedUsers([userId])
  }

  // Выбор пользователя для группового чата
  const toggleUserForGroup = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Создание чата
  const handleCreateChat = async () => {
    setError("")
    setCreating(true)

    try {
      if (chatType === 'private') {
        if (selectedUsers.length === 0) {
          setError("Выберите пользователя")
          setCreating(false)
          return
        }

        const response = await fetch('https://chatserver-ood9.onrender.com/chats/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser?.id,
            otherUserId: selectedUsers[0]
          })
        })

        const data = await response.json()
        
        if (data.success || data.chat) {
          setModalOpen(false)
          setSelectedUsers([])
          setSearchQuery("")
          navigate(`/chat/${data.chat.id}`)
        } else if (data.error === 'Чат уже существует' && data.chat) {
          setModalOpen(false)
          navigate(`/chat/${data.chat.id}`)
        } else {
          setError(data.error || "Ошибка создания чата")
        }
      } else {
        if (selectedUsers.length < 2) {
          setError("Выберите минимум 2 пользователя для группового чата")
          setCreating(false)
          return
        }
        if (!groupName.trim()) {
          setError("Введите название группы")
          setCreating(false)
          return
        }

        const response = await fetch('https://chatserver-ood9.onrender.com/chats/create-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser?.id,
            chatName: groupName,
            usersIds: selectedUsers
          })
        })

        const data = await response.json()
        
        if (data.success) {
          setModalOpen(false)
          setSelectedUsers([])
          setGroupName("")
          setSearchQuery("")
          navigate(`/chat/${data.chat.id}`)
        } else {
          setError(data.error || "Ошибка создания группы")
        }
      }
    } catch (error) {
      console.error('Ошибка:', error)
      setError("Не удалось подключиться к серверу")
    } finally {
      setCreating(false)
    }
  }

  // Закрыть модальное окно и сбросить состояние
  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedUsers([])
    setGroupName("")
    setSearchQuery("")
    setError("")
    setChatType('private')
  }

  // Получаем последнее сообщение из чата
  const getLastMessage = (chat: ChatType): string => {
    if (!chat.messages || chat.messages.length === 0) {
      return "Нет сообщений"
    }
    const lastMessage = chat.messages[chat.messages.length - 1]
    return lastMessage.text && lastMessage.text.length > 50 
      ? lastMessage.text.slice(0, 50) + "..." 
      : lastMessage.text || "Нет сообщений"
  }

  // Получаем время последнего сообщения
  const getLastMessageTime = (chat: ChatType): string => {
    if (!chat.messages || chat.messages.length === 0) {
      return ""
    }
    return chat.messages[chat.messages.length - 1].time || ""
  }

  // Получаем название чата
  const getChatName = (chat: ChatType): string => {
    if (chat.isGroup) {
      return chat.chatName || "Групповой чат"
    }
    return chat.chatName || "Пользователь"
  }

  // Получаем аватар чата
  const getChatAvatar = (chat: ChatType): string => {
    return chat.avatarBase64 || ""
  }

  // Проверяем онлайн статус пользователя в личном чате
  const isUserOnline = (chat: ChatType): boolean => {
    if (chat.isGroup) return false
    const otherUserId = chat.users.find(id => id !== currentUser?.id)
    return otherUserId ? onlineUsers.includes(otherUserId) : false
  }

  // Открыть чат
  const openChat = (chatId: number) => {
    navigate(`/chat/${chatId}`)
  }

  // Выход из аккаунта
  const handleLogout = () => {
    if (setCurrentUser) {
      setCurrentUser(null)
    }
    localStorage.removeItem('currentUser')
    navigate('/login')
  }

  if (!currentUser) {
    return null
  }

  const chatsArray = Array.isArray(chats) ? chats : []

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
          <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontSize: 25, fontWeight: 'bold' }}>
              Мессенджер
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                color="inherit" 
                onClick={() => setModalOpen(true)}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <AddIcon />
              </IconButton>

              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: onlineUsers.includes(currentUser.id) ? '#44b700' : '#9e9e9e',
                    boxShadow: '0 0 0 2px #1976d2',
                  }
                }}
              >
                <Avatar alt={currentUser.name} src={currentUser.avatarBase64} sx={{ bgcolor: '#1565c0' }}>
                  {currentUser.name.charAt(0)}
                </Avatar>
              </Badge>

              <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 500 }}>
                {currentUser.name}
              </Typography>

              <Button variant="contained" onClick={handleLogout} sx={{ bgcolor: 'darkred', '&:hover': { bgcolor: '#8b0000' }, textTransform: 'none' }}>
                Выйти
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'auto', bgcolor: '#f5f5f5' }}>
        {loading ? (
          <Box sx={{ p: 2, display: 'grid', gap: 2 }}>
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} variant="rectangular" width={'100%'} height={70} sx={{ borderRadius: 2, bgcolor: '#e0e0e0' }} />
            ))}
          </Box>
        ) : chatsArray.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" color="text.secondary">У вас пока нет чатов</Typography>
            <Button variant="contained" onClick={() => setModalOpen(true)} sx={{ textTransform: 'none' }}>Создать чат</Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {chatsArray.map((chat, index) => {
              const isOnline = !chat.isGroup && isUserOnline(chat)
              const chatName = getChatName(chat)
              
              return (
                <Box key={chat.id}>
                  <ListItem onClick={() => openChat(chat.id)} sx={{ cursor: 'pointer', transition: 'background-color 0.2s', '&:hover': { bgcolor: '#e8e8e8' }, py: 1.5 }}>
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: isOnline ? '#44b700' : '#9e9e9e',
                            boxShadow: '0 0 0 2px #f5f5f5',
                          }
                        }}
                      >
                        <Avatar src={getChatAvatar(chat)} sx={{ bgcolor: '#1976d2' }}>
                          {chatName.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{chatName}</Typography>}
                      secondary={<Typography variant="body2" color="text.secondary" sx={{ fontSize: 14 }}>{getLastMessage(chat)}</Typography>}
                    />
                    {getLastMessageTime(chat) && (
                      <Typography variant="caption" color="text.secondary">{getLastMessageTime(chat)}</Typography>
                    )}
                  </ListItem>
                  {index < chatsArray.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              )
            })}
          </List>
        )}
      </Box>

      {/* Модальное окно создания чата */}
      <Modal open={modalOpen} onClose={handleCloseModal} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 3, width: '90%', maxWidth: 500, maxHeight: '80vh', overflow: 'auto', position: 'relative' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, bgcolor: 'white', zIndex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Создать чат</Typography>
            <IconButton onClick={handleCloseModal}><CloseIcon /></IconButton>
          </Box>

          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button fullWidth variant={chatType === 'private' ? 'contained' : 'outlined'} onClick={() => { setChatType('private'); setSelectedUsers([]); setGroupName("") }} startIcon={<PersonIcon />} sx={{ textTransform: 'none' }}>Личный чат</Button>
              <Button fullWidth variant={chatType === 'group' ? 'contained' : 'outlined'} onClick={() => { setChatType('group'); setSelectedUsers([]) }} startIcon={<GroupIcon />} sx={{ textTransform: 'none' }}>Групповой чат</Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

            {chatType === 'group' && (
              <TextField fullWidth label="Название группы" value={groupName} onChange={(e) => setGroupName(e.target.value)} sx={{ mb: 2 }} />
            )}

            <TextField fullWidth placeholder="Поиск пользователей..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 2 }} />

            {selectedUsers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Выбрано: {selectedUsers.length}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {selectedUsers.map(id => {
                    const user = users.find(u => u.id === id)
                    return user ? <Chip key={id} label={user.name} size="small" onDelete={() => chatType === 'group' && toggleUserForGroup(id)} /> : null
                  })}
                </Box>
              </Box>
            )}

            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredUsers.map(user => {
                const isSelected = selectedUsers.includes(user.id)
                return (
                  <ListItem key={user.id} onClick={() => { if (chatType === 'private') { selectUserForPrivate(user.id) } else { toggleUserForGroup(user.id) } }} sx={{ cursor: 'pointer', borderRadius: 2, mb: 0.5, bgcolor: isSelected ? 'action.selected' : 'transparent', '&:hover': { bgcolor: 'action.hover' } }}>
                    <ListItemAvatar>
                      <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" sx={{ '& .MuiBadge-badge': { bgcolor: user.isOnline ? '#44b700' : '#9e9e9e' } }}>
                        <Avatar src={user.avatarBase64}>{user.name.charAt(0)}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText primary={user.name} secondary={user.gmail} />
                    {isSelected && <Box sx={{ color: '#1976d2' }}>✓</Box>}
                  </ListItem>
                )
              })}
              {filteredUsers.length === 0 && <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Пользователи не найдены</Typography>}
            </List>

            <Button fullWidth variant="contained" onClick={handleCreateChat} disabled={creating || (chatType === 'group' && selectedUsers.length < 2) || (chatType === 'private' && selectedUsers.length === 0)} sx={{ mt: 2, textTransform: 'none' }}>
              {creating ? <CircularProgress size={24} /> : "Создать чат"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  )
}