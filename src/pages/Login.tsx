import { Box, TextField, Button, Stack, Alert, CircularProgress } from "@mui/material"
import { useState, type FC } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { User } from "../types"
import axios from "axios"

interface LoginProps {
  setCurrentUser: (user: User | null) => void
}

interface FormErrors {
  email?: string
  password?: string
}

export const Login: FC<LoginProps> = ({ setCurrentUser }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  
  // Поля формы
  const [formData, setFormData] = useState({
    email: "",
    password: ""
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
    // Очищаем общую ошибку при вводе
    if (error) setError("")
  }
  
  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    // Валидация email
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/
    if (!formData.email.trim()) {
      newErrors.email = "Введите email"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Введите корректный email"
    }
    
    // Валидация пароля
    if (!formData.password) {
      newErrors.password = "Введите пароль"
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов"
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
        await axios.post('https://chatserver-ood9.onrender.com/login', {
            gmail: formData.email,
            password: formData.password
        })
        .then(res => {
            if (res.data.message === 'Неверная пароль или почта!') {
                setError('Неверный email или пароль')
            } else if (res.data.id) {
                setCurrentUser(res.data)
                navigate('/')
            } else {
                setError('Ошибка при входе. Попробуйте позже.')
            } 
        })
    } catch (err) {
      console.error('Ошибка:', err)
      setError('Не удалось подключиться к серверу')
    } finally {
      setLoading(false)
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
        padding: '40px',
        borderRadius: '20px',
        width: '420px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      }}>
        <Stack spacing={3}>
          <h2 style={{ textAlign: 'center', margin: 0, color: '#333' }}>Вход в аккаунт</h2>
          
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          
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
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleSubmit()
              }
            }}
          />
          
          <TextField 
            label="Пароль" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth 
            error={!!errors.password}
            helperText={errors.password}
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
            style={{ height: 50 }}
          >
            {loading ? <CircularProgress size={24} /> : "Войти"}
          </Button>
        </Stack>
      </Box>
      
      <Link style={{ fontSize: 20, color: 'white', position: 'fixed', left: 20, bottom: 20, textDecoration: 'none' }} to='/register'>
        Регистрация
      </Link>
    </Box>
  )
}