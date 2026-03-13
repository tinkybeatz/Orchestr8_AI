import type { DashboardData } from './dashboard-server.js';

const CSS = `
:root{--bg:#080d16;--s1:#0e1623;--s2:#131e2e;--border:#1a2744;--text:#dde6f5;
--muted:#3d5280;--accent:#6d8ef5;--green:#2dd4a0;--amber:#f5a623;--red:#f56565}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;
min-height:100vh;padding:40px 48px}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px}
.logo{display:flex;align-items:center;gap:12px}
.logo-mark{width:36px;height:36px;background:linear-gradient(135deg,#4466dd,#8b5cf6);
border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff}
.logo-name{font-size:1.1rem;font-weight:700;letter-spacing:-.01em}
.logo-name span{color:var(--muted);font-weight:400}
.badge-ro{background:var(--s2);border:1px solid var(--border);color:var(--muted);
font-size:.7rem;padding:4px 10px;border-radius:20px;letter-spacing:.06em;text-transform:uppercase}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:44px}
@media(max-width:700px){.stats{grid-template-columns:repeat(2,1fr)}}
.stat{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:20px 22px;
position:relative;overflow:hidden}
.stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.stat:nth-child(1)::before{background:var(--accent)}
.stat:nth-child(2)::before{background:var(--green)}
.stat:nth-child(3)::before{background:var(--amber)}
.stat:nth-child(4)::before{background:#a78bfa}
.stat-label{color:var(--muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.stat-value{font-size:2rem;font-weight:700;letter-spacing:-.02em}
section{margin-bottom:44px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.section-title{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.section-count{background:var(--s2);border:1px solid var(--border);color:var(--muted);
font-size:.65rem;padding:2px 8px;border-radius:20px}
.table-wrap{overflow-x:auto;border-radius:12px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;background:var(--s1)}
thead tr{border-bottom:1px solid var(--border)}
th{padding:11px 16px;text-align:left;font-size:.65rem;font-weight:600;text-transform:uppercase;
letter-spacing:.1em;color:var(--muted);white-space:nowrap;background:var(--s2)}
td{padding:12px 16px;font-size:.85rem;color:var(--text);border-bottom:1px solid var(--border);
vertical-align:middle;max-width:320px;word-break:break-word}
tr:last-child td{border-bottom:none}
tbody tr{transition:background .12s}
tbody tr:hover td{background:var(--s2)}
.mono{font-family:'SF Mono',ui-monospace,monospace;font-size:.75rem;color:var(--muted)}
.ts{font-family:'SF Mono',ui-monospace,monospace;font-size:.72rem;color:var(--muted)}
.chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:6px;font-size:.72rem;font-weight:600}
.chip::before{content:'';width:5px;height:5px;border-radius:50%}
.chip-active{background:#0d2e1a;color:var(--green)}.chip-active::before{background:var(--green)}
.chip-paused{background:#2e1d0d;color:var(--amber)}.chip-paused::before{background:var(--amber)}
.chip-archived{background:var(--s2);color:var(--muted)}.chip-archived::before{background:var(--muted)}
.chip-yes{background:#0d1d3a;color:var(--accent)}.chip-yes::before{background:var(--accent)}
.chip-no{background:var(--s2);color:var(--muted)}.chip-no::before{background:var(--muted)}
.empty{color:var(--muted);font-style:italic;font-size:.85rem}
footer{margin-top:32px;color:var(--muted);font-size:.72rem;border-top:1px solid var(--border);
padding-top:20px;display:flex;justify-content:space-between}
`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmt = (d: Date): string =>
  new Date(d).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

const chip = (status: string): string =>
  `<span class="chip chip-${esc(status)}">${esc(status)}</span>`;

export function renderDashboard(data: DashboardData): string {
  const { projects, workflows, docs, totalChannels, generatedAt } = data;

  const projectRows = projects.length
    ? projects
        .map(
          (r) =>
            `<tr><td class="mono">${esc(r.id.slice(0, 8))}…</td><td>${esc(r.name)}</td>` +
            `<td>${chip(r.status)}</td><td class="mono">${esc(r.n8n_url)}</td>` +
            `<td class="ts">${fmt(r.created_at)}</td></tr>`,
        )
        .join('')
    : `<tr><td colspan="5" class="empty">No projects yet.</td></tr>`;

  const workflowRows = workflows.length
    ? workflows
        .map(
          (r) =>
            `<tr><td class="mono">${esc(r.workflow_id)}</td><td>${esc(r.project_name)}</td>` +
            `<td>${esc(r.name)}</td>` +
            `<td>${chip(r.has_doc ? 'yes' : 'no')}</td>` +
            `<td class="ts">${fmt(r.synced_at)}</td></tr>`,
        )
        .join('')
    : `<tr><td colspan="5" class="empty">No workflows saved yet.</td></tr>`;

  const docRows = docs.length
    ? docs
        .map(
          (r) =>
            `<tr><td>${esc(r.project_name)}</td><td class="mono">${esc(r.doc_type)}</td>` +
            `<td class="mono">${esc(r.slug)}</td><td class="ts">${fmt(r.updated_at)}</td></tr>`,
        )
        .join('')
    : `<tr><td colspan="4" class="empty">No documents saved yet.</td></tr>`;

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="30">
<title>Orchestr8_AI — Dashboard</title>
<style>${CSS}</style></head><body>
<header>
  <div class="logo">
    <div class="logo-mark">O</div>
    <div class="logo-name">Orchestr8_AI <span>/ dashboard</span></div>
  </div>
  <span class="badge-ro">read-only</span>
</header>
<div class="stats">
  <div class="stat"><div class="stat-label">Projects</div><div class="stat-value">${projects.length}</div></div>
  <div class="stat"><div class="stat-label">Workflows</div><div class="stat-value">${workflows.length}</div></div>
  <div class="stat"><div class="stat-label">Documents</div><div class="stat-value">${docs.length}</div></div>
  <div class="stat"><div class="stat-label">Channels</div><div class="stat-value">${totalChannels}</div></div>
</div>
<section>
  <div class="section-header"><span class="section-title">Projects</span><span class="section-count">${projects.length}</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Name</th><th>Status</th><th>N8N URL</th><th>Created</th></tr></thead>
    <tbody>${projectRows}</tbody>
  </table></div>
</section>
<section>
  <div class="section-header"><span class="section-title">Workflows</span><span class="section-count">${workflows.length}</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Workflow ID</th><th>Project</th><th>Name</th><th>Documented</th><th>Synced</th></tr></thead>
    <tbody>${workflowRows}</tbody>
  </table></div>
</section>
<section>
  <div class="section-header"><span class="section-title">Documents</span><span class="section-count">${docs.length}</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Project</th><th>Type</th><th>Slug</th><th>Updated</th></tr></thead>
    <tbody>${docRows}</tbody>
  </table></div>
</section>
<footer>
  <span>Auto-refreshes every 30 s</span>
  <span>Generated ${fmt(generatedAt)}</span>
</footer>
</body></html>`;
}
