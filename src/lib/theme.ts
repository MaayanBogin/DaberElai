// src/lib/theme.ts

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Define the type for our theme
type Theme = 'light' | 'dark';

// Function to get the initial theme
function getInitialTheme(): Theme {
    if (!browser) {
        return 'light'; // Default for server-side rendering
    }
    // 1. Check localStorage first
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
        return storedTheme;
    }
    // 2. If not in localStorage, check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    // 3. Default to light
    return 'light';
}

// Create the writable store
const initialTheme = getInitialTheme();
const theme = writable<Theme>(initialTheme);

// Subscribe to changes in the store to update the DOM and localStorage
theme.subscribe((value) => {
    if (browser) {
        // Apply/remove the 'dark' class to the root <html> element
        document.documentElement.classList.toggle('dark', value === 'dark');
        
        // Save the user's preference to localStorage
        localStorage.setItem('theme', value);
    }
});

export default theme;