# Ward Cleaning App Layout Specification

## Overview

This document outlines the layout architecture for the Ward Cleaning application. The design follows modern web application principles with a responsive interface that adapts seamlessly between desktop and mobile viewports.

## Top Navigation Bar

The application features a thin, persistent toolbar that spans the full width of the viewport:

- **Height**: 60px (desktop), 50px (mobile)
- **Position**: Fixed to the top of the viewport
- **Background**: White (light mode), slate-900 (dark mode)
- **Shadow**: Subtle drop shadow to create depth
- **z-index**: High priority to ensure it remains above all content

### Navigation Bar Elements

From left to right:

1. **App Logo**
   - Position: Left-most corner
   - Size: 32px × 32px (desktop), 24px × 24px (mobile)
   - Appearance: Colorful mountain logo in a circular container
   - Behavior: Clickable, returns to dashboard home

2. **Page Title**
   - Position: Adjacent to logo
   - Typography: 18px, medium weight
   - Dynamic: Changes based on current section

3. **Spacer**: Flexible space that pushes the following elements to the right

4. **Action Icons** (right-aligned):
   - **Dark/Light Mode Toggle**
     - Icon: Sun/Moon
     - Behavior: Toggles between light and dark themes
     - Animation: Smooth transition between states
   
   - **Settings**
     - Icon: Gear/Cog
     - Behavior: Opens global application settings panel
   
   - **User Profile**
     - Icon: User avatar (if uploaded) or user icon
     - Badge: Optional notification indicator
     - Behavior: Opens dropdown with profile options and logout

## Side Navigation (Desktop)

A vertical navigation menu on the left side of the screen:

- **Default State**: Collapsed (64px width), showing only icons
- **Expanded State**: 240px width, showing icons with labels
- **Position**: Fixed to the left edge of the viewport, below the top navbar
- **Height**: Full viewport height minus top navbar
- **Background**: White/slate-50 (light mode), slate-900 (dark mode)
- **Behavior**: 
  - Can be pinned open or set to auto-collapse
  - Transitions smoothly between states
  - Hover expands menu temporarily when collapsed

### Side Navigation Content

The navigation is organized into logical sections with visual separation:

#### Members Section
- **Header**: "MEMBERS" (small caps, muted color)
- **Menu Items**:
  1. **My Stats**
     - Icon: Chart/Graph
     - Badge: Optional (for new achievements)
  
  2. **Leader Board**
     - Icon: Trophy/Podium
     - Badge: Optional (ranking change indicator)
  
  3. **Tasks**
     - Icon: Checklist/Task
     - Badge: Count of active tasks

#### Admin Section
- **Header**: "ADMIN" (small caps, muted color)
- **Menu Items**:
  1. **Messenger**
     - Icon: Chat/Message bubble
     - Badge: Unread message count
  
  2. **Campaigns**
     - Icon: Megaphone/Broadcast
  
  3. **Contacts**
     - Icon: Address book/People
  
  4. **Schedule**
     - Icon: Calendar
     - Badge: Events today indicator
  
  5. **Reporting**
     - Icon: Document/Charts
  
  6. **Tools**
     - Icon: Wrench/Toolbox
  
  7. **Settings**
     - Icon: Sliders/Controls
  
  8. **Docs**
     - Icon: Book/Document

### Visual Treatment
- Active menu item: Highlighted with primary color accent
- Hover state: Subtle background change with transition
- Icons: Consistent 24px size, outlined style
- Typography: 14px, medium weight, high contrast
- Spacing: Consistent padding (16px vertical)

## Mobile Navigation

On mobile devices, the interface adapts:

- **Side Navigation**: Hidden by default
- **Toggle Control**: Hamburger menu button in the top-left corner of the navbar
- **Behavior**:
  - Tapping toggle opens a drawer from the left
  - Drawer covers a portion of the content (280px width)
  - Semi-transparent overlay behind the drawer
  - Swipe gestures supported for opening/closing
  - Animation: Smooth entrance/exit with proper easing

### Mobile-specific Considerations

- Menu always appears in expanded state on mobile (showing both icons and text)
- Larger touch targets (minimum 44px height)
- Subtle haptic feedback on interaction
- Bottom sheet alternative for critical actions
- Clear visual indicator for current section

## Main Content Area

- **Position**: Adjusts based on navigation state
- **Margin**: Automatically accommodates expanded or collapsed menu
- **Padding**: Consistent 24px on all sides (16px on mobile)
- **Layout**: Responsive grid system that reflows based on viewport
- **Scrolling**: Content area scrolls independently from navigation

## Design System Integration

The layout incorporates our design system:

- **Color Palette**:
  - Primary: #3b82f6 (blue)
  - Secondary: #10b981 (emerald)
  - Accent: #8b5cf6 (violet)
  - Neutrals: Slate scale from 50 to 900

- **Typography**:
  - Font Family: Inter
  - Scale: Follows 1.25 ratio
  - Weights: 400 (regular), 500 (medium), 600 (semibold)

- **Spacing**: 4px base unit, following 4, 8, 12, 16, 24, 32, 48, 64px scale

- **Border Radius**: 6px (standard), 12px (large), 999px (pills)

- **Shadows**: 3 elevation levels for depth
  - Subtle (cards): 0 1px 3px rgba(0,0,0,0.1)
  - Medium (modals): 0 4px 6px rgba(0,0,0,0.1)
  - High (popovers): 0 10px 15px rgba(0,0,0,0.1)

## Transitions and Animations

- **Menu Expansion**: 200ms ease-out
- **Page Transitions**: 300ms ease-in-out
- **Hover States**: 150ms ease
- **Loading States**: Subtle pulse animations
- **Microinteractions**: Purposeful animation for feedback (saves, confirmations)

## Accessibility Considerations

- Keyboard navigable interface (tab order, focus states)
- High contrast ratio between text and background (WCAG AA+)
- Screen reader friendly (proper ARIA attributes)
- Reduced motion option for vestibular disorders
- Focus indicators visible in all states

---

This layout creates a modern, functional interface that balances aesthetics with usability. The system scales appropriately across devices while maintaining a consistent interaction model and visual language. 