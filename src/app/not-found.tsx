"use client";

import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-950 via-gray-900 to-black text-white px-6">
      <div className="text-center space-y-6 animate-fadeIn">
        <h1 className="text-8xl md:text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-lg">
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-semibold">Page not found</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            The page you’re looking for doesn’t exist or has been moved.
          </p>
        </div>

        {/* Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-white/20"
        >
          Go back home
        </Link>

        {/* Floating glow dots */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 blur-3xl opacity-20 rounded-full animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-400 blur-3xl opacity-20 rounded-full animate-pulse" />
      </div>

      {/* Simple fade animation */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
