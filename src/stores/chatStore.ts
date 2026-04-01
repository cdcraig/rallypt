import { create } from 'zustand'
import type { GroupWithMeta } from '../types'

interface ChatState {
  groups: GroupWithMeta[]
  setGroups: (groups: GroupWithMeta[]) => void
  addGroup: (group: GroupWithMeta) => void
}

export const useChatStore = create<ChatState>((set) => ({
  groups: [],
  setGroups: (groups) => set({ groups }),
  addGroup: (group) =>
    set((state) => ({ groups: [group, ...state.groups] })),
}))
