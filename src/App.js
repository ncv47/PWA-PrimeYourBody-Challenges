import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">MPAKT Challenges</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Challenge Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Week 1 Challenges</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Challenge cards here */}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg hover:bg-indigo-700">
              <h3 className="font-semibold text-lg">My Progress</h3>
              <p className="text-indigo-100">3/7 challenges done</p>
            </button>
            <button className="bg-green-600 text-white p-6 rounded-xl shadow-lg hover:bg-green-700">
              Community
            </button>
            <button className="bg-purple-600 text-white p-6 rounded-xl shadow-lg hover:bg-purple-700">
              Profile
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
