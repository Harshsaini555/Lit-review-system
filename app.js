/**
 * Main application script for LitReview AI
 * Initializes and coordinates UI and API components
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI controller
    const ui = new UIController();
    
    // Initialize drag and drop for file uploads
    initDragAndDrop();

    // Add example suggestions dynamically
    addDynamicSuggestions();

    // Check for API key on startup
    checkApiKey();
});

/**
 * Initialize drag and drop functionality for file uploads
 */
function initDragAndDrop() {
    const dropZone = document.querySelector('.border-dashed');
    const fileInput = document.getElementById('file-upload');
    
    if (!dropZone || !fileInput) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    // Remove highlight when leaving drop zone
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('border-indigo-500');
        dropZone.classList.add('bg-indigo-50');
    }
    
    function unhighlight() {
        dropZone.classList.remove('border-indigo-500');
        dropZone.classList.remove('bg-indigo-50');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        // Trigger the file input change event
        if (files.length > 0) {
            // Create a new FileList-like object
            const dataTransfer = new DataTransfer();
            
            // Add files to dataTransfer object
            for (let i = 0; i < files.length; i++) {
                if (files[i].type === 'application/pdf') {
                    dataTransfer.items.add(files[i]);
                }
            }
            
            // Set files to file input and dispatch change event
            fileInput.files = dataTransfer.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    }
}

/**
 * Add dynamic suggestion chips based on context
 */
function addDynamicSuggestions() {
    const suggestionChipsContainer = document.getElementById('suggestion-chips');
    
    if (!suggestionChipsContainer) return;
    
    // Common literature review tasks
    const suggestions = [
        'Summarize main findings',
        'Find research gaps',
        'Compare methodologies',
        'Identify key authors',
        'What are the limitations?',
        'Extract theoretical frameworks',
        'Recent trends in this field',
        'Conflicting results across papers'
    ];
    
    // Clear existing suggestions
    suggestionChipsContainer.innerHTML = '';
    
    // Add random suggestions (5 max)
    const shuffled = suggestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    selected.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip text-xs whitespace-nowrap bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100';
        chip.textContent = suggestion;
        
        chip.addEventListener('click', () => {
            const messageInput = document.getElementById('message-input');
            messageInput.value = suggestion;
            autoResizeTextarea(messageInput);
            
            // Toggle send button
            const sendButton = document.getElementById('send-message');
            if (sendButton) sendButton.disabled = false;
            
            messageInput.focus();
        });
        
        suggestionChipsContainer.appendChild(chip);
    });
}

/**
 * Check if API key is set, prompt user if not
 */
function checkApiKey() {
    const apiKey = localStorage.getItem('gemini_api_key');
    
    if (!apiKey) {
        // Wait a moment for UI to initialize
        setTimeout(() => {
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) {
                settingsBtn.classList.add('animate-pulse');
                
                // Show tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'absolute -top-10 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap';
                tooltip.textContent = 'Set your API key';
                tooltip.style.zIndex = '50';
                
                // Add arrow
                const arrow = document.createElement('div');
                arrow.className = 'absolute h-2 w-2 bg-gray-800 transform rotate-45 -bottom-1 right-3';
                tooltip.appendChild(arrow);
                
                settingsBtn.parentNode.style.position = 'relative';
                settingsBtn.parentNode.appendChild(tooltip);
                
                // Remove after a few seconds
                setTimeout(() => {
                    settingsBtn.classList.remove('animate-pulse');
                    if (tooltip.parentNode === settingsBtn.parentNode) {
                        settingsBtn.parentNode.removeChild(tooltip);
                    }
                }, 5000);
            }
        }, 1000);
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    
    // Show error notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg bg-red-500 text-white max-w-xs';
    notification.textContent = 'An error occurred: ' + (e.error?.message || 'Unknown error');
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            if (notification.parentNode === document.body) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 5000);
});

// Add a simple CSS class for custom styles
const style = document.createElement('style');
style.textContent = `
    .prose h1, .prose h2, .prose h3 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
    }
    .prose p {
        margin-bottom: 0.75em;
    }
    .prose ul, .prose ol {
        margin-top: 0.5em;
        margin-bottom: 0.5em;
        padding-left: 1.5em;
    }
    .prose ul li {
        list-style-type: disc;
    }
    .ai-response a {
        color: #4f46e5;
        text-decoration: underline;
    }
    .suggestion-chip {
        transition: all 0.2s;
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .fade-in {
        animation: fadeIn 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);