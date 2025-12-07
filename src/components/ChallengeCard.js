function ChallengeCard({ title, level, videoUrl, deadline }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="flex gap-2 mb-4 text-sm">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Level {level}</span>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">Due {deadline}</span>
      </div>
      <video className="w-full rounded-lg mb-4" controls src={videoUrl} />
      <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700">
        Mark as DONE
      </button>
    </div>
  );
}