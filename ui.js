/**
 * UI controller for LitReview AI
 * Handles all UI interactions and updates
 */

class UIController {
    constructor() {
        this.messageHistory = [];
        this.uploadedFiles = [];
        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * Initialize UI element references
     */
    initializeElements() {
        // Welcome screen elements
        this.welcomeContainer = document.getElementById('welcome-container');
        this.researchAreaInput = document.getElementById('research-area');
        this.researchQuestionInput = document.getElementById('research-question');
        this.startChatButton = document.getElementById('start-chat');
        this.uploadButton = document.getElementById('upload-btn');
        this.fileUploadInput = document.getElementById('file-upload');
        this.uploadedFilesContainer = document.getElementById('uploaded-files');
        
        // Chat interface elements
        this.chatContainer = document.getElementById('chat-container');
        this.messagesContainer = document.getElementById('messages');
        this.inputContainer = document.getElementById('input-container');
        this.messageInput = document.getElementById('message-input');
        this.sendMessageButton = document.getElementById('send-message');
        this.suggestionChips = document.getElementById('suggestion-chips');
        this.clearChatButton = document.getElementById('clear-chat');
        
        
        // Loading modal
        this.loadingModal = document.getElementById('loading-modal');
        this.loadingText = document.getElementById('loading-text');
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Welcome screen events
        this.startChatButton.addEventListener('click', () => this.startChat());
        this.uploadButton.addEventListener('click', () => this.fileUploadInput.click());
        this.fileUploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Chat interface events
        this.messageInput.addEventListener('input', (e) => {
            autoResizeTextarea(e.target);
            this.toggleSendButton();
        });
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.sendMessageButton.addEventListener('click', () => this.sendMessage());
        this.clearChatButton.addEventListener('click', () => this.clearChat());
        
        
        
        // Suggestion chips
        const suggestionChips = document.querySelectorAll('.suggestion-chip');
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.messageInput.value = chip.textContent;
                autoResizeTextarea(this.messageInput);
                this.toggleSendButton();
                this.messageInput.focus();
            });
        });
    }




    /**
     * Start chat - transition from welcome screen to chat interface
     */
    startChat() {
        const researchArea = this.researchAreaInput.value.trim();
        const researchQuestion = this.researchQuestionInput.value.trim();
        
        if (!researchArea && !researchQuestion && this.uploadedFiles.length === 0) {
            this.showNotification('Please provide research context or upload papers', 'error');
            return;
        }
        
        // Store research context
        localStorage.setItem('research_area', researchArea);
        localStorage.setItem('research_question', researchQuestion);
        
        // Hide welcome container and show chat interface
        this.welcomeContainer.classList.add('hidden');
        this.chatContainer.classList.remove('hidden');
        this.inputContainer.classList.remove('hidden');
        
        // Add welcome message
        this.addSystemMessage(this.generateWelcomeMessage(researchArea, researchQuestion));
        
        // Focus on input
        this.messageInput.focus();
    }

    /**
     * Generate welcome message based on research context
     */
    generateWelcomeMessage(researchArea, researchQuestion) {
        let message = "Hello! I'm LitReview AI, your literature review assistant. ";
        
        if (researchArea && researchQuestion) {
            message += `I'll help you with your research in <strong>${researchArea}</strong> focusing on the question: <strong>${researchQuestion}</strong>. `;
        } else if (researchArea) {
            message += `I'll help you with your research in <strong>${researchArea}</strong>. `;
        } else if (researchQuestion) {
            message += `I'll help you explore your research question: <strong>${researchQuestion}</strong>. `;
        }
        
        if (this.uploadedFiles.length > 0) {
            message += `I have analyzed ${this.uploadedFiles.length} paper(s) that you've uploaded. `;
        }
        
        message += "What would you like to know about these papers? You can ask me to summarize findings, compare methodologies, identify gaps, or ask specific questions about the content.";
        
        return message;
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(event) {
        const files = event.target.files;
        
        if (!files || files.length === 0) return;
        
        // Show loading modal
        this.loadingModal.classList.remove('hidden');
        this.loadingText.textContent = 'Processing your papers...';
        
        try {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              this.loadingText.textContent = `Processing ${file.name}...`;
              
              try {
                const paper = await apiService.processPDFFile(file);
                const index = apiService.addPaper(paper);
                this.addUploadedFile(paper, index);
                this.uploadedFiles.push(paper);
                
                // Show immediate feedback for patents
                this.showNotification(`Successfully processed ${file.name}`, 'success');
              } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                this.showNotification(
                  `Failed to process ${file.name}: ${error.message || 'Invalid PDF format'}`,
                  'error'
                );
              }
            }
          } finally {
            this.loadingModal.classList.add('hidden');
          }
        
        // Hide loading modal
        this.loadingModal.classList.add('hidden');
        
        // Reset file input
        this.fileUploadInput.value = '';
        
        // Show uploaded files container if there are files
        if (this.uploadedFiles.length > 0) {
            this.uploadedFilesContainer.classList.remove('hidden');
        }
    }

    /**
     * Add uploaded file to the UI
     */
    addUploadedFile(paper, index) {
        const fileElement = document.createElement('div');
        fileElement.className = 'flex items-center justify-between bg-gray-50 rounded-md p-2';
        fileElement.dataset.index = index;
        
        fileElement.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                </svg>
                <div>
                    <div class="text-sm font-medium">${sanitizeText(paper.filename)}</div>
                </div>
            </div>
            <button class="remove-file text-gray-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        
        // Add remove event listener
        const removeButton = fileElement.querySelector('.remove-file');
        removeButton.addEventListener('click', () => this.removeUploadedFile(index));
        
        // Add to container
        this.uploadedFilesContainer.appendChild(fileElement);
    }

    /**
     * Remove uploaded file
     */
    removeUploadedFile(index) {
        // Remove from API service
        apiService.removePaper(index);
        
        // Remove from UI
        const fileElements = this.uploadedFilesContainer.querySelectorAll('[data-index]');
        for (const element of fileElements) {
            if (parseInt(element.dataset.index) === index) {
                element.remove();
                break;
            }
        }
        
        // Remove from local list
        this.uploadedFiles = this.uploadedFiles.filter((_, i) => i !== index);
        
        // Hide container if no files
        if (this.uploadedFiles.length === 0) {
            this.uploadedFilesContainer.classList.add('hidden');
        }
    }

    /**
     * Send a message to the AI
     */
    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message) return;
        
        // Disable send button
        this.sendMessageButton.disabled = true;
        
        // Add user message to UI
        this.addUserMessage(message);
        
        // Clear input
        this.messageInput.value = '';
        autoResizeTextarea(this.messageInput);
        
        try {
            // Get current settings
            const apiKey = apiService.apiKey;
            
            if (!apiKey) {
                this.showNotification('Please set your API key in settings', 'error');
                this.sendMessageButton.disabled = false;
                return;
            }
            
            // Get research context
            const researchArea = localStorage.getItem('research_area') || '';
            const researchQuestion = localStorage.getItem('research_question') || '';
            
            // Create context object
            const context = {
                researchArea,
                researchQuestion,
                history: this.messageHistory.slice(-5)  // Include last 5 messages for context
            };
            
            // Send message to API
            const response = await apiService.sendMessage(message, context);
            
            // Add AI response to UI
            this.addAIMessage(response);
            
            // Add to message history
            this.messageHistory.push({
                user: message,
                assistant: response,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Error: ' + (error.message || 'Failed to get response'), 'error');
        } finally {
            // Enable send button
            this.sendMessageButton.disabled = false;
        }
    }

    /**
     * Add user message to the chat UI
     */
    addUserMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.className = 'flex items-start justify-end';
        
        msgElement.innerHTML = `
            <div class="bg-indigo-100 rounded-lg p-3 max-w-md ml-auto">
                <div class="text-gray-900">${sanitizeText(message).replace(/\n/g, '<br>')}</div>
                <div class="text-xs text-right mt-1 text-gray-500">${formatTimestamp(Date.now())}</div>
            </div>
        `;
        
        this.messagesContainer.appendChild(msgElement);
        this.scrollToBottom();
    }

    /**
     * Add AI message to the chat UI
     */
    addAIMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.className = 'flex items-start';
        
        msgElement.innerHTML = `
            <div class="flex-shrink-0 mr-2">
                <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a2 2 0 104 0 2 2 0 00-4 0z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
            <div class="bg-white rounded-lg p-3 shadow max-w-md">
                <div class="ai-response prose prose-sm">${markdownToHtml(message)}</div>
                <div class="text-xs mt-1 text-gray-500">${formatTimestamp(Date.now())}</div>
            </div>
        `;
        
        this.messagesContainer.appendChild(msgElement);
        this.scrollToBottom();
    }

    /**
     * Add system message to the chat UI
     */
    addSystemMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.className = 'flex items-start';
        
        msgElement.innerHTML = `
            <div class="flex-shrink-0 mr-2">
                <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a2 2 0 104 0 2 2 0 00-4 0z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
            <div class="bg-indigo-50 rounded-lg p-3 max-w-md">
                <div class="system-message">${message}</div>
            </div>
        `;
        
        this.messagesContainer.appendChild(msgElement);
        this.scrollToBottom();
    }

    /**
     * Scroll chat container to bottom
     */
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    /**
     * Toggle send button based on input content
     */
    toggleSendButton() {
        this.sendMessageButton.disabled = !this.messageInput.value.trim();
    }

    /**
     * Clear chat history
     */
    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            // Clear UI
            this.messagesContainer.innerHTML = '';
            
            // Clear message history
            this.messageHistory = [];
            
            // Show welcome screen again
            this.chatContainer.classList.add('hidden');
            this.inputContainer.classList.add('hidden');
            this.welcomeContainer.classList.remove('hidden');
            
            // Clear inputs
            this.messageInput.value = '';
            autoResizeTextarea(this.messageInput);
            
            // Show notification
            this.showNotification('Chat history cleared');
        }
    }

    /**
     * Show notification
     * @param {string} message - The notification message
     * @param {string} type - 'success' or 'error'
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
}