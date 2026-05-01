# Widget Deployment Fix

## 🔧 Problem

Widget files (`widget.js` and `widget.css`) were returning 404 on deployed sites because:
1. The main app build was clearing the `dist/` folder
2. Widget files weren't being copied back to `dist/` after the main build

## ✅ Solution

Updated the build process to:
1. Build widget files → `dist/widget.js`, `dist/widget.css`
2. Copy to `public/` → for dev server access
3. Build main app → clears and rebuilds `dist/`
4. **Copy widget files from `public/` back to `dist/`** ← This was the missing step!

## 📝 Build Process (package.json:8)

```bash
npm run build
```

Now runs in this order:
1. `build:widget-only` - Builds widget to dist/
2. `copy:widget` - Copies widget from dist/ to public/ (for dev)
3. `vite build` - Builds main app (clears dist/)
4. `copy:widget-to-dist` - Copies widget from public/ back to dist/

## ✅ Verification

After building, `dist/` folder contains:
```
dist/
├── index.html
├── widget.js          ← Widget script
├── widget.css         ← Widget styles
├── widget-embed.html  ← Embed example
├── _headers           ← CORS configuration
├── _redirects         ← Routing rules
└── assets/
    ├── index-*.js
    └── index-*.css
```

## 🚀 Deploy to Lovable

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "Fix widget deployment - ensure files in dist"
   git push
   ```

2. **Lovable auto-deploys** when you push to main branch

3. **Verify deployment**:
   - Visit `https://preview--goap-ui.lovable.app/widget.js`
   - Visit `https://preview--goap-ui.lovable.app/widget.css`
   - Visit `https://preview--goap-ui.lovable.app/demo`
   - Visit `https://preview--goap-ui.lovable.app/widget-embed.html`

## 🧪 Local Testing

Test the full build process locally:

```bash
# Clean build
rm -rf dist/
npm run build

# Verify widget files exist
ls -l dist/ | grep widget

# Preview locally
npm run preview
# Visit http://localhost:4173/demo
```

## 📂 Files Changed

1. **package.json** - Updated build script
2. **public/_redirects** - Added to prevent SPA routing from catching widget files
3. **public/_headers** - CORS headers for cross-domain embedding
4. **.gitignore** - Fixed to ignore dist/ folder
5. **vite.config.ts** - Added browser globals for widget build

## 🔍 Troubleshooting

### Still getting 404?

1. **Check build logs**:
   - Ensure all 4 build steps complete
   - Look for "cp public/widget.js dist/" in logs

2. **Verify files exist locally**:
   ```bash
   ls -lh dist/ | grep widget
   ```

3. **Check deployed files**:
   - View Lovable deployment logs
   - Verify widget files were uploaded

4. **Clear cache**:
   - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Check in incognito/private window

### Widget loads locally but not on deployment?

This usually means the files aren't being uploaded. Check:
- Build logs show successful widget copy
- Deployment platform includes all dist/ files
- _redirects file is working correctly

## 📊 File Sizes

After build:
- `widget.js`: ~595KB (177KB gzipped)
- `widget.css`: ~65KB (11.5KB gzipped)
- `index.js`: ~668KB (195KB gzipped)

## 🎯 Next Steps

1. Push changes to trigger deployment
2. Wait for Lovable build to complete
3. Test widget on deployed site
4. Share widget URL with others to test cross-domain embedding

## 💡 Tips

- **Dev server**: Widget files are served from `public/` folder
- **Production build**: Widget files are in `dist/` folder
- **Both needed**: Files must be in both locations for dev and prod to work

## ℹ️ Why This Approach?

We use this multi-step process because:
1. Vite clears `dist/` when building the main app
2. We need widget files in `public/` for dev server
3. We need widget files in `dist/` for production
4. Copying after main build ensures they're included in deployment
