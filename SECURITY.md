# Security posture — novfinance.com

Response to the external assessment (NOV-01 … NOV-06). Findings were re-verified
against live DNS and HTTP before any change was made.

| # | Finding | Status |
|---|---------|--------|
| NOV-01 | No DMARC, SPF `~all`, no DKIM | ⏳ **Needs DNS access — records below** |
| NOV-02 | No HTTP security headers | ◑ Partially fixed in-page; rest needs a CDN |
| NOV-03 | Formspree processes form data | ✅ Honeypot added; two dashboard settings left |
| NOV-04 | Young domain behind WHOIS privacy | ℹ️ No action — informational |
| NOV-05 | TLS configuration sound | ✅ No action — positive evidence |
| NOV-06 | No robots.txt / security.txt | ✅ Fixed |

---

## NOV-01 — Email authentication (highest priority)

Confirmed: `_dmarc.novfinance.com` is empty, SPF ends in `~all`, no DKIM at the
common selectors.

**One thing the assessment did not surface, and it changes the risk:** the MX
records are Namecheap *email forwarding* (`eforward1-5.registrar-servers.com`),
and the address published on the site is `eyalnov8@gmail.com`. The domain
receives and forwards mail — nothing appears to **send** as `@novfinance.com`.

That makes enforcement unusually safe here. A domain that sends no mail can move
to a strict policy quickly, because there is no legitimate mail flow to break.

### Step 1 — publish DMARC in monitoring mode

In Namecheap → Domain List → novfinance.com → Advanced DNS → Add New Record:

| Field | Value |
|-------|-------|
| Type | `TXT Record` |
| Host | `_dmarc` |
| Value | `v=DMARC1; p=none; rua=mailto:dmarc@novfinance.com; fo=1` |
| TTL | Automatic |

⚠️ **Use an address on your own domain, not the Gmail one.** DMARC forbids
sending reports to a different domain unless *that* domain publishes an
authorisation record — which nobody can do for `gmail.com`. Point `rua` at
`dmarc@novfinance.com` and add a forwarding rule for it in Namecheap's email
forwarding, so the reports land in the same inbox anyway.

### Step 2 — after 2–4 weeks of reports

The reports are XML and unpleasant to read by hand. A free digest service
(Postmark DMARC digests, dmarcian's free tier) turns them into a weekly summary.

Once the reports confirm nothing legitimate is sending as the domain, tighten
both records:

| Record | Host | New value |
|--------|------|-----------|
| TXT | `_dmarc` | `v=DMARC1; p=reject; rua=mailto:dmarc@novfinance.com; fo=1` |
| TXT | `@` | `v=spf1 include:spf.efwd.registrar-servers.com -all` |

Go via `p=quarantine` first if you want a softer landing.

### DKIM

Not applicable while the domain only forwards. If you ever configure Gmail
"send mail as" over SMTP with this domain, add the DKIM record from that
provider **before** moving DMARC to `p=reject`.

---

## NOV-02 — HTTP security headers

The assessment is right that GitHub Pages serves no custom response headers and
that this is a platform limit. Two of the six can still be set from inside the
document, and now are, on all four pages:

- **Content-Security-Policy** — via `<meta http-equiv>`. Scoped to what the
  pages actually load: Google Fonts for CSS and font files, Formspree for the
  contact POST, everything else `'self'`. `object-src 'none'` and
  `base-uri 'self'` close off plugin and base-tag injection.
- **Referrer-Policy** — via `<meta name="referrer">`, set to
  `strict-origin-when-cross-origin`.

### What is honestly not fixed

`Strict-Transport-Security`, `X-Frame-Options` and `X-Content-Type-Options`
**cannot** be set from a meta tag. Browsers ignore `frame-ancestors` in a meta
tag too, so it was deliberately left out rather than included for appearances.

`script-src` carries `'unsafe-inline'` because a static host cannot mint a
per-request nonce. It still blocks loading any *external* script, which is the
delivery path that matters for this site.

No framebusting script was added: it is trivially bypassable, and the site has
no authenticated or destructive action worth hijacking.

### The real fix, when you want it

Put Cloudflare in front of the existing GitHub Pages origin — the DNS is already
at a registrar that supports it, and nothing about the repo changes. Then set
these in a Transform Rule (or move to Cloudflare Pages / Netlify, where the
`_headers` file in this repo activates on its own):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

Once HSTS has run for a while without trouble, submit the domain to
hstspreload.org.

---

## NOV-03 — Formspree

The endpoint id in the page source is normal for Formspree and is not a secret.
The real exposures are spam volume and the processor relationship.

**Done in this repo:** a `_gotcha` honeypot field on the contact form. Formspree
drops any submission that fills it. It sits off-screen, is `aria-hidden`, and is
out of the tab order, so it costs nothing in accessibility. It is also excluded
from the form's own validation so it can never block a real visitor.

**Left to do in the Formspree dashboard** (cannot be set from this repo):

1. Enable reCAPTCHA on the form.
2. Confirm the plan's rate limiting, and set an email allowlist if available.

**Processor relationship:** already disclosed on `privacy.html`, which states
plainly that submissions — including whatever a visitor writes about their
pension — are handled by Formspree and stored outside Israel.

---

## NOV-06 — Discovery files

- `robots.txt` — allows everything, points at the sitemap.
- `sitemap.xml` — the four real pages.
- `.well-known/security.txt` — RFC 9116 disclosure contact.

`security.txt` carries a mandatory `Expires` field, currently **2027-08-29**.
Renew it before then or it stops being valid.

---

## Not addressed, by decision

**NOV-04** (young domain, WHOIS privacy) is informational. WHOIS privacy is a
deliberate choice and normal; it is only a signal when combined with the others.
Publishing DMARC removes the part of that cluster that actually matters.

---

## Note on publishing

The repo carries a `.nojekyll` marker. GitHub Pages runs Jekyll by default, and
Jekyll drops paths beginning with a dot or an underscore from the build — which
silently 404'd `/.well-known/security.txt` and `/_headers` even though both were
committed. The site uses no Jekyll features, so disabling it costs nothing.

Keep the file. Deleting it makes both paths disappear again, quietly.
