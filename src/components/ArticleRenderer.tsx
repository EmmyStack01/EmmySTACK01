import { DocumentRenderer } from '@keystatic/core/renderer';

export default function ArticleRenderer({ document }: { document: any }) {
  if (!document || !Array.isArray(document)) {
    return <p style={{ color: '#8b949e', fontStyle: 'italic' }}>No content yet.</p>;
  }

  return (
    <DocumentRenderer
      document={document}
      componentBlocks={{
        cta: ({ title, text, btnText, btnLink }: any) => (
          <div className="glass-card keystatic-cta-block">
            <h4>{title}</h4>
            <p>{text}</p>
            <a href={btnLink} className="btn-glow">{btnText}</a>
          </div>
        )
      }}
    />
  );
}