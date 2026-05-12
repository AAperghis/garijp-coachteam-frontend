"use client";

import { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowEmpty?: boolean;
}

export default function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = "—",
  className = "",
  allowEmpty = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        className="w-full bg-transparent px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-garijp-blue"
        value={open ? query : value}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
      />
      {open && (
        <ul className="absolute left-0 top-full z-50 max-h-48 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {allowEmpty && (
            <li>
              <button
                type="button"
                className="w-full px-4 py-1.5 text-left text-sm text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
              >
                {placeholder}
              </button>
            </li>
          )}
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                className={`w-full px-4 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  opt === value ? "font-semibold text-garijp-blue" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {opt}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-2 text-sm text-zinc-400">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}
