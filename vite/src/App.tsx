import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './components/pages/home-page'
import ChatPage from './components/pages/chat-page'
import CheckoutPage from './components/pages/checkout-page'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage/>}/>
          <Route path='/chat' element={<ChatPage/>}/>
          <Route path='/checkout' element={<CheckoutPage/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
