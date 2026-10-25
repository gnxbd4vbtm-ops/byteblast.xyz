const $ = (id) => document.getElementById(id);
let media = null;

function humanBytes(n) {
  if (!n) return '';
  const units = ['B','KB','MB','GB']; let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}
function clock(seconds) {
  if (!Number.isFinite(seconds)) return '';
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = Math.floor(seconds % 60);
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
}
async function api(url, options = {}) {
  const response = await fetch(url, {headers:{'Content-Type':'application/json'}, ...options});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Something went wrong');
  return body;
}

$('fetch-form').addEventListener('submit', async (event) => {
  event.preventDefault(); $('message').textContent = ''; $('result').classList.add('hidden');
  const button = $('fetch'); button.disabled = true; button.querySelector('span').textContent = 'Fetching…';
  try {
    media = await api('/api/info', {method:'POST', body:JSON.stringify({url:$('url').value})});
    $('thumbnail').src = media.thumbnail || '';
    $('title').textContent = media.title; $('uploader').textContent = media.uploader || 'Unknown creator';
    $('duration').textContent = clock(media.duration);
    $('quality').replaceChildren(...media.formats.map((f, i) => {
      const option = document.createElement('option'); option.value = f.id;
      const bits = [i === 0 ? `Best · ${f.label}` : f.label, f.video_codec, f.has_audio ? f.audio_codec : 'audio merged', humanBytes(f.approximate_size)].filter(Boolean);
      option.textContent = bits.join(' · '); return option;
    }));
    const sub = $('subtitle'); sub.replaceChildren(new Option('None',''), ...media.subtitles.map(x => new Option(x, x)));
    $('subtitle-field').classList.toggle('hidden', !media.subtitles.length);
    $('result').classList.remove('hidden'); $('result').scrollIntoView({behavior:'smooth', block:'center'});
  } catch (error) { $('message').textContent = error.message; }
  finally { button.disabled = false; button.querySelector('span').textContent = 'Fetch'; }
});

$('output').addEventListener('change', () => $('audio-field').classList.toggle('hidden', $('output').value !== 'audio'));
$('download').addEventListener('click', async () => {
  if (!media) return;
  $('download').disabled = true; $('progress-card').classList.remove('hidden');
  try {
    const job = await api('/api/jobs', {method:'POST', body:JSON.stringify({
      url:media.url, format_id:$('quality').value, output:$('output').value,
      audio_format:$('output').value === 'audio' ? $('audio').value : 'original',
      subtitle_language:$('subtitle').value || null
    })});
    watch(job.id);
  } catch (error) { $('message').textContent = error.message; $('download').disabled = false; }
});
function watch(id) {
  const events = new EventSource(`/api/jobs/${id}/events`);
  events.onmessage = ({data}) => {
    const job = JSON.parse(data), percent = Math.round(job.percent || 0);
    $('stage').textContent = job.stage; $('detail').textContent = job.detail; $('percent').textContent = `${percent}%`; $('bar').style.width = `${percent}%`;
    $('size').textContent = job.total_bytes ? `${humanBytes(job.downloaded_bytes)} / ${humanBytes(job.total_bytes)}` : humanBytes(job.downloaded_bytes);
    $('speed').textContent = job.speed ? `${humanBytes(job.speed)}/s` : '';
    $('eta').textContent = job.eta ? `${clock(job.eta)} remaining` : '';
    if (job.stage === 'ready') { events.close(); $('download').disabled = false; window.location.assign(job.download_url); }
    if (job.stage === 'failed') { events.close(); $('download').disabled = false; $('message').textContent = job.detail; }
  };
  events.onerror = () => { events.close(); $('download').disabled = false; $('message').textContent = 'Progress connection was interrupted.'; };
}
