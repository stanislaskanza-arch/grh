import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { findEntrepriseById, findUserForLogin } from '../modules/parametres/storage'

export type User = {
  id: string
  name: string
  email: string
  role: string
  entrepriseId?: string
  entrepriseNom?: string
}

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

const STORAGE_KEY = 'grh.auth.user'

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      async login(email, password) {
        await new Promise((r) => setTimeout(r, 350))
        const found = findUserForLogin(email, password)
        if (!found) {
          return {
            ok: false as const,
            message:
              'Identifiants incorrects ou compte inactif. Vérifiez e-mail et mot de passe.',
          }
        }
        const entreprise = findEntrepriseById(found.entrepriseId)
        const nextUser: User = {
          id: found.id,
          name: `${found.prenom} ${found.nom}`.trim(),
          email: found.email,
          role: found.role,
          entrepriseId: found.entrepriseId,
          entrepriseNom: entreprise?.raisonSociale,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
        return { ok: true as const }
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
