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

  const apiKey = process.env.YOUTUBE_API_KEY;

  try {
    // Get video title
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const videoData = await videoRes.json();
    const title = videoData.items?.[0]?.snippet?.title || 'Unknown Title';

    // Get caption tracks list
    const captionRes = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
    );
    const captionData = await captionRes.json();

    // Try timedtext API directly (works for most public videos)
    const langs = ['en', 'en-US', 'en-GB', ''];
    let transcript = '';

    for (const lang of langs) {
      const langParam = lang ? `&lang=${lang}` : '';
      const tRes = await fetch(
        `https://www.youtube.com/api/timedtext?v=${videoId}${langParam}&fmt=json3`
      );
      if (!tRes.ok) continue;
      const json = await tRes.json();
      const lines = (json.events || [])
        .filter(e => e.segs)
        .flatMap(e => e.segs.map(s => (s.utf8 || '').replace(/\n/g, ' ')))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (lines.length > 50) { transcript = lines; break; }

      // Try XML fallback
      const xRes = await fetch(
        `https://www.youtube.com/api/timedtext?v=${videoId}${langParam}`
      );
      const xml = await xRes.text();
      const xmlLines = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
        .map(m => m[1]
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
        ).filter(Boolean).join(' ');
      if (xmlLines.length > 50) { transcript = xmlLines; break; }
    }

    if (!transcript) {
      return res.status(404).json({ error: 'No captions available for this video. Try a video with closed captions enabled.' });
    }

    res.status(200).json({ title, transcript, videoId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transcript: ' + err.message });
  }
}