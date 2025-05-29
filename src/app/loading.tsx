export default function Loading() {
  return (
    <div className="flex h-screen bg-background w-full">
      <div className="w-64 border-r bg-muted/10 animate-pulse"></div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading MirrorStone...</p>
        </div>
      </div>
    </div>
  );
}
