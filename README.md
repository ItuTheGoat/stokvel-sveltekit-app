# Luma: The Modern South African Stokvel 🇿🇦

Luma is a high-performance, mobile-first community savings (stokvel) platform. It digitizes traditional trust-based savings circles with transparent records, automated tracking, and secure proof-of-payment management.

Built with Svelte 5, Luma delivers a fluid app-like experience across web and mobile.

## 🛠️ The Stack

### Frontend & Framework
- **SvelteKit (Adapter-Static):** Configured as a single-page app (SPA) for seamless native wrapping via Capacitor.
- **Svelte 5 (Runes):** Uses `$state`, `$derived`, and `$effect` for fine-grained reactivity and efficient UI updates.
- **Tailwind CSS:** Rapid, utility-first responsive styling.
- **shadcn-svelte:** Accessible, high-quality UI components.

### Form Handling & Validation
- **Superforms:** Robust form state and validation flow for Svelte.
- **Zod:** TypeScript-first schema validation for rules and contribution data.

### Backend-as-a-Service (BaaS)
- **Firebase Auth:** OTP and social authentication.
- **Cloud Firestore:** Real-time, multi-tenant NoSQL data layer.
- **Firebase Storage:** Secure storage for proof-of-payment images and user documents.

### Runtime & Tooling
- **Bun:** Fast runtime, package manager, and test runner.

## 🚀 Key Features (v1 MVP)

### For Society Admins
- **Society CRUD:** Create and manage societies, goals, and rules.
- **Rule Management:** Configure contribution amounts, frequency (weekly/monthly/quarterly), and member caps.
- **Ledger Oversight:** Approve or reject member contributions from uploaded proof of payment.
- **Invite System:** Share 8-digit alphanumeric invite codes via WhatsApp or deep links.

### For Society Members
- **Multi-Society Access:** Participate in multiple savings groups.
- **Secure Contributions:** Upload digital proof-of-payment from mobile gallery.
- **Contribution History:** Transparent view of personal and society progress.

## 🏗️ Architecture

Luma uses a flat-collection, multi-tenant Firestore model. This allows users to be admins in some societies and members in others without duplication or deep nesting.

- Svelte 5 runes manage global app state (for example, user session and active society) without traditional stores.
- Superforms powers the multi-step Society Setup flow with Zod validation before writes.

## 🏃 Getting Started

### Prerequisites
- Bun installed locally.
- A Firebase project with Firestore, Auth, and Storage enabled.

### Installation
```bash
# Clone the repo
git clone https://github.com/your-username/luma.git

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env
```

### Development
```bash
# Start the SvelteKit dev server
bun run dev

# Build the static site (for Capacitor sync)
bun run build
```

## 📱 Mobile Deployment (Capacitor)

Luma is built to be wrapped with Capacitor for native features such as camera uploads (proof of payment) and contacts for invites.

```bash
# Build static output
bun run build

# Sync to native platforms
npx cap sync

# Open native project
npx cap open android
```

## 📂 Folder Structure

```text
src/
├── lib/
│   ├── components/     # shadcn-svelte UI components
│   ├── schema/         # Zod validation schemas
│   └── firebase/       # Client-side SDK initialization
├── routes/
│   ├── (auth)/         # Login, register, OTP flows
│   ├── (app)/          # Protected dashboard and admin routes
│   └── join/[code]/    # Dynamic invite link handling
└── static/             # Assets and branding
```

## Pro Tip

When adding new shadcn components with Bun:

```bash
bun x shadcn-svelte@latest add [component-name]
```