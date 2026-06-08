import { Eyebrow } from "./bits";

// Shown when the database is not reachable yet (no DATABASE_URL or not pushed).
export function SetupNotice({ detail }: { detail?: string }) {
  const steps: [string, string][] = [
    ["1", "Create a free Postgres at neon.tech. Copy the pooled connection string."],
    ["2", "Add it to .env as DATABASE_URL. See .env.example."],
    ["3", "Run npm run db:push to create the tables."],
    ["4", "Run npm run db:seed to load the placeholder month."],
    ["5", "On Vercel, set DATABASE_URL in Project Settings, then redeploy."],
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Eyebrow>/ SETUP REQUIRED</Eyebrow>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream-light">Connect the database</h1>
      <p className="mt-3 text-dim">
        This tool persists every figure to Postgres so any teammate sees the same live numbers. Point it at a
        Neon database to begin.
      </p>
      <ol className="mt-8 space-y-3">
        {steps.map(([n, t]) => (
          <li key={n} className="flex gap-4 rounded-lg border border-line bg-ink-panel p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-red font-mono text-sm font-bold text-white">{n}</span>
            <span className="text-sm text-cream-base">{t}</span>
          </li>
        ))}
      </ol>
      {detail ? (
        <p className="mt-6 font-mono text-xs text-dim">Detail: {detail}</p>
      ) : null}
    </div>
  );
}
