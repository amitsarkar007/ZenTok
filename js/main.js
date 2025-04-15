class QuoteManager {
    constructor() {
        this.quotesContainer = document.getElementById('quotes-container');
        this.loadingElement = document.getElementById('loading');
        this.quotes = [];
        this.isLoading = false;
        // Initialize with a random page between 1 and 3000
        this.currentPage = Math.floor(Math.random() * 3000) + 1;
        this.hasReachedEnd = false;
        
        this.init();
    }

    async init() {
        await this.loadQuotes();
        this.setupInfiniteScroll();
    }

    async loadQuotes() {
        if (this.isLoading || this.hasReachedEnd) return;
        
        this.isLoading = true;
        this.loadingElement.classList.add('active');

        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const targetUrl = encodeURIComponent(`https://zenquotes.io/api/quotes?page=${this.currentPage}`);
            
            const response = await fetch(proxyUrl + targetUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            const newQuotes = await response.json();
            
            if (newQuotes.length === 0) {
                this.hasReachedEnd = true;
                this.loadingElement.textContent = 'No more quotes available';
                return;
            }

            this.quotes = [...this.quotes, ...newQuotes];
            this.renderQuotes(newQuotes);
            this.currentPage++;
        } catch (error) {
            console.error('Error loading quotes:', error);
            this.loadingElement.textContent = 'Error loading quotes. Please try again later.';
            // If there's an error, try a different random page between 1 and 3000
            this.currentPage = Math.floor(Math.random() * 3000) + 1;
        } finally {
            this.isLoading = false;
            this.loadingElement.classList.remove('active');
        }
    }

    renderQuotes(quotes) {
        quotes.forEach(quote => {
            const quoteCard = document.createElement('div');
            quoteCard.className = 'quote-card';
            
            // Generate random background color
            const bgColor = this.getRandomColor();
            quoteCard.style.backgroundColor = bgColor;
            
            // Ensure text color has sufficient contrast
            const textColor = this.getContrastColor(bgColor);
            quoteCard.style.color = textColor;

            quoteCard.innerHTML = `
                <div class="quote-text">${quote.q}</div>
                <div class="quote-author">- ${quote.a}</div>
            `;

            this.quotesContainer.appendChild(quoteCard);
        });
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    getContrastColor(hexcolor) {
        // Convert hex to RGB
        const r = parseInt(hexcolor.substr(1,2), 16);
        const g = parseInt(hexcolor.substr(3,2), 16);
        const b = parseInt(hexcolor.substr(5,2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return white for dark backgrounds, black for light backgrounds
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    setupInfiniteScroll() {
        window.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            // Load more quotes when user is near the bottom
            if (scrollHeight - scrollTop - clientHeight < 100) {
                this.loadQuotes();
            }
        });
    }
}

// About Modal Functionality
class AboutModal {
    constructor() {
        this.aboutButton = document.getElementById('about-button');
        this.aboutModal = document.getElementById('about-modal');
        this.closeButton = document.getElementById('close-about');
        
        this.init();
    }

    init() {
        this.aboutButton.addEventListener('click', () => this.openModal());
        this.closeButton.addEventListener('click', () => this.closeModal());
        this.aboutModal.addEventListener('click', (e) => {
            if (e.target === this.aboutModal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.aboutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.aboutModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize the quote manager and about modal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuoteManager();
    new AboutModal();
}); 