# 10-kGPT

IMPORTANT: this project is very early in development. Expect issues!!!

# Background
I started this aas a TypeScript app but I got a CORS block from the SEC.
So I moved it to Node. The script will scrape the SEC site for 10Q's for Palantir
then ask GPT to summerize and save the ouput to the `responses` directory.

It's important to note you can't just pass the entire filling or you will hit GPT token limits.
This is why I parse the tables from the page HTML, which is the most dogshit HTML I have ever seen.

# Help Wanted
I'd like to: 
- Figure out how to deal with pages that contain a large number of toekns. Chunking the pages
- to stay under the limit will lose context. Maybe use langchain or haystack and a huggingface model?
Extend to 10-Ks which are more complicated to parse.
- Explore usage of https://sec-api.io/ so I don't need to parse HTML pages

The responses need to be improved as well. We need to track the URL of the 10-Q that the page comes from. Also, I have ssen the model outputing wierd lage numbers at the bootom of the page in some cases. This prompt may need improvement: `Indicate the page number using ${fileName}`. The unltimate goal is to audit the responses and rate them 0-7 for quality after a manual review of the 10-Q.

It's important to note you can't just pass the entire filling or you will hit GPT token limits.

# Setup
`npm install`

# Run
Create the pages directory. This is where pages are saved for research puposes. I ignore this directory since it will result in a large number of files. After creating the pages directory run `npm run start $TICKER` passing the ticker symbol of the ocmpany you want to analyze.

This will run `node node-index` passing the ticker symbok you specify and save responses to the `responses` directory. 