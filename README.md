# 10-kGPT

IMPORTANT: this project is very early in development. Expect issues!!!

# Background
I started this aas a TypeScript app but I got a CORS block from the SEC.
So I moved it to Node. The script will scrape the SEC site for 10Q's for Palantir
then ask GPT to summerize and save the ouput to the `responses` directory.

It's important to note you can't just pass the entire filling or you will hit GPT token limits.
This is why I parse the tables from the page HTML, which is the most dogshit HTML I have ever seen.

# Help Wanted
I want to parse more tables from the 10-Q. I'd also like to extend to 10-Ks which are more complicated to parse.

It's important to note you can't just pass the entire filling or you will hit GPT token limits.

# Setup
`npm install`

# Run
`npm run start`

This will run `node node-index` and save responses to the `responses` directory. 

## Run for specific ticker
You can specify a company using `--ticker` option. In below example, replace `PLTR` with ticker of your choice.

`npm run start -- --ticker PLTR`
