const MessageSkeleton = () => {
  const skeletonMessages = [
    { isMine: false, width: "w-48" },
    { isMine: false, width: "w-64" },
    { isMine: true, width: "w-56" },
    { isMine: false, width: "w-40" },
    { isMine: true, width: "w-72" },
    { isMine: true, width: "w-36" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {skeletonMessages.map((item, idx) => (
        <div
          key={idx}
          className={`flex items-end gap-2.5 ${
            item.isMine ? "justify-end" : "justify-start"
          }`}
        >
          {!item.isMine && (
            <div className="size-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
          )}

          <div
            className={`h-12 ${item.width} rounded-2xl animate-pulse ${
              item.isMine
                ? "bg-sky-500/20 rounded-br-sm border border-sky-500/30"
                : "bg-white/10 rounded-bl-sm border border-white/10"
            }`}
          />

          {item.isMine && (
            <div className="size-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;