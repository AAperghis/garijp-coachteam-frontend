"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const AwakeContext = createContext({
  isAwake: false,
  wakeUp: () => {},
});

export function AwakeProvider({ children }: { children: React.ReactNode }) {
    const [isAwake, setIsAwake] = useState(false);
    const cancelledRef = useRef(false);

    const wakeUp = async () => {
      cancelledRef.current = false;
      let awake = false;
      while (!awake && !cancelledRef.current) {
        const response = await fetch(`${API_URL}/health`).catch(() => undefined);
        if (cancelledRef.current) break;
        if (response?.status === 200) {
          awake = true;
          setIsAwake(true);
        } else {
          setIsAwake(false);
          await new Promise(res => setTimeout(res, 1000));
        }
      }
    };

    useEffect(() => {
        cancelledRef.current = false;
        wakeUp();
        return () => { cancelledRef.current = true; };
    }, []);

    
    return <AwakeContext.Provider value={{ isAwake, wakeUp }}>{children}</AwakeContext.Provider>;
}

export function useAwake() {
  return useContext(AwakeContext)
}


