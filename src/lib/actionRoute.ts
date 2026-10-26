import { createContext } from 'react'

/** Committed router pathname; actions compare this with history during pending transitions. */
export const ActionRoutePath = createContext<string | undefined>(undefined)
