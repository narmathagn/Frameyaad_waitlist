// Google Apps Script Web App URL (Replace this with your deployed URL)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8P3wrNsWpKTqaGZcFVGqN7HxTiE0VYZJ4grKJ-r5R_xAFQqgg0zUPIWcaKcp-tiYe/exec';

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const ctaBtn = document.getElementById('cta-btn');
    const form = document.getElementById('waitlist-form');
    const emailInput = document.getElementById('email-input');
    const submitBtn = document.getElementById('submit-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const successMsg = document.getElementById('success-msg');
    const errorMsg = document.getElementById('error-msg');
    const watcherCountEl = document.getElementById('watcher-count');

    // UI Logic: Reveal Form
    ctaBtn.addEventListener('click', () => {
        ctaBtn.classList.add('hidden');
        form.classList.remove('hidden');
        // Small delay to allow display:flex to apply before animating opacity/transform
        setTimeout(() => {
            form.classList.add('form-visible');
            emailInput.focus();
        }, 10);
    });

    // Real-time Email Validation
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email.length > 0) {
            if (!emailRegex.test(email)) {
                // Invalid state (Red border)
                emailInput.classList.add('border-red-500', 'focus:ring-red-500');
                emailInput.classList.remove('border-white/20', 'focus:ring-brand-gold', 'border-green-500', 'focus:ring-green-500');
            } else {
                // Valid state (Green border)
                emailInput.classList.add('border-green-500', 'focus:ring-green-500');
                emailInput.classList.remove('border-white/20', 'focus:ring-brand-gold', 'border-red-500', 'focus:ring-red-500');
            }
        } else {
            // Empty state (Reset to default)
            emailInput.classList.remove('border-red-500', 'focus:ring-red-500', 'border-green-500', 'focus:ring-green-500');
            emailInput.classList.add('border-white/20', 'focus:ring-brand-gold');
        }
        hideError(); // Clear any existing form error messages
    });

    // Form Submission Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        // Basic Client-Side Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        // Prepare UI for submission
        hideError();
        setLoadingState(true);

        try {
            // Using no-cors mode due to Apps Script CORS behavior
            // We pass the email as a URL parameter or form data. URL param is usually easiest for simple setups.
            const url = new URL(GOOGLE_SCRIPT_URL);
            url.searchParams.append('email', email);

            const response = await fetch(url.toString(), {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}`
            });

            // Since mode is no-cors, we can't read the response reliably. 
            // We assume success if the fetch didn't throw a network error.
            showSuccess();
            incrementCount();
        } catch (error) {
            console.error('Submission error:', error);
            showError('Something went wrong. Please try again.');
        } finally {
            setLoadingState(false);
        }
    });

    // Helper Functions
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            emailInput.disabled = true;
            submitBtn.querySelector('span').classList.add('opacity-0'); // Hide text
            loadingSpinner.classList.remove('hidden'); // Show spinner
        } else {
            submitBtn.disabled = false;
            emailInput.disabled = false;
            submitBtn.querySelector('span').classList.remove('opacity-0');
            loadingSpinner.classList.add('hidden');
        }
    }

    function showSuccess() {
        form.classList.remove('form-visible');
        setTimeout(() => {
            form.classList.add('hidden');
            successMsg.classList.remove('hidden');
        }, 500); // Wait for transition
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function hideError() {
        errorMsg.classList.add('hidden');
    }

    let currentWatchers = 0;

    // Fetch initial count from Google Sheet
    async function fetchWaitlistCount() {
        try {
            // Append a parameter to let the script know we want the count
            const url = new URL(GOOGLE_SCRIPT_URL);
            url.searchParams.append('action', 'getCount');

            const response = await fetch(url.toString(), {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.count !== undefined) {
                    currentWatchers = parseInt(data.count, 10);
                    watcherCountEl.textContent = currentWatchers;
                }
            }
        } catch (error) {
            console.error('Failed to fetch waitlist count:', error);
            // Fallback gracefully if fetch fails
            currentWatchers = 0;
            watcherCountEl.textContent = currentWatchers;
        }
    }

    function incrementCount() {
        currentWatchers += 1;

        // Animate the number change
        watcherCountEl.style.transform = 'scale(1.2)';
        watcherCountEl.style.color = '#fff';

        setTimeout(() => {
            watcherCountEl.textContent = currentWatchers;
            watcherCountEl.style.transform = 'scale(1)';
            watcherCountEl.style.color = ''; // Revert to class color
        }, 150);
    }

    // Call it on load
    if (GOOGLE_SCRIPT_URL) {
        fetchWaitlistCount();
    } else {
        currentWatchers = 0;
        watcherCountEl.textContent = currentWatchers;
    }
});
