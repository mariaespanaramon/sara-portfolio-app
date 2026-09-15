# Sara's Portfolio Web Application

A portfolio application built with React, TypeScript, and Tailwind CSS, implementing a clean hexagonal architecture pattern.

If you see something strange, no you did not. I am a Backend Engineer attempting to build a Frontend application 😛

Feel free to visit the application at [sararamon.com](https://sararamon.netlify.app/)

## 🎯 Features

- **Modern Tech Stack**: React 18 with functional components and Hooks, TypeScript for type safety, Tailwind CSS for styling
- **Hexagonal Architecture**: Clean separation of concerns with Domain, Infrastructure, Application, and Presentation layers
- **Light Theme**: Minimalist design on white, with header and hero type inverting
  against whatever sits behind it
- **Fully Responsive**: Optimized for mobile, tablet, and desktop viewports
- **Smooth Scrolling**: Seamless navigation between sections with anchor links
- **Sections**: The home lists sections rather than individual projects; each section
  has its own page listing its work
- **Type-Safe**: TypeScript implementation for strict type checking

## 🏗️ Architecture

### Domain Layer (Core)
- Pure business logic and entity definitions
- Interface definitions: `WorkItem`, `Section`, `AboutContent`, `ContactDetails`
- No external dependencies

### Infrastructure Layer (Adapters)
- Data fetching and external service integration
- Mock API functions simulating Headless CMS
- Ready for integration with real APIs (Contentful, Sanity, Strapi, etc.)
- Security: Prepared for environment variable configuration

### Application Layer (Use Cases)
- Business logic orchestration
- Custom Hooks: `useWorkItems`, `useSections`, `useSection`, `useAboutContent`,
  `useContactDetails`
- State management and data flow control

### Presentation Layer (Components)
- React UI components
- Components: `Header`, `FullscreenMenu`, `IntroSplash`, `Hero`, `SectionGrid`,
  `SectionCard`, `SectionPage`, `ProjectRow`, `WorkItemDetail`, `AboutSection`,
  `ContactSection`, `Footer`
- Presentation hooks: `useIsMobile`, `useScrollLock`, `useRevealOnScroll`
- Only interacts with Application layer hooks

### Folder Structure
```
src/
├── application/
│   ├── domain/                    # Domain Layer (Anemic approach)
│   │   ├── WorkItem.ts           # WorkItem entity interface
│   │   ├── Section.ts            # Section entity interface
│   │   ├── AboutContent.ts      # AboutContent entity interface
│   │   ├── ContactDetails.ts    # ContactDetails entity interface
│   │   └── urlId.ts             # Title to URL id helper
│   └── service/                   # Application Services (Use Cases)
│       ├── useWorkItems.ts       # Use case for fetching work items
│       ├── useSections.ts        # Use case for fetching all sections
│       ├── useSection.ts         # Use case for resolving one section by id
│       ├── useAboutContent.ts    # Use case for fetching about content
│       └── useContactDetails.ts  # Use case for fetching contact details
├── infrastructure/                # Infrastructure Layer
│   ├── ports/                     # Ports (Interfaces)
│   │   └── repositories.ts       # Repository interfaces
│   ├── config/
│   │   └── netlify.config.ts     # Netlify Blobs configuration
│   └── adapters/                  # Adapters (Implementations)
│       ├── MockWorkItemRepository.ts
│       ├── NetlifyBlobsWorkItemRepository.ts
│       ├── MockSectionRepository.ts
│       ├── MockAboutContentRepository.ts
│       └── MockContactDetailsRepository.ts
├── presentation/                  # Presentation Layer
│   ├── hooks/                     # Reusable UI behaviour
│   │   ├── useIsMobile.ts        # Viewport narrower than the md breakpoint
│   │   ├── useScrollLock.ts      # Freeze the page behind an overlay
│   │   └── useRevealOnScroll.ts  # Reveal an element once it scrolls into view
│   └── components/                # React components
│       ├── IntroSplash.tsx       # Animated logo on first load of a tab
│       ├── Header.tsx
│       ├── FullscreenMenu.tsx    # Mobile navigation overlay
│       ├── Hero.tsx
│       ├── SectionGrid.tsx       # Home grid of sections
│       ├── SectionCard.tsx
│       ├── SectionPage.tsx       # One section and its projects
│       ├── ProjectRow.tsx        # A project inside a section page
│       ├── WorkItemCard.tsx
│       ├── WorkItemDetail.tsx    # A project page
│       ├── RevealOnScroll.tsx
│       ├── AboutSection.tsx
│       ├── ContactSection.tsx
│       ├── Footer.tsx
│       ├── workItemCards/         # Per-type card renderers
│       └── workItemDetails/       # Per-type detail renderers
├── App.tsx                        # Application entry point (wiring, routes)
├── main.tsx
└── index.css
```

### Routes

| Path | Screen |
|---|---|
| `/` | Home: hero, section grid, about, contact |
| `/section/:id` | One section, with its projects one per row |
| `/work/:id` | One project, media full screen then text on scroll |

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
  site: {
    bg: '#ffffff',
    surface: '#f5f5f5',
    border: '#e5e5e5',
    text: { primary: '#0a0a0a', secondary: '#4a4a4a', muted: '#8a8a8a' },
  }
}
```

The tokens are named `site.*`, not `dark.*`. They were renamed when the site moved to
a light theme, so that the names do not contradict their values.

### Intro Splash

`IntroSplash` shows an animated logo the first time the site loads **in a tab**, then
fades out. It is skipped when:

- `sessionStorage` already holds the `sara-intro-seen` key, which is set as soon as the
  intro starts. Reloading the same tab therefore does not replay it, while a new tab
  does, because `sessionStorage` is scoped per tab and not shared across the browser
- the visitor prefers reduced motion

To see it again in the same tab, clear the flag from the console:

```js
sessionStorage.removeItem('sara-intro-seen')
```

The gif URL is the `INTRO_GIF_URL` constant at the top of the component. It currently
points at a placeholder hosted elsewhere; replace it with a file in `public/`.

### Mobile Navigation

Below the `md` breakpoint the inline header links are replaced by `FullscreenMenu`, a
full-screen overlay opened by a `menu` / `close` trigger. Its state lives in `App`,
because the overlay has to be a sibling of the header: nested inside it would inherit the
header's stacking context and its blend mode.

## 📦 Deployment

This application is deployed using **Netlify**.

## 🔌 Adding Work Item Types

The application uses an extensible architecture for work item types, following the Strategy pattern and Open/Closed Principle. Currently supported types: `image`, `video`, and `gallery`.

### Adding a New Work Item Type

To add a new work item type (e.g., audio, PDF, 3D model):

**1. Update the Domain Model**

Add your new type to `src/application/domain/WorkItem.ts`:

```typescript
export interface WorkItem {
  // ... existing fields
  type: 'image' | 'video' | 'gallery' | 'audio'; // Add your type
  audioUrl?: string; // Add type-specific fields
}
```

**2. Create Card Renderer**

Create `src/presentation/components/workItemCards/AudioItemCard.tsx`:

```typescript
import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemCard } from './IWorkItemCard';

export class AudioItemCard implements IWorkItemCard {
  renderMedia(workItem: WorkItem, isHovered: boolean): JSX.Element {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-site-surface">
        <audio src={workItem.audioUrl} controls className="w-full px-8" />
      </div>
    );
  }
}
```

**3. Create Detail Renderer**

Create `src/presentation/components/workItemDetails/AudioItemDetail.tsx`:

```typescript
import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemDetail } from './IWorkItemDetail';

export class AudioItemDetail implements IWorkItemDetail {
  // Fills the framed, full-screen block at the top of the project page.
  renderHeroMedia(workItem: WorkItem): JSX.Element {
    return (
      <div className="w-full h-full flex items-center justify-center bg-site-surface">
        <audio src={workItem.audioUrl} controls className="w-full max-w-2xl" />
      </div>
    );
  }

  // Anything revealed further down the page, or null when there is nothing more.
  // Unlike the hero, this element carries its own sizing.
  renderBodyMedia(): JSX.Element | null {
    return null;
  }
}
```

**4. Register with Factories**

Update `src/presentation/components/workItemCards/WorkItemCardFactory.ts`:

```typescript
import { AudioItemCard } from './AudioItemCard';

export class WorkItemCardFactory {
  private static renderers: Map<string, IWorkItemCard> = new Map([
    ['video', new VideoItemCard()],
    ['image', new ImageItemCard()],
    ['gallery', new GalleryItemCard()],
    ['audio', new AudioItemCard()], // Add this line
  ]);
  // ...
}
```

Update `src/presentation/components/workItemDetails/WorkItemDetailFactory.ts` similarly.

**5. Update Validation**

Update `src/infrastructure/adapters/NetlifyBlobsWorkItemRepository.ts`:

```typescript
private isValidWorkItem(item: unknown): item is WorkItem {
  // ... existing code
  const baseValid = 
    // ... existing checks
    (workItem.type === 'image' || workItem.type === 'video' || 
     workItem.type === 'gallery' || workItem.type === 'audio') && // Add type
    // ... rest of validation
  
  // Add type-specific validation
  if (workItem.type === 'audio') {
    return typeof workItem.audioUrl === 'string';
  }
}
```

**6. Add Sample Data**

Add a sample item to `src/infrastructure/adapters/MockWorkItemRepository.ts`:

```typescript
{
  id: '6',
  title: 'Sound Design Reel',
  category: 'Audio',
  description: 'A collection of sound design work...',
  year: '2024',
  type: 'audio',
  audioUrl: 'https://example.com/audio.mp3',
  tags: ['Sound Design', 'Audio'],
}
```

That's it! The new type is now fully integrated with automatic routing, validation, and rendering.


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
    "type": "video",
    "imageUrl": "",
    "videoUrl": "https://yoursitename.netlify.app/.netlify/blobs/serve/videos/your-video-name.mp4",
    "sectionId": "videoclips",
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
- `type`: **Required.** One of `image`, `video` or `gallery`. Decides which renderer is
  used and which media field must be present. Items without it are rejected on load
- `imageUrl`: Required for `image`. For `video` it is the poster, and it is also the still
  shown for the project on its section page, so it is worth setting
- `videoUrl`: Required for `video`. Full URL to your video in Netlify Blobs
- `galleryImages`: Required for `gallery`. Array of image URLs
- `sectionId`: Optional. Which section the project appears under, e.g. `videoclips`.
  Must match a section `id` in `MockSectionRepository`. **A project without it appears
  on no section page**, so it is effectively invisible unless linked directly
- `gifUrl`: Optional. Animated preview, used instead of the still on section pages and
  shown below the text on the project page. Intended for 3D work
- `tags`: Array of tags for the project

**Available section ids:** `3d-modeling`, `videoclips`, `black-and-white`,
`exhibitions`, `awards-and-recognition`. They live in
`src/infrastructure/adapters/MockSectionRepository.ts`, which is also where a section's
title, order and cover media are set.

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
