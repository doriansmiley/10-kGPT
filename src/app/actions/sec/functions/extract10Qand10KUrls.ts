const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const debug = require('debug')('10k');

export default async function extract10Qand10KUrls(cik: string) {
    debug(`extract10Qand10KUrls called with cik ${cik}`);
    const query = {
      query: {
        query_string: {
          query: `ticker:(${cik}) AND formType:(10-Q OR 10-K)`
        }
      },
      from: "0",
      size: "20",
      sort: [{ filedAt: { order: "desc" } }]
    };
  
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SEC_API_KEY}`
    };
    debug(process.env.SEC_API_ENDPOINT);
    debug(process.env.SEC_API_KEY);
    debug({
      method: 'POST',
      headers,
      body: JSON.stringify(query)
    })
    const response = await fetch(`${process.env.SEC_API_ENDPOINT}?token=${process.env.SEC_API_KEY}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(query)
    });
  
    const data = await response.json();
    const filings = data?.filings ?? [];
    const q10Url: string[] = [];
    const k10Url: string[] = [];
  
    debug(filings.length)
    filings.forEach((f: Partial<{linkToFilingDetails: string, formType: string}>) => {
      if (f.formType === '10-Q') {
        q10Url.push(f.linkToFilingDetails!);
      }
      if (f.formType === '10-K') {
        k10Url.push(f.linkToFilingDetails!);
      }
    });
  
    return { q10Url, k10Url };
  }