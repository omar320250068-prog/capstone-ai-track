import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-brand-500">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-ink-500">
        That route does not exist on this deployment. Head back to a page that does.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      >
        Back to home
      </Link>
    </div>
  );
}