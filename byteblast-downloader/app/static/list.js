const $ = (id) => document.getElementById(id);

async function api(url, options = {}) {
  const response = await fetch(url, {headers: {'Content-Type': 'application/json'}, ...options});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Something went wrong');
  return body;
}

function parseUrls(value) {
  return [...new Set(value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean))];
}

function chooseFormat(formats, requestedQuality) {
  if (!formats.length) throw new Error('No video formats are available');
  if (requestedQuality === 'best') return formats[0];
  const maximum = Number(requestedQuality);
  return formats.find((format) => format.height && format.height <= maximum) || formats.at(-1);
}

function createRow(url, position) {
  const row = document.createElement('article');
  row.className = 'queue-item';
  row.innerHTML = `
    <div class="queue-title"><strong>${position}.</strong><span></span><b>Waiting</b></div>
    <div class="bar"><i></i></div>
    <small></small>`;
  row.querySelector('span').textContent = url;
  $('queue').append(row);
  return row;
}

function updateRow(row, label, percent = 0, detail = '') {
  row.querySelector('b').textContent = label;
  row.querySelector('.bar i').style.width = `${Math.max(0, Math.min(100, percent))}%`;
  row.querySelector('small').textContent = detail;
}

function waitForJob(jobId, row) {
  return new Promise((resolve, reject) => {
    const events = new EventSource(`/api/jobs/${jobId}/events`);
    events.onmessage = ({data}) => {
      const job = JSON.parse(data);
      updateRow(row, job.stage, Math.round(job.percent || 0), job.detail);
      if (job.stage === 'ready') {
        events.close();
        resolve(job.download_url);
      } else if (job.stage === 'failed') {
        events.close();
        reject(new Error(job.detail));
      }
    };
    events.onerror = () => {
      events.close();
      reject(new Error('Progress connection was interrupted'));
    };
  });
}

function deliver(downloadUrl) {
  const frame = document.createElement('iframe');
  frame.src = downloadUrl;
  frame.title = 'File download';
  $('deliveries').append(frame);
}

async function processUrl(url, row, settings) {
  updateRow(row, 'Fetching', 0, 'Fetching video information');
  const info = await api('/api/info', {method: 'POST', body: JSON.stringify({url})});
  row.querySelector('.queue-title span').textContent = info.title;
  const format = chooseFormat(info.formats, settings.quality);
  updateRow(row, 'Starting', 0, format.label);
  const job = await api('/api/list/jobs', {
    method: 'POST',
    body: JSON.stringify({
      url,
      format_id: format.id,
      output: settings.output,
      audio_format: settings.output === 'audio' ? settings.audio : 'original',
      subtitle_language: null
    })
  });
  const downloadUrl = await waitForJob(job.id, row);
  updateRow(row, 'Downloaded', 100, 'Sending file to your browser');
  deliver(downloadUrl);
}

$('output').addEventListener('change', () => {
  $('audio-field').classList.toggle('hidden', $('output').value !== 'audio');
});

$('list-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const urls = parseUrls($('urls').value);
  if (!urls.length) return;
  if (urls.length > 30) {
    $('message').textContent = 'A list can contain at most 30 URLs.';
    return;
  }
  $('message').textContent = '';
  $('queue').replaceChildren();
  $('queue').classList.remove('hidden');
  const button = $('start');
  button.disabled = true;
  const settings = {quality: $('quality').value, output: $('output').value, audio: $('audio').value};
  const rows = urls.map((url, index) => createRow(url, index + 1));
  let failures = 0;
  for (let index = 0; index < urls.length; index++) {
    try {
      await processUrl(urls[index], rows[index], settings);
    } catch (error) {
      failures++;
      rows[index].classList.add('failed');
      updateRow(rows[index], 'Failed', 0, error.message);
    }
  }
  button.disabled = false;
  $('message').textContent = failures ? `${urls.length - failures} completed, ${failures} failed.` : `All ${urls.length} downloads completed.`;
});
