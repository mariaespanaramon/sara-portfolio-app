# Sara's Portfolio Web Application

A portfolio application built with React, TypeScript, and Tailwind CSS, implementing a clean hexagonal architecture pattern.

If you see something strange, no you did not. I am a Backend Engineer attempting to build a Frontend application 😛

Feel free to visit the application at [sararamon.com](https://sararamon.netlify.app/)

## 🎯 Features

- **Modern Tech Stack**: React 18 with functional components and Hooks, TypeScript for type safety, Tailwind CSS for styling
- **Hexagonal Architecture**: Clean separation of concerns with Domain, Infrastructure, Application, and Presentation layers
- **Dark Theme**: Minimalist, high-contrast design inspired by premium portfolio sites
- **Fully Responsive**: Optimized for mobile, tablet, and desktop viewports
- **Smooth Scrolling**: Seamless navigation between sections with anchor links
- **Type-Safe**: TypeScript implementation for strict type checking

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

### Folder Structure
```
src/
├── application/
│   ├── domain/                    # Domain Layer (Anemic approach)
│   │   ├── WorkItem.ts           # WorkItem entity interface
│   │   └── AboutContent.ts       # AboutContent entity interface
│   └── service/                   # Application Services (Use Cases)
│       ├── useWorkItems.ts       # Use case for fetching work items
│       └── useAboutContent.ts    # Use case for fetching about content
├── infrastructure/                # Infrastructure Layer
│   ├── ports/                     # Ports (Interfaces)
│   │   └── repositories.ts       # Repository interfaces
│   └── adapters/                  # Adapters (Implementations)
│       ├── MockWorkItemRepository.ts
│       └── MockAboutContentRepository.ts
├── presentation/                  # Presentation Layer
│   └── components/                # React components
│       ├── Header.tsx
│       ├── Hero.tsx
│       ├── WorkItemCard.tsx
│       ├── WorkSection.tsx
│       ├── AboutSection.tsx
│       └── Footer.tsx
├── App.tsx                        # Application entry point (wiring)
├── main.tsx
└── index.css
```

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

## 📦 Deployment

This application is deployed using **Netlify**.


## 📚 Adding Content
Once the content is ready, replace mock data in the Infrastructure layer (`MOCK_WORK_ITEMS`, `MOCK_ABOUT_CONTENT`) or connect to a Headless CMS:

### API Integration
Add the following environment variables to Netlify:
- VITE_API_KEY: Your CMS/API key
- VITE_API_URL: Your API endpoint URL

And replace the mock functions in the Infrastructure layer with real API calls:

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
