export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  if (!match) return res.status(400).json({ error: 'Invalid YouTube URL' });
  const videoId = match[1];

  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await pageRes.text();

    const titleMatch = html.match(/"title":"([^"]+)"/);
    const title = titleMatch ? titleMatch[1].replace(/\\u0026/g, '&') : 'Unknown Title';

    const captionMatch = html.match(/"captionTracks":\[(\{[^]]*?\})\]/);
    if (!captionMatch) {
      return res.status(404).json({ error: 'No captions available for this video' });
    }

    const captionData = captionMatch[1];
    const urlMatch = captionData.match(/"baseUrl":"([^"]+)"/);
    if (!urlMatch) return res.status(404).json({ error: 'Could not find caption URL' });

    const captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
    const transcriptRes = await fetch(captionUrl);
    const xml = await transcriptRes.text();

    const lines = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
      .map(m => m[1]
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
      ).filter(Boolean);

    res.status(200).json({ title, transcript: lines.join(' '), videoId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transcript: ' + err.message });
  }
}