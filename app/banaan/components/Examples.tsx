"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function downloadExample(name: string) {
    const response = await fetch(`${API_URL}/examples/banaan/${name}.xlsx`);
    if (!response.ok) {
        throw new Error("Failed to download example");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

export function BanaanExamples() {
    const [examples, setExamples] = useState<string[]>([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/examples/banaan`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load examples");
                return res.json();
            })
            .then(data => setExamples(data))
            .catch(() => setError(true));
    }, []);

    return (
        <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Download example file:</p>
            {error ? (
                <p className="text-sm text-red-600">Failed to load examples</p>
            ) : (
                examples.map((name: string) => (
                    <button
                        key={name}
                        onClick={() => downloadExample(name)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {name}
                    </button>
                ))
            )}
        </div>
    );
}