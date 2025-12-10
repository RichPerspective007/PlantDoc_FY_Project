import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PlantDocChatbot from './PlantDocChatbot.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PlantDocChatbot></PlantDocChatbot>
  </StrictMode>,
)
