import { useEffect, useState, type FC } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Chats } from "./pages/Chats"
import { Chat } from "./pages/Chat"
import { Profile } from "./pages/Profile"
import type { User } from "./types"

export const App: FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser')
    return savedUser ? JSON.parse(savedUser) : null
  })

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    } else {
      setCurrentUser(null)
      localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  return (
    <>
      <Routes>
        <Route path="/login" element={currentUser === null ? <Login setCurrentUser={setCurrentUser} /> : <Navigate to='/' />} />
        <Route path="/register" element={currentUser === null ? <Register /> : <Navigate to='/' />} />
        <Route path="/chat/:id" element={currentUser !== null ? <Chat currentUser={currentUser} /> : <Navigate to='/login' />} />
        <Route path="/profile" element={currentUser !== null ? <Profile /> : <Navigate to='/login' />} />
        <Route path="/" element={currentUser !== null ? <Chats currentUser={currentUser} setCurrentUser={setCurrentUser} /> : <Navigate to='/login' />} />
      </Routes>
    </>
  )
}