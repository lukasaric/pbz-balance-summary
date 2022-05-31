# PBZ-balance-summary

## :page_with_curl: Dependencies

- Node.js (>= 8.11.0)
- npm (>= 5.8.0)

Check `engines` field in [`package.json`](package.json)

## :computer: Installation

### Prerequisites

- [Node.js & npm](https://nodejs.org/en/download/)
- [Serverless](https://www.serverless.com/framework/docs/getting-started/)
- Clone this repo

## Repo setup

- Run `npm install` in the repo directory
- App is configured via environment variables contained in a file named `.env`.
  Use the `.env.example` file as a template: `cp .env.example .env` and enter configuration details.
- For other scripts run `npm run`

## Amazon

- SES [docs](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/Welcome.html)
- SNS [docs](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- Lambda [docs](https://docs.aws.amazon.com/lambda/index.html)

### Prerequisites:
  - Verify domain & email
  - Create SNS topic & after lambda deployment, add SNS topic as lambda trigger.
  - Adjust configuration sets (set SNS topic for `delivery`)
  - Create S3 bucket, and allow SES actions in bucket [policy](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/receiving-email-permissions.html) (Be sure to add `Get`, `Put`, `Delete` & `List` bucket actions)
  - Create `mail receiving rule sets`(First rule is `S3` bucket, second is `lambda`)
  - After lambda deployment, go to IAM console, create role with `AWSLambdaFullAccess` & `AmazonSESFullAccess` permissions
  - Important: Copy role `arn` to `serverless.yml` config!

## :rocket: Launch

`IMPORTANT` :point_right: Be sure that S3 bucket is empty before sending any mails.

### Development

- Create `seed` folder
- Create `.json` file that represents AWS SES mocked event(mail receiving).
<br/>SES event example :point_down:

```javascript
{
  "Records": [
    {
      "EventSource": "aws:ses",
      "EventVersion": "1.0",
      "ses": {
        "mail": {
           "timestamp": "2020-09-30T06:13:48.251Z",
           "source": "<allowed_source_email_address>",
           "messageId": "<incoming_message_id>",
           "headersTruncated": false
        },
        "receipt":{
           "timestamp": "2020-09-30T06:13:48.251Z",
           "processingTimeMillis": 518
        }
     }
    }
  ]
}
```

- Invoke lambda function locally by running `npm run invoke:local <path>`

### Lambda deployment

- `serverless deploy` or with shorthand `sls deploy`
