"use client"

import { createContext, useContext } from "react"

// Portals need the same tokens as the surface that opened them.
const UiThemeContext = createContext("app-ui")
export const UiThemeProvider = UiThemeContext.Provider
export const useUiTheme = () => useContext(UiThemeContext)
