# Bill-Split

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main)

Easily upload a bill/receipt and split it between friends and family

TODO

1. Api
   1. Send back recalculated bill for endpoints that call for recalculation
   2. Add dao tests (mock testing db)
   3. Lazy load classes
   4. Encode bill page url
2. UI
   1. Handle api error responses (only checking for 'data' property right now)
   2. Home page
   3. Bill page
      1. Show loading indicator when line item is claimed/unclaimed
3. CI/CD
   1. Automated deployment
