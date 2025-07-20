# Tiation Portfolio

An enterprise-grade portfolio application built with Next.js, TypeScript, and Supabase.

![Portfolio Preview](./public/images/preview.png)

## 🌟 Features

- Dark neon theme with cyan/magenta gradients
- Mobile-first, responsive design
- TypeScript throughout
- Enterprise-grade security
- SaaS functionality with Stripe integration
- Comprehensive testing suite
- CI/CD pipeline with GitHub Actions
- Containerized deployment

## 🏗 Architecture

![Architecture Diagram](./docs/images/architecture.png)

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payment Processing**: Stripe
- **Deployment**: AWS ECS, Docker
- **CI/CD**: GitHub Actions

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- npm 10.x
- Docker (for containerized development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tiation/tiation-portfolio.git
   cd tiation-portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration values.

4. Run the development server:
   ```bash
   npm run dev
   ```

### Docker Development

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

## 🛡 Security Features

- CSP Headers
- Rate Limiting
- CSRF Protection
- XSS Prevention
- Input Validation
- Secure Session Management
- Error Boundary Implementation
- Comprehensive Error Logging

## 📦 Production Deployment

1. Build the production image:
   ```bash
   docker build -f Dockerfile.prod -t tiation-portfolio:prod .
   ```

2. Push to container registry:
   ```bash
   docker push your-registry/tiation-portfolio:prod
   ```

3. Deploy to AWS ECS:
   ```bash
   aws ecs update-service --cluster production --service tiation-portfolio --force-new-deployment
   ```

## 🔍 Code Quality

- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Jest testing framework
- GitHub Actions CI/CD

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🌟 Support

For support, email tiatheone@protonmail.com

# AI Remix Platform

A full-stack web application similar to Lovable.dev that includes a public project gallery, remixable projects, live previews, and a **Claude-powered AI edit/chat interface**. Self-hostable on Ubuntu VPS with user-provided Claude API keys.

![AI Remix Platform](https://img.shields.io/badge/AI-Powered-blue) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green) ![Claude AI](https://img.shields.io/badge/Claude-AI-orange)

## ✨ Features

### 🎨 **Public Gallery**
- Grid view of all public projects with title, tags, thumbnail, author
- **[Preview]** and **[Remix]** buttons for each project
- Filterable by tag or author
- Real-time project thumbnails via iframe previews

### 🔄 **Project Remix & Editor**
- Click **[Remix]** to clone any public project into your workspace
- Full-featured Monaco code editor with syntax highlighting
- Edit project metadata (title, description, tags, visibility)
- Live iframe preview panel
- Real-time code compilation and rendering

### 🤖 **Claude AI Edit Chat**
- Integrated chat panel next to code editor
- Send prompts like "Add a navigation bar" or "Make it responsive"
- Claude analyzes your code and returns updated versions
- Support for multiple Claude models (Haiku, Sonnet, Opus)
- Users add their own Claude API key (stored encrypted)
- AI interaction logging and history

### 👤 **Auth & User Projects**
- Supabase authentication (email + GitHub)
- Personal dashboard to manage your projects
- Public/private project visibility controls
- Fork tracking and remix history

### 🗄️ **Database Schema**
- **`users`**: profiles, encrypted Claude API keys, preferences
- **`projects`**: code storage, metadata, visibility settings
- **`ai_logs`**: Claude interaction history and analytics
- **`project_likes`**: social features with like counts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (via NVM recommended)
- Git
- A Supabase account
- (Optional) Claude API key from Anthropic

### 1. Clone Repository
```bash
git clone https://github.com/your-username/ai-remix-platform
cd ai-remix-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup
Apply the database migration to set up tables:
```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL from supabase/migrations/001_initial_schema.sql
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your AI Remix Platform!

## 📁 Project Structure

```
/ai-remix-platform
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Public gallery homepage
│   │   ├── remix/[id]/        # Project editor page
│   │   ├── dashboard/         # User project management
│   │   └── api/               # API routes
│   │       └── claude/        # Claude AI integration
│   ├── components/
│   │   ├── CodeEditor.tsx     # Monaco editor wrapper
│   │   ├── ClaudeChat.tsx     # AI chat interface
│   │   └── ProjectCard.tsx    # Gallery project cards
│   ├── lib/
│   │   └── supabase.ts        # Database client & utilities
│   └── types/
│       └── supabase.ts        # TypeScript definitions
├── supabase/
│   └── migrations/            # Database schema
├── scripts/
│   └── setup-vps.sh          # Ubuntu server setup
└── public/                   # Static assets
```

## 🤖 Claude AI Integration

### How It Works
1. Users add their Claude API key in settings (encrypted in database)
2. Chat interface sends user prompt + current code to `/api/claude/edit`
3. Backend calls Claude API with structured prompt
4. Claude returns modified code + explanation
5. Frontend updates editor with new code
6. All interactions logged for analytics

### Supported Models
- `claude-3-haiku-20241022` - Fast, cost-effective
- `claude-3-5-sonnet-20241022` - Balanced performance
- `claude-3-opus-20240229` - Most capable

### Example Prompts
- "Add a dark mode toggle"
- "Make this responsive for mobile"
- "Add a contact form with validation"
- "Convert this to use CSS Grid"
- "Fix any accessibility issues"

## 🌐 Ubuntu VPS Deployment

### Automated Setup
Run the included setup script on a fresh Ubuntu 20.04/22.04 server:

```bash
chmod +x scripts/setup-vps.sh
./scripts/setup-vps.sh
```

This installs:
- Node.js (via NVM)
- PM2 process manager
- Nginx reverse proxy
- SSL certificates (Certbot)
- Firewall configuration
- Automated backups

### Manual Deployment Steps
1. **Clone repository to VPS:**
   ```bash
   cd /var/www/ai-remix-platform
   git clone https://github.com/your-username/ai-remix-platform .
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.production
   # Edit with production values
   ```

3. **Build and start:**
   ```bash
   npm ci --production
   npm run build
   pm2 start ecosystem.config.js
   pm2 save
   ```

4. **Setup SSL:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## 🔐 Security Features

- Row-level security (RLS) in Supabase
- Encrypted Claude API key storage
- CORS protection
- Rate limiting on AI endpoints
- Input sanitization
- Secure iframe sandboxing for previews

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS |
| **Editor** | Monaco Editor |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **AI** | Claude API (Anthropic) |
| **Deployment** | Ubuntu VPS, Nginx, PM2 |
| **SSL** | Let's Encrypt (Certbot) |

## 📊 Usage Examples

### Creating a New Project
1. Sign in with email or GitHub
2. Click **"Create New"** in header
3. Start with default HTML template
4. Use Claude AI to build features: *"Create a landing page for a coffee shop"*
5. Preview live results in right panel
6. Save and publish to gallery

### Remixing Existing Projects
1. Browse public gallery
2. Click **"Remix"** on any project
3. Code loads in editor
4. Ask Claude to modify: *"Add animations to this portfolio"*
5. Remix becomes your own project

### Claude AI Assistance
```
User: "Add a responsive navigation menu"
Claude: *analyzes current HTML/CSS and returns updated code with mobile-friendly nav*

User: "Make this accessible"
Claude: *adds ARIA labels, keyboard navigation, and semantic HTML*

User: "Convert to a dark theme"
Claude: *updates CSS variables and color scheme*
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/your-username/ai-remix-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/ai-remix-platform/discussions)

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [Supabase](https://supabase.com) for backend infrastructure
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- [Lovable.dev](https://lovable.dev) for inspiration

---

**Built with ❤️ and powered by Claude AI**