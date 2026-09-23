import Link from "next/link";

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Capstone App";

const REPO_URL = "https://github.com/omar320250068-prog/capstone-ai-track";

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-300/40">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-6 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Built with Next.js + Tailwind — part of the day-one deployment workflow.</p>
        <p>
          {appName} v{appVersion} ·{" "}
          <Link
            href={REPO_URL}
            className="underline underline-offset-2 hover:text-ink-700"
          >
            GitHub
          </Link>
        </p>
      </div>
    </footer>
  );
}