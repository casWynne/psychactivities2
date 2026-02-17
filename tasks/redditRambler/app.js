/* ============================================================
   Reddit JSON → Report (Serverless, GitHub Pages friendly)

   Features:
   - Upload 1+ Reddit JSON files (structure: [postListing, commentListing])
   - Extract post (t3) + flatten nested comments (t1)
   - Anonymise authors (optional persistence via localStorage)
   - Ethical safeguards (optional):
       - Redact emails
       - Anonymise u/username mentions (optionally map to u/user_###)
       - Redact r/sub mentions (configurable below)
   - Render HTML report + Print-to-PDF
   - Post images (preview/url/gallery) with clickable URLs
   - Comment image thumbnails (from URLs in comment text)
   - Videos (reddit + external) with clickable URL + optional thumbnail
   - Export:
       - TXT report
       - CSV (posts + comments)
       - Coding-ready CSV (with parent context + blank codes/notes)
   - Mapping:
       - Persist in localStorage
       - Download mapping JSON
       - Upload mapping JSON
   ============================================================ */


/* =========================
   0) DOM HOOKS / UI ELEMENTS
   ========================= */
const el = (id) => document.getElementById(id);

// Required
const fileInput = el("fileInput");
const btnParse = el("btnParse");
const btnPrint = el("btnPrint");
const logEl = el("log");
const reportEl = el("report");

// Optional (only enable if present in index.html)
const chkPersistMap = el("chkPersistMap");
const chkHideDeleted = el("chkHideDeleted");
const btnTxt = el("btnTxt");
const btnCsv = el("btnCsv");
const btnCodingCsv = el("btnCodingCsv");

const chkEthics = el("chkEthics");
const chkMapMentions = el("chkMapMentions");
const btnDownloadMap = el("btnDownloadMap");
const mapInput = el("mapInput");

// Last parsed results (for export buttons)
let LAST_FILES_RESULT = null;
let LAST_REPORT_META = null;


/* =========================
   1) CONFIG
   ========================= */
const MAP_KEY = "reddit_report_anon_map_v1";

// If true: redact r/subreddit mentions in post/comment text.
// If you want to preserve subreddit references for analysis, set false.
const REDACT_SUB_MENTIONS = true;

// Participation table size
const TOP_CONTRIBUTORS_N = 15;


/* =========================
   2) LOGGING
   ========================= */
function log(msg) {
  if (!logEl) return;
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}


/* =========================
   3) GENERAL HELPERS
   ========================= */
function isDeletedAuthor(a) {
  return a == null || a === "" || a === "[deleted]" || a === "[removed]";
}

function asDatetimeUTC(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return "";
  const d = new Date(Number(seconds) * 1000);
  return d.toISOString().replace("T", " ").replace("Z", " UTC");
}

function ensureChildrenList(children) {
  return Array.isArray(children) ? children : [];
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function indentPx(depth) {
  const d = Number.isFinite(Number(depth)) ? Number(depth) : 0;
  return Math.min(12 * d, 240);
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}


/* =========================
   4) ETHICS / REDACTION
   ========================= */

// Extract usernames mentioned in text: u/name or /u/name
function extractUserMentions(text) {
  const t = String(text || "");
  const set = new Set();
  const re = /(?:^|[\s(])\/?u\/([A-Za-z0-9_-]{3,20})/gi;
  let m;
  while ((m = re.exec(t)) !== null) set.add(m[1]);
  return [...set];
}

function redactEmails(text) {
  const t = String(text || "");
  return t.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[EMAIL]"
  );
}

function anonymiseMentions(text, map, { mapMentions = true } = {}) {
  let t = String(text || "");

  // u/name or /u/name
  t = t.replace(/(^|[\s(])\/?u\/([A-Za-z0-9_-]{3,20})/gi, (full, prefix, user) => {
    if (!mapMentions) return `${prefix}u/[USER]`;
    const anon = map.get(user);
    return anon ? `${prefix}u/${anon}` : `${prefix}u/[USER]`;
  });

  // r/sub or /r/sub
  if (REDACT_SUB_MENTIONS) {
    t = t.replace(/(^|[\s(])\/?r\/([A-Za-z0-9_]{2,21})/gi, (full, prefix) => {
      return `${prefix}r/[SUB]`;
    });
  }

  return t;
}

function applyEthicalSafeguards(text, map, opts) {
  if (!opts.ethicsOn) return String(text || "");
  let t = String(text || "");
  t = redactEmails(t);
  t = anonymiseMentions(t, map, { mapMentions: opts.mapMentions });
  return t;
}


/* =========================
   5) URL NORMALISATION + MEDIA DETECTION
   ========================= */

// Normalise Reddit preview URLs so we don’t duplicate images
function normaliseRedditImageUrl(url) {
  if (!url) return "";

  let u = String(url)
    .replaceAll("&amp;", "&")
    .replaceAll("&#x2F;", "/");

  u = u.split("?")[0];

  u = u.replace("https://preview.redd.it/", "https://i.redd.it/")
       .replace("http://preview.redd.it/", "https://i.redd.it/");

  return u;
}

function isProbablyImageUrl(url) {
  if (!url) return false;
  const u = String(url).toLowerCase();
  return u.includes("i.redd.it/") || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(u);
}

function getPostImageUrls(t3) {
  const urls = new Set();

  // preview
  const prev = t3?.preview?.images?.[0];
  if (prev?.source?.url) {
    const nu = normaliseRedditImageUrl(prev.source.url);
    if (nu) urls.add(nu);
  }

  // direct url / overridden
  const u1 = t3?.url_overridden_by_dest;
  const u2 = t3?.url;
  for (const u of [u1, u2]) {
    if (!u) continue;
    const nu = normaliseRedditImageUrl(u);
    if (/\.(png|jpe?g|gif|webp)$/i.test(nu) || nu.includes("i.redd.it/")) urls.add(nu);
  }

  // gallery
  if (t3?.is_gallery && t3?.media_metadata) {
    for (const key of Object.keys(t3.media_metadata)) {
      const mm = t3.media_metadata[key];
      const galleryUrl = mm?.s?.u;
      if (galleryUrl) {
        const nu = normaliseRedditImageUrl(galleryUrl);
        if (nu) urls.add(nu);
      }
    }
  }

  return [...urls];
}

function getPostVideoInfo(t3) {
  const rv1 = t3?.secure_media?.reddit_video?.fallback_url;
  const rv2 = t3?.media?.reddit_video?.fallback_url;
  const redditVideoUrl = rv1 || rv2;

  if (redditVideoUrl) {
    const thumb =
      t3?.secure_media?.oembed?.thumbnail_url ||
      t3?.media?.oembed?.thumbnail_url ||
      t3?.preview?.images?.[0]?.source?.url ||
      "";

    return {
      type: "reddit",
      url: String(redditVideoUrl),
      thumbnail: normaliseRedditImageUrl(thumb),
      provider: "Reddit"
    };
  }

  const oembed = t3?.secure_media?.oembed || t3?.media?.oembed;
  const extUrl = t3?.url_overridden_by_dest || t3?.url || "";

  const domain = String(t3?.domain || "").toLowerCase();
  const looksVideoDomain =
    /(youtube\.com|youtu\.be|vimeo\.com|streamable\.com|twitch\.tv)/i.test(domain);

  if (oembed?.thumbnail_url || looksVideoDomain) {
    return {
      type: "external",
      url: String(extUrl),
      thumbnail: normaliseRedditImageUrl(oembed?.thumbnail_url || ""),
      provider: oembed?.provider_name || t3?.domain || "External"
    };
  }

  if (String(extUrl).includes("v.redd.it/")) {
    const thumb = t3?.preview?.images?.[0]?.source?.url || "";
    return {
      type: "reddit",
      url: String(extUrl),
      thumbnail: normaliseRedditImageUrl(thumb),
      provider: "Reddit"
    };
  }

  return null;
}


/* =========================
   6) COMMENT URL EXTRACTION + RENDERING
   ========================= */

function extractUrlsFromCommentBody(text) {
  const urls = new Set();
  const t = String(text || "");

  // Markdown links: [text](url)
  const mdLinkRe = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi;
  let m;
  while ((m = mdLinkRe.exec(t)) !== null) urls.add(m[1]);

  // Bare URLs
  const bareRe = /(https?:\/\/[^\s<>()]+)\b/gi;
  while ((m = bareRe.exec(t)) !== null) urls.add(m[1]);

  return [...urls];
}

function renderCommentBody(bodyText, { renderImages = true } = {}) {
  const raw = String(bodyText || "");

  let safe = escapeHtml(raw);

  // Linkify URLs
  const urlRe = /(https?:\/\/[^\s<>()]+)\b/gi;
  safe = safe.replace(urlRe, (match) => {
    const href = match;
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(match)}</a>`;
  });

  if (!renderImages) return safe;

  const urls = extractUrlsFromCommentBody(raw)
    .map(normaliseRedditImageUrl)
    .filter(isProbablyImageUrl);

  if (!urls.length) return safe;

  const thumbs = urls
    .map((u) => `<img class="commentimg" src="${escapeHtml(u)}" alt="Comment image">`)
    .join("");

  return `${safe}<div class="commentimgs">${thumbs}</div>`;
}


/* =========================
   7) FIND POST + FLATTEN COMMENTS
   ========================= */
function findT3(postListing) {
  const kids = ensureChildrenList(postListing?.data?.children);
  for (const it of kids) {
    if (it?.kind === "t3" && it?.data) return it.data;
  }
  return null;
}

function flattenComments(commentListing, sourceFile, postFullname) {
  const out = [];
  const rootKids = ensureChildrenList(commentListing?.data?.children);
  const stack = [...rootKids].reverse();

  while (stack.length) {
    const item = stack.pop();
    if (!item || item.kind !== "t1" || !item.data) continue;

    const d = item.data;

    out.push({
      source_file: sourceFile,
      post_id: postFullname,
      comment_id: d.name ?? "",
      parent_id: d.parent_id ?? "",
      depth: d.depth ?? 0,
      author_raw: d.author ?? "",
      created_utc: d.created_utc ?? null,
      created_dt_utc: asDatetimeUTC(d.created_utc),
      score: d.score ?? null,
      body: d.body ?? ""
    });

    const repliesKids = ensureChildrenList(d?.replies?.data?.children);
    for (let i = repliesKids.length - 1; i >= 0; i--) stack.push(repliesKids[i]);
  }

  return out;
}


/* =========================
   8) ANONYMISATION MAPPING
   ========================= */
function loadMap() {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function saveMap(map) {
  const obj = Object.fromEntries(map.entries());
  localStorage.setItem(MAP_KEY, JSON.stringify(obj));
}

function nextUserId(n) {
  return `user_${String(n).padStart(3, "0")}`;
}

function ensureMapped(map, authors) {
  const unique = [...new Set(authors)].filter((a) => !isDeletedAuthor(a));
  let count = map.size;

  for (const a of unique) {
    if (!map.has(a)) {
      count += 1;
      map.set(a, nextUserId(count));
    }
  }
}


/* =========================
   9) PRINT SAFETY: WAIT FOR IMAGES
   ========================= */
async function waitForImages(container) {
  const imgs = [...container.querySelectorAll("img")];
  if (!imgs.length) return;

  await Promise.allSettled(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })
  );
}


/* =========================
   10) EXPORT HELPERS
   ========================= */
function downloadBlob(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// CSV helpers
function csvEscape(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function toCSV(rows, columns) {
  const header = columns.map(csvEscape).join(",");
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n");
}


/* =========================
   11) EXPORT BUILDERS: TXT / CSV / CODING CSV
   ========================= */
function buildTxtReport(filesResult, reportMeta) {
  const lines = [];

  lines.push("============================================================");
  lines.push("REDDIT EXTRACTION REPORT (TXT)");
  lines.push("============================================================");
  if (reportMeta) {
    lines.push(`Report created (UTC): ${reportMeta.createdUTC}`);
    lines.push(`Files processed:      ${reportMeta.totalFiles}`);
    lines.push(`Total posts:          ${reportMeta.totalPosts}`);
    lines.push(`Total comments:       ${reportMeta.totalComments}`);
    lines.push(`Total post images:    ${reportMeta.totalImages}`);
    lines.push(`Total post videos:    ${reportMeta.totalVideos}`);
    lines.push(`Anonymised users:     ${reportMeta.mappingSize}`);
    lines.push(`Mapping persistence:  ${reportMeta.persistenceEnabled ? "Yes" : "No"}`);
  }
  lines.push("");

  for (const fr of filesResult) {
    const p = fr.post;

    lines.push("============================================================");
    lines.push(`FILE: ${fr.source_file}`);
    lines.push(`POST ID: ${p.post_id || ""}`);
    lines.push(`DATE (UTC): ${p.created_dt_utc || ""}`);
    lines.push(`SUBREDDIT: ${p.subreddit || ""}`);
    lines.push(`AUTHOR: ${p.author_anon || ""}`);
    lines.push(`TITLE: ${p.title || ""}`);
    lines.push("------------------------------------------------------------");
    lines.push("POST TEXT:");
    lines.push(p.selftext ? p.selftext : "[No post text]");
    lines.push("");

    const imgs = p.image_urls || [];
    if (imgs.length) {
      lines.push(`IMAGES (${imgs.length}):`);
      for (const u of imgs) lines.push(`- ${u}`);
      lines.push("");
    }

    if (p.video?.url) {
      lines.push("VIDEO:");
      lines.push(`Provider: ${p.video.provider || ""}`);
      lines.push(`URL: ${p.video.url}`);
      if (p.video.thumbnail) lines.push(`Thumbnail: ${p.video.thumbnail}`);
      lines.push("");
    }

    lines.push(`COMMENTS (${fr.comments.length}):`);
    if (!fr.comments.length) {
      lines.push("[No comments found]");
      lines.push("");
      continue;
    }

    const comms = [...fr.comments].sort((a, b) => {
      const ta = a.created_utc ?? 0;
      const tb = b.created_utc ?? 0;
      if (ta !== tb) return ta - tb;
      return (a.depth ?? 0) - (b.depth ?? 0);
    });

    for (const c of comms) {
      const indent = "  ".repeat(Math.max(0, Number(c.depth ?? 0)));
      lines.push(
        `${indent}- Comment: ${c.comment_id || ""} | Parent: ${c.parent_id || ""} | Author: ${c.author_anon || ""} | Date(UTC): ${c.created_dt_utc || ""} | Score: ${c.score ?? ""}`
      );
      lines.push(`${indent}  ${c.body || ""}`);

      const mediaLinks = extractUrlsFromCommentBody(c.body || "")
        .map(normaliseRedditImageUrl)
        .filter(isProbablyImageUrl);

      for (const u of mediaLinks) lines.push(`${indent}  [image] ${u}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function buildCsvData(filesResult) {
  const postsRows = filesResult.map((fr) => {
    const p = fr.post;
    return {
      source_file: fr.source_file,
      post_id: p.post_id || "",
      subreddit: p.subreddit || "",
      title: p.title || "",
      selftext: p.selftext || "",
      url: p.url || "",
      permalink: p.permalink || "",
      author_anon: p.author_anon || "",
      created_dt_utc: p.created_dt_utc || "",
      score: p.score ?? "",
      num_comments: p.num_comments ?? "",
      image_urls: (p.image_urls || []).join(" | "),
      video_url: p.video?.url || "",
      video_provider: p.video?.provider || "",
      video_thumbnail: p.video?.thumbnail || ""
    };
  });

  const commentsRows = [];
  for (const fr of filesResult) {
    const p = fr.post;
    for (const c of fr.comments) {
      commentsRows.push({
        source_file: fr.source_file,
        post_id: p.post_id || "",
        post_title: p.title || "",
        post_selftext: p.selftext || "",
        post_created_dt_utc: p.created_dt_utc || "",
        comment_id: c.comment_id || "",
        parent_id: c.parent_id || "",
        depth: c.depth ?? "",
        author_anon: c.author_anon || "",
        created_dt_utc: c.created_dt_utc || "",
        score: c.score ?? "",
        body: c.body || "",
        comment_image_urls: extractUrlsFromCommentBody(c.body || "")
          .map(normaliseRedditImageUrl)
          .filter(isProbablyImageUrl)
          .join(" | ")
      });
    }
  }

  const postsCols = [
    "source_file","post_id","subreddit","title","selftext","url","permalink",
    "author_anon","created_dt_utc","score","num_comments",
    "image_urls","video_url","video_provider","video_thumbnail"
  ];

  const commentsCols = [
    "source_file",
    "post_id","post_title","post_selftext","post_created_dt_utc",
    "comment_id","parent_id","depth",
    "author_anon","created_dt_utc","score",
    "body","comment_image_urls"
  ];

  return {
    postsCsv: toCSV(postsRows, postsCols),
    commentsCsv: toCSV(commentsRows, commentsCols)
  };
}

function buildCodingReadyCsv(filesResult, { includeParentText = true } = {}) {
  const rows = [];

  for (const fr of filesResult) {
    const p = fr.post;

    // comment_id -> comment object
    const byId = new Map();
    for (const c of fr.comments) {
      if (c.comment_id) byId.set(c.comment_id, c);
    }

    for (const c of fr.comments) {
      const parentText =
        includeParentText && c.parent_id && byId.has(c.parent_id)
          ? (byId.get(c.parent_id).body || "")
          : "";

      rows.push({
        source_file: fr.source_file,
        post_id: p.post_id || "",
        subreddit: p.subreddit || "",
        post_title: p.title || "",
        post_created_dt_utc: p.created_dt_utc || "",
        comment_id: c.comment_id || "",
        parent_id: c.parent_id || "",
        depth: c.depth ?? "",
        author_anon: c.author_anon || "",
        created_dt_utc: c.created_dt_utc || "",
        score: c.score ?? "",
        comment_text: c.body || "",
        parent_comment_text: parentText,
        codes: "",
        notes: ""
      });
    }
  }

  const columns = [
    "source_file",
    "post_id",
    "subreddit",
    "post_title",
    "post_created_dt_utc",
    "comment_id",
    "parent_id",
    "depth",
    "author_anon",
    "created_dt_utc",
    "score",
    "comment_text",
    "parent_comment_text",
    "codes",
    "notes"
  ];

  return toCSV(rows, columns);
}


/* =========================
   12) PARTICIPATION SUMMARY
   ========================= */
function buildParticipationSummary(filesResult) {
  const counts = new Map(); // author_anon -> count

  for (const fr of filesResult) {
    for (const c of fr.comments) {
      const a = c.author_anon || "";
      if (!a) continue;
      counts.set(a, (counts.get(a) || 0) + 1);
    }
  }

  const total = [...counts.values()].reduce((s, n) => s + n, 0);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return { totalAuthors: counts.size, totalCommentsWithAuthor: total, top: sorted };
}


/* =========================
   13) RENDER REPORT (HTML)
   ========================= */
function renderReport(filesResult, opts, reportMeta) {
  const hideDeleted = !!opts?.hideDeleted;

  // Participation stats FIRST (fixes your crash)
  const part = buildParticipationSummary(filesResult);
  const topN = part.top.slice(0, TOP_CONTRIBUTORS_N);

  const summaryHtml = reportMeta ? `
    <section class="reportlog">
      <h2>Report Summary</h2>
      <div><b>Report created:</b> ${escapeHtml(reportMeta.createdUTC)}</div>
      <div><b>Files processed:</b> ${reportMeta.totalFiles}</div>
      <div><b>Total posts:</b> ${reportMeta.totalPosts}</div>
      <div><b>Total comments:</b> ${reportMeta.totalComments}</div>
      <div><b>Total post images:</b> ${reportMeta.totalImages}</div>
      <div><b>Total post videos:</b> ${reportMeta.totalVideos}</div>
      <div><b>Anonymised users:</b> ${reportMeta.mappingSize}</div>
      <div><b>Mapping persistence enabled:</b> ${reportMeta.persistenceEnabled ? "Yes" : "No"}</div>

      <div class="participation">
        <h3>User participation</h3>
        <div><b>Unique anonymised users in comments:</b> ${part.totalAuthors}</div>
        <div><b>Total attributed comments:</b> ${part.totalCommentsWithAuthor}</div>

        ${topN.length ? `
          <table class="ptab">
            <thead>
              <tr><th>User</th><th>Comments</th><th>%</th></tr>
            </thead>
            <tbody>
              ${topN.map(([user, n]) => {
                const pct = part.totalCommentsWithAuthor
                  ? ((n / part.totalCommentsWithAuthor) * 100).toFixed(1)
                  : "0.0";
                return `<tr><td>${escapeHtml(user)}</td><td>${n}</td><td>${pct}</td></tr>`;
              }).join("")}
            </tbody>
          </table>
        ` : `<div>No attributed users (all deleted/removed).</div>`}
      </div>
    </section>
  ` : "";

  const parts = [];

  for (const fr of filesResult) {
    const p = fr.post;

    const imgs = p.image_urls || [];
    const imagesHtml = imgs.length ? `
      <div class="images">
        <h4>Images (${imgs.length})</h4>
        ${imgs.map((u) => `
          <div class="imageblock">
            <img class="postimg" src="${escapeHtml(u)}" alt="Post image">
            <div class="imagelink">
              <b>Image URL:</b><br>
              <a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u)}</a>
            </div>
          </div>
        `).join("")}
      </div>
    ` : "";

    const v = p.video;
    const videoHtml = v ? `
      <div class="video">
        <h4>Video</h4>
        ${v.thumbnail ? `<img class="videothumb" src="${escapeHtml(v.thumbnail)}" alt="Video thumbnail">` : ""}
        <div class="vmeta">
          <div><b>Provider:</b> ${escapeHtml(v.provider || "")}</div>
          <div class="videolink">
            <b>Video URL:</b><br>
            <a href="${escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(v.url)}</a>
          </div>
        </div>
        <div class="note">Note: Videos are not embedded in the PDF. Use the link above to view.</div>
      </div>
    ` : "";

    parts.push(`
      <article class="post">
        <div class="meta">
          <span><b>File:</b> ${escapeHtml(fr.source_file)}</span>
          <span><b>Subreddit:</b> ${escapeHtml(p.subreddit || "")}</span>
          <span><b>Date:</b> ${escapeHtml(p.created_dt_utc || "")}</span>
          <span><b>Post ID:</b> ${escapeHtml(p.post_id || "")}</span>
          <span><b>Author:</b> ${escapeHtml(p.author_anon || "")}</span>
        </div>

        <h3>${escapeHtml(p.title || "")}</h3>

        <div class="pre"><b>Post text</b>\n\n${escapeHtml(p.selftext ? p.selftext : "[No post text]")}</div>

        ${imagesHtml}
        ${videoHtml}

        <section class="comments">
          <h4>Comments (${fr.comments.length})</h4>

          ${fr.comments.map((c) => {
            const deleted = isDeletedAuthor(c.author_raw);
            if (hideDeleted && deleted) return "";

            return `
              <div class="comment" style="margin-left:${indentPx(c.depth)}px">
                <div class="cmeta">
                  <b>${escapeHtml(c.author_anon || "")}</b>
                  <span> · ${escapeHtml(c.created_dt_utc || "")}</span>
                  <span> · score: ${escapeHtml(c.score ?? "")}</span>
                  <span> · id: ${escapeHtml(c.comment_id || "")}</span>
                </div>
                <div class="cbody">${renderCommentBody(c.body || "", { renderImages: true })}</div>
              </div>
            `;
          }).join("")}
        </section>
      </article>
    `);
  }

  reportEl.innerHTML = summaryHtml + parts.join("");
}


/* =========================
   14) MAPPING IMPORT/EXPORT UI
   ========================= */
if (btnDownloadMap) {
  btnDownloadMap.addEventListener("click", () => {
    const map = loadMap();
    const obj = Object.fromEntries(map.entries());
    downloadBlob("anon_map.json", "application/json;charset=utf-8", JSON.stringify(obj, null, 2));
  });
}

if (mapInput) {
  mapInput.addEventListener("change", async () => {
    const file = mapInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const obj = JSON.parse(text);

      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        alert("Mapping file must be a JSON object of { username: anon_id }");
        return;
      }

      for (const [k, v] of Object.entries(obj)) {
        if (typeof k !== "string" || typeof v !== "string") {
          alert("Invalid mapping format (keys/values must be strings).");
          return;
        }
      }

      localStorage.setItem(MAP_KEY, JSON.stringify(obj));
      log(`✅ Mapping loaded from file (${Object.keys(obj).length} users).`);
    } catch (e) {
      alert("Could not read mapping JSON: " + (e?.message || e));
    } finally {
      mapInput.value = "";
    }
  });
}


/* =========================
   15) MAIN: PARSE BUTTON HANDLER
   ========================= */
btnParse.addEventListener("click", async () => {
  // Reset UI
  if (logEl) logEl.textContent = "";
  if (reportEl) reportEl.innerHTML = `<p class="hint">Parsing…</p>`;

  if (btnPrint) btnPrint.disabled = true;
  if (btnTxt) btnTxt.disabled = true;
  if (btnCsv) btnCsv.disabled = true;
  if (btnCodingCsv) btnCodingCsv.disabled = true;

  LAST_FILES_RESULT = null;
  LAST_REPORT_META = null;

  const files = [...(fileInput?.files || [])];
  if (!files.length) {
    if (reportEl) reportEl.innerHTML = `<p class="hint">No files selected.</p>`;
    log("No files selected.");
    return;
  }

  log(`Found ${files.length} file(s).`);

  // Read UI toggles safely (in case element missing)
  const persist = !!chkPersistMap?.checked;
  const hideDeleted = !!chkHideDeleted?.checked;

  const ethicsOn = !!chkEthics?.checked;
  const mapMentions = !!chkMapMentions?.checked;

  const map = persist ? loadMap() : new Map();
  if (persist) log(`Loaded mapping (${map.size} user(s)) from localStorage.`);

  const filesResult = [];

  for (const file of files) {
    log(`Processing: ${file.name}`);

    let raw;
    try {
      raw = JSON.parse(await file.text());
    } catch (e) {
      log(`  ❌ Failed to parse JSON: ${e?.message || e}`);
      continue;
    }

    if (!Array.isArray(raw) || raw.length < 2) {
      log(`  ❌ Unexpected structure (expected [postListing, commentListing]). Skipping.`);
      continue;
    }

    const postListing = raw[0];
    const commentListing = raw[1];

    const t3 = findT3(postListing);
    if (!t3) {
      log(`  ❌ No t3 post found. Skipping.`);
      continue;
    }

    const post_id = t3.name ?? "";
    const post = {
      source_file: file.name,
      post_id,
      subreddit: t3.subreddit_name_prefixed ?? "",
      title: t3.title ?? "",
      selftext: t3.selftext ?? "",
      url: t3.url ?? "",
      permalink: t3.permalink ?? "",
      author_raw: t3.author ?? "",
      created_utc: t3.created_utc ?? null,
      created_dt_utc: asDatetimeUTC(t3.created_utc),
      score: t3.score ?? null,
      num_comments: t3.num_comments ?? null,
      image_urls: getPostImageUrls(t3),
      video: getPostVideoInfo(t3),
      author_anon: ""
    };

    const comments = flattenComments(commentListing, file.name, post_id);

    // 1) Map real authors
    const authorsThisFile = [post.author_raw, ...comments.map((c) => c.author_raw)];
    ensureMapped(map, authorsThisFile);

    // 2) Map mentioned usernames (optional)
    if (mapMentions) {
      const mentioned = [
        ...extractUserMentions(post.title),
        ...extractUserMentions(post.selftext),
        ...comments.flatMap((c) => extractUserMentions(c.body))
      ];
      ensureMapped(map, mentioned);
    }

    // 3) Apply anon IDs
    post.author_anon = isDeletedAuthor(post.author_raw) ? "" : (map.get(post.author_raw) || "");
    for (const c of comments) {
      c.author_anon = isDeletedAuthor(c.author_raw) ? "" : (map.get(c.author_raw) || "");
    }

    // 4) Apply ethical safeguards to text (post + comments)
    const ethicsOpts = { ethicsOn, mapMentions };
    post.title = applyEthicalSafeguards(post.title, map, ethicsOpts);
    post.selftext = applyEthicalSafeguards(post.selftext, map, ethicsOpts);
    for (const c of comments) c.body = applyEthicalSafeguards(c.body, map, ethicsOpts);

    filesResult.push({ source_file: file.name, post, comments });

    log(`  ✅ Post + ${comments.length} comment(s). Images: ${post.image_urls.length} Videos: ${post.video ? 1 : 0}`);
  }

  if (!filesResult.length) {
    if (reportEl) reportEl.innerHTML = `<p class="hint">No usable files parsed. Check the log.</p>`;
    log("Done (no usable files).");
    return;
  }

  if (persist) {
    saveMap(map);
    log(`Saved mapping (${map.size} user(s)) to localStorage.`);
  }

  const totalPosts = filesResult.length;
  const totalComments = filesResult.reduce((sum, f) => sum + f.comments.length, 0);
  const totalImages = filesResult.reduce((sum, f) => sum + (f.post.image_urls?.length || 0), 0);
  const totalVideos = filesResult.reduce((sum, f) => sum + (f.post.video ? 1 : 0), 0);

  const reportMeta = {
    createdUTC: new Date().toISOString().replace("T", " ").replace("Z", " UTC"),
    totalFiles: files.length,
    totalPosts,
    totalComments,
    totalImages,
    totalVideos,
    mappingSize: map.size,
    persistenceEnabled: persist
  };

  renderReport(filesResult, { hideDeleted }, reportMeta);

  log("Waiting for images to load (so they print properly)...");
  await waitForImages(reportEl);
  log("Images ready.");

  LAST_FILES_RESULT = filesResult;
  LAST_REPORT_META = reportMeta;

  if (btnPrint) btnPrint.disabled = false;
  if (btnTxt) btnTxt.disabled = false;
  if (btnCsv) btnCsv.disabled = false;
  if (btnCodingCsv) btnCodingCsv.disabled = false;

  log("Done. Report ready.");
});


/* =========================
   16) DOWNLOAD / PRINT BUTTON HANDLERS
   ========================= */
if (btnPrint) {
  btnPrint.addEventListener("click", () => window.print());
}

if (btnTxt) {
  btnTxt.addEventListener("click", () => {
    if (!LAST_FILES_RESULT) return;
    const stamp = nowStamp();
    const txt = buildTxtReport(LAST_FILES_RESULT, LAST_REPORT_META);
    downloadBlob(`reddit_report_${stamp}.txt`, "text/plain;charset=utf-8", txt);
  });
}

if (btnCsv) {
  btnCsv.addEventListener("click", () => {
    if (!LAST_FILES_RESULT) return;
    const stamp = nowStamp();
    const { postsCsv, commentsCsv } = buildCsvData(LAST_FILES_RESULT);
    downloadBlob(`reddit_posts_${stamp}.csv`, "text/csv;charset=utf-8", postsCsv);
    downloadBlob(`reddit_comments_${stamp}.csv`, "text/csv;charset=utf-8", commentsCsv);
  });
}

if (btnCodingCsv) {
  btnCodingCsv.addEventListener("click", () => {
    if (!LAST_FILES_RESULT) return;
    const stamp = nowStamp();
    const csv = buildCodingReadyCsv(LAST_FILES_RESULT, { includeParentText: true });
    downloadBlob(`reddit_coding_ready_${stamp}.csv`, "text/csv;charset=utf-8", csv);
  });
}
