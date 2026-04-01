import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GroupMessageView } from './features/group/GroupMessageView'
import { ChatList } from './features/chat/ChatList'
import { CreateGroupFlow } from './features/group/CreateGroupFlow'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Chat list — home screen */}
        <Route path="/" element={<ChatList />} />

        {/* Create new group chat */}
        <Route path="/chat/new-group" element={<CreateGroupFlow />} />

        {/* Group chat view */}
        <Route path="/chat/group/:groupId" element={<GroupMessageView />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
