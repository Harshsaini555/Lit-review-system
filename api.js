/**
 * API service for LitReview AI
 * Handles all communication with the Gemini API
 */

class ApiService {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyCR7-Y_sXtpvCH-1BgstEmd8dUrBu6u-tY';
        this.model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
        this.temperature = parseFloat(localStorage.getItem('gemini_temperature') || '0.7');
        this.maxTokens = parseInt(localStorage.getItem('gemini_max_tokens') || '1024');
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.uploadedPapers = [];
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
    }

    setModel(model) {
        this.model = model;
        localStorage.setItem('gemini_model', model);
    }

    setTemperature(temp) {
        this.temperature = temp;
        localStorage.setItem('gemini_temperature', temp.toString());
    }

    setMaxTokens(tokens) {
        this.maxTokens = tokens;
        localStorage.setItem('gemini_max_tokens', tokens.toString());
    }

    /**
     * Add a paper to the context
     * @param {Object} paper - The paper object with metadata and content
     */
    addPaper(paper) {
        this.uploadedPapers.push(paper);
        return this.uploadedPapers.length - 1; // Return the index
    }

    /**
     * Remove a paper from the context
     * @param {number} index - The index of the paper to remove
     */
    removePaper(index) {
        if (index >= 0 && index < this.uploadedPapers.length) {
            this.uploadedPapers.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Send a message to the AI model
     * @param {string} message - The user's message
     * @param {Object} context - Additional context like research area and question
     * @returns {Promise} - Promise resolving to the AI response
     */
    async sendMessage(message, context = {}) {
        if (!this.apiKey) {
            throw new Error('API key is not set. Please configure your API key in settings.');
        }

        try {
            // Show loading state
            document.getElementById('loading-modal').classList.remove('hidden');
            document.getElementById('loading-text').textContent = 'Getting AI response...';

            // Construct the prompt with context
            let fullPrompt = this.constructPrompt(message, context);
            
            // Make API request
            const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: this.temperature,
                        maxOutputTokens: this.maxTokens,
                        topP: 0.9,
                        topK: 40
                    }
                })
            });

            const data = await response.json();
            
            // Hide loading state
            document.getElementById('loading-modal').classList.add('hidden');
            
            if (data.error) {
                throw new Error(`API Error: ${data.error.message}`);
            }
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const textResponse = data.candidates[0].content.parts[0].text;
                return textResponse;
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            // Hide loading state
            document.getElementById('loading-modal').classList.add('hidden');
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Construct a prompt with all available context
     * @param {string} message - The user's message
     * @param {Object} context - Additional context
     * @returns {string} - The full prompt
     */
    constructPrompt(message, context) {
        let prompt = 'You are an advanced document analysis assistant. Your task is to thoroughly analyze ALL provided documents and respond to user queries with accurate, detailed information.\n\n';
        
        if (context.researchArea) {
          prompt += `Research Area: ${context.researchArea}\n`;
        }
        
        // Special handling for patent documents
        const patents = this.uploadedPapers
        if (patents.length > 0) {
          prompt += "DOCUMENTS AVAILABLE FOR ANALYSIS:\n";
          patents.forEach((patent, i) => {
            prompt += `\npaper ${i+1}: ${patent.title}\n`;
            prompt += `Abstract: ${patent.abstract}\n`;
            
            // Include key sections for patents
            const fullText = patent.fullText;
            const sections = {
              description: this.extractSection(fullText),
              claims: this.extractSection(fullText, 'CLAIMS', 'ABSTRACT')
            };
            
            if (sections.description) {
              prompt += `Description: ${truncateText(sections.description, 1000)}\n`;
            }
          });
        }
        
        prompt += `\nUSER'S QUESTION: ${message}\n`;
        prompt += "RESPONSE REQUIREMENTS:\n";
        prompt += "1. firstly answer the user's question properly\n\n";
        prompt += "2. Analyze ALL relevant documents completely\n";
        prompt += "3. Identify and synthesize key information\n";
        prompt += "4. Structure response clearly with headings\n";
        
        return prompt;
      }
      
      extractSection(text, startMarker, endMarker) {
        const start = text.indexOf(startMarker);
        if (start === -1) return null;
        
        const end = endMarker ? text.indexOf(endMarker, start) : text.length;
        return text.substring(start + startMarker.length, end !== -1 ? end : text.length).trim();
      }
    
    /**
     * Extract text content from a PDF file
     * @param {File} file - The PDF file
     * @returns {Promise} - Promise resolving to the extracted text
     */
    async extractTextFromPDF(file) {
        console.log("Starting PDF extraction for:", file.name); // Debug log
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          console.log(`PDF loaded. Pages: ${pdf.numPages}`); // Debug log
      
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`Processing page ${i}`); // Debug log
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            console.log(`Page ${i} text length:`, pageText.length); // Debug log
            fullText += pageText + '\n';
          }
          
          console.log("Extracted text sample:", fullText.substring(0, 200)); // Debug first 200 chars
          return fullText;
        } catch (error) {
          console.error('PDF extraction error:', error);
          throw new Error(`Failed to extract text from ${file.name}`);
        }
      }
    
    /**
     * Process a PDF file to extract metadata and content
     * @param {File} file - The PDF file
     * @returns {Promise} - Promise resolving to a paper object
     */
    async processPDFFile(file) {
        try {
          const text = await this.extractTextFromPDF(file);
          
          // Extract basic metadata (simple regex examples)
          const titleMatch = text.match(/Title:(.*?)\n/) || 
                            text.match(/^(.*?)\n/);
          const authorMatch = text.match(/Author:(.*?)\n/);
          const yearMatch = text.match(/(19|20)\d{2}/);
      
          return {
            id: Date.now().toString(),
            title: titleMatch ? titleMatch[1].trim() : file.name.replace('.pdf', ''),
            authors: authorMatch ? authorMatch[1].trim() : 'Unknown Authors',
            year: yearMatch ? yearMatch[0] : 'N/A',
            abstract: text.substring(0, 300) + '...', // First 300 chars as abstract
            fullText: text,
            filename: file.name,
            size: file.size
          };
        } catch (error) {
          console.error('PDF processing error:', error);
          throw error;
        }
      }
}

// Create and export a single instance
const apiService = new ApiService();