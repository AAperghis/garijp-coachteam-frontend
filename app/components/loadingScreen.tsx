"use client";
import { useAwake } from "../context/wakeupContext";
import { CircleLoader} from "react-spinners";

export function LoadingScreen() {
    const { isAwake } = useAwake();
    if (isAwake) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 z-50">
            <div className="flex flex-col items-center gap-4">
                <CircleLoader color="#3bc1f6" size={60} />
                <p className="text-lg text-gray-300">Loading...</p>
            </div>
        </div>
    )
}