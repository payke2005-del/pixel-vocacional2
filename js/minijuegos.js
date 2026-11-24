/* ========================================================================
   MINIJUEGOS MODULARES - TRIVIA UNIVERSITARIA (VERSIÓN CORREGIDA)
   Vanilla JS (ES6+), sin dependencias externas.
   
   Arquitectura:
   - Cada juego es una clase independiente.
   - start(containerElement, onComplete)  -> renderiza dentro del contenedor
                                             y ejecuta onComplete({success, score, timeSpent})
   - destroy()                            -> limpia timers, listeners y DOM
   ======================================================================== */

/* ---------- Utilidades compartidas ---------- */
const Minijuegos = {
  inyectarEstilos(cssTexto) {
    let el = document.getElementById('mj-styles');
    if (!el) {
      el = document.createElement('style');
      el.id = 'mj-styles';
      document.head.appendChild(el);
    }
    el.textContent = cssTexto;
  },
  tiempoTranscurrido(inicio) {
    return parseFloat(((Date.now() - inicio) / 1000).toFixed(2));
  },
  crearBtn(texto, claseExtra, onclick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mj-btn ' + (claseExtra || '');
    btn.textContent = texto;
    if (onclick) btn.addEventListener('click', onclick);
    return btn;
  }
};

/* ------------------------------------------------------------------
   1. BUG HUNTER GAME  (Carrera: Informática) - REDISEÑADO FÁCIL
   ------------------------------------------------------------------ */
class BugHunterGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.timer = null;
    this.inicio = null;
    this.lineas = [];
    this.bugsEncontrados = 0;
    this.totalBugs = 2; // Reducido a 2 bugs
    this.limiteSegundos = 30; // Más tiempo
    this.terminado = false;
  }

  start(containerElement, onComplete) {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.terminado = false;
    this.bugsEncontrados = 0;
    this.container.innerHTML = '';

    this.lineas = [
      { texto: 'function sumar(a, b) {', esBug: false },
      { texto: '    return a + b', esBug: true }, // Falta ;
      { texto: '}', esBug: false },
      { texto: 'let nombre = "Ana"', esBug: true }, // Falta ;
      { texto: 'console.log(nombre);', esBug: false }
    ];
    this.totalBugs = this.lineas.filter(l => l.esBug).length;

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-bgh-wrap';
    wrap.innerHTML = `
      <h2>🐛 Caza de Bugs - Informática</h2>
      <p class="mj-bgh-explicacion">Un programador debe encontrar errores en el código. <strong>Haz clic en las líneas que tengan errores</strong> (faltan puntos y comas).</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-bgh-timer">${this.limiteSegundos}</span>s</span>
        <span>🐛 <span id="mj-bgh-score">0</span>/${this.totalBugs}</span>
      </div>
      <div class="mj-bgh-code" id="mj-bgh-code"></div>
      <div id="mj-bgh-pista" class="mj-bgh-pista"></div>
      <div class="mj-msg" id="mj-bgh-msg"></div>
      <button id="mj-bgh-finalizar" class="mj-btn secondary" style="display:none;">Finalizar juego</button>
    `;
    this.container.appendChild(wrap);

    const codeEl = this.container.querySelector('#mj-bgh-code');
    this.lineas.forEach((lin, i) => {
      const div = document.createElement('div');
      div.className = 'mj-bgh-line';
      div.dataset.index = i;
      div.innerHTML = `<span class="mj-bgh-lineno">${i + 1}</span><span class="mj-bgh-content">${this.escapeHtml(lin.texto)}</span>`;
      div.addEventListener('click', () => this.clicLinea(div, lin.esBug));
      codeEl.appendChild(div);
    });

    this.inicio = Date.now();
    const timerEl = this.container.querySelector('#mj-bgh-timer');
    this.timer = setInterval(() => {
      const restantes = this.limiteSegundos - Math.floor(Minijuegos.tiempoTranscurrido(this.inicio));
      timerEl.textContent = Math.max(0, restantes);
      if (restantes <= 0) this.finalizar();
    }, 500);

    this.container.querySelector('#mj-bgh-finalizar').addEventListener('click', () => this.finalizar());
  }

  clicLinea(el, esBug) {
    if (this.terminado) return;
    if (el.classList.contains('found') || el.classList.contains('wrong')) return;

    if (esBug) {
      el.classList.add('found');
      this.bugsEncontrados++;
      this.container.querySelector('#mj-bgh-score').textContent = this.bugsEncontrados;
      if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
      if (this.bugsEncontrados >= this.totalBugs) {
        this.finalizar();
      }
    } else {
      el.classList.add('wrong');
      if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
      const pista = this.container.querySelector('#mj-bgh-pista');
      pista.textContent = '❌ Esa línea está bien. Busca las que les falta el punto y coma (;).';
      pista.className = 'mj-bgh-pista warn';
      setTimeout(() => el.classList.remove('wrong'), 800);
    }
  }

  finalizar() {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const score = parseFloat(((this.bugsEncontrados / this.totalBugs) * 100).toFixed(2));
    const success = this.bugsEncontrados >= this.totalBugs;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-bgh-msg');
    msg.className = 'mj-msg ' + (success ? 'ok' : 'err');
    msg.textContent = success
      ? `🎉 ¡Encontraste los ${this.totalBugs} bugs! ¡Programador experto!`
      : `⏱ Tiempo agotado. Encontraste ${this.bugsEncontrados}/${this.totalBugs} bugs.`;
    msg.style.display = 'block';

    this.container.querySelector('#mj-bgh-finalizar').style.display = 'none';

    if (this.onComplete) {
      this.onComplete({ success, score, timeSpent });
    }
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }

  escapeHtml(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/* ------------------------------------------------------------------
   2. BALANCE PERFECTO  (Carrera: Contaduría) - CORREGIDO
   ------------------------------------------------------------------ */
class BalanceGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.inicio = null;
    this.timer = null;
    this.terminado = false;
    this.tarjetas = [];
    this.colocarEn = {};
    this.tarjetaSeleccionada = null;
  }

  start(containerElement, onComplete) {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.terminado = false;
    this.colocarEn = {};
    this.tarjetaSeleccionada = null;
    this.container.innerHTML = '';

    this.tarjetas = [
      { id: 't1', concepto: 'Venta de productos', monto: 500, correcto: 'haber', icono: '💰', tipo: 'ingreso' },
      { id: 't2', concepto: 'Compra de equipo', monto: 300, correcto: 'debe', icono: '💻', tipo: 'egreso' },
      { id: 't3', concepto: 'Pago de luz y agua', monto: 150, correcto: 'debe', icono: '💡', tipo: 'egreso' },
      { id: 't4', concepto: 'Préstamo bancario', monto: 1000, correcto: 'haber', icono: '🏦', tipo: 'ingreso' }
    ];

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-bg-wrap';
    wrap.innerHTML = `
      <h2>⚖ El Balance Perfecto - Contaduría</h2>
      <p class="mj-bg-explicacion">En contabilidad, <strong>Debe</strong> son salidas de dinero (egresos) y <strong>Haber</strong> son entradas (ingresos). <strong>Haz clic en una tarjeta y luego en la columna correcta</strong> para equilibrar la balanza.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-bg-timer">00</span>s</span>
        <span>✅ <span id="mj-bg-score">0</span>/4 colocadas</span>
      </div>
      <div class="mj-balanza-wrap">
        <div class="mj-balanza" id="mj-balanza">⚖</div>
        <div class="mj-balanza-texto" id="mj-balanza-texto">Esperando tarjetas...</div>
      </div>
      <div class="mj-bg-columns">
        <div class="mj-bg-col debe" data-col="debe">
          <h4>📤 Debe (Egresos)</h4>
          <div class="mj-bg-dropzone" data-col="debe"></div>
          <div class="mj-bg-sum" id="mj-bg-sum-debe">Suma: 0</div>
        </div>
        <div class="mj-bg-col haber" data-col="haber">
          <h4>📥 Haber (Ingresos)</h4>
          <div class="mj-bg-dropzone" data-col="haber"></div>
          <div class="mj-bg-sum" id="mj-bg-sum-haber">Suma: 0</div>
        </div>
      </div>
      <div id="mj-bg-mazo" class="mj-bg-mazo"></div>
      <div id="mj-bg-pista" class="mj-bg-pista"></div>
      <div class="mj-msg" id="mj-bg-msg"></div>
      <button id="mj-bg-verificar" class="mj-btn">Verificar Balance</button>
    `;
    this.container.appendChild(wrap);

    const mazo = this.container.querySelector('#mj-bg-mazo');
    this.tarjetas.forEach(t => {
      const card = document.createElement('div');
      card.className = 'mj-bg-card';
      card.dataset.id = t.id;
      card.dataset.correcto = t.correcto;
      card.innerHTML = `<span class="mj-bg-icon">${t.icono}</span><div>${t.concepto}</div><div class="monto">${t.monto}</div>`;
      card.addEventListener('click', () => this.seleccionarTarjeta(card, t));
      mazo.appendChild(card);
    });

    // Listener en la COLUMNA COMPLETA, no solo en la dropzone
    this.container.querySelectorAll('.mj-bg-col').forEach(colEl => {
      colEl.addEventListener('click', (e) => {
        // Evitar que el clic en una tarjeta ya colocada dispare el listener de la columna
        if (e.target.closest('.mj-bg-card')) return;
        this.colocarEnColumna(colEl.dataset.col);
      });
    });

    this.inicio = Date.now();
    this.timer = setInterval(() => {
      const el = this.container.querySelector('#mj-bg-timer');
      el.textContent = Math.floor(Minijuegos.tiempoTranscurrido(this.inicio)).toString().padStart(2, '0');
    }, 500);

    this.container.querySelector('#mj-bg-verificar').addEventListener('click', () => this.finalizar());
    this.actualizarContador();
    this.actualizarBalanza();
  }

  seleccionarTarjeta(card, tarjeta) {
    if (this.terminado) return;
    if (this.colocarEn[tarjeta.id]) return;

    if (this.tarjetaSeleccionada) {
      this.tarjetaSeleccionada.classList.remove('seleccionada');
    }

    this.tarjetaSeleccionada = card;
    card.classList.add('seleccionada');
    const pistaEl = this.container.querySelector('#mj-bg-pista');
    pistaEl.textContent = `👆 Seleccionaste: ${tarjeta.concepto}. Ahora haz clic en "Debe" o "Haber".`;
    pistaEl.className = 'mj-bg-pista info';
    if (typeof SoundSystem !== 'undefined') SoundSystem.play('click');
  }

  colocarEnColumna(col) {
    if (this.terminado) return;
    if (!this.tarjetaSeleccionada) {
      const pistaEl = this.container.querySelector('#mj-bg-pista');
      pistaEl.textContent = '⚠ Primero selecciona una tarjeta haciendo clic en ella.';
      pistaEl.className = 'mj-bg-pista warn';
      return;
    }

    const id = this.tarjetaSeleccionada.dataset.id;
    if (this.colocarEn[id]) return;

    this.colocarEn[id] = col;
    const dz = this.container.querySelector(`.mj-bg-dropzone[data-col="${col}"]`);
    if (!dz) return;

    // Mover la tarjeta a la dropzone
    dz.appendChild(this.tarjetaSeleccionada);
    this.tarjetaSeleccionada.classList.remove('seleccionada');
    this.tarjetaSeleccionada.classList.add('colocada', col);
    this.tarjetaSeleccionada = null;

    // Feedback visual y sonoro
    const t = this.tarjetas.find(tar => tar.id === id);
    const correcto = t.correcto === col;
    if (correcto) {
      if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
    } else {
      if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
    }

    this.actualizarContador();
    this.actualizarBalanza();
  }

  actualizarContador() {
    const colocadas = Object.keys(this.colocarEn).length;
    this.container.querySelector('#mj-bg-score').textContent = colocadas;
    ['debe', 'haber'].forEach(col => {
      const suma = this.tarjetas.filter(t => this.colocarEn[t.id] === col)
        .reduce((acc, t) => acc + t.monto, 0);
      this.container.querySelector(`#mj-bg-sum-${col}`).textContent = `Suma: ${suma}`;
    });
  }

  actualizarBalanza() {
    const balanza = this.container.querySelector('#mj-balanza');
    const texto = this.container.querySelector('#mj-balanza-texto');
    const sumaDebe = this.tarjetas.filter(t => this.colocarEn[t.id] === 'debe').reduce((a, t) => a + t.monto, 0);
    const sumaHaber = this.tarjetas.filter(t => this.colocarEn[t.id] === 'haber').reduce((a, t) => a + t.monto, 0);

    if (sumaDebe === sumaHaber && sumaDebe > 0) {
      balanza.textContent = '⚖✨';
      texto.textContent = '¡Equilibrada!';
      texto.style.color = '#16a34a';
      balanza.classList.add('equilibrada');
    } else if (sumaDebe > sumaHaber) {
      balanza.textContent = '⚖⬇';
      texto.textContent = 'Debe pesa más';
      texto.style.color = '#dc2626';
      balanza.classList.remove('equilibrada');
    } else if (sumaHaber > sumaDebe) {
      balanza.textContent = '⚖⬆';
      texto.textContent = 'Haber pesa más';
      texto.style.color = '#16a34a';
      balanza.classList.remove('equilibrada');
    } else {
      balanza.textContent = '⚖';
      texto.textContent = 'Esperando tarjetas...';
      texto.style.color = '#6b7280';
      balanza.classList.remove('equilibrada');
    }
  }

  finalizar() {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const colocadas = Object.keys(this.colocarEn).length;
    const bienColocadas = this.tarjetas.filter(t => this.colocarEn[t.id] === t.correcto).length;
    const sumaDebe = this.tarjetas.filter(t => this.colocarEn[t.id] === 'debe').reduce((a, t) => a + t.monto, 0);
    const sumaHaber = this.tarjetas.filter(t => this.colocarEn[t.id] === 'haber').reduce((a, t) => a + t.monto, 0);
    const balanceOk = sumaDebe === sumaHaber;

    const score = parseFloat(((bienColocadas / this.tarjetas.length) * 100).toFixed(2));
    const success = balanceOk && colocadas === this.tarjetas.length;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-bg-msg');
    msg.className = 'mj-msg ' + (success ? 'ok' : 'err');
    msg.textContent = success
      ? '🎉 ¡Balance perfecto! Debe = Haber. ¡Excelente contable!'
      : `⚠ Balance incompleto. Debe: ${sumaDebe}, Haber: ${sumaHaber}.`;
    msg.style.display = 'block';

    this.container.querySelector('#mj-bg-verificar').style.display = 'none';

    if (this.onComplete) {
      this.onComplete({ success, score, timeSpent });
    }
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }
}

/* ------------------------------------------------------------------
   3. COMPLETA EL CIRCUITO  (Carrera: Electricidad) - CORREGIDO
   ------------------------------------------------------------------ */
class CircuitGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.inicio = null;
    this.timer = null;
    this.terminado = false;
    this.gridSize = 3;
    this.celdas = [];
    this.source = { x: 0, y: 0 };
    this.target = { x: 2, y: 2 };
  }

  start(containerElement, onComplete) {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.terminado = false;
    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-cg-wrap';
    wrap.innerHTML = `
      <h2>🔌 Completa el Circuito - Electricidad</h2>
      <p class="mj-cg-explicacion">Los electricistas conectan cables para que la corriente fluya. <strong>Haz clic en los cables para rotarlos 90°</strong> y conecta la fuente (+) con el receptor (-).</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-cg-timer">00</span>s</span>
        <span>🔌 <span id="mj-cg-status">Circuito abierto</span></span>
      </div>
      <div class="mj-cg-grid" id="mj-cg-grid"></div>
      <div id="mj-cg-pista" class="mj-cg-pista"></div>
      <div class="mj-msg" id="mj-cg-msg"></div>
      <button id="mj-cg-verificar" class="mj-btn">Verificar Conexión</button>
    `;
    this.container.appendChild(wrap);

    this.inicializarGrid();
    this.renderGrid();

    this.inicio = Date.now();
    this.timer = setInterval(() => {
      const el = this.container.querySelector('#mj-cg-timer');
      el.textContent = Math.floor(Minijuegos.tiempoTranscurrido(this.inicio)).toString().padStart(2, '0');
    }, 500);

    this.container.querySelector('#mj-cg-verificar').addEventListener('click', () => this.finalizar());
  }

  inicializarGrid() {
    const tipos = ['|', '-', 'L', 'J', '7', 'F'];
    const conexionesBase = {
      '|': new Set(['N', 'S']),
      '-': new Set(['E', 'W']),
      'L': new Set(['N', 'E']),
      'J': new Set(['N', 'W']),
      '7': new Set(['S', 'W']),
      'F': new Set(['S', 'E'])
    };

    this.celdas = [];
    for (let y = 0; y < this.gridSize; y++) {
      const fila = [];
      for (let x = 0; x < this.gridSize; x++) {
        if (x === this.source.x && y === this.source.y) {
          fila.push({ tipo: 'source', rot: 0, conexiones: new Set(['E']) });
        } else if (x === this.target.x && y === this.target.y) {
          fila.push({ tipo: 'target', rot: 0, conexiones: new Set(['W']) });
        } else {
          const tipo = tipos[Math.floor(Math.random() * tipos.length)];
          fila.push({ tipo, rot: 0, conexiones: new Set(conexionesBase[tipo]) });
        }
      }
      this.celdas.push(fila);
    }
  }

  rotarConexiones(set, grados) {
    const rotarDir = (d) => {
      const orden = ['N', 'E', 'S', 'W'];
      const idx = orden.indexOf(d);
      return orden[(idx + grados / 90) % 4];
    };
    const resultado = new Set();
    for (const d of set) resultado.add(rotarDir(d));
    return resultado;
  }

  renderGrid() {
    const grid = this.container.querySelector('#mj-cg-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const c = this.celdas[y][x];
        const celda = document.createElement('div');
        celda.className = 'mj-cg-cell';
        if (c.tipo === 'source') celda.classList.add('source');
        if (c.tipo === 'target') celda.classList.add('target');
        celda.textContent = this.simbolo(c);
        celda.dataset.x = x;
        celda.dataset.y = y;
        celda.addEventListener('click', () => this.rotarCelda(x, y, celda));
        grid.appendChild(celda);
      }
    }
  }

  simbolo(c) {
    if (c.tipo === 'source') return '+';
    if (c.tipo === 'target') return '-';
    // Mapa coherente con las conexiones reales
    const mapa = {
      '|': { 0: '│', 90: '─', 180: '│', 270: '─' },
      '-': { 0: '─', 90: '│', 180: '─', 270: '│' },
      'L': { 0: '└', 90: '┌', 180: '┐', 270: '┘' },
      'J': { 0: '┘', 90: '└', 180: '┌', 270: '┐' },
      '7': { 0: '┐', 90: '┘', 180: '└', 270: '┌' },
      'F': { 0: '┌', 90: '┐', 180: '┘', 270: '└' }
    };
    return mapa[c.tipo]?.[c.rot] || '?';
  }

  rotarCelda(x, y, celdaEl) {
    if (this.terminado) return;
    const c = this.celdas[y][x];
    if (c.tipo === 'source' || c.tipo === 'target') return;
    c.rot = (c.rot + 90) % 360;
    // Recalcular conexiones desde la base
    c.conexiones = this.rotarConexiones(this.conexionesBaseDeTipo(c.tipo), c.rot);
    // Actualizar solo el símbolo de esta celda (sin re-renderizar todo)
    celdaEl.textContent = this.simbolo(c);
    // Pequeña animación de rotación
    celdaEl.style.transform = 'scale(0.9)';
    setTimeout(() => { celdaEl.style.transform = 'scale(1)'; }, 100);
    this.actualizarEstado();
    if (typeof SoundSystem !== 'undefined') SoundSystem.play('click');
  }

  conexionesBaseDeTipo(tipo) {
    const base = {
      '|': new Set(['N', 'S']),
      '-': new Set(['E', 'W']),
      'L': new Set(['N', 'E']),
      'J': new Set(['N', 'W']),
      '7': new Set(['S', 'W']),
      'F': new Set(['S', 'E'])
    };
    return base[tipo];
  }

  actualizarEstado() {
    const conectado = this.verificarCircuito();
    const span = this.container.querySelector('#mj-cg-status');
    const pista = this.container.querySelector('#mj-cg-pista');
    if (conectado) {
      span.textContent = '¡Circuito cerrado!';
      span.style.color = '#16a34a';
      pista.textContent = '🎉 ¡Excelente! La corriente fluye correctamente.';
      pista.className = 'mj-cg-pista ok';
    } else {
      span.textContent = 'Circuito abierto';
      span.style.color = '#dc2626';
      pista.textContent = '💡 Gira más cables para conectar la fuente con el receptor.';
      pista.className = 'mj-cg-pista info';
    }
  }

  verificarCircuito() {
    const visitada = new Set();
    const cola = [{ x: this.source.x, y: this.source.y }];
    visitada.add(`${this.source.x},${this.source.y}`);

    const opuesto = { N: 'S', S: 'N', E: 'W', W: 'E' };
    const delta = { N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, E: { x: 1, y: 0 }, W: { x: -1, y: 0 } };

    while (cola.length > 0) {
      const actual = cola.shift();
      const c = this.celdas[actual.y][actual.x];

      if (actual.x === this.target.x && actual.y === this.target.y) {
        return true;
      }

      for (const dir of c.conexiones) {
        const d = delta[dir];
        const nx = actual.x + d.x;
        const ny = actual.y + d.y;
        if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize) continue;
        const clave = `${nx},${ny}`;
        if (visitada.has(clave)) continue;
        const vecino = this.celdas[ny][nx];
        if (vecino.conexiones.has(opuesto[dir])) {
          visitada.add(clave);
          cola.push({ x: nx, y: ny });
        }
      }
    }
    return false;
  }

  finalizar() {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const success = this.verificarCircuito();
    const score = success ? 100 : 0;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-cg-msg');
    msg.className = 'mj-msg ' + (success ? 'ok' : 'err');
    msg.textContent = success
      ? '🎉 ¡Circuito cerrado! Corriente fluyendo. ¡Electricista experto!'
      : '⚠ El circuito sigue abierto. Gira más cables y vuelve a intentar.';
    msg.style.display = 'block';

    this.container.querySelector('#mj-cg-verificar').style.display = 'none';

    if (this.onComplete) {
      this.onComplete({ success, score, timeSpent });
    }
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }
}

/* ------------------------------------------------------------------
   4. RELACIÓN DE ENGRANAJES  (Carrera: Mecánica) - REDISEÑADO FÁCIL
   ------------------------------------------------------------------ */
class GearGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.inicio = null;
    this.timer = null;
    this.terminado = false;
    this.rpmMotor = 120;
    this.dientesMotor = 20;
    this.dientesSalida = 20;
    this.opcionesDientes = [10, 15, 20, 30, 40, 50, 60];
    this.seleccion = [20, 20]; // Reducido a 2 engranajes
    this.objetivo = 0;
  }

  start(containerElement, onComplete) {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.terminado = false;
    this.container.innerHTML = '';

    // Generar objetivo alcanzable con 2 engranajes
    const d1 = this.opcionesDientes[Math.floor(Math.random() * this.opcionesDientes.length)];
    const d2 = this.opcionesDientes[Math.floor(Math.random() * this.opcionesDientes.length)];
    this.objetivo = parseFloat((this.rpmMotor * (this.dientesMotor / d1) * (this.dientesMotor / d2)).toFixed(1));

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-gg-wrap';
    wrap.innerHTML = `
      <h2>⚙ Relación de Engranajes - Mecánica</h2>
      <p class="mj-gg-explicacion">Los mecánicos usan engranajes para cambiar la velocidad de las máquinas. <strong>Selecciona el tamaño de los 2 engranajes intermedios</strong> para alcanzar la velocidad objetivo.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-gg-timer">00</span>s</span>
        <span>🎯 <span id="mj-gg-obj">Objetivo: ${this.objetivo} RPM</span></span>
      </div>
      <div class="mj-gg-diagram" id="mj-gg-diagram"></div>
      <div class="mj-gg-controls" id="mj-gg-controls"></div>
      <div class="mj-gg-target" id="mj-gg-result">Velocidad final: -- RPM</div>
      <div id="mj-gg-pista" class="mj-gg-pista"></div>
      <div class="mj-msg" id="mj-gg-msg"></div>
      <button id="mj-gg-verificar" class="mj-btn">Verificar Velocidad</button>
    `;
    this.container.appendChild(wrap);

    this.renderDiagrama();
    this.renderControles();

    this.inicio = Date.now();
    this.timer = setInterval(() => {
      const el = this.container.querySelector('#mj-gg-timer');
      el.textContent = Math.floor(Minijuegos.tiempoTranscurrido(this.inicio)).toString().padStart(2, '0');
    }, 500);

    this.container.querySelector('#mj-gg-verificar').addEventListener('click', () => this.finalizar());
  }

  renderDiagrama() {
    const diagram = this.container.querySelector('#mj-gg-diagram');
    diagram.innerHTML = '';

    const motor = document.createElement('div');
    motor.className = 'mj-gg-gear motor';
    motor.innerHTML = `<span class="mj-gg-teeth">${this.dientesMotor}</span><div>Motor<br>${this.rpmMotor} RPM</div>`;
    diagram.appendChild(motor);

    const flecha1 = document.createElement('div');
    flecha1.className = 'mj-gg-arrow';
    flecha1.textContent = '↓';
    diagram.appendChild(flecha1);

    this.seleccion.forEach((d, i) => {
      const gear = document.createElement('div');
      gear.className = 'mj-gg-gear';
      gear.innerHTML = `<span class="mj-gg-teeth">${d}</span><div>Int ${i + 1}</div>`;
      diagram.appendChild(gear);

      if (i < this.seleccion.length - 1) {
        const flecha = document.createElement('div');
        flecha.className = 'mj-gg-arrow';
        flecha.textContent = '↓';
        diagram.appendChild(flecha);
      }
    });

    const flecha2 = document.createElement('div');
    flecha2.className = 'mj-gg-arrow';
    flecha2.textContent = '↓';
    diagram.appendChild(flecha2);

    const salida = document.createElement('div');
    salida.className = 'mj-gg-gear output';
    salida.innerHTML = `<span class="mj-gg-teeth">${this.dientesSalida}</span><div>Salida</div>`;
    diagram.appendChild(salida);
  }

  renderControles() {
    const controls = this.container.querySelector('#mj-gg-controls');
    controls.innerHTML = '';
    this.seleccion.forEach((d, i) => {
      const ctrl = document.createElement('div');
      ctrl.className = 'mj-gg-control';
      ctrl.innerHTML = `<label>Engranaje intermedio ${i + 1}</label>`;
      const select = document.createElement('select');
      this.opcionesDientes.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = `${opt} dientes`;
        o.selected = opt === d;
        select.appendChild(o);
      });
      select.addEventListener('change', (e) => {
        this.seleccion[i] = parseInt(e.target.value);
        this.renderDiagrama();
        this.actualizarResultado();
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('click');
      });
      ctrl.appendChild(select);
      controls.appendChild(ctrl);
    });
  }

  actualizarResultado() {
    const rpmFinal = this.calcularRPM();
    const el = this.container.querySelector('#mj-gg-result');
    el.textContent = `Velocidad final: ${rpmFinal.toFixed(1)} RPM`;
    this.actualizarPista(rpmFinal);
  }

  actualizarPista(rpmFinal) {
    const pista = this.container.querySelector('#mj-gg-pista');
    const diff = Math.abs(rpmFinal - this.objetivo);
    const porcentaje = (diff / this.objetivo) * 100;

    if (porcentaje <= 5) {
      pista.textContent = '✅ ¡Perfecto! Estás en el objetivo.';
      pista.className = 'mj-gg-pista ok';
    } else if (rpmFinal < this.objetivo) {
      pista.textContent = '💡 Vas muy lento. Prueba con engranajes más pequeños.';
      pista.className = 'mj-gg-pista info';
    } else {
      pista.textContent = '💡 Vas muy rápido. Prueba con engranajes más grandes.';
      pista.className = 'mj-gg-pista info';
    }
  }

  calcularRPM() {
    let rpm = this.rpmMotor;
    for (const d of this.seleccion) {
      rpm = rpm * (this.dientesMotor / d);
    }
    rpm = rpm * (this.dientesMotor / this.dientesSalida);
    return rpm;
  }

  finalizar() {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const rpmFinal = this.calcularRPM();
    const diff = Math.abs(rpmFinal - this.objetivo);
    const exito = diff <= this.objetivo * 0.05;
    const score = exito ? 100 : parseFloat(Math.max(0, 100 - (diff / this.objetivo) * 100).toFixed(2));
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-gg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? `🎉 ¡Velocidad alcanzada! ${rpmFinal.toFixed(1)} RPM ≈ ${this.objetivo} RPM. ¡Mecánico experto!`
      : `⚠ Velocidad incorrecta: ${rpmFinal.toFixed(1)} RPM (objetivo: ${this.objetivo} RPM).`;
    msg.style.display = 'block';

    this.container.querySelector('#mj-gg-verificar').style.display = 'none';

    if (this.onComplete) {
      this.onComplete({ success: exito, score, timeSpent });
    }
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }
}

/* ------------------------------------------------------------------
   5. AJUSTE DE SEÑAL  (Carrera: Telecomunicaciones) - REDISEÑADO FÁCIL
   ------------------------------------------------------------------ */
class SignalGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.inicio = null;
    this.timer = null;
    this.terminado = false;
    this.canvas = null;
    this.ctx = null;
    this.objetivo = { A: 0, f: 0 };
    this.usuario = { A: 1, f: 1 };
    this.rafaAnim = null;
  }

  start(containerElement, onComplete) {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.terminado = false;
    this.container.innerHTML = '';

    // Valores objetivo más simples
    this.objetivo.A = parseFloat((0.5 + Math.random() * 1.0).toFixed(1)); // 0.5 - 1.5
    this.objetivo.f = parseFloat((0.5 + Math.random() * 1.5).toFixed(1)); // 0.5 - 2.0

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-sg-wrap';
    wrap.innerHTML = `
      <h2>📡 Ajuste de Señal - Telecomunicaciones</h2>
      <p class="mj-sg-explicacion">Los ingenieros en telecomunicaciones ajustan señales para que lleguen claras. <strong>Mueve los sliders para igualar la onda de referencia (gris)</strong>.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-sg-timer">00</span>s</span>
        <span>📊 <span id="mj-sg-error">Error: --</span></span>
      </div>
      <div class="mj-sg-canvas-wrap">
        <canvas id="mj-sg-canvas" width="560" height="200"></canvas>
      </div>
      <div class="mj-sg-precision-wrap">
        <div class="mj-sg-precision-label">Precisión: <span id="mj-sg-precision">0%</span></div>
        <div class="mj-sg-precision-bar"><div class="mj-sg-precision-fill" id="mj-sg-precision-fill"></div></div>
      </div>
      <div class="mj-sg-sliders">
        <div class="mj-sg-slider">
          <label>Amplitud <span class="mj-sg-val" id="mj-sg-val-A">1.0</span></label>
          <input type="range" id="mj-sg-slider-A" min="0.1" max="1.5" step="0.1" value="1.0">
        </div>
        <div class="mj-sg-slider">
          <label>Frecuencia <span class="mj-sg-val" id="mj-sg-val-f">1.0</span></label>
          <input type="range" id="mj-sg-slider-f" min="0.1" max="2.0" step="0.1" value="1.0">
        </div>
      </div>
      <div class="mj-msg" id="mj-sg-msg"></div>
      <button id="mj-sg-verificar" class="mj-btn">Validar Señal</button>
    `;
    this.container.appendChild(wrap);

    this.canvas = this.container.querySelector('#mj-sg-canvas');
    this.ctx = this.canvas.getContext('2d');

    const sA = this.container.querySelector('#mj-sg-slider-A');
    const sF = this.container.querySelector('#mj-sg-slider-f');
    const vA = this.container.querySelector('#mj-sg-val-A');
    const vF = this.container.querySelector('#mj-sg-val-f');

    const actualizar = () => {
      this.usuario.A = parseFloat(sA.value);
      this.usuario.f = parseFloat(sF.value);
      vA.textContent = this.usuario.A;
      vF.textContent = this.usuario.f;
      this.dibujar();
      this.actualizarError();
      this.actualizarPrecision();
    };

    sA.addEventListener('input', actualizar);
    sF.addEventListener('input', actualizar);

    this.dibujar();
    this.actualizarError();
    this.actualizarPrecision();

    this.inicio = Date.now();
    this.timer = setInterval(() => {
      const el = this.container.querySelector('#mj-sg-timer');
      el.textContent = Math.floor(Minijuegos.tiempoTranscurrido(this.inicio)).toString().padStart(2, '0');
    }, 500);

    this.container.querySelector('#mj-sg-verificar').addEventListener('click', () => this.finalizar());
  }

  dibujar() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const amp = 60;
    const escalaX = w / (2 * Math.PI * 3);

    ctx.clearRect(0, 0, w, h);

    // Ejes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();

    // Onda objetivo (gris, puntizada)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const t = x / escalaX;
      const y = cy - this.objetivo.A * amp * Math.sin(2 * Math.PI * this.objetivo.f * t);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Onda usuario: color según precisión
    const errA = Math.abs(this.usuario.A - this.objetivo.A) / this.objetivo.A;
    const errF = Math.abs(this.usuario.f - this.objetivo.f) / this.objetivo.f;
    const err = (errA + errF) / 2;
    let color = '#ef4444'; // rojo
    if (err <= 0.25) color = '#16a34a'; // verde
    else if (err <= 0.5) color = '#eab308'; // amarillo

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const t = x / escalaX;
      const y = cy - this.usuario.A * amp * Math.sin(2 * Math.PI * this.usuario.f * t);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Leyenda
    ctx.fillStyle = '#4b5563';
    ctx.font = '12px sans-serif';
    ctx.fillText('Objetivo (gris)', 10, 20);
    ctx.fillStyle = color;
    ctx.fillText('Tu señal', 10, 40);
  }

  actualizarError() {
    const errA = Math.abs(this.usuario.A - this.objetivo.A) / this.objetivo.A;
    const errF = Math.abs(this.usuario.f - this.objetivo.f) / this.objetivo.f;
    const err = (errA + errF) / 2;
    const el = this.container.querySelector('#mj-sg-error');
    el.textContent = `Error: ${(err * 100).toFixed(1)}%`;
  }

  actualizarPrecision() {
    const errA = Math.abs(this.usuario.A - this.objetivo.A) / this.objetivo.A;
    const errF = Math.abs(this.usuario.f - this.objetivo.f) / this.objetivo.f;
    const err = (errA + errF) / 2;
    const precision = Math.max(0, Math.min(100, 100 - err * 100));
    const pct = this.container.querySelector('#mj-sg-precision');
    const fill = this.container.querySelector('#mj-sg-precision-fill');
    if (pct) pct.textContent = precision.toFixed(0) + '%';
    if (fill) {
      fill.style.width = precision + '%';
      fill.style.background = precision >= 75 ? '#16a34a' : precision >= 50 ? '#eab308' : '#ef4444';
    }
  }

  verificar() {
    const errA = Math.abs(this.usuario.A - this.objetivo.A) / this.objetivo.A;
    const errF = Math.abs(this.usuario.f - this.objetivo.f) / this.objetivo.f;
    const err = (errA + errF) / 2;
    const exito = err <= 0.25; // Tolerancia ampliada al 25%
    const score = exito ? 100 : parseFloat(Math.max(0, 100 - err * 100).toFixed(2));
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-sg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? `🎉 ¡Señal igualada! A=${this.objetivo.A}, f=${this.objetivo.f}. ¡Ingeniero en telecomunicaciones!`
      : `⚠ Señal no coincide. Objetivo: A=${this.objetivo.A}, f=${this.objetivo.f}. Tuya: A=${this.usuario.A}, f=${this.usuario.f}.`;
    msg.style.display = 'block';

    this.container.querySelector('#mj-sg-verificar').style.display = 'none';

    if (this.onComplete) {
      this.onComplete({ success: exito, score, timeSpent });
    }
  }

  finalizar() {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);
    if (this.rafaAnim) cancelAnimationFrame(this.rafaAnim);
    this.verificar();
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.rafaAnim) cancelAnimationFrame(this.rafaAnim);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }
}