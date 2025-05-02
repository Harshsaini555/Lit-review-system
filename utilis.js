/**
 * Utility functions for LitReview AI
 */

/**
 * Format a timestamp into a readable date/time
 * @param {number} timestamp - The timestamp in milliseconds
 * @returns {string} - Formatted date/time string
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Convert markdown to HTML
 * @param {string} markdown - The markdown text
 * @returns {string} - The HTML
 */
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // Replace markdown headings
    let html = markdown
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');
    
    // Replace markdown bold/italic
    html = html
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Replace markdown lists
    html = html
        .replace(/^\s*\n\* (.*)/gm, '<ul class="list-disc pl-5 my-2"><li>$1</li></ul>')
        .replace(/^\s*\n- (.*)/gm, '<ul class="list-disc pl-5 my-2"><li>$1</li></ul>');
    
    // Fix for lists (combine consecutive list items)
    html = html
        .replace(/<\/ul>\s*<ul class="list-disc pl-5 my-2">/g, '');
    
    // Replace markdown links
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-indigo-600 hover:underline" target="_blank">$1</a>');
    
    // Replace line breaks
    html = html.replace(/\n/gim, '<br>');
    
    return html;
}

/**
 * Sanitize text to prevent XSS
 * @param {string} text - The input text
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
}

/**
 * Generate a random ID
 * @returns {string} - Random ID
 */
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Debounce function to limit the rate at which a function is executed
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Auto-resize a textarea based on its content
 * @param {HTMLElement} textarea - The textarea element
 */
function autoResizeTextarea(textarea) {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set to scrollHeight to expand the textarea
    textarea.style.height = textarea.scrollHeight + 'px';
    
    // Limit max height
    const maxHeight = window.innerHeight * 0.3; // 30% of viewport height
    if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
}

/**
 * Format file size in a human-readable format
 * @param {number} bytes - The size in bytes
 * @returns {string} - Formatted size string
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text to a specified length
 * @param {string} text - The input text
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}

/**
 * Extract citation information in a standard format
 * @param {string} text - Text containing citation
 * @returns {Object} - Structured citation object
 */
function extractCitation(text) {
    // Very simple citation extraction - in a real app this would be more sophisticated
    const match = text.match(/\(([\w\s]+),\s*(\d{4})\)/);
    
    if (match) {
        return {
            author: match[1],
            year: match[2]
        };
    }
    
    return null;
}