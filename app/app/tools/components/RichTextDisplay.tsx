"use client";

/**
 * Component for displaying rich text content from the WYSIWYG editor
 * Ensures proper rendering of HTML elements, especially lists
 */
export function RichTextDisplay({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div 
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

/**
 * This component provides the global styles needed for proper rich text rendering
 */
export function RichTextStyles() {
  return (
    <style jsx global>{`
      .rich-text-content {
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .rich-text-content ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin: 0.75rem 0;
      }
      
      .rich-text-content ol {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin: 0.75rem 0;
      }
      
      .rich-text-content li {
        margin: 0.25rem 0;
      }
      
      .rich-text-content p {
        margin: 0.75rem 0;
      }
      
      .rich-text-content h1,
      .rich-text-content h2,
      .rich-text-content h3,
      .rich-text-content h4,
      .rich-text-content h5,
      .rich-text-content h6 {
        font-weight: 600;
        margin: 1rem 0 0.5rem;
      }
      
      .rich-text-content strong {
        font-weight: 600;
      }
      
      .rich-text-content a {
        color: #3b82f6;
        text-decoration: underline;
      }
    `}</style>
  );
}

/**
 * Combines the RichTextDisplay with its required styles
 */
export function RichTextDisplayWithStyles(props: { html: string; className?: string }) {
  return (
    <>
      <RichTextStyles />
      <RichTextDisplay {...props} />
    </>
  );
}

export default RichTextDisplayWithStyles; 