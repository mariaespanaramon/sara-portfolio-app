# Premium Portfolio Web Application

A fully functional, production-ready portfolio application built with React, TypeScript, and Tailwind CSS, implementing a clean hexagonal architecture pattern.

## 🎯 Features

- **Modern Tech Stack**: React 18 with functional components and Hooks, TypeScript for type safety, Tailwind CSS for styling
- **Hexagonal Architecture**: Clean separation of concerns with Domain, Infrastructure, Application, and Presentation layers
- **Premium Dark Theme**: Minimalist, high-contrast design inspired by premium portfolio sites
- **Fully Responsive**: Optimized for mobile, tablet, and desktop viewports
- **Smooth Scrolling**: Seamless navigation between sections with anchor links
- **Type-Safe**: Full TypeScript implementation with strict type checking
- **Production-Ready**: Optimized build with Vite, ready for deployment

## 🏗️ Architecture

### Domain Layer (Core)
- Pure business logic and entity definitions
- Interface definitions: `WorkItem`, `AboutContent`
- No external dependencies

### Infrastructure Layer (Adapters)
- Data fetching and external service integration
- Mock API functions simulating Headless CMS
- Ready for integration with real APIs (Contentful, Sanity, Strapi, etc.)
- Security: Prepared for environment variable configuration

### Application Layer (Use Cases)
- Business logic orchestration
- Custom Hooks: `useWorkItems`, `useAboutContent`
- State management and data flow control

### Presentation Layer (Components)
- React UI components
- Components: `Header`, `Hero`, `WorkSection`, `WorkItemCard`, `AboutSection`, `Footer`
- Only interacts with Application layer hooks

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security & Best Practices

- No hardcoded API keys or sensitive information
- Environment variables ready for integration (use `.env` file)
- For production API integration, use:
  ```typescript
  const API_KEY = import.meta.env.VITE_API_KEY;
  // Or for Netlify: process.env.NEXT_PUBLIC_API_KEY
  ```

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  dark: {
    bg: '#0a0a0a',
    surface: '#131313',
    // ... customize colors
  }
}
```

### Content
Replace mock data in the Infrastructure layer (`MOCK_WORK_ITEMS`, `MOCK_ABOUT_CONTENT`) with your actual content or connect to a Headless CMS.

### API Integration
Replace the mock functions in the Infrastructure layer with real API calls:

```typescript
async function getWorkItems(): Promise<WorkItem[]> {
  const response = await fetch(`${API_URL}/work-items`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
    }
  });
  return response.json();
}
```

## 📦 Deployment

This application is ready to deploy to:
- **Netlify**: Connect your Git repository and deploy automatically
- **Vercel**: Zero-config deployment with Git integration
- **GitHub Pages**: Build and deploy static files
- **Any static hosting service**: Run `npm run build` and deploy the `dist` folder

### Environment Variables (Production)

For Netlify/Vercel, add these environment variables in your dashboard:
- `VITE_API_KEY`: Your CMS/API key
- `VITE_API_URL`: Your API endpoint URL

## 🛠️ Technologies

- **React 18**: Modern UI library with Hooks
- **TypeScript 5**: Static typing and improved DX
- **Tailwind CSS 3**: Utility-first CSS framework
- **Vite 5**: Next-generation frontend tooling
- **ESLint**: Code quality and consistency

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
