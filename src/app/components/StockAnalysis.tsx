'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useState, useEffect } from 'react';
import {analyzeStock} from '@gpt10k/actions'

export default function StockAnalysis({ticker}: {ticker: string}) {
    let [isPending, startTransition] = useTransition();
    const [analysis, setAnalysis] = useState<{value: string, context: any}>();
    useEffect(() => {
        startTransition(async () => {
            const result = await analyzeStock({ticker});
            setAnalysis(result);
            });
    }, [ticker]);
    return (
        <div>
            <p style={{display: isPending ? 'inline' : 'none'}}>loading...</p>
            <p style={{display: isPending ? 'none' : 'inline'}}>result {analysis?.value}</p>
        </div>
    )
}