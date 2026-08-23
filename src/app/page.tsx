import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white text-gray-900">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-indigo-900">
            SocietyOS
          </h1>
          <p className="text-xl text-gray-600">
            Intelligent Residential Maintenance
          </p>
        </div>
        
        <div className="mt-12 pt-8">
          <p className="text-gray-600 mb-8 max-w-xl mx-auto text-lg">
            Welcome to the future of community living. Report issues, track progress, and enjoy a well-maintained society.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors text-center inline-block">
              Login
            </Link>
            <Link href="/register" className="px-6 py-3 rounded-lg bg-white text-indigo-600 border border-indigo-200 font-medium hover:bg-indigo-50 transition-colors text-center inline-block">
              Register
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
