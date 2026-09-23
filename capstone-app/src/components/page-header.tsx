type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
};

export default function PageHeader({ title, eyebrow, description }: PageHeaderProps) {
  return (
    <header className="mb-10 space-y-2">
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-widest text-brand-500">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-ink-500">{description}</p>
      ) : null}
    </header>
  );
}