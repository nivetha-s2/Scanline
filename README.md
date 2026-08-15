# Scanline — Two-Layer Resume Check

## How it works
Scanline gives two clearly separate reports, so the AI's judgment is never confused with a real measurement:

1. **ATS Parse Check (deterministic)** — runs entirely in the browser, no AI involved. Regex-based: detects email/phone/links, standard section headers, and literal keyword overlap against a pasted job description. Same resume → same result, every time. This is what real ATS software actually does.
2. **Recruiter-Style Read (AI judgment)** — sent to Groq (Llama 3.3 70B) via the backend. Judges substance: is the experience convincing, specific, quantified. Labeled clearly as AI opinion, not a precise score, because it will vary between runs.

## What's in this folder
- `public/index.html` — the website (frontend + the deterministic parse layer)
- `api/scan.js` — the backend function that talks to Groq (AI layer only)
- `vercel.json` — tells Vercel how to serve the files

## Deploy steps (Vercel, free)

1. **Get a Groq API key**
   Go to https://console.groq.com/keys → create a key → copy it.

2. **Push this folder to GitHub**
   - Create a new repo on github.com (e.g. `scanline`)
   - In this folder, run:
     ```
     git init
     git add .
     git commit -m "Scanline resume scanner"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/scanline.git
     git push -u origin main
     ```

3. **Import into Vercel**
   - Go to https://vercel.com → sign in with GitHub
   - Click "Add New Project" → select your `scanline` repo → Import
   - Before deploying, add an Environment Variable:
     - Name: `GROQ_API_KEY`
     - Value: (paste the key from step 1)
   - Click Deploy

4. **You're live**
   Vercel gives you a URL like `scanline-yourname.vercel.app` — open it, paste a resume, click "Run scan". It should work end to end.

5. **Get it on Google**
   - Go to https://search.google.com/search-console
   - Add your Vercel URL as a property (use the URL prefix method — it auto-verifies since Vercel sets the right DNS/meta)
   - Submit the URL for indexing under "URL Inspection" → "Request Indexing"
   - Indexing usually takes a few days to 2 weeks

## Notes
- Never put the Groq key directly in `index.html` or `scan.js` — always use the Vercel environment variable. That's the whole point of the backend.
- Free Groq tier has rate limits; fine for personal/demo traffic, may need upgrading if this gets real usage.
