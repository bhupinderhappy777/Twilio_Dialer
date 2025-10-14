# Contributing to Twilio Dialer

Thank you for your interest in contributing to the Twilio Dialer project! This document provides guidelines and information for contributors.

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming environment for all contributors.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in the Issues tab
2. If not, create a new issue with:
   - Clear, descriptive title
   - Detailed description of the problem or feature
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Browser and OS information
   - Any relevant console errors or screenshots

### Submitting Changes

1. **Fork the Repository**
   ```bash
   # Fork via GitHub UI, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Twilio_Dialer.git
   cd Twilio_Dialer
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**
   - Follow the coding standards below
   - Add comments for complex logic
   - Update documentation as needed
   - Test your changes thoroughly

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Provide a clear description of your changes
   - Link any related issues

## Coding Standards

### JavaScript

- **ES6+ Syntax**: Use modern JavaScript features (const/let, arrow functions, async/await)
- **Naming Conventions**:
  - Variables and functions: camelCase (e.g., `getUserToken`, `activeCall`)
  - Constants: UPPER_SNAKE_CASE (e.g., `WORKER_URL`, `MAX_RETRIES`)
  - Classes: PascalCase (if added in future)
- **Comments**: Use JSDoc for functions, inline comments for complex logic
- **Error Handling**: Always use try-catch for async operations
- **Event Listeners**: Clean up listeners when not needed to prevent memory leaks

### Documentation

- **JSDoc Format**: All functions should have JSDoc comments:
  ```javascript
  /**
   * Brief description of function
   * @param {type} paramName - Description
   * @returns {type} Description
   * @throws {Error} When something goes wrong
   */
  ```
- **README Updates**: Update README.md if adding new features
- **Inline Comments**: Use sparingly, only for non-obvious code

### HTML/CSS

- **Semantic HTML**: Use appropriate HTML5 elements
- **Accessibility**: Include ARIA labels where appropriate
- **Responsive**: Test on multiple screen sizes
- **CSS**: Keep styles in the `<style>` tag unless the project grows significantly

## Development Setup

### Prerequisites

- Node.js 16+ (for running local servers and tools)
- A Twilio account (for testing)
- A Cloudflare account (for Worker deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bhupinderhappy777/Twilio_Dialer.git
   cd Twilio_Dialer
   ```

2. **Start a local server**:
   ```bash
   python3 -m http.server 8000
   # or
   npx http-server -p 8000
   ```

3. **Open in browser**:
   - Navigate to `http://localhost:8000`
   - Open DevTools for debugging

4. **Make changes**:
   - Edit files in your preferred editor
   - Refresh browser to see changes
   - Check console for errors

### Testing Checklist

Before submitting a PR, verify:

- [ ] Code follows the coding standards
- [ ] All functions have JSDoc comments
- [ ] No console errors in browser DevTools
- [ ] Application initializes correctly
- [ ] Call flow works (if modified)
- [ ] Error handling works correctly
- [ ] Status messages display properly
- [ ] README updated if needed
- [ ] No sensitive information committed

## Areas for Contribution

### Current Priorities

1. **Enhanced Error Handling**
   - Better error messages for users
   - Retry logic for token fetching
   - Connection quality indicators

2. **User Experience**
   - Recent calls history
   - Contact list/favorites
   - Keyboard shortcuts
   - Dark mode

3. **Testing**
   - Unit tests for functions
   - Integration tests
   - Browser compatibility testing

4. **Documentation**
   - Video tutorials
   - Troubleshooting guides
   - Code examples

5. **Security**
   - User authentication integration
   - Token management improvements
   - Security best practices documentation

### Future Enhancements

- Incoming call support
- Call recording functionality
- Conference calling
- SMS integration
- Call analytics/history
- Multi-language support

## Questions?

If you have questions about contributing:

1. Check existing documentation (README, DEPLOYMENT.md)
2. Look through closed issues/PRs for similar questions
3. Open a new issue with the "question" label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Acknowledgments

Thank you to all contributors who help improve this project!
