export default function MatchmakingPage() {
  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] lg:min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-[#FFF9E6] rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🤝</span>
        </div>
        
        <h1 className="text-3xl font-bold text-[#0A1024] mb-4">Matchmaking Coming Soon!</h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Fitur pencarian rekan tim dan matchmaking saat ini sedang dalam <span className="font-semibold text-[#0A1024]">tahap development</span>. 
          Nantikan kemudahan mencari rekan satu tim yang sesuai dengan keahlian Anda segera!
        </p>
      </div>
    </div>
  );
}
