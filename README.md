# ZenTok

A modern, minimalist web application that displays inspirational quotes from ZenQuotes API in a TikTok-style interface.

## Overview

ZenTok is a web-based application that fetches and displays inspirational quotes from the ZenQuotes API. It provides a clean, distraction-free interface for users to read and reflect on meaningful quotes, presented in a vertical scrolling format similar to TikTok.

## Features

- Clean, minimalist user interface
- Random inspirational quotes
- Author attribution
- Distraction-free reading experience
- Modern and responsive design
- SVG-based assets for crisp visuals
- Infinite scrolling functionality
- Dynamic color generation for each quote
- Automatic contrast adjustment for text readability
- TikTok-style vertical scrolling interface
- About modal with project information
- Mobile-responsive design

## Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- SVG for graphics
- ZenQuotes API for quote data
- CORS proxy (api.allorigins.win) for API requests

## API Integration

ZenTok uses the [ZenQuotes API](https://zenquotes.io/) to fetch inspirational quotes. The API provides:
- Random quotes
- Paginated quote retrieval
- Author attribution
- No API key required for basic usage

For more details about the API, visit the [ZenQuotes Documentation](https://docs.zenquotes.io/zenquotes-documentation/).

### CORS Handling
The application uses [api.allorigins.win](https://allorigins.win/) as a CORS proxy to handle cross-origin requests to the ZenQuotes API. This ensures reliable quote fetching across different browsers and environments.

## Project Structure

```
ZenTok/
├── css/           # Stylesheets
│   └── styles.css # Main stylesheet
├── js/            # JavaScript files
│   └── main.js    # Main application logic
├── index.html     # Main HTML file
├── favicon.svg    # Browser favicon
└── meta-image.svg # Social media preview image
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/amitsarkar007/ZenTok.git
```

2. Open `index.html` in your web browser to view the project.

## Development

The project uses vanilla JavaScript and CSS without any build tools or dependencies. Simply edit the files in the respective directories:
- `js/main.js` for application logic
- `css/styles.css` for styling
- `index.html` for structure and content

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by [Amit Sarkar](https://x.com/amit_sarkar007) 