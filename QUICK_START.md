# Quick Start Guide - Kiro System

## 🚨 Memory Issue Fixed!

The Next.js memory issue has been resolved. Here's how to start your application:

## Starting the Application

### Option 1: Use the Batch File (Easiest)
```bash
cd NovProject/frontend
start_dev.bat
```

### Option 2: Use npm (with memory fix)
```bash
cd NovProject/frontend
npm run dev
```
The memory limit is now automatically set in package.json.

### Option 3: Manual Command
```bash
cd NovProject/frontend
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

## What Was Fixed

1. **Increased Node.js memory limit** to 4GB in package.json
2. **Optimized Next.js webpack config** to reduce memory usage
3. **Created start_dev.bat** for easy startup

## Full Startup Sequence

### 1. Start Backend (Terminal 1)
```bash
cd NovProject/backend
python app.py
```

### 2. Start Frontend (Terminal 2)
```bash
cd NovProject/frontend
start_dev.bat
```

### 3. Open Browser
Navigate to: http://localhost:3000

## Testing Kiro System

Once the app is running, you can test the Kiro components:

1. **Navigate to your learning page** (wherever you integrate Kiro)
2. **Allow camera access** when prompted
3. **Observe emotion detection** in real-time
4. **Wait for interventions** based on your emotional state

## Troubleshooting

### Still Getting Memory Errors?

1. **Close other applications** to free up RAM
2. **Increase memory further**:
   ```bash
   set NODE_OPTIONS=--max-old-space-size=8192
   npm run dev
   ```

3. **Clear cache**:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run dev
   ```

### Backend Not Connecting?

- Ensure Python backend is running on port 5000
- Check `http://localhost:5000/api/health`

### Camera Not Working?

- Ensure you're using HTTPS or localhost
- Check browser permissions
- Try a different browser

## Next Steps

1. ✅ Start the application
2. ✅ Test basic functionality
3. ✅ Integrate Kiro into your learning pages
4. ✅ Customize intervention messages
5. ✅ Deploy to production

## Documentation

- **Integration Guide**: `KIRO_INTEGRATION_GUIDE.md`
- **Implementation Details**: `KIRO_IMPLEMENTATION_COMPLETE.md`
- **Deployment**: `KIRO_DEPLOYMENT_CHECKLIST.md`
- **Memory Fix Details**: `MEMORY_FIX.md`

## Support

If you encounter issues:
1. Check the error message in the terminal
2. Review the documentation files
3. Check browser console for frontend errors
4. Verify backend is running and accessible

Happy coding! 🚀
