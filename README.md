# Adult-only shop storefront starter

A no-build HTML/CSS/JavaScript starter for a branded product catalog with search, category filters, a browser-persisted cart, and a manual order-request preview. It is intentionally in **demo mode** and uses sample product names/prices.

## Project structure

```text
vape-shop-starter/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── config.js
│       ├── products.js
│       └── app.js
├── .gitignore
└── README.md
```

## Run it locally

1. Open this folder in VS Code.
2. Install the VS Code extension **Live Server** (or use another local static server).
3. Right-click `index.html` and select **Open with Live Server**.
4. Confirm the age declaration, search/filter the sample catalog, add items to cart, and prepare a demo order request.
5. In demo mode, order details remain in the page and are not emailed or submitted to a server.

You can also open `index.html` in a modern browser, but a local server is the better development workflow.

## Configure the branding

Edit `assets/js/config.js`:

- `shopName`: approved store name.
- `orderEmail`: the shop's monitored order-request email address.
- `currency`: currently `PHP`.
- `demoMode`: keep this `true` until all launch checks have been completed.

Edit the CSS variables at the top of `assets/css/styles.css` to match the client's approved logo, brand colors, typography, and design. Replace the text wordmark with the authorized logo asset once supplied.

## Configure catalog entries

Edit `assets/js/products.js`. Replace all sample items with verified records. Confirm each product is lawful for the seller to list, has accurate specifications, and uses the applicable label/health warning. Do not use unsubstantiated health or reduced-risk claims. Replace decorative sample visuals with the client's properly licensed product images after confirming they are appropriate under applicable law and platform policies.

The item prices and subtotal are front-end estimates only. They are not authoritative prices and are not backed by inventory or a server.

## Manual order flow in this starter

- Customer adds products to cart.
- Customer completes the basic contact form.
- In demo mode the site renders an order request preview and does not send it.
- For a basic non-demo test, `demoMode` can be set to `false`; the page will create an email draft using `mailto:`. The customer must still press Send. Email apps are not guaranteed to be configured, and `mailto:` is not a reliable production order-management system.
- No ID images, card data, or payments are collected.

**Before production:** a backend or reputable form/order provider is strongly recommended, with server-side validation, spam protection, clear privacy notice, minimal collection of personal data, access control for order records, retention/deletion rules, and notification/backup handling. Do not place secrets/API keys in frontend JavaScript or a public repository.

## Git + GitHub

Create a **private** GitHub repository for the client project. From this folder in VS Code Terminal, run:

```bash
git init
git add index.html assets .gitignore README.md
git commit -m "Create adult-only storefront starter"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-PRIVATE-REPO.git
git push -u origin main
```

Replace the repository URL with the real private repository. If Git prompts for identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

For subsequent changes:

```bash
git add .
git commit -m "Describe the change"
git push
```

Do not commit customer order details, identification documents, passwords, access tokens, `.env` files, or other secrets. Use separate branches for larger changes and review the diff before committing.

## Compliance and deployment gate — do not skip

This is a development scaffold, **not a legal-compliance solution and not ready for live sales**. Before publishing any real catalog or accepting real requests, the retailer/client should verify current requirements with qualified Philippine counsel/regulators and the chosen hosting provider.

Items to verify include:

- Republic Act No. 11900 and current implementing rules: minimum age is 18; online trade must adopt measures to deny access to minors and display required statutory signages; the law describes self-declaration of legal age on the opening page, seller registration with DTI or SEC, product health-warning/label requirements, applicable BIR/fiscal-mark and minimum-price requirements, and compliant age verification for delivery.
- A simple JavaScript age gate is client-side and can be bypassed. It is not a strong access-control or identity-verification system. Do not represent it as sufficient proof of legal compliance. If required, implement an appropriate server-side/third-party age-verification process and verify age at handoff/delivery as applicable.
- Review every product's legal status, approved labeling, required warnings, tax/fiscal marks, and accurate listing details. Do not target minors, use youth-appealing imagery, or publish misleading/unsubstantiated product or health claims.
- Publish a real privacy notice and establish how requests/records will be secured, accessed, retained, and deleted in line with applicable privacy law.
- Check the chosen domain registrar, host, form provider, email provider, and any future payment provider's current policies. Some payment providers/platforms restrict nicotine/tobacco or regulated products. Get explicit approval before relying on a service.
- GitHub should be the source-code repository, not the production host. GitHub's documentation says GitHub Pages is not intended or allowed as free hosting for an online business/e-commerce site or sites primarily facilitating commercial transactions. See: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

Primary legal reference: Republic Act No. 11900, especially Sections 4, 6–8, 10 and 12: https://lawphil.net/statutes/repacts/ra2022/ra_11900_2022.html

## Known starter limitations

- No backend, database, inventory lock, user accounts, real age/identity verification, payment processing, order record, email-delivery service, or automated fulfillment.
- Browser local storage is not a server-side source of truth.
- The age declaration is a front-end user flow only.
- Demo products/prices are placeholders and must not be sold as real listings.
