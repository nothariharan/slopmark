import { login, signup } from "./actions";
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-24 bg-black text-zinc-100 min-h-screen">
      <Link href="/" className="absolute left-8 top-8 py-2 px-4 rounded-none border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors text-sm">
        back
      </Link>
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-zinc-100">
        <h1 className="text-2xl font-medium tracking-tight mb-8 text-center text-zinc-100">
          slopmark
        </h1>
        
        <label className="text-sm text-zinc-500 font-normal mb-1" htmlFor="email">
          email
        </label>
        <input
          className="rounded-none px-4 py-2 bg-transparent border-b border-zinc-800 mb-6 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700"
          name="email"
          placeholder="you@example.com"
          required
        />
        
        <label className="text-sm text-zinc-500 font-normal mb-1" htmlFor="password">
          password
        </label>
        <input
          className="rounded-none px-4 py-2 bg-transparent border-b border-zinc-800 mb-8 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <div className="flex flex-col gap-3">
          <button
            formAction={login}
            className="bg-zinc-100 hover:bg-zinc-300 text-black rounded-none px-4 py-2 font-medium transition-colors"
          >
            Sign In
          </button>
          <button
            formAction={signup}
            className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 rounded-none px-4 py-2 font-medium transition-colors"
          >
            Sign Up
          </button>
        </div>
        
        {searchParams?.message && (
          <p className="mt-6 p-4 border border-zinc-800 text-zinc-400 text-center rounded-none text-sm">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  );
}
