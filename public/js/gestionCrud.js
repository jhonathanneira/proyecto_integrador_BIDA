const API_BIDA = '/app';

function iniciarGestion(config) {
  const raiz = document.getElementById('gestion-app');
  let editandoId = null;
  const escapar = (valor) => String(valor ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
  const entrada = (campo) => {
    if (campo.tipo === 'textarea') return `<textarea name="${campo.nombre}" placeholder="${campo.etiqueta}"></textarea>`;
    if (campo.tipo === 'select') return `<select name="${campo.nombre}">${campo.opciones.map(o => `<option value="${o}">${o}</option>`).join('')}</select>`;
    return `<input name="${campo.nombre}" type="${campo.tipo || 'text'}" ${campo.requerido ? 'required' : ''} placeholder="${campo.etiqueta}">`;
  };
  raiz.innerHTML = `<header><h1>${config.titulo}</h1><p>${config.descripcion}</p></header>
    <form id="form-gestion"><div class="campos">${config.campos.map(c => `<label>${c.etiqueta}${entrada(c)}</label>`).join('')}</div><div class="acciones"><button type="submit">Guardar</button><button type="button" id="cancelar" hidden>Cancelar edición</button></div><p id="mensaje"></p></form>
    <section><h2>Registros</h2><div class="tabla"><table><thead><tr>${config.columnas.map(c => `<th>${c.etiqueta}</th>`).join('')}<th>Acciones</th></tr></thead><tbody id="filas"></tbody></table></div></section>`;
  const form = document.getElementById('form-gestion'), filas = document.getElementById('filas'), mensaje = document.getElementById('mensaje'), cancelar = document.getElementById('cancelar');
  const leerMensaje = async r => { const data = await r.json().catch(() => ({})); return data.mensaje || data.message || 'No se pudo completar la operación.'; };
  const cargar = async () => {
    filas.innerHTML = '<tr><td colspan="20">Cargando...</td></tr>';
    try {
      const r = await fetch(`${API_BIDA}/${config.ruta}`); const data = await r.json();
      const lista = data[config.lista] || [];
      filas.innerHTML = lista.length ? lista.map(item => `<tr>${config.columnas.map(c => `<td>${escapar(c.formato ? c.formato(item[c.nombre]) : item[c.nombre])}</td>`).join('')}<td><button class="editar" data-id="${item[config.id]}">Editar</button><button class="eliminar" data-id="${item[config.id]}">Eliminar</button></td></tr>`).join('') : '<tr><td colspan="20">No hay registros.</td></tr>';
      filas.querySelectorAll('.editar').forEach(b => b.onclick = () => editar(lista.find(x => String(x[config.id]) === b.dataset.id)));
      filas.querySelectorAll('.eliminar').forEach(b => b.onclick = () => eliminar(b.dataset.id));
    } catch { filas.innerHTML = '<tr><td colspan="20">No fue posible conectar con la API.</td></tr>'; }
  };
  const editar = item => { editandoId = item[config.id]; config.campos.forEach(c => { const e = form.elements[c.nombre]; e.value = item[c.nombre] ?? ''; if (c.tipo === 'select') e.value = item[c.nombre] || c.opciones[0]; }); cancelar.hidden = false; mensaje.textContent = `Editando registro #${editandoId}`; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const eliminar = async id => { if (!confirm('¿Deseas eliminar este registro?')) return; const r = await fetch(`${API_BIDA}/${config.ruta}/${id}`, { method: 'DELETE' }); mensaje.textContent = await leerMensaje(r); if (r.ok) cargar(); };
  cancelar.onclick = () => { editandoId = null; form.reset(); cancelar.hidden = true; mensaje.textContent = ''; };
  form.onsubmit = async e => { e.preventDefault(); const datos = Object.fromEntries(new FormData(form)); config.campos.filter(c => c.tipo === 'number').forEach(c => { if (datos[c.nombre] !== '') datos[c.nombre] = Number(datos[c.nombre]); }); const r = await fetch(`${API_BIDA}/${config.ruta}${editandoId ? '/' + editandoId : ''}`, { method: editandoId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }); mensaje.textContent = await leerMensaje(r); if (r.ok) { form.reset(); editandoId = null; cancelar.hidden = true; cargar(); } };
  cargar();
}
