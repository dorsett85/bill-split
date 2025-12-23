# Bill-Split

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/HX6qXEAczo3W16Uo5yG8gK/Y8PRJZuSGrxN3KTQDZhh12/tree/main)

Easily upload a bill/receipt and split it between friends and family

TODO

1. Api
   1. Live updates
   2. Add bad request response to controllers (see patchAccessToken for example)
   2. Calculate what everyone owes on BE
   3. Delete or deactivate access tokens
   4. Encode bill page url
2. UI
   1. Home page
   2. Bill page
      1. Check for 403 responses for each api request
   3. Admin page
      1. Deactivate access token toggle
      2. Remove access token success notification
3. CI/CD
   1. Automated deployment
