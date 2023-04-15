interface Filing {
  form: string;
  filingDate: string;
  accessionNumber: string;
  primaryDocument: string;
}

export async function extract10Qand10KUrls(
  edgarUrl: string
): Promise<{ q10Url?: string[]; k10Url?: string[] }> {
  const response = await fetch(edgarUrl);
  const data = await response.json();

  const filings = data?.filings?.recent ?? {};
  const q10Url: string[] = [];
  const k10Url: string[] = [];

  filings?.form?.forEach((f: string, index) => {
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

export async function fetch10qs(reportTypes: string[], q10Urls: string[]) {
  const reports: string[] = [];
  console.log(reportTypes);
  q10Urls.forEach(async (url) => {
    console.log(url);
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    reportTypes.forEach(async (reportType) => {
      console.log(reportType);
      const report = doc.querySelector(`a[href*='${reportType}']`);
      if (report) {
        const reportUrl = report.getAttribute('href');
        const reportResponse = await fetch(`https://www.sec.gov${reportUrl}`);
        const reportHtml = await reportResponse.text();
        reports.push(reportHtml);
      }
    });
  });

  return reports;
}

async function main() {
  const edgarUrl = 'https://data.sec.gov/submissions/CIK0001321655.json';

  // Write TypeScript code!
  const appDiv: HTMLElement = document.getElementById('app');
  appDiv.innerHTML = `<h1>TypeScript Starter</h1>`;

  const { q10Url, k10Url } = await extract10Qand10KUrls(edgarUrl);

  appDiv.innerHTML += `<ul>`;
  console.log(`10-Q URL: ${q10Url}`);
  console.log(`10-K URL: ${k10Url}`);
  q10Url.forEach((url) => {
    appDiv.innerHTML += `<li><a href="${url}">10-Q URL: ${url}</a></li>`;
  });
  k10Url.forEach((url) => {
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
      q10Url
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
