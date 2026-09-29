import Link from "next/link";
import LocalFont from "next/font/local";

const oneDir = LocalFont({
  src: '../fonts/OneDirection.ttf',
  weight: '500',
})

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className={`${oneDir.className} text-7xl text-garijp-red font-bold tracking-tight`}>Coach Team Tools</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Planning tools for coach teams. Choose a tool below to get started.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/banaan"
          className="group rounded-xl border border-zinc-200 p-6 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
        >
          <h2 className="text-xl font-semibold group-hover:underline">
            Banaan
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Upload a cursist list (CSV/XLSX), compute the banana boat schedule,
            and download the result.
          </p>
        </Link>
        <Link
          href="/rooster"
          className="group rounded-xl border border-zinc-200 p-6 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
        >
          <h2 className="text-xl font-semibold group-hover:underline">
            Rooster
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Upload a roster config (JSON), compute the task roster, and download
            the result.
          </p>
        </Link>
      </div>
    </div>
  );
}
