# Bill-Split

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main)

Easily upload a bill/receipt and split it between friends and family

TODO

1. Api
   1. Endpoint for manual item creation
   2. Add persistent storage for access pins
   3. Encode bill page url
   3. Get presigned url for uploading image directly to s3 from browser
2. UI
   1. Home page
      1. Check for 403 responses for each api request
   3. Bill page
      1. Add image magnifying glass or let users view a larger bill image to
         double-check the receipt.
3. CI/CD
   1. Automated deployment
