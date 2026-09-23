"use client";

// Message content rendering.
//
// The mentor rule this component implements: never render raw streamed
// markdown naively — an unclosed code fence or dangling asterisk visibly
// breaks mid-stream. We use a single buffer for the whole in-flight message:
// while a message is still streaming we render its raw text (plain, escaped,
// mono) so nothing ever parses as half-finished markdown; the moment the
// stream finishes (or is stopped) the completed text is rendered with
// react-markdown. Completed user turns are also plain text.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  h1: (props: React.ComponentProps<"h1">) => (
    <h1 className="text-lg font-semibold text-ink-900" {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 className="text-base font-semibold text-ink-900" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className="text-sm font-semibold text-ink-900" {...props} />
  ),
  p: (props: React.ComponentProps<"p">) => <p className="text-ink-700" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="list-disc space-y-1 pl-5 text-ink-700" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="list-decimal space-y-1 pl-5 text-ink-700" {...props} />
  ),
  li: (props: React.ComponentProps<"li">) => <li className="text-ink-700" {...props} />,
  a: (props: React.ComponentProps<"a">) => (
    <a
      className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="border-l-2 border-ink-300 pl-3 text-sm italic text-ink-500"
      {...props}
    />
  ),
  code: (props: React.ComponentProps<"code">) => {
    const isBlock = typeof props.className === "string" && /language-/.test(props.className);
    if (isBlock) {
      return <code className="block" {...props} />;
    }
    return (
      <code
        className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink-900"
        {...props}
      />
    );
  },
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      className="overflow-x-auto rounded-xl bg-ink-900 p-4 text-sm text-white [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
};

export function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed [&>*:first-child]:mt-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** Blinking caret shown after text while a reply is still streaming. */
export function StreamingCaret() {
  return (
    <span aria-hidden="true" className="animate-chat-caret text-brand-500" role="presentation">
      ▍
    </span>
  );
}

/** Raw in-flight text: escaped, wrap-friendly, never parsed as markdown. */
export function StreamingText({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-ink-900">
      {text}
    </pre>
  );
}