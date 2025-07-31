import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import admin setup utilities for browser console access
import './utils/adminSetup'
import './utils/cleanupAuth'
import './utils/simpleSetup'

createRoot(document.getElementById("root")!).render(<App />);
