# Development deployment

- GitHub: `Acefayad2/amg-practice-exam`, branch `main`.
- Existing Netlify site: `amg-exam-portal` (`40829c93-d6a6-4b8a-bbf7-c64e20d06701`).
- Course URL: https://amg-exam-portal.netlify.app/course/
- Course entry point: `public/course/index.html`; Vite copies it into `dist/course/index.html`.
- Home navigation: `src/components/HomeScreen.jsx`.
- Video and original source package remain hosted on Higgsfield. URLs are recorded in `lesson-06-manifest.json`; large MP4 files are not committed to Git.
- The course page carries a noindex directive while development continues. This is a public review page, not an access-controlled learning platform.

## Release procedure

1. Install locked dependencies with `npm ci`.
2. Build with `npm run build`.
3. Verify the course video, captions, chapter controls, and quiz feedback; confirm the existing exam center still loads.
4. Push the reviewed source changes to GitHub.
5. Deploy the built `dist` directory to the existing Netlify site and verify `/course/` on the returned URL.

Netlify currently uses manual deployments. A GitHub push alone does not update the public site; repeat the Netlify deploy step for each development release. The user authorized GitHub pushes and Netlify development releases in this conversation. No recurring automation was configured.

## Course status

One lesson is produced. Other planned lessons and full exam preparation functionality remain in development. The existing question bank has known review items in `source-audit.md`; this deployment does not claim to resolve them.
