import { MessageSquare } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="h-full w-full md:w-80 lg:w-96 glass-panel border-r border-white/10 flex flex-col bg-[var(--color-surface)]/60 backdrop-blur-2xl">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-4 w-24 bg-white/10 rounded-md animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-full bg-white/5 rounded-xl animate-pulse" />
      </div>

      {/* List Skeletons */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-2.5 flex items-center gap-3 rounded-xl bg-white/5 animate-pulse">
            <div className="size-12 rounded-full bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-24 bg-white/10 rounded" />
                <div className="h-2.5 w-10 bg-white/5 rounded" />
              </div>
              <div className="h-3 w-36 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;