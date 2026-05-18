import type { FC } from "react"
import {
    Box,
    Avatar,
    Typography,
    Card,
    CardContent,
    Button,
    Divider,
    Stack,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from "@mui/material"
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Delete as DeleteIcon
} from "@mui/icons-material"
import { useState } from "react"

export const Profile: FC = () => {
    const [isEditing, setIsEditing] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)
    
    // Данные пользователя
    const [user, setUser] = useState({
        name: "Анна Иванова",
        email: "anna@example.com",
        password: "12345678",
        about: "Дизайнер интерфейсов. Люблю создавать красивые и удобные продукты. В свободное время занимаюсь фотографией."
    })

    const [formData, setFormData] = useState(user)

    const handleSave = () => {
        setUser(formData)
        setIsEditing(false)
        // Здесь можно добавить API вызов для сохранения на сервере
    }

    const handleDeleteAccount = () => {
        setOpenDialog(false)
        // Здесь можно добавить API вызов для удаления аккаунта
        console.log('Аккаунт удалён')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#f5f7fa',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3
        }}>
            <Card sx={{
                maxWidth: 700,
                width: '100%',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden'
            }}>
                {/* Шапка с градиентом */}
                <Box sx={{
                    height: 120,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }} />

                {/* Аватар и редактирование */}
                <Box sx={{ position: 'relative', px: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Avatar sx={{
                            width: 100,
                            height: 100,
                            bgcolor: '#764ba2',
                            fontSize: 40,
                            border: '4px solid white',
                            marginTop: '-50px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}>
                            {formData.name.charAt(0)}
                        </Avatar>
                        {!isEditing && (
                            <IconButton 
                                onClick={() => setIsEditing(true)}
                                sx={{
                                    bgcolor: '#f0f0f0',
                                    '&:hover': { bgcolor: '#e0e0e0' }
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                <CardContent>
                    {!isEditing ? (
                        // Режим просмотра
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                                    {user.name}
                                </Typography>
                            </Box>

                            <Divider />

                            <Stack spacing={1.5}>
                                <Typography variant="subtitle2" sx={{ color: '#999', fontWeight: 600, letterSpacing: 1 }}>
                                    КОНТАКТНАЯ ИНФОРМАЦИЯ
                                </Typography>
                                
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#999' }}>Email</Typography>
                                    <Typography variant="body1" sx={{ color: '#333' }}>
                                        {user.email}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" sx={{ color: '#999' }}>Пароль</Typography>
                                    <Typography variant="body1" sx={{ color: '#333' }}>
                                        {'•'.repeat(user.password.length)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" sx={{ color: '#999' }}>О себе</Typography>
                                    <Typography variant="body2" sx={{ color: '#555', mt: 0.5, lineHeight: 1.5 }}>
                                        {user.about}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Divider />

                            {/* Кнопка удалить аккаунт */}
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setOpenDialog(true)}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    borderColor: '#ff4444',
                                    color: '#ff4444',
                                    '&:hover': {
                                        borderColor: '#cc0000',
                                        backgroundColor: '#fff5f5'
                                    }
                                }}
                            >
                                Удалить аккаунт
                            </Button>
                        </Stack>
                    ) : (
                        // Режим редактирования
                        <Stack spacing={3}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                                Редактирование профиля
                            </Typography>

                            <TextField
                                fullWidth
                                label="Имя"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#667eea',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#667eea',
                                        }
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#667eea',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#667eea',
                                        }
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Пароль"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                helperText="Минимум 6 символов"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#667eea',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#667eea',
                                        }
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="О себе"
                                name="about"
                                value={formData.about}
                                onChange={handleChange}
                                variant="outlined"
                                multiline
                                rows={4}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#667eea',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#667eea',
                                        }
                                    }
                                }}
                            />

                            <Stack direction="row" spacing={2}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSave}
                                    sx={{
                                        bgcolor: '#667eea',
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: '#5a67d8' }
                                    }}
                                >
                                    Сохранить
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setIsEditing(false)}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        borderColor: '#e0e0e0',
                                        color: '#666',
                                        '&:hover': { borderColor: '#999' }
                                    }}
                                >
                                    Отмена
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </CardContent>
            </Card>

            {/* Диалог подтверждения удаления аккаунта */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
            >
                <DialogTitle sx={{ color: '#ff4444' }}>
                    Удалить аккаунт?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#666' }}>
                        Это действие нельзя отменить. Все ваши данные будут удалены навсегда.
                        Вы уверены, что хотите продолжить?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ padding: 2, gap: 1 }}>
                    <Button 
                        onClick={() => setOpenDialog(false)}
                        sx={{ textTransform: 'none', color: '#666' }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleDeleteAccount}
                        variant="contained"
                        sx={{ 
                            bgcolor: '#ff4444',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#cc0000' }
                        }}
                    >
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
