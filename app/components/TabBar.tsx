"use client";

interface TabBarProps<T extends string> {
  tab: T;
  setTab: (t: T) => void;
  tabs: readonly { readonly id: T; readonly label: string }[];
}

export default function TabBar<T extends string>({ tab, setTab, tabs }: TabBarProps<T>) {
  return (
    <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === t.id
              ? "border-b-2 border-garijp-blue text-foreground"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
