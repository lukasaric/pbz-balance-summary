# PBZ-balance-inferer

## :page_with_curl: Dependencies

- Node.js (>= 8.11.0)
- npm (>= 5.8.0)

Check `engines` field in [`package.json`](package.json)

## :computer: Installation

### Prerequisites

- [Node.js & npm](https://nodejs.org/en/download/)
- [Serverless](https://www.serverless.com/framework/docs/getting-started/)
- Clone this repo

### Setup

- Run `npm install` in the repo directory
- App is configured via environment variables contained in a file named `.env`.
  Use the `.env.example` file as a template: `cp .env.example .env` and enter configuration details.
- For other scripts run `npm run`

## :rocket: Launch

### Development

- Invoke lambda function locally by running `npm run invoke:seed`

### Lambda deployment

- `serverless deploy` or with shorthand `sls deploy`
