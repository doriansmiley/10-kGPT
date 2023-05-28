'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TickerForm() {
  const router = useRouter();
  const [ticker, setTicker] = useState<string>();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event?.target?.value as string;
    setTicker(value);
  }

  function handleSubmit(formData: FormData) {
    router.push(`/analyze/${ticker}`);
  }

  return (
    <form action={handleSubmit}>
      <input type='text' id='ticker' value={ticker} onChange={handleChange}/>
      <button type="submit">Submit</button>
    </form>
  )
}