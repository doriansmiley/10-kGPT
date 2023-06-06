'use client';
import * as React from 'react';
import { useTransition } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeStock } from '@gpt10k/actions';

export default function StockAnalysis({ ticker }: { ticker: string }) {
    let [isPending, startTransition] = useTransition();
    const [analysis, setAnalysis] = useState<{ value: string, context: any }>();
    const router = useRouter();
    const [query, setQuery] = useState<string>();

    async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        //TODO handle auto complete with the SEC API
        // https://sec-api.io/docs/mapping-api/map-ticker-to-company-details
        const value = event?.target?.value as string;
        setQuery(value);
    }

    function handleSubmit(formData: FormData) {
        // TODO handle validation
        router.push(`/query/${query}`);
    }

    useEffect(() => {
        startTransition(async () => {
            const result = await analyzeStock({ ticker });
            setAnalysis(result);
        });
    }, [ticker]);
    return (
        <>
            <div>
                <p style={{ display: analysis ? 'none' : 'inline' }}>loading...</p>
                <p style={{ display: analysis ? 'inline' : 'none' }}>result {analysis?.value}</p>
            </div>
            <div>
                <form action={handleSubmit} style={{ display: analysis ? 'inline' : 'none' }}>
                    <input type='text' id='query' placeholder={`Enter your query for ${ticker}`} onChange={handleChange} />
                    <button type="submit">Submit</button>
                </form>
            </div>
        </>
    )
}