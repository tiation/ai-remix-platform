# Contributing to Tiation Portfolio

First off, thank you for considering contributing to Tiation Portfolio! It's people like you that make this platform an amazing tool for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Process](#development-process)
- [Getting Started](#getting-started)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community and Connection](#community-and-connection)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to tiatheone@protonmail.com.

### Our Values

- **Cooperation over Competition**: We believe in building together rather than competing.
- **Community Connection**: Strong relationships make better software.
- **Inclusive Development**: Everyone's contribution matters.
- **Sustainable Growth**: Building for the long term.

## Development Process

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/tiation-portfolio.git
cd tiation-portfolio
npm install
```

### 2. Branch

```bash
# Create a new branch for your feature
git checkout -b feature/amazing-feature
```

### 3. Development Environment

```bash
# Set up your environment
cp .env.example .env.local

# Start development server
npm run dev
```

### 4. Test

```bash
# Run tests
npm test

# Check types
npm run type-check

# Lint code
npm run lint
```

## Getting Started

### Prerequisites

- Node.js 20.x
- npm 10.x
- Docker (optional)

### Development Workflow

1. Pick an issue or create one
2. Write failing tests
3. Implement your changes
4. Ensure tests pass
5. Update documentation
6. Submit PR

## Pull Request Process

1. **Title**: Use descriptive titles
   - ✅ "Add dark mode toggle component"
   - ❌ "Fix stuff"

2. **Description**: Include:
   - Problem solved
   - Solution approach
   - Breaking changes
   - Screenshots (if UI changes)

3. **Checklist**:
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Follows style guidelines
   - [ ] Reviewed by yourself
   - [ ] Added to changelog

## Style Guidelines

### Code Style

```typescript
// Use TypeScript
interface User {
  id: string;
  name: string;
  email: string;
}

// Use async/await
async function getUser(id: string): Promise<User> {
  try {
    return await db.users.findUnique({ where: { id } });
  } catch (error) {
    logger.error('Failed to fetch user:', error);
    throw error;
  }
}
```

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>
feat(auth): add OAuth support for GitHub
fix(ui): resolve dark mode toggle issue
chore(deps): update dependencies
```

### Documentation

- Update README.md if needed
- Add JSDoc comments to functions
- Include inline comments for complex logic
- Update architecture diagrams if needed

## Community and Connection

### Get in Touch

- GitHub Issues
- Discussions
- Email: tiatheone@protonmail.com

### Related Projects

- [grieftodesign](https://github.com/tiation/grieftodesign)
- [$19 Trillion Solution](https://github.com/ChaseWhiteRabbit/economic-reform)

### Recognition

All contributors are recognized in:
- README.md
- CONTRIBUTORS.md
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Remember: Every contribution matters, no matter how small! 🌟

# Contributing to Tiation Portfolio

Welcome to our community! We believe in the power of cooperation over competition and value the strength that comes from working together.

## 🌟 Our Values

- **Community First**: Building connections and fostering a supportive environment
- **Cooperation Over Competition**: Together we achieve more than alone
- **Inclusive Development**: Every voice matters in creating better solutions

## 🔗 Related Projects

- [Grief to Design](https://github.com/ChaseWhiteRabbit/grief-to-design)
- [The $19 Trillion Solution](https://github.com/ChaseWhiteRabbit/19-trillion-solution)

## 🚀 Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Submit a pull request

## 📋 Development Guidelines

### Code Standards
- Use TypeScript for all new code
- Follow enterprise-grade practices
- Ensure WCAG compliance
- Include comprehensive tests
- Document all new features

### Design Standards
- Support both dark neon and light themes
- Maintain mobile-first approach
- Use cyan/magenta gradients for dark theme
- Use fluro gradients for light theme

### Testing Requirements
- Write unit tests for new features
- Ensure accessibility testing
- Test mobile responsiveness
- Performance testing

## 🤝 Community Guidelines

- Be respectful and supportive
- Value different perspectives
- Share knowledge freely
- Help others learn and grow

Together we can build something amazing that benefits everyone. Thank you for contributing!
