import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GroupMessageView } from './features/group/GroupMessageView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Group chat view — primary route for now */}
        <Route path="/chat/group/:groupId" element={<GroupMessageView />} />

        {/* Placeholder root */}
        <Route
          path="*"
          element={
            <div className="flex-1 flex items-center justify-center bg-[#0a1628] text-slate-400 text-sm">
              RallyPT — navigate to /chat/group/:groupId
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
