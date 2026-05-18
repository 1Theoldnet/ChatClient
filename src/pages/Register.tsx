import { Box, TextField, Button, Stack, styled, Avatar, Alert, CircularProgress } from "@mui/material"
import { useState, type FC } from "react"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import { Link, useNavigate } from "react-router-dom"
import axios from 'axios'

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
})

interface FormErrors {
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
}

export const Register: FC = () => {
    const navigate = useNavigate()
    const [preview, setPreview] = useState<string>("")
    const [_, setFileName] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>("")
    
    // Поля формы
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    })
    
    // Ошибки полей
    const [errors, setErrors] = useState<FormErrors>({})
    
    // Обработка изменения полей
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Очищаем ошибку поля при вводе
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: "" }))
        }
    }
    
    // Валидация формы
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}
        
        // Валидация имени
        if (!formData.name.trim()) {
            newErrors.name = "Введите имя"
        } else if (formData.name.length < 2) {
            newErrors.name = "Имя должно содержать минимум 2 символа"
        } else if (formData.name.length > 20) {
            newErrors.name = "Имя не должно превышать 20 символов"
        } else if (!/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(formData.name)) {
            newErrors.name = "Имя должно содержать только буквы"
        }
        
        // Валидация email
        const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/
        if (!formData.email.trim()) {
            newErrors.email = "Введите email"
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Введите корректный email (пример: name@example.com)"
        }
        
        // Валидация пароля
        if (!formData.password) {
            newErrors.password = "Введите пароль"
        } else if (formData.password.length < 6) {
            newErrors.password = "Пароль должен содержать минимум 6 символов"
        } else if (formData.password.length > 20) {
            newErrors.password = "Пароль не должен превышать 20 символов"
        }
        
        // Валидация подтверждения пароля
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Подтвердите пароль"
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Пароли не совпадают"
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }
    
    // Отправка формы
    const handleSubmit = async () => {
        setError("")
        
        if (!validateForm()) {
            return
        }
        
        setLoading(true)
        
        try {
            await axios.post('https://chatserver-ood9.onrender.com/register', {
                name: formData.name,
                gmail: formData.email,
                password: formData.password,
                avatarBase64: preview
            })
            .then(res => {
                if (res.data.message === 'Пользователь успешно создан!') {
                    navigate('/login')
                } else if (res.data.message === 'Такой пользователь уже зарегистрирован!') {
                    setError('Такой пользователь уже существует')
                } else {
                    setError('Ошибка при регистрации. Попробуйте позже.')
                }
            })
        } catch (err) {
            console.error('Ошибка:', err)
            setError('Не удалось подключиться к серверу')
        } finally {
            setLoading(false)
        }
    }
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите изображение')
                return
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Размер файла не должен превышать 5MB')
                return
            }
            
            setFileName(file.name)
            
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }
    
    return (
        <Box style={{ 
            width: '100%', 
            height: '100vh', 
            backgroundImage: 'url("https://wallpapers.com/images/featured/sejeste-iphone-99acinjkciouj7g0.jpg")',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
        }}>
            <Box style={{
                background: 'white',
                padding: '30px',
                borderRadius: '20px',
                width: '450px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
                <Stack spacing={2}>
                    <h2 style={{ textAlign: 'center', margin: 0 }}>Регистрация</h2>
                    
                    {error && (
                        <Alert severity="error" onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}
                    
                    {preview && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Avatar
                                src={preview} 
                                sx={{ width: 80, height: 80, mx: 'auto' }}
                            />
                        </Box>
                    )}
                    
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        {preview ? "Изменить аватар" : "Выбрать аватар"}
                        <VisuallyHiddenInput 
                            type="file" 
                            onChange={handleImageChange}
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                        />
                    </Button>
                    
                    <TextField 
                        label="Имя" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth 
                        error={!!errors.name}
                        helperText={errors.name}
                        disabled={loading}
                    />
                    
                    <TextField 
                        label="Email" 
                        name="email"
                        type="email" 
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth 
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={loading}
                    />
                    
                    <TextField 
                        label="Пароль" 
                        name="password"
                        type="password" 
                        value={formData.password}
                        onChange={handleChange}
                        fullWidth 
                        error={!!errors.password}
                        helperText={errors.password}
                        disabled={loading}
                    />
                    
                    <TextField 
                        label="Подтвердите пароль" 
                        name="confirmPassword"
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        fullWidth 
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        disabled={loading}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !loading) {
                                handleSubmit()
                            }
                        }}
                    />
                    
                    <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={handleSubmit}
                        disabled={loading}
                        sx={{ height: 50 }}
                    >
                        {loading ? <CircularProgress size={24} /> : "Зарегистрироваться"}
                    </Button>
                </Stack>
            </Box>
            
            <Link style={{ fontSize: 20, color: 'white', position: 'fixed', left: 20, bottom: 20, textDecoration: 'none' }} to='/login'>
                Войти
            </Link>
        </Box>
    )
}