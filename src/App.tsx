import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChatList } from './features/chat/ChatList'
import { GroupMessageView } from './features/group/GroupMessageView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Chat list — unified inbox */}
        <Route path="/" element={<ChatList />} />

        {/* Group chat view */}
        <Route path="/chat/group/:groupId" element={<GroupMessageView />} />

        {/* DM view — placeholder until 1:1 messaging UI is built */}
        <Route
          path="/chat/dm/:userId"
          element={
            <div className="flex-1 flex items-center justify-center bg-[#0a1628] text-slate-400 text-sm">
              Direct message view — coming soon
            </div>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
