# Loopy Frontend

> Interactive multi-language coding playground - Frontend Application

React-based frontend for the Loopy learning platform, providing an interactive coding environment with real-time execution and AI-powered feedback.

## 🚀 Features

- **Multi-Language Support**: JavaScript, Python, C++
- **Interactive Code Editor**: Syntax highlighting and auto-completion
- **Real-time Execution**: Instant code execution with virtual terminal
- **AI-Powered Feedback**: Get detailed feedback in Vietnamese
- **Progress Tracking**: Track your learning journey
- **Responsive Design**: Works on desktop and mobile

## 📋 Prerequisites

- Node.js 18+ (recommended: 20.x)
- npm 9+

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/your-org/loopy-frontend.git
cd loopy-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your backend API URL
```

## ⚙️ Configuration

Create a `.env.local` file in the root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Root component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Dependencies and scripts
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🎨 Code Quality

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📚 Documentation

### 📖 Complete Documentation Hub

See [**docs/README.md**](docs/README.md) for all documentation.

### 🔒 Security Documentation

- [Security and Bugs Report](docs/SECURITY_AND_BUGS_REPORT.md) - Comprehensive security audit
- [Critical Fix Complete](docs/CRITICAL_FIX_COMPLETE.md) - Cookie authentication implementation

### Related Backend Documentation

- [Backend Testing Guide](../loopy-backend/docs/QUICK_START_TESTING.md)
- [Token Security Migration](../loopy-backend/docs/TOKEN_SECURITY_MIGRATION.md)

## 🔗 Backend API

This frontend requires the Loopy Backend API to function properly.

**Backend Repository**: [loopy-backend](https://github.com/your-org/loopy-backend)

Make sure the backend is running before starting the frontend.

## 📦 Tech Stack

- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **Routing**: React Router DOM 6.x
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **Icons**: react-icons

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Manual Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the production build
# Upload to your hosting provider
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🐛 Bug Reports

If you find a bug, please open an issue on [GitHub Issues](https://github.com/your-org/loopy-frontend/issues).

## 📧 Contact

- **Email**: your-email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Vite](https://vitejs.dev/)

---

**Note**: This is the frontend application. For the complete platform, you also need the [backend API](https://github.com/your-org/loopy-backend).
