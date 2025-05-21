import Link from 'next/link';
import MarkdownRenderer from '@/components/markdown-renderer';

export default function DocsPage() {
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
            <div className="prose dark:prose-invert max-w-none">
              <MarkdownRenderer filePath="docs/INTRODUCTION.md" />
            </div>
            
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div></div>
              <div>
                <button className="flex items-center gap-2 text-primary hover:underline">
                  Member Onboarding
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-medium mb-4">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {[
                { 
                  question: 'How long are typical cleaning assignments?',
                  answer: 'Most cleaning assignments range from 1-2 hours, depending on the area and tasks involved.'
                },
                { 
                  question: 'What should I wear for cleaning assignments?',
                  answer: 'Comfortable, casual clothing and closed-toe shoes are recommended. For some tasks, gloves will be provided.'
                },
                { 
                  question: 'Can I bring my children to help with cleaning?',
                  answer: 'Yes, children are welcome to help under adult supervision. There are many age-appropriate tasks they can assist with.'
                },
                { 
                  question: 'What if I need to cancel my assignment?',
                  answer: 'Please notify your team leader as soon as possible through the Messenger feature, or reschedule directly in the app.'
                }
              ].map((item, i) => (
                <div key={i} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <h3 className="font-medium mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button className="text-primary hover:underline text-sm">View All FAQs</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 