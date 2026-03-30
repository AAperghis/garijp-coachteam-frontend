"use client";
import { useTheme } from "../context/themeContext";
import { Sun, Moon} from "lucide-react"


export function ThemeButton() {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button 
            onClick={toggleTheme} 
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-md hover:text-zinc-200 dark:hover:text-zinc-400 transition-colors"
            >
            {isDark ? <Sun/> : <Moon/>}
        </button>
    )
}   