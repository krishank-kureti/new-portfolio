import Link from "next/link";

const modules = [
  ["PROJECTS", "Add projects, connect a public or private GitHub repository, and start ingestion."],
  ["INBOX", "Read collaboration messages and see when Telegram notifications were sent."],
  ["ORBIT", "Inspect ingestion health and test the codebase-aware assistant before publishing."],
];

export default function AdminPage() {
  return <main className="admin-page"><header className="admin-header"><Link href="/" className="wordmark">KK<span>●</span></Link><span className="eyebrow">PRIVATE WORKSPACE / ADMIN</span><button className="admin-login">CONTINUE WITH GITHUB ↗</button></header><section className="admin-hero"><span className="eyebrow">CONTROL ROOM / 2026</span><h1>Make the work<br /><em>legible.</em></h1><p>The admin workspace will let you publish projects without touching the portfolio code. Connect GitHub once, then Orbit can ingest and explain each repository.</p></section><section className="admin-grid">{modules.map(([title, text], index) => <article key={title} className="admin-card"><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p><button>OPEN MODULE <b>↗</b></button></article>)}</section><footer className="admin-footer"><span>NEON + PGVECTOR / GITHUB OAUTH / TELEGRAM</span><Link href="/">← Back to portfolio</Link></footer></main>;
}
