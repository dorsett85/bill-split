# Bill-Split

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main)

Easily upload a bill/receipt and split it between friends and family

TODO

1. Api
   1. For adding participants, create a new topic that just sends the new
      participant for SSE. Right now we're recalculating the whole bill.
   2. Catch handled errors in the backend and set those as the error message.
   3. Encode bill page url
   4. On bill status polling, call the api on refetching errors and set the
      status to 'error'. In addition, provide a mechanism to retry the image
      analysis.
   5. In the change pub/sub, add a property that indicates what the change was
      so the UI can present a notification.
   6. Add test for new db methods (e.g., updateBySearch)
2. UI
   1. Home page
   2. Bill page
      1. Show loading indicator when line item is claimed/unclaimed
3. CI/CD
   1. Automated deployment
