// Force dynamic rendering for all auth pages
export const dynamic = 'force-dynamic';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center">
      {children}
    </div>
  );
}
