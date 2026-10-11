// src/components/ArticleRenderer.tsx
// Renders a Keystatic document on the server (no client directive needed) as styled rich text.
// All styling lives in /style/articles-style.css (.prose and .ar-cta).
import { DocumentRenderer, type DocumentRendererProps } from '@keystatic/core/renderer';

const SITE_HOST = 'emmystack01.com';

/** Only allow safe link targets; anything else (e.g. "javascript:") is dropped. */
function safeHref(href?: string): string | undefined {
  if (!href) return undefined;
  const value = href.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value)) return value;
  return undefined;
}

function isExternal(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    return host !== SITE_HOST;
  } catch {
    return true;
  }
}

export default function ArticleRenderer({ document }: { document: DocumentRendererProps['document'] | null | undefined }) {
  if (!document || !Array.isArray(document) || document.length === 0) {
    return <p>No content yet.</p>;
  }

  return (
    <DocumentRenderer
      document={document}
      renderers={{
        inline: {
          // External links open in a new tab safely; unsafe URLs render as plain text.
          link: ({ children, href }) => {
            const safe = safeHref(href);
            if (!safe) return <>{children}</>;
            const external = isExternal(safe);
            return (
              <a href={safe} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {children}
              </a>
            );
          },
        },
      }}
      componentBlocks={{
        cta: ({ title, text, btnText, btnLink }: { title?: string; text?: string; btnText?: string; btnLink?: string }) => {
          const href = safeHref(btnLink);
          return (
            <aside className="ar-cta">
              {title && <h4>{title}</h4>}
              {text && <p>{text}</p>}
              {href && btnText && (
                <a
                  href={href}
                  className="cta"
                  {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {btnText}
                </a>
              )}
            </aside>
          );
        },
      }}
    />
  );
}
