@echo off
REM Deploy Vite build output to gh-pages branch for GitHub Pages

REM 1. Build the project
npm run build

REM 2. Switch to orphan gh-pages branch
git checkout --orphan gh-pages

REM 3. Remove all files from the index
git reset --hard

REM 4. Copy build output to root
xcopy /E /I /Y dist\client\* .

REM 5. Add and commit
git add .
git commit -m "Deploy to GitHub Pages"

REM 6. Push to gh-pages branch
git push -f origin gh-pages

REM 7. Switch back to main branch
git checkout main

echo Deployment complete. Your site should be live on GitHub Pages.
