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

This application uses **Netlify Blobs** for content storage, providing a simple and efficient way to manage portfolio work items and videos.

### Adding Videos and Work Items

#### 1. Upload a Video to Netlify Blobs

First, upload your video file to the `videos` store:

```bash
# Make sure you're in the project directory and logged into Netlify CLI
netlify link

# Upload a video (replace with your video path)
netlify blobs:set videos your-video-name.mp4 ~/path/to/your-video.mp4
```

#### 2. Update Work Items

Work items are stored as JSON in the `work-items` store. To add or update work items:

**Step 1:** Download the current work items (if any exist):
```bash
netlify blobs:get work-items items.json > items.json
```

**Step 2:** Edit `items.json` and add your new work item following this structure:

```json
[
  {
    "id": "1",
    "title": "Your Project Title",
    "category": "Photography",
    "description": "A detailed description of your project.\nYou can use \\n for line breaks.",
    "year": "2025",
    "imageUrl": "",
    "videoUrl": "https://yoursitename.netlify.app/.netlify/blobs/serve/videos/your-video-name.mp4",
    "tags": ["Tag1", "Tag2", "Tag3"]
  }
]
```

**Field Descriptions:**
- `id`: Unique identifier (string)
- `title`: Project title
- `category`: Project category (e.g., Photography, Design, Video)
- `description`: Full project description (use `\n` for line breaks)
- `year`: Project year
- `imageUrl`: Leave empty to use video's first frame as thumbnail, or provide a custom poster image URL
- `videoUrl`: Full URL to your video in Netlify Blobs
- `tags`: Array of tags for the project

**Step 3:** Upload the updated JSON file:
```bash
netlify blobs:set work-items items.json items.json
```

#### 3. Video URL Format

Your video URL should follow this pattern:
```
https://[your-site-name].netlify.app/.netlify/blobs/serve/videos/[video-filename].mp4
```

Replace `[your-site-name]` with your Netlify site name and `[video-filename]` with the name you used when uploading.

#### 4. Verify Your Changes

After uploading, deploy your site or wait for the next build. Your new work items will appear automatically.

### Managing Content via Netlify CLI

**List all blobs in a store:**
```bash
netlify blobs:list videos
netlify blobs:list work-items
```

**Delete a blob:**
```bash
netlify blobs:delete videos your-video-name.mp4
netlify blobs:delete work-items items.json
```

**View a blob:**
```bash
netlify blobs:get work-items items.json
```

### Environment Variables

The application requires the `NETLIFY_BLOB_ACCESS` environment variable to be set in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add `NETLIFY_BLOB_ACCESS` with your Netlify Blobs access token
4. Get your token from: https://app.netlify.com/user/applications#personal-access-tokens

### Alternative: API Integration

If you prefer using a Headless CMS instead of Netlify Blobs, replace mock data in the Infrastructure layer (`MOCK_WORK_ITEMS`, `MOCK_ABOUT_CONTENT`) or connect to a Headless CMS:

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
