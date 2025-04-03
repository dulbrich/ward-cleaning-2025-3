import { Suspense } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-180px)]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-muted rounded mb-4"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 