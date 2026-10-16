const LINK = '</llms.txt>; rel="describedby"; type="text/plain", </index.md>; rel="alternate"; type="text/markdown", </sitemap-index.xml>; rel="sitemap"';
const NOT_FOUND = '# 404: page not found\n\nThere is nothing at this URL. Start from [llms.txt](https://lidarcss.com/llms.txt) or the [sitemap](https://lidarcss.com/sitemap-index.xml).\n';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const wantsMarkdown = /text\/markdown/.test(request.headers.get('Accept') ?? '');

    if (wantsMarkdown && !url.pathname.includes('.')) {
      url.pathname = `${url.pathname.replace(/\/$/, '') || '/index'}.md`;
      const md = await env.ASSETS.fetch(new Request(url, request));
      if (md.ok) return withHeaders(md, { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept' });
    }

    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && wantsMarkdown) {
      return new Response(NOT_FOUND, { status: 404, headers: { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept' } });
    }
    return withHeaders(res, new URL(request.url).pathname === '/' ? { Vary: 'Accept', Link: LINK } : { Vary: 'Accept' });
  },
};

function withHeaders(res, headers) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
  return out;
}
