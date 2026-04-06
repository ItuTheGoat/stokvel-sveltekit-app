# Luma: The Modern South African Stokvel 🇿🇦

Luma is a high-performance, mobile-first community savings (Stokvel) platform. It digitizes traditional trust-based savings circles, providing transparency, automated record-keeping, and secure proof-of-payment management.

Built with Svelte 5, Luma leverages the latest in reactive programming to ensure a fluid, app-like experience on both web and mobile.

## 🛠️ The Stack

### Frontend & Framework

- **SvelteKit (Adapter-Static):** Configured as a Single Page Application (SPA) to allow for seamless native wrapping via Capacitor.
- **Svelte 5 (Runes):** Utilizing `$state`, `$derived`, and `$effect` for fine-grained reactivity and efficient UI updates.
- **Tailwind CSS:** For rapid, utility-first responsive design.
- **shadcn-svelte:** High-quality, accessible UI components themed for the South African fintech aesthetic.

### Form Handling & Validation

- **Superforms:** The industry standard for Svelte forms, providing seamless client-side state management.
- **Zod:** Strict TypeScript-first schema validation for society rules and contribution data.

### Backend-as-a-Service (BaaS)

- **Firebase Auth:** Secure OTP and social authentication.
- **Cloud Firestore:** Real-time, multi-tenant NoSQL database.
- **Firebase Storage:** Secure hosting for Proof of Payment (POP) images and user documents.

### Runtime & Tooling

- **Bun:** Ultra-fast JavaScript runtime, package manager, and test runner.

## 🚀 Key Features (v1 MVP)

### For Society Admins

- **Society CRUD:** Full control over society creation, goal setting, and rule definitions.
- **Rule Management:** Set contribution amounts, frequencies (Weekly, Monthly, Quarterly), and member caps.
- **Ledger Oversight:** Review and approve/reject member contributions based on uploaded Proof of Payments.
- **Invite System:** Generate and share 8-digit alpha-numeric codes via WhatsApp/deep links.

### For Society Members

- **Multi-Society Access:** Join and participate in multiple savings groups simultaneously.
- **Secure Contributions:** Upload digital POPs directly from the mobile gallery.
- **Contribution History:** A transparent, read-only view of personal and group progress.

## 🏗️ Architecture

Luma uses a Flat-Collection Multi-Tenant approach in Firestore. This ensures that users can be Admins of some societies and Members of others without data duplication or complex deep-nesting.

- Svelte 5 runes are used to manage global app state (User Session, Active Society) without the overhead of traditional stores.
- Superforms handles the complex logic of the Society Setup multi-step form, ensuring all Zod-validated rules are met before hitting the database.

## 🏃 Getting Started

### Prerequisites

- Bun installed on your machine.
- A Firebase Project with Firestore, Auth, and Storage enabled.

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

Luma is designed to be wrapped in Capacitor to access native device features like the camera (for POP uploads) and the contact list (for invites).

- Build the static project: `bun run build`
- Sync with native platforms: `npx cap sync`
- Open in Android Studio/Xcode: `npx cap open android`

## 📂 Folder Structure

```text
src/
├── lib/
│   ├── components/     # shadcn-svelte UI components
│   ├── schema/         # Zod validation schemas
│   └── firebase/       # Client-side SDK initialization
├── routes/
│   ├── (auth)/         # Login, Register, OTP flows
│   ├── (app)/          # Protected Dashboard and Admin routes
│   └── join/[code]/    # Dynamic invite link handling
└── static/             # Assets and branding
```

## Pro-Tip for Development

When adding new shadcn components using Bun:

```bash
bun x shadcn-svelte@latest add [component-name]
```
