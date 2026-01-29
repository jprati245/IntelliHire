

# AI Career Assessment Platform - Foundation Plan

## Overview
A professional, corporate-styled Progressive Web App (PWA) for comprehensive career assessments, featuring skills & aptitude testing with a full user management foundation.

---

## 🎨 Design System

**Color Palette:**
- Primary: Deep navy blue (#1a365d)
- Secondary: Professional blue (#3182ce)
- Accents: Light blue highlights, clean whites
- Text: Dark grays on light backgrounds

**Typography:** Clean, professional sans-serif fonts with clear hierarchy

**Layout:** Structured grid system with generous whitespace, card-based content organization

---

## 📱 Pages & Features

### 1. **Landing/Login Page**
- Clean split-screen design (branding left, form right on desktop)
- Email/password login form with validation
- Google Sign-In button (OAuth)
- Link to registration
- Mobile: stacked layout with branding header

### 2. **Registration Page**
- Multi-step or single-page registration
- Email/password with confirmation
- Google Sign-In option
- Terms & privacy policy acceptance
- Redirect to profile setup after registration

### 3. **Dashboard**
- Welcome header with user name
- Quick stats cards (assessments completed, skills identified, etc.)
- Recent activity feed
- Call-to-action for starting assessments
- Navigation to all sections

### 4. **User Profile Page**
- Profile photo upload (Supabase Storage)
- Personal information (name, title, industry)
- Career goals section
- Skills overview
- Edit capabilities

### 5. **Settings Page**
- Account settings (email, password change)
- Notification preferences
- Theme preferences (light/dark mode)
- Privacy settings
- Account deletion option

### 6. **Responsive Navigation**
- Desktop: Collapsible sidebar with icons and labels
- Tablet: Collapsible sidebar (icon-only when collapsed)
- Mobile: Bottom navigation bar + hamburger menu for additional options

---

## 🔐 Authentication & Security

- Email/password authentication via Supabase Auth
- Google OAuth integration
- Protected routes (unauthenticated users redirect to login)
- User session management
- Secure password reset flow
- User roles table (for future admin features)

---

## 🗄️ Database Structure

**profiles table:**
- User ID (linked to auth.users)
- Display name, avatar URL
- Job title, industry
- Career goals
- Created/updated timestamps

**user_roles table:**
- User ID, role (enum: user, admin)
- For future admin functionality

**RLS Policies:** Users can only access their own data

---

## 📲 PWA Features

- Installable from browser to home screen
- Offline-capable with service worker
- App manifest with proper icons
- Fast loading with caching strategies

---

## 📁 Clean Architecture

```
src/
├── components/
│   ├── auth/          # Login, Register forms
│   ├── layout/        # Sidebar, Header, Navigation
│   ├── dashboard/     # Dashboard-specific components
│   ├── profile/       # Profile components
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── contexts/          # Auth context, Theme context
├── pages/             # Page components
├── lib/               # Utilities, Supabase client
└── types/             # TypeScript definitions
```

---

## 🚀 Deliverables

1. Complete authentication flow (email + Google)
2. Protected routing system
3. Fully responsive UI (mobile, tablet, desktop)
4. Dashboard with placeholder content
5. Profile page with edit functionality
6. Settings page with preferences
7. PWA configuration for installability
8. Clean, commented, maintainable code

