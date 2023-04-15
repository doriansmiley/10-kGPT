interface Filing {
  form: string;
  filingDate: string;
  accessionNumber: string;
  primaryDocument: string;
}

async function extract10Qand10KUrls(
  edgarUrl: string
): Promise<{ q10Url?: string[]; k10Url?: string[] }> {
  const response = await fetch(edgarUrl);
  const data = await response.json();

  const filings = data?.filings?.recent ?? {};
  const q10Url: string[] = [];
  const k10Url: string[] = [];

  filings?.form?.forEach((f: string, index: number) => {
    if (f === '10-Q') {
      const accessionNumber = filings.accessionNumber[index].replace(/-/g, '');
      q10Url.push(
        `https://www.sec.gov/Archives/edgar/data/${data.cik}/${accessionNumber}/${filings.primaryDocument[index]}`
      );
    }
    if (f === '10-K') {
      const accessionNumber = filings.accessionNumber[index].replace(/-/g, '');
      k10Url.push(
        `https://www.sec.gov/Archives/edgar/data/${data.cik}/${accessionNumber}/${filings.primaryDocument[index]}`
      );
    }
  });

  return { q10Url, k10Url };
}

async function fetch10qs(reportTypes: string[], q10Urls: string[]) {
  const reports: string[] = [];
  console.log(reportTypes);

  q10Urls.forEach(async (url) => {
    console.log(url);
    const response = await fetch(url, { mode: 'no-cors' });
    const html = await response.text();
    console.log(response)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    reportTypes.forEach(async (reportType) => {
      const headings = doc.querySelectorAll('a');
      console.log(headings);
      const report = [...headings].find((a) => a.textContent?.includes(reportType));
      console.log(report);
      if (report) {
        const reportUrl = report.getAttribute('href');
        const reportResponse = await fetch(`https://www.sec.gov${reportUrl}`);
        const reportHtml = await reportResponse.text();
        console.log(reportHtml.length);
        reports.push(reportHtml);
      }
    });
  });
  return reports;
}



async function main() {
  const edgarUrl = 'https://data.sec.gov/submissions/CIK0001321655.json';

  // Write TypeScript code!
  const appDiv: HTMLElement = document.getElementById('app') as HTMLElement;
  appDiv.innerHTML = `<h1>TypeScript Starter</h1>`;

  const { q10Url, k10Url } = await extract10Qand10KUrls(edgarUrl);

  appDiv.innerHTML += `<ul>`;
  console.log(`10-Q URL: ${q10Url}`);
  console.log(`10-K URL: ${k10Url}`);
  q10Url?.forEach((url) => {
    appDiv.innerHTML += `<li><a href="${url}">10-Q URL: ${url}</a></li>`;
  });
  k10Url?.forEach((url) => {
    appDiv.innerHTML += `<li><a href="${url}">10-K URL: ${url}</a></li>`;
  });
  appDiv.innerHTML += `</ul>`;
  try {
    const reports = await fetch10qs(
      [
        'Financial Statements (Unaudited)',
        'Condensed Consolidated Balance Sheets',
        'Condensed Consolidated Statements of Operations',
        'Condensed Consolidated Statements of Comprehensive Loss',
        'Condensed Consolidated Statements of Stockholders’ Equity',
        'Condensed Consolidated Statements of Cash Flows',
      ],
      q10Url || []
    );

    appDiv.innerHTML += `<ul>`;
    console.log(reports);
    reports.forEach((report) => {
      appDiv.innerHTML += `<li>${report.length}: length ${report.length}</li>`;
    });
    appDiv.innerHTML += `</ul>`;
  } catch (e) {
    console.log(e);
  }
}
main();
