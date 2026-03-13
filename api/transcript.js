module.exports = async function handler(req, res) {
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
    const { YoutubeTranscript } = require('youtube-transcript');

    const apiKey = process.env.YOUTUBE_API_KEY;
    let title = 'Unknown Title';
    try {
      const videoRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      );
      const videoData = await videoRes.json();
      title = videoData.items?.[0]?.snippet?.title || title;
    } catch(_) {}

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!transcript) {
      return res.status(404).json({ error: 'No captions available for this video.' });
    }

    res.status(200).json({ title, transcript, videoId });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('disabled') || msg.includes('No transcript')) {
      return res.status(404).json({ error: 'No captions available for this video. The creator may have disabled transcripts.' });
    }
    res.status(500).json({ error: 'Failed to fetch transcript: ' + msg });
  }
}