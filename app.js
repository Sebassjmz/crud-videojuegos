/* ===== GameVault CRUD – Lógica principal (IndexedDB) ===== */

/* Nombre de la base de datos */
const DB_NAME    = 'GameVaultDB';

/* Versión de la base de datos */
const DB_VERSION = 1;

/* Nombre del almacén (tabla) donde se guardarán los videojuegos */
const STORE_NAME = 'videojuegos';

/* Variable global donde se guardará la conexión a la BD */
let db;

/* Variable temporal para guardar el ID del videojuego a eliminar */
let pendingDeleteId = null;

/* ─── IndexedDB: inicializar ─── */

/* Función que abre o crea la base de datos */
function openDB() {
  return new Promise((resolve, reject) => {

    /* Solicita abrir la base de datos */
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    /* Evento que se ejecuta cuando la BD se crea o cambia de versión */
    req.onupgradeneeded = (e) => {

      /* Obtiene la referencia de la base de datos */
      const d = e.target.result;

      /* Verifica si el almacén aún no existe */
      if (!d.objectStoreNames.contains(STORE_NAME)) {

        /* Crea el almacén con clave primaria autoincrementable */
        const store = d.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        /* Crea índices para búsquedas */
        store.createIndex('titulo', 'titulo', { unique: false });
        store.createIndex('genero', 'genero', { unique: false });
        store.createIndex('desarrollador', 'desarrollador', { unique: false });

        /* Datos de ejemplo iniciales */
        const sample = [
          { titulo: 'The Legend of Zelda: Breath of the Wild', genero: 'Aventura', plataforma: 'Nintendo Switch', anio: 2017, desarrollador: 'Nintendo', calificacion: 10, descripcion: 'Mundo abierto épico con libertad total de exploración.' },
          { titulo: 'Elden Ring', genero: 'RPG', plataforma: 'PC / PS5', anio: 2022, desarrollador: 'FromSoftware', calificacion: 10, descripcion: 'RPG de acción difícil, gratificante y mundo inmenso.' },
          { titulo: 'FIFA 24', genero: 'Deportes', plataforma: 'Multi', anio: 2023, desarrollador: 'EA Sports', calificacion: 7, descripcion: 'Simulador de fútbol anual de EA.' },
          { titulo: 'Resident Evil 4 Remake', genero: 'Terror', plataforma: 'PC / PS5', anio: 2023, desarrollador: 'Capcom', calificacion: 9, descripcion: 'Remake moderno del clásico survival horror.' },
          { titulo: 'Age of Empires IV', genero: 'Estrategia', plataforma: 'PC', anio: 2021, desarrollador: 'Relic Entertainment', calificacion: 8, descripcion: 'Estrategia histórica en tiempo real de alto nivel.' },
        ];

        /* Inserta los videojuegos de ejemplo */
        sample.forEach(g => store.add(g));
      }
    };

    /* Evento cuando la BD se abre correctamente */
    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    /* Evento cuando ocurre un error */
    req.onerror = () => reject(req.error);
  });
}

/* ─── CRUD helpers ─── */

/* Obtiene todos los videojuegos almacenados */
function dbGetAll() {
  return new Promise((res, rej) => {

    /* Transacción de solo lectura */
    const req = db.transaction(STORE_NAME, 'readonly')
                  .objectStore(STORE_NAME)
                  .getAll();

    /* Devuelve los resultados */
    req.onsuccess = () => res(req.result);

    /* Manejo de error */
    req.onerror = () => rej(req.error);
  });
}

/* Agrega un nuevo videojuego */
function dbAdd(game) {
  return new Promise((res, rej) => {

    /* Transacción de escritura */
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .add(game);

    /* Devuelve el ID insertado */
    req.onsuccess = () => res(req.result);

    /* Manejo de error */
    req.onerror = () => rej(req.error);
  });
}

/* Actualiza un videojuego existente */
function dbUpdate(game) {
  return new Promise((res, rej) => {

    /* Reemplaza el registro existente */
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .put(game);

    /* Confirmación exitosa */
    req.onsuccess = () => res();

    /* Manejo de error */
    req.onerror = () => rej(req.error);
  });
}

/* Elimina un videojuego por ID */
function dbDelete(id) {
  return new Promise((res, rej) => {

    /* Borra el registro */
    const req = db.transaction(STORE_NAME, 'readwrite')
                  .objectStore(STORE_NAME)
                  .delete(id);

    /* Confirmación exitosa */
    req.onsuccess = () => res();

    /* Manejo de error */
    req.onerror = () => rej(req.error);
  });
}

/* ─── Utilidades UI ─── */

/* Convierte una calificación numérica en estrellas */
function stars(n) {

  /* Calcula cuántas estrellas llenas mostrar */
  const full = Math.round(Number(n) / 2);

  /* Retorna estrellas llenas y vacías */
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

/* Devuelve la clase CSS según el género */
function genreClass(g) {

  /* Mapa de géneros y clases */
  const map = {
    'Acción': 'g-Acción',
    'RPG': 'g-RPG',
    'Aventura': 'g-Aventura',
    'Deportes': 'g-Deportes',
    'Estrategia': 'g-Estrategia',
    'Simulación': 'g-Simulación',
    'Terror': 'g-Terror',
    'Otros': 'g-Otros',
  };

  /* Retorna la clase correspondiente */
  return map[g] || 'g-Otros';
}

/* Muestra una notificación temporal */
function showToast(msg) {

  /* Obtiene el contenedor del toast */
  const t = document.getElementById('toast');

  /* Cambia el mensaje */
  t.textContent = '✅ ' + msg;

  /* Muestra el toast */
  t.classList.remove('hidden');

  /* Oculta el toast después de 2.5 segundos */
  setTimeout(() => t.classList.add('hidden'), 2500);
}

/* ─── Render ─── */

/* Renderiza la tabla de videojuegos */
async function renderTable() {

  /* Obtiene todos los videojuegos */
  let all = await dbGetAll();

  /* Obtiene texto de búsqueda */
  const q = document.getElementById('search-input').value.toLowerCase();

  /* Obtiene filtro de género */
  const gf = document.getElementById('filter-genre').value;

  /* Filtra por búsqueda */
  if (q) {
    all = all.filter(g =>
      g.titulo.toLowerCase().includes(q) ||
      g.desarrollador.toLowerCase().includes(q) ||
      g.genero.toLowerCase().includes(q)
    );
  }

  /* Filtra por género */
  if (gf) {
    all = all.filter(g => g.genero === gf);
  }

  /* Obtiene el tbody de la tabla */
  const tbody = document.getElementById('games-tbody');

  /* Si no hay resultados */
  if (all.length === 0) {

    /* Muestra mensaje vacío */
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="icon">🕹️</div>
            <p>No se encontraron videojuegos.</p>
          </div>
        </td>
      </tr>`;
  } else {

    /* Genera las filas dinámicamente */
    tbody.innerHTML = all.map(g => `
      <tr>
        <td class="td-titulo" title="${g.titulo}">${g.titulo}</td>

        <td>
          <span class="genre-badge ${genreClass(g.genero)}">
            ${g.genero}
          </span>
        </td>

        <td class="td-sec">${g.plataforma}</td>
        <td class="td-sec">${g.anio}</td>
        <td>${g.desarrollador}</td>

        <td>
          <span class="rating-stars">${stars(g.calificacion)}</span>
          <small style="color:#6b6b67"> ${g.calificacion}</small>
        </td>

        <td>
          <div class="actions">

            <!-- Botón editar -->
            <button class="btn edit" onclick="openEdit(${g.id})">
              ✏️ Editar
            </button>

            <!-- Botón eliminar -->
            <button class="btn del"
              onclick="askDelete(${g.id},'${g.titulo.replace(/'/g,"\\'")}')">
              🗑️
            </button>

          </div>
        </td>
      </tr>
    `).join('');
  }

  /* Actualiza estadísticas */
  await renderStats();
}

/* Renderiza estadísticas generales */
async function renderStats() {

  /* Obtiene todos los videojuegos */
  const all = await dbGetAll();

  /* Total de juegos */
  const total = all.length;

  /* Cantidad de géneros únicos */
  const genres = new Set(all.map(g => g.genero)).size;

  /* Promedio de calificación */
  const avg = total
    ? (all.reduce((s, g) => s + Number(g.calificacion), 0) / total).toFixed(1)
    : '—';

  /* Cantidad de filas mostradas */
  const filtered = document.querySelectorAll('#games-tbody tr').length;

  /* Actualiza contador */
  document.getElementById('badge-total').textContent = total + ' juegos';

  /* Inserta tarjetas de estadísticas */
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card green">
      <div class="lbl">Total</div>
      <div class="val">${total}</div>
    </div>

    <div class="stat-card">
      <div class="lbl">Géneros</div>
      <div class="val">${genres}</div>
    </div>

    <div class="stat-card amber">
      <div class="lbl">Rating prom.</div>
      <div class="val">${avg}</div>
    </div>

    <div class="stat-card">
      <div class="lbl">Mostrados</div>
      <div class="val">${filtered}</div>
    </div>`;
}

/* ─── Modal Formulario ─── */

/* Abre el modal para crear o editar */
function openModal(title, btnLabel, data = {}) {

  /* Configura el título del modal */
  document.getElementById('modal-title').textContent = title;

  /* Cambia el texto del botón */
  document.getElementById('btn-save').textContent = btnLabel;

  /* Rellena los campos */
  document.getElementById('form-id').value = data.id || '';
  document.getElementById('form-titulo').value = data.titulo || '';
  document.getElementById('form-genero').value = data.genero || 'Acción';
  document.getElementById('form-plataforma').value = data.plataforma || 'PC';
  document.getElementById('form-desarrollador').value = data.desarrollador || '';
  document.getElementById('form-anio').value = data.anio || new Date().getFullYear();
  document.getElementById('form-calificacion').value = data.calificacion || 8;
  document.getElementById('form-descripcion').value = data.descripcion || '';

  /* Actualiza estrellas */
  updateRatingDisplay();

  /* Muestra el modal */
  document.getElementById('modal-form').classList.remove('hidden');

  /* Coloca cursor en el título */
  document.getElementById('form-titulo').focus();
}

/* Cierra el modal */
function closeModal() {
  document.getElementById('modal-form').classList.add('hidden');
}

/* Actualiza el número y estrellas del rating */
function updateRatingDisplay() {

  /* Obtiene valor actual */
  const val = document.getElementById('form-calificacion').value;

  /* Actualiza número */
  document.getElementById('rating-display').textContent = val;

  /* Actualiza estrellas */
  document.getElementById('rating-stars').textContent = stars(val);
}

/* ─── CRUD: Crear / Editar ─── */

/* Evento para abrir modal de registro */
document.getElementById('btn-nuevo').addEventListener('click', () => {
  openModal('🎮 Registrar videojuego', 'Registrar juego');
});

/* Evento para cancelar */
document.getElementById('btn-cancel').addEventListener('click', closeModal);

/* Evento para actualizar rating en tiempo real */
document.getElementById('form-calificacion')
  .addEventListener('input', updateRatingDisplay);

/* Evento para guardar videojuego */
document.getElementById('btn-save').addEventListener('click', async () => {

  /* Obtiene y limpia valores */
  const titulo = document.getElementById('form-titulo').value.trim();
  const desarrollador = document.getElementById('form-desarrollador').value.trim();

  /* Validación de campos obligatorios */
  if (!titulo || !desarrollador) {
    alert('Los campos Título y Desarrollador son obligatorios.');
    return;
  }

  /* Obtiene ID oculto */
  const id = document.getElementById('form-id').value;

  /* Construye objeto videojuego */
  const game = {
    titulo,
    genero: document.getElementById('form-genero').value,
    plataforma: document.getElementById('form-plataforma').value,
    anio: Number(document.getElementById('form-anio').value),
    desarrollador,
    calificacion: Number(document.getElementById('form-calificacion').value),
    descripcion: document.getElementById('form-descripcion').value.trim(),
  };

  /* Si existe ID se actualiza */
  if (id) {

    game.id = Number(id);

    await dbUpdate(game);

    showToast('Videojuego actualizado correctamente');

  } else {

    /* Si no existe ID se registra */
    await dbAdd(game);

    showToast('Videojuego registrado correctamente');
  }

  /* Cierra modal */
  closeModal();

  /* Refresca tabla */
  await renderTable();
});

/* ─── CRUD: Editar ─── */

/* Función global para editar un juego */
window.openEdit = async (id) => {

  /* Obtiene todos los juegos */
  const all = await dbGetAll();

  /* Busca el juego por ID */
  const game = all.find(g => g.id === id);

  /* Abre modal si existe */
  if (game) {
    openModal('✏️ Editar videojuego', 'Guardar cambios', game);
  }
};

/* ─── CRUD: Eliminar ─── */

/* Abre modal de confirmación */
window.askDelete = (id, titulo) => {

  /* Guarda ID temporalmente */
  pendingDeleteId = id;

  /* Mensaje de confirmación */
  document.getElementById('confirm-msg').textContent =
    `Se eliminará "${titulo}". Esta acción no se puede deshacer.`;

  /* Muestra modal */
  document.getElementById('modal-confirm').classList.remove('hidden');
};

/* Evento cancelar eliminación */
document.getElementById('btn-cancel-del').addEventListener('click', () => {

  /* Oculta modal */
  document.getElementById('modal-confirm').classList.add('hidden');

  /* Limpia ID */
  pendingDeleteId = null;
});

/* Evento confirmar eliminación */
document.getElementById('btn-confirm-del').addEventListener('click', async () => {

  /* Verifica que exista un ID */
  if (pendingDeleteId !== null) {

    /* Elimina el videojuego */
    await dbDelete(pendingDeleteId);

    /* Muestra notificación */
    showToast('Videojuego eliminado');

    /* Limpia ID */
    pendingDeleteId = null;
  }

  /* Oculta modal */
  document.getElementById('modal-confirm').classList.add('hidden');

  /* Refresca tabla */
  await renderTable();
});

/* ─── Filtros en tiempo real ─── */

/* Evento de búsqueda */
document.getElementById('search-input')
  .addEventListener('input', renderTable);

/* Evento de filtro por género */
document.getElementById('filter-genre')
  .addEventListener('change', renderTable);

/* ─── Arranque ─── */

/* Abre la BD al iniciar */
openDB()

  /* Cuando abre correctamente renderiza la tabla */
  .then(() => renderTable())

  /* Manejo de errores */
  .catch(err => {

    /* Muestra mensaje de error */
    document.body.innerHTML = `
      <p style="padding:24px;color:red;font-family:sans-serif">
        Error al abrir IndexedDB: ${err}
      </p>`;
  });