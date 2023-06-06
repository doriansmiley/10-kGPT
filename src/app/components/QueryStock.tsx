'use client';
import * as React from 'react';
import { useTransition } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { queryStock } from '@gpt10k/actions';

export default function QueryStock({ query }: { query: string }) {
    let [isPending, startTransition] = useTransition();
    const [analysis, setAnalysis] = useState<string>();

    useEffect(() => {
        startTransition(async () => {
            const result = await queryStock(decodeURIComponent(query));
            setAnalysis(result);
        });
    }, [query]);

    return (
        <>
            <div>
                <p style={{ display: analysis ? 'none' : 'inline' }}>loading...</p>
                <p style={{ display: analysis ? 'inline' : 'none' }}>result {analysis}</p>
            </div>
        </>
    )
}