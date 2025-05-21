import { promises as fs } from 'fs';
import path from 'path';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

// Function to convert markdown to HTML
async function markdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true }) // Pass raw HTML
    .use(rehypeRaw) // Parse the raw HTML
    .use(rehypeStringify)
    .process(markdown);
  
  return result.toString();
}

export default async function DocsPage() {
  // Read the INTRODUCTION.md file content
  const introductionPath = path.join(process.cwd(), 'public', 'docs', 'INTRODUCTION.md');
  const markdownContent = await fs.readFile(introductionPath, 'utf8');
  
  // Convert markdown to HTML
  const htmlContent = await markdownToHtml(markdownContent);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Documentation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <nav className="bg-card rounded-lg border overflow-hidden sticky top-[76px]">
            <div className="p-4">
              <div className="relative mb-4">
                <input
                  type="search"
                  placeholder="Search docs..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Getting Started</h3>
                  <div className="space-y-1">
                    <button className="w-full text-left px-3 py-2 rounded-md text-sm bg-primary/10 text-primary">
                      Introduction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="prose dark:prose-invert max-w-none markdown-content">
              {/* Render the processed HTML content */}
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add global CSS for the markdown content
// You can also add this to your global CSS file
const markdownStyles = `
  .markdown-content h1, 
  .markdown-content h2, 
  .markdown-content h3, 
  .markdown-content h4 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .markdown-content h1 {
    font-size: 2rem;
  }

  .markdown-content h2 {
    font-size: 1.5rem;
    padding-top: 0.5rem;
  }

  .markdown-content h3 {
    font-size: 1.25rem;
    padding-top: 0.25rem;
  }

  .markdown-content p {
    margin-top: 1rem;
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .markdown-content ul, .markdown-content ol {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  .markdown-content ul {
    list-style-type: disc;
  }

  .markdown-content li {
    margin-bottom: 0.5rem;
  }
`; 