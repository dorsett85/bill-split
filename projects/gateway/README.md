# Gateway

This application is responsible for the user interface and public api.

## Development

1. Start the app with `pnpm start`
   1. This will build and run the server, then watch for changes
   2. The contents of the public/ directory will also get moved to the build
      base directory where they can be referenced in the React code. For
      example:
      ```html
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      ```

### Adding Pages

The `src/client/pages` directory is setup to have a base (landing) directory, with
any level of nested directories. In each directory beginning with the base, there
will be 2 modules that our build requires:

1. `index.server.tsx`
   1. The full html page component that our server will render.
   2. When you've created a new page, make sure to add it to the routes list on the
      server.
2. `index.client.tsx`
   1. This will take the page component rendered by the server and Hydrate it with
      React interactivity.
   2. Our build automatically converts this to a static .js file that the browser
      will load when it requests a page.

A final nice to have component is one that will fill the `body` portion of the page
component, which can have the same or similar name to the directory. E.g., if the
directory is `/bill`, then the component could be `Bill.tsx`. These body components
can import additional components from `src/client/components`.
