export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-180px)]">
      <div className="space-y-6 w-full max-w-3xl">
        {/* Loading header */}
        <div className="animate-pulse flex justify-between items-center">
          <div className="h-8 w-40 bg-muted rounded"></div>
          <div className="h-8 w-28 bg-muted rounded"></div>
        </div>
        
        {/* Loading content */}
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          
          <div className="h-72 bg-muted rounded-lg"></div>
          
          <div className="h-44 bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
  );
} 