# personal-chat-ui

## How to run


```bash

npm i

npm run dev

```


# Error on buidling

The error below happens because of the NODE_ENV=development var.
I production this shouldnt happen.

https://github.com/vercel/next.js/issues/56481

```bash
node ➜ /workspaces/ui (main) $ npm run build

> ui@0.1.0 build
> next build

 ⚠ You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env
   ▲ Next.js 15.3.3
   - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully in 4.0s
 ✓ Linting and checking validity of types    
   Collecting page data  ...✅ AI Service initialized with backend URL: http://ai:8010
 ✓ Collecting page data    
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
    at y (.next/server/chunks/548.js:6:1351)
Error occurred prerendering page "/404". Read more: https://nextjs.org/docs/messages/prerender-error
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
    at K (/workspaces/ui/node_modules/next/dist/compiled/next-server/pages.runtime.prod.js:16:6526)
    at y (/workspaces/ui/.next/server/chunks/548.js:6:1351)
    at react-stack-bottom-frame (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:9251:18)
    at renderWithHooks (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:4898:19)
    at renderElement (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:5333:23)
    at retryNode (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:6092:31)
    at renderNodeDestructive (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:6042:11)
    at renderElement (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:5319:11)
    at retryNode (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:6092:31)
    at renderNodeDestructive (/workspaces/ui/node_modules/react-dom/cjs/react-dom-server.edge.development.js:6042:11)
Export encountered an error on /_error: /404, exiting the build.
 ⨯ Next.js build worker exited with code: 1 and signal: null


``` 