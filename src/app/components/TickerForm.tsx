'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TickerForm() {
  const router = useRouter();
  const [ticker, setTicker] = useState<string>();

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    //TODO handle auto complete with the SEC API
    // https://sec-api.io/docs/mapping-api/map-ticker-to-company-details
    const value = event?.target?.value as string;
    setTicker(value);
  }

  function handleSubmit(formData: FormData) {
    // TODO handle validation
    router.push(`/analyze/${ticker}`);
  }

  return (
    <form action={handleSubmit}>
      <input type='text' id='ticker' value={ticker} onChange={handleChange}/>
      <button type="submit">Submit</button>
    </form>
  )
}