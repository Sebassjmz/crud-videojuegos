/* ===== GameVault CRUD – Lógica principal (IndexedDB) ===== */

const DB_NAME    = 'GameVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'videojuegos';

let db;
let pendingDeleteId = null;

/* ─── IndexedDB: inicializar ─── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_NAME)) {
        const store = d.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('titulo',      'titulo',      { unique: false });
        store.createIndex('genero',      'genero',      { unique: false });
        store.createIndex('desarrollador','desarrollador',{ unique: false });

        // Datos de ejemplo
        const sample = [
          { titulo: 'The Legend of Zelda: Breath of the Wild', genero: 'Aventura',   plataforma: 'Nintendo Switch', anio: 2017, desarrollador: 'Nintendo',      calificacion: 10, descripcion: 'Mundo abierto épico con libertad total de exploración.' },
          { titulo: 'Elden Ring',                              genero: 'RPG',        plataforma: 'PC / PS5',        anio: 2022, desarrollador: 'FromSoftware',   calificacion: 10, descripcion: 'RPG de acción difícil, gratificante y mundo inmenso.' },
          { titulo: 'FIFA 24',                                 genero: 'Deportes',   plataforma: 'Multi',           anio: 2023, desarrollador: 'EA Sports',      calificacion: 7,  descripcion: 'Simulador de fútbol anual de EA.' },
          { titulo: 'Resident Evil 4 Remake',                  genero: 'Terror',     plataforma: 'PC / PS5',        anio: 2023, desarrollador: 'Capcom',         calificacion: 9,  descripcion: 'Remake moderno del clásico survival horror.' },
          { titulo: 'Age of Empires IV',                       genero: 'Estrategia', plataforma: 'PC',              anio: 2021, desarrollador: 'Relic Entertainment', calificacion: 8, descripcion: 'Estrategia histórica en tiempo real de alto nivel.' },
        ];
        sample.forEach(g => store.add(g));
      }
    };

    req.onsuccess  = (e) => { db = e.target.result; resolve(db); };
    req.onerror    = ()  => reject(req.error);
  });
}

/* ─── CRUD helpers ─── */
function dbGetAll() {
  return new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readonly')
                  .objectStore(STORE_NAME).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

function dbAdd(game) {
  return new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME).add(game);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

function dbUpdate(game) {
  return new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME).put(game);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

function dbDelete(id) {
  return new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

/* ─── Utilidades UI ─── */
function stars(n) {
  const full = Math.round(Number(n) / 2);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function genreClass(g) {
  const map = {
    'Acción': 'g-Acción', 'RPG': 'g-RPG', 'Aventura': 'g-Aventura',
    'Deportes': 'g-Deportes', 'Estrategia': 'g-Estrategia',
    'Simulación': 'g-Simulación', 'Terror': 'g-Terror', 'Otros': 'g-Otros',
  };
  return map[g] || 'g-Otros';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = '✅ ' + msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

/* ─── Render ─── */
async function renderTable() {
  let all = await dbGetAll();

  const q  = document.getElementById('search-input').value.toLowerCase();
  const gf = document.getElementById('filter-genre').value;

  if (q)  all = all.filter(g =>
    g.titulo.toLowerCase().includes(q) ||
    g.desarrollador.toLowerCase().includes(q) ||
    g.genero.toLowerCase().includes(q));
  if (gf) all = all.filter(g => g.genero === gf);

  const tbody = document.getElementById('games-tbody');

  if (all.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="icon">🕹️</div>
        <p>No se encontraron videojuegos.</p>
      </div></td></tr>`;
  } else {
    tbody.innerHTML = all.map(g => `
      <tr>
        <td class="td-titulo" title="${g.titulo}">${g.titulo}</td>
        <td><span class="genre-badge ${genreClass(g.genero)}">${g.genero}</span></td>
        <td class="td-sec">${g.plataforma}</td>
        <td class="td-sec">${g.anio}</td>
        <td>${g.desarrollador}</td>
        <td>
          <span class="rating-stars">${stars(g.calificacion)}</span>
          <small style="color:#6b6b67"> ${g.calificacion}</small>
        </td>
        <td>
          <div class="actions">
            <button class="btn edit" onclick="openEdit(${g.id})">✏️ Editar</button>
            <button class="btn del"  onclick="askDelete(${g.id},'${g.titulo.replace(/'/g,"\\'")}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('');
  }

  await renderStats();
}

async function renderStats() {
  const all = await dbGetAll();
  const total  = all.length;
  const genres = new Set(all.map(g => g.genero)).size;
  const avg    = total
    ? (all.reduce((s, g) => s + Number(g.calificacion), 0) / total).toFixed(1)
    : '—';
  const filtered = document.querySelectorAll('#games-tbody tr').length;

  document.getElementById('badge-total').textContent = total + ' juegos';
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card green"><div class="lbl">Total</div><div class="val">${total}</div></div>
    <div class="stat-card"><div class="lbl">Géneros</div><div class="val">${genres}</div></div>
    <div class="stat-card amber"><div class="lbl">Rating prom.</div><div class="val">${avg}</div></div>
    <div class="stat-card"><div class="lbl">Mostrados</div><div class="val">${filtered}</div></div>`;
}

/* ─── Modal Formulario ─── */
function openModal(title, btnLabel, data = {}) {
  document.getElementById('modal-title').textContent    = title;
  document.getElementById('btn-save').textContent       = btnLabel;
  document.getElementById('form-id').value             = data.id   || '';
  document.getElementById('form-titulo').value         = data.titulo       || '';
  document.getElementById('form-genero').value         = data.genero       || 'Acción';
  document.getElementById('form-plataforma').value     = data.plataforma   || 'PC';
  document.getElementById('form-desarrollador').value  = data.desarrollador || '';
  document.getElementById('form-anio').value           = data.anio         || new Date().getFullYear();
  document.getElementById('form-calificacion').value   = data.calificacion || 8;
  document.getElementById('form-descripcion').value    = data.descripcion  || '';
  updateRatingDisplay();
  document.getElementById('modal-form').classList.remove('hidden');
  document.getElementById('form-titulo').focus();
}

function closeModal() {
  document.getElementById('modal-form').classList.add('hidden');
}

function updateRatingDisplay() {
  const val = document.getElementById('form-calificacion').value;
  document.getElementById('rating-display').textContent = val;
  document.getElementById('rating-stars').textContent   = stars(val);
}

/* ─── CRUD: Crear / Editar ─── */
document.getElementById('btn-nuevo').addEventListener('click', () => {
  openModal('🎮 Registrar videojuego', 'Registrar juego');
});

document.getElementById('btn-cancel').addEventListener('click', closeModal);

document.getElementById('form-calificacion').addEventListener('input', updateRatingDisplay);

document.getElementById('btn-save').addEventListener('click', async () => {
  const titulo       = document.getElementById('form-titulo').value.trim();
  const desarrollador = document.getElementById('form-desarrollador').value.trim();

  if (!titulo || !desarrollador) {
    alert('Los campos Título y Desarrollador son obligatorios.');
    return;
  }

  const id = document.getElementById('form-id').value;
  const game = {
    titulo,
    genero:       document.getElementById('form-genero').value,
    plataforma:   document.getElementById('form-plataforma').value,
    anio:         Number(document.getElementById('form-anio').value),
    desarrollador,
    calificacion: Number(document.getElementById('form-calificacion').value),
    descripcion:  document.getElementById('form-descripcion').value.trim(),
  };

  if (id) {
    game.id = Number(id);
    await dbUpdate(game);
    showToast('Videojuego actualizado correctamente');
  } else {
    await dbAdd(game);
    showToast('Videojuego registrado correctamente');
  }

  closeModal();
  await renderTable();
});

/* ─── CRUD: Editar ─── */
window.openEdit = async (id) => {
  const all  = await dbGetAll();
  const game = all.find(g => g.id === id);
  if (game) openModal('✏️ Editar videojuego', 'Guardar cambios', game);
};

/* ─── CRUD: Eliminar ─── */
window.askDelete = (id, titulo) => {
  pendingDeleteId = id;
  document.getElementById('confirm-msg').textContent =
    `Se eliminará "${titulo}". Esta acción no se puede deshacer.`;
  document.getElementById('modal-confirm').classList.remove('hidden');
};

document.getElementById('btn-cancel-del').addEventListener('click', () => {
  document.getElementById('modal-confirm').classList.add('hidden');
  pendingDeleteId = null;
});

document.getElementById('btn-confirm-del').addEventListener('click', async () => {
  if (pendingDeleteId !== null) {
    await dbDelete(pendingDeleteId);
    showToast('Videojuego eliminado');
    pendingDeleteId = null;
  }
  document.getElementById('modal-confirm').classList.add('hidden');
  await renderTable();
});

/* ─── Filtros en tiempo real ─── */
document.getElementById('search-input').addEventListener('input', renderTable);
document.getElementById('filter-genre').addEventListener('change', renderTable);

/* ─── Arranque ─── */
openDB()
  .then(() => renderTable())
  .catch(err => {
    document.body.innerHTML =
      `<p style="padding:24px;color:red;font-family:sans-serif">
       Error al abrir IndexedDB: ${err}</p>`;
  });