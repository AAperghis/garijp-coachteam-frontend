"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {}}
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const dark = localStorage.getItem('theme') ? localStorage.getItem('theme') === 'dark': window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', dark)
    }, []);

    const toggleTheme = () => {
        const dark = !isDark;
        setIsDark(dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', dark)
    }
    return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext)
}