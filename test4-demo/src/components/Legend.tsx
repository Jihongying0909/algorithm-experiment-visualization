export default function Legend() {
  const items = [
    ['当前节点', '#FFF3D8', '#D97706'],
    ['已完成', '#F8EFE5', '#C9A27E'],
    ['边界节点', '#F1E8FF', '#A78BFA'],
    ['重复子问题', '#FFF0F0', '#E8B4B8'],
    ['当前最优', '#EFF7EC', '#8DAA91'],
  ];
  return (
    <div className="warm-card p-4">
      <div className="text-sm text-[#7C6A5D] mb-2">图例</div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        {items.map(([name, bg, bd]) => (
          <div key={name} className="flex items-center gap-2 text-[#6A5648]">
            <span className="w-4 h-4 rounded-md border" style={{ background: bg, borderColor: bd }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
