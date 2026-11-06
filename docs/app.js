import { createPlan } from './plan.js';
const $ = (id) => document.getElementById(id);
const today = new Date().toISOString().slice(0, 10);
const currentYear = Number(today.slice(0, 4));
let plan;
let downloadUrl;
$('start').value = `${currentYear}-01-01`;
$('end').value = today;
$('start').max = today;
$('end').max = today;
function draw() {
  const year = Number($('year').value);
  const first = new Date(Date.UTC(year, 0, 1, 12));
  const last = new Date(Date.UTC(year, 11, 31, 12));
  const start = first.getTime() - first.getUTCDay() * 86400000;
  const end = last.getTime() + (6 - last.getUTCDay()) * 86400000;
  const fragment = document.createDocumentFragment();
  for (let ms = start; ms <= end; ms += 86400000) {
    const date = new Date(ms).toISOString().slice(0, 10);
    const sameYear = Number(date.slice(0, 4)) === year;
    const count = sameYear && date >= plan.start && date <= plan.end ? plan.perDay : 0;
    const cell = document.createElement(sameYear ? 'button' : 'span');
    cell.className = `cell${sameYear ? '' : ' outside'}`;
    if (sameYear) {
      cell.type = 'button';
      const text = `${date}: ${count} simulated commits`;
      cell.title = text;
      cell.setAttribute('aria-label', text);
      if (count) cell.style.background = count <= 2 ? '#164b35' : count <= 5 ? '#287d48' : count <= 10 ? '#54b65b' : '#a6ef75';
      for (const event of ['focus', 'mouseenter', 'click']) cell.addEventListener(event, () => { $('detail').textContent = text; });
    }
    fragment.append(cell);
  }
  $('calendar').replaceChildren(fragment);
  $('chart-title').textContent = `${year} / simulated activity`;
}
function update() {
  try {
    const next = createPlan({ start: $('start').value, end: $('end').value, perDay: $('per-day').value });
    plan = next;
    $('error').textContent = '';
    $('days').textContent = plan.dayCount.toLocaleString('en-US');
    $('total').textContent = plan.total.toLocaleString('en-US');
    const years = Number(plan.end.slice(0, 4)) - Number(plan.start.slice(0, 4)) + 1;
    $('years').textContent = years;
    $('year').replaceChildren();
    for (let year = Number(plan.start.slice(0, 4)); year <= Number(plan.end.slice(0, 4)); year++) {
      const option = document.createElement('option');
      option.value = year; option.textContent = year; $('year').append(option);
    }
    $('year').value = plan.end.slice(0, 4);
    $('command').textContent = `node index.js --start ${plan.start} --end ${plan.end} --per-day ${plan.perDay}`;
    $('copy-status').textContent = '';
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([JSON.stringify({ ...plan, generated: true, timezone: 'UTC' }, null, 2)], { type: 'application/json' }));
    $('download').href = downloadUrl;
    $('download').download = `sponsortest-${plan.start}-${plan.end}.json`;
    $('detail').textContent = 'Hover or focus a day to inspect it.';
    draw();
  } catch (error) { $('error').textContent = error.message; }
}
$('planner').addEventListener('submit', (event) => { event.preventDefault(); update(); });
$('year').addEventListener('change', draw);
$('previous').addEventListener('click', () => { $('start').value = `${currentYear - 1}-01-01`; $('end').value = `${currentYear - 1}-12-31`; update(); });
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('command').textContent); $('copy-status').textContent = 'Command copied.'; }
  catch { $('copy-status').textContent = 'Select the command above and copy it manually.'; }
});
update();
