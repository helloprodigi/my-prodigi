export default function Loading() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFC700] border-r-[#FFC700]/50 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#FFC700]/30 border-l-[#FFC700]/10 animate-spin"></div>
      </div>
    </div>
  );
}
