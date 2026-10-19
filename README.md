# Built on Chai. Powered by Code. — 3D street portfolio

React + Vite + React Three Fiber + Drei + Framer Motion. Five supplied GLBs (`public/models`) live in one Jaipur street;
click an object → camera flies in → five planets orbit it → pick one to read its content.

    npm install
    npm run dev       # develop
    npm run build     # production build in dist/

## Add your real details
Everything the site says lives in `src/portfolioData.js`. Empty fields are hidden (no fake links, no placeholder claims):
- `profile.contact` — email, LinkedIn, GitHub, Instagram, resume. Each one you fill in appears as a planet on the **street lamp** (resume: put the PDF in `public/` and use `/resume.pdf`).
- Project `github`, `live`, `stack`, `results`, `screenshots` fields, Experience > Internships, Achievements timeline.

## Controls
Click an object (or the numbered pins / bottom chips) · scroll, drag, swipe or ←/→ to rotate the orbit · Enter or click to open ·
Esc steps back · "Back to Street" always available. Respects `prefers-reduced-motion`; falls back to an accessible list without WebGL.

Scene layout (positions, camera angles, orbit sizes) is in `src/sceneLayout.js`.
