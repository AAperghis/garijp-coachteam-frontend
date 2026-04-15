"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function downloadExample(filename: string) {
    const response = await fetch(`${API_URL}/examples/banaan/${filename}`);
    if (!response.ok) {
        throw new Error("Failed to download example");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}`;
    a.click();
    URL.revokeObjectURL(url);
}

interface ExampleFile {
    name: string;
    filename: string;
}

export function BanaanExamples() {
    const [examples, setExamples] = useState<ExampleFile[]>([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/examples/banaan`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load examples");
                return res.json();
            })
            .then(data => {
                console.log(data);
                setExamples(data);
            })
            .catch(() => setError(true));
    }, []);

    return (
        <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Download example file:</p>
            {error ? (
                <p className="text-sm text-red-600">Failed to load examples</p>
            ) : (
                examples.map((example: ExampleFile) => (
                    <button
                        key={example.name}
                        onClick={() => downloadExample(example.filename)}
                        className="cursor-pointer rounded-lg bg-garijp-blue px-2 py-1 text-sm hover:underline"
                    >
                        <div className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            <div>{example.name}</div>
                        </div>
                    </button>
                ))
            )}
        </div>
    );
}