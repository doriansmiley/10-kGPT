# 10-kGPT

IMPORTANT: this project is very early in development. Expect issues!!!

# Background
I started this aas a TypeScript app but I got a CORS block from the SEC.
So I moved it to Node. The script will scrape the SEC site for 10Q's for Palantir
then ask GPT to summerize saavinv the ouput to the `responses` directory.

It's important to note you can't just pass the entire filling or you will hit GPT token limits.
This is why I parse the tables from the page HTMML, which is the most dogshit HTML I have ever seen.

# Help Wanted
I'd like to extend this beyond Palantir by looking up the ID values
in this URL `https://data.sec.gov/submissions/CIK0001321655.json` in the SEC database
by using the API in the EDGAR system. I also want to parse more tables from the 10-Q. I'd also like to extend to 10-Ks which are more complicated
to parse.

It's important to note you can't just pass the entire filling or you will hit GPT token limits.

# Setup
`npm install`

# Run
`npm run start`

This will run `node node-index` and save responses to the `responses` directory. 