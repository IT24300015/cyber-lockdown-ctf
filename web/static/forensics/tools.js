// Nova Tech Internal Archive — Investigation Tools

// ==== DATA ====
const EXIF_DATA = {
  'File Name':    'badge.jpg',
  'File Size':    '11.8 KB',
  'MIME Type':    'image/jpeg',
  'Image Width':  '600 px',
  'Image Height': '380 px',
  'Software':     'Nova Tech ID Card Generator v3.2',
  'Author':       'Nova Tech Security Team',
  'Description':  'Employee access badge - 2026',
  'Copyright':    'Nova Tech Solutions Ltd',
};

// What hex viewer shows — mostly ordinary bytes with readable ASCII
const HEX_LINES = [
  '89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52',
  '00 00 02 58 00 00 01 7C 08 02 00 00 00 45 87 A1',
  '2C 00 00 00 09 70 48 59 73 00 00 0B 13 00 00 0B',
  '13 01 00 9A 9C 18 00 00 00 1C 74 45 58 74 53 6F',
  '66 74 77 61 72 65 00 4E 6F 76 61 20 54 65 63 68',
  '20 49 44 20 43 61 72 64 20 47 65 6E 65 72 61 74',
  '6F 72 20 76 33 2E 32 00 00 00 1A 74 45 58 74 41',
  '75 74 68 6F 72 00 4E 6F 76 61 20 54 65 63 68 20',
  '53 65 63 75 72 69 74 79 20 54 65 61 6D 00 00 00',
  '2E 74 45 58 74 44 65 73 63 72 69 70 74 69 6F 6E',
  '00 45 6D 70 6C 6F 79 65 65 20 61 63 63 65 73 73',
  '20 62 61 64 67 65 20 2D 20 32 30 32 36 00 00 00',
  '32 74 45 58 74 43 6F 70 79 72 69 67 68 74 00 4E',
  '6F 76 61 20 54 65 63 68 20 53 6F 6C 75 74 69 6F',
  '6E 73 20 4C 74 64 00 00 00 00 49 45 4E 44 AE 42',
  '60 82                                          ',
];

const VALID_USERNAMES = {
  'auditr_2026': {
    token: 'L3NlY3VyZS9hdWRpdC0yMDI2LmxvZw==',
    note: 'Record retrieved — encrypted token attached.'
  }
};

// ==== UI ====
const preview = document.getElementById('preview');
const previewTitle = document.getElementById('previewTitle');
const toolButtons = document.querySelectorAll('.toolGrid button');
const clearBtn = document.getElementById('clearBtn');
const searchInput = document.getElementById('userSearch');
const searchBtn = document.getElementById('searchBtn');
const searchResult = document.getElementById('searchResult');
const imageBox = document.getElementById('imageBox');

function clearOutput() {
  preview.innerHTML = '<span class="loading">Select a tool above to inspect the image...</span>';
  previewTitle.textContent = 'Output';
  toolButtons.forEach(b => b.classList.remove('active'));
  imageBox.innerHTML = '<img id="badgeImage" src="badge.jpg" alt="Recovered Nova Tech ID badge" />';
}
clearBtn.addEventListener('click', clearOutput);

function renderOutput(title, html) {
  previewTitle.textContent = title;
  preview.innerHTML = html;
}
function showLoading(title, message) {
  previewTitle.textContent = title;
  preview.innerHTML = `<span class="loading">${message}</span>`;
}

// ==== EXIF VIEWER — no hint, only benign metadata ====
function runExif() {
  showLoading('EXIF Viewer', 'Parsing image metadata...');
  setTimeout(() => {
    let html = `<span class="label">=== EXIF METADATA ===</span>\n\n`;
    for (const [k, v] of Object.entries(EXIF_DATA)) {
      html += `  ${k.padEnd(16)} : ${v}\n`;
    }
    html += `\n<span class="label">Note:</span> No suspicious metadata found.`;
    html += `\n<span class="label">Hint:</span> The employee badge itself may contain visible identifying info.`;
    renderOutput('EXIF Viewer', html);
  }, 400);
}

// ==== HEX VIEWER — no flag visible ====
function runHex() {
  showLoading('Hex Viewer', 'Reading file bytes...');
  setTimeout(() => {
    let html = `<span class="label">=== HEX VIEW (offset 0x0000) ===</span>\n\n`;
    html += `  Offset    Bytes                                         ASCII\n`;
    html += `  ------    --------------------------------------------  ----------------\n`;
    HEX_LINES.forEach((line, i) => {
      const offset = (i * 16).toString(16).padStart(6, '0');
      const ascii = line.trim().split(' ').map(h => {
        if (!h || h.length !== 2) return ' ';
        const n = parseInt(h, 16);
        return (n >= 32 && n <= 126) ? String.fromCharCode(n) : '.';
      }).join('');
      html += `  ${offset}    ${line.padEnd(44)}  ${ascii}\n`;
    });
    html += `\n<span class="label">Note:</span> Standard PNG chunks present. No hidden data found in header.`;
    renderOutput('Hex Viewer', html);
  }, 400);
}

// ==== BASE64 DECODER — user must supply input ====
function runBase64() {
  previewTitle.textContent = 'Base64 Decoder';
  preview.innerHTML = `
<span class="label">=== BASE64 DECODER ===</span>

Paste a Base64 string to decode it:

<input id="b64input" type="text" placeholder="paste base64 here..." style="
  width: 100%; padding: 8px; margin-top: 8px;
  font-family: monospace; border: 1px solid #cbd5e0;
  border-radius: 4px; outline: none;
" />

<button id="b64decode" style="
  margin-top: 8px; padding: 8px 16px; background: #2456a0;
  color: #fff; border: 0; border-radius: 4px; cursor: pointer;
  font-weight: 600;
">Decode</button>

<pre id="b64output" style="
  margin-top: 12px; padding: 10px; background: #f7fafc;
  border-left: 3px solid #2456a0; border-radius: 3px;
  font-size: 0.85rem; min-height: 40px;
">Result will appear here...</pre>
  `;
  document.getElementById('b64decode').addEventListener('click', () => {
    const input = document.getElementById('b64input').value.trim();
    const out = document.getElementById('b64output');
    if (!input) {
      out.textContent = 'Enter a Base64 value.';
      return;
    }
    try {
      const decoded = atob(input);
      if (decoded.startsWith('/') && decoded.includes('/')) {
        out.innerHTML = `
<span style="color:#166534;">Decoded:</span>

  <code style="background:#e8f0fb; padding:2px 6px; border-radius:3px;">${decoded}</code>

<span style="color:#2456a0; font-weight:600;">Action:</span>
  <a href="/challenge-files${decoded}" target="_blank" style="
    display: inline-block; margin-top: 8px; padding: 8px 14px;
    background: #2456a0; color: #fff; text-decoration: none;
    border-radius: 4px; font-family: monospace; font-size: 0.85rem;
  ">📂 Open ${decoded}</a>
        `;
      } else {
        out.innerHTML = `<span style="color:#166534;">Decoded:</span>\n${decoded}`;
      }
    } catch (e) {
      out.innerHTML = `<span style="color:#991b1b;">Invalid Base64 value.</span>`;
    }
  });
}
// ==== IMAGE ZOOM — reveals hidden username in the badge ====
function runZoom() {
  previewTitle.textContent = 'Image Zoom';
  preview.innerHTML = `
<div class="zoomHint">Zoom into the corners to inspect for hidden details.</div>
<div class="zoomControls">
  <button id="zoomOut">− Zoom Out</button>
  <button id="zoomIn">+ Zoom In</button>
  <button id="zoomReset">Reset</button>
  <span class="zoomLevel">Zoom: <b id="zoomVal">1.0x</b></span>
</div>
<div class="zoomContainer" id="zoomContainer">
  <img id="zoomImg" src="badge.jpg" />
</div>
  `;

  let scale = 1.0;
  const img = document.getElementById('zoomImg');
  const zoomVal = document.getElementById('zoomVal');

  function applyZoom() {
    img.style.transform = `scale(${scale})`;
    zoomVal.textContent = scale.toFixed(1) + 'x';
  }

  document.getElementById('zoomIn').addEventListener('click', () => {
    scale = Math.min(6.0, scale + 0.5);
    applyZoom();
  });
  document.getElementById('zoomOut').addEventListener('click', () => {
    scale = Math.max(1.0, scale - 0.5);
    applyZoom();
  });
  document.getElementById('zoomReset').addEventListener('click', () => {
    scale = 1.0;
    applyZoom();
  });

  // Pan with drag
  const container = document.getElementById('zoomContainer');
  let isDown = false, startX, startY, scrollLeft, scrollTop;
  container.style.cursor = 'grab';
  container.addEventListener('mousedown', e => {
    isDown = true;
    container.style.cursor = 'grabbing';
    startX = e.pageX - container.offsetLeft;
    startY = e.pageY - container.offsetTop;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
  });
  container.addEventListener('mouseleave', () => { isDown = false; container.style.cursor = 'grab'; });
  container.addEventListener('mouseup', () => { isDown = false; container.style.cursor = 'grab'; });
  container.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    container.scrollLeft = scrollLeft - (x - startX);
    container.scrollTop  = scrollTop  - (y - startY);
  });

  applyZoom();
}

// ==== SEARCH ====
searchBtn.addEventListener('click', () => {
  const user = searchInput.value.trim().toLowerCase();
  if (!user) {
    searchResult.className = 'searchResult error';
    searchResult.textContent = 'Enter a username.';
    return;
  }
  if (VALID_USERNAMES[user]) {
    const rec = VALID_USERNAMES[user];
    searchResult.className = 'searchResult success';
    searchResult.innerHTML = `<strong>Record found.</strong>${rec.note}<br><br>Token: <code>${rec.token}</code>`;
  } else {
    searchResult.className = 'searchResult error';
    searchResult.textContent = 'No records found for "' + user + '".';
  }
});

// ==== TOOL BUTTONS ====
toolButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    toolButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    switch (tool) {
      case 'exif':    runExif();    break;
      case 'hex':     runHex();     break;
      case 'base64':  runBase64();  break;
      case 'zoom':    runZoom();    break;
    }
  });
});

// ==== FILE CLICK ====
document.querySelectorAll('#fileList li').forEach(li => {
  li.addEventListener('click', () => {
    document.querySelectorAll('#fileList li').forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    clearOutput();
  });
});