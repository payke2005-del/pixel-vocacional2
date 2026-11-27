// ============================================================
// MINIJUEGOS MODULARES - PIXEL VOCACIONAL (VERSIÓN FINAL CORREGIDA)
// ============================================================

const Minijuegos = {
  tiempoTranscurrido(inicio) {
    return parseFloat(((Date.now() - inicio) / 1000).toFixed(2));
  }
};

// ------------------------------------------------------------
// 1. BUG HUNTER GAME (Informática)
// ------------------------------------------------------------
class BugHunterGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.timer = null;
    this.inicio = null;
    this.lineas = [];
    this.bugsEncontrados = 0;
    this.totalBugs = 0;
    this.limiteSegundos = 30;
    this.terminado = false;
    this.nivel = 'principiante';
    this.juegoIniciado = false;
    // Variables para el modo "Atrapa el Bug" (Intermedio)
    this.minigameRunning = false;
    this.minigameScore = 0;
    this.minigameTimeLeft = 20;
    this.spawnInterval = null;
    this.minigameTimer = null;
  }

  start(containerElement, onComplete, nivel = 'principiante') {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.nivel = nivel;
    this.terminado = false;
    this.bugsEncontrados = 0;
    this.juegoIniciado = false;
    this.container.innerHTML = '';

    if (nivel === 'intermedio') {
      this.startAtrapaBug();
      return;
    }

    let lineasBase = [];
    let tiempo = 30;
    let explicacion = '';

    if (nivel === 'principiante') {
      lineasBase = [
        { texto: 'function sumar(a, b) {', esBug: false },
        { texto: '    return a + b', esBug: true },
        { texto: '}', esBug: false }
      ];
      tiempo = 30;
      explicacion = 'Busca la línea que le falta el punto y coma (;).';
    } else {
      lineasBase = [
        { texto: 'function calcularPromedio(notas) {', esBug: false },
        { texto: '    let suma = 0;', esBug: false },
        { texto: '    for (let i = 0; i < notas.length; i++) {', esBug: false },
        { texto: '        suma += notas[i];', esBug: false },
        { texto: '    }', esBug: false },
        { texto: '    return suma / notas.length', esBug: true },
        { texto: '}', esBug: false },
        { texto: '', esBug: false },
        { texto: 'let edad = 25', esBug: true },
        { texto: 'if (edad > 18) {', esBug: false },
        { texto: '    console.log("Mayor de edad");', esBug: false },
        { texto: '}', esBug: false },
        { texto: '', esBug: false },
        { texto: 'function saludar(nombre) {', esBug: false },
        { texto: '    return "Hola, " + nombre;', esBug: false },
        { texto: '}', esBug: true }
      ];
      tiempo = 25;
      explicacion = 'Hay 3 errores. Revisa puntos y comas, llaves y paréntesis.';
    }

    this.lineas = lineasBase;
    this.totalBugs = this.lineas.filter(l => l.esBug).length;
    this.limiteSegundos = tiempo;

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-bgh-wrap';
    wrap.innerHTML = `
      <h2>🐛 Caza de Bugs - Informática (${nivel.toUpperCase()})</h2>
      <p class="mj-explicacion">${explicacion}</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-bgh-timer">${this.limiteSegundos}</span>s</span>
        <span>🐛 <span id="mj-bgh-score">0</span>/${this.totalBugs}</span>
      </div>
      <div class="mj-bgh-code" id="mj-bgh-code"></div>
      <div id="mj-bgh-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-bgh-msg"></div>
      <button id="mj-bgh-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-bgh-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    const codeEl = this.container.querySelector('#mj-bgh-code');
    this.lineas.forEach((lin, i) => {
      const div = document.createElement('div');
      div.className = 'mj-bgh-line';
      div.dataset.index = i;
      div.innerHTML = `<span class="mj-bgh-lineno">${i + 1}</span><span class="mj-bgh-content">${this.escapeHtml(lin.texto)}</span>`;
      div.style.pointerEvents = 'none';
      div.addEventListener('click', () => this.clicLinea(div, lin.esBug));
      codeEl.appendChild(div);
    });

    this.container.querySelector('#mj-bgh-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-bgh-iniciar').style.display = 'none';
      codeEl.querySelectorAll('.mj-bgh-line').forEach(l => l.style.pointerEvents = 'auto');
      this.iniciarTimer();
    });

    this.container.querySelector('#mj-bgh-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, this.nivel);
    });
  }

  // --- MODO INTERMEDIO: ATRAPA EL BUG ---
  startAtrapaBug() {
    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-bgh-wrap';
    wrap.innerHTML = `
      <h2>🐛 Atrapa el Bug - Informática (INTERMEDIO)</h2>
      <p class="mj-explicacion">Haz clic en los bichos (🐛) y evita los archivos (📁). Tienes 20 segundos para atrapar la mayor cantidad posible.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-mini-timer">20</span>s</span>
        <span>🐛 <span id="mj-mini-score">0</span> puntos</span>
      </div>
      <div class="mj-bgh-area" id="mj-mini-area" style="width: 100%; height: 300px; background: #1a1a2a; border: 2px solid #4a4a6a; border-radius: 8px; position: relative; overflow: hidden; margin-top: 15px;"></div>
      <div class="mj-msg" id="mj-bgh-msg"></div>
      <button id="mj-bgh-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-bgh-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    const area = this.container.querySelector('#mj-mini-area');
    const scoreEl = this.container.querySelector('#mj-mini-score');
    const timerEl = this.container.querySelector('#mj-mini-timer');
    const msg = this.container.querySelector('#mj-bgh-msg');

    let itemsAtrapados = 0;

    const spawn = () => {
      if (!this.minigameRunning) return;
      const isBug = Math.random() < 0.7;
      const emoji = isBug ? '🐛' : '📁';
      const x = Math.floor(Math.random() * (area.clientWidth - 40));
      const y = Math.floor(Math.random() * (area.clientHeight - 40));

      const item = document.createElement('div');
      item.style.position = 'absolute';
      item.style.left = x + 'px';
      item.style.top = y + 'px';
      item.style.fontSize = '2rem';
      item.style.cursor = 'pointer';
      item.style.userSelect = 'none';
      item.style.transition = 'transform 0.1s';
      item.textContent = emoji;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.minigameRunning) return;
        item.remove();
        if (isBug) {
          itemsAtrapados += 10;
          scoreEl.textContent = itemsAtrapados;
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
        } else {
          itemsAtrapados = Math.max(0, itemsAtrapados - 5);
          scoreEl.textContent = itemsAtrapados;
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
        }
      });

      area.appendChild(item);
      setTimeout(() => { if (item.parentElement) item.remove(); }, 1000);
    };

    this.container.querySelector('#mj-bgh-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.minigameRunning = true;
      this.container.querySelector('#mj-bgh-iniciar').style.display = 'none';
      this.inicio = Date.now();
      let time = 20;
      timerEl.textContent = time;

      this.spawnInterval = setInterval(spawn, 500);
      this.minigameTimer = setInterval(() => {
        time--;
        timerEl.textContent = Math.max(0, time);
        if (time <= 0) {
          this.minigameRunning = false;
          clearInterval(this.spawnInterval);
          clearInterval(this.minigameTimer);
          area.innerHTML = '';
          const success = itemsAtrapados > 50;
          msg.className = 'mj-msg ' + (success ? 'ok' : 'err');
          msg.textContent = success
            ? `🎉 ¡Excelente! Atrapaste ${itemsAtrapados} puntos. Acertaste porque reaccionaste rápido y evitastes los archivos.`
            : `⚠ Solo atrapaste ${itemsAtrapados} puntos. Fallaste porque no llegaste a la meta de 50 puntos.`;
          msg.style.display = 'block';
          this.container.querySelector('#mj-bgh-reiniciar').style.display = 'block';
          if (this.onComplete) this.onComplete({ success, score: itemsAtrapados, timeSpent: 20 });
        }
      }, 1000);
    });

    this.container.querySelector('#mj-bgh-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'intermedio');
    });
  }

  iniciarTimer() {
    this.inicio = Date.now();
    const timerEl = this.container.querySelector('#mj-bgh-timer');
    this.timer = setInterval(() => {
      const restantes = this.limiteSegundos - Math.floor(Minijuegos.tiempoTranscurrido(this.inicio));
      timerEl.textContent = Math.max(0, restantes);
      if (restantes <= 0) this.finalizar();
    }, 500);
  }

  clicLinea(el, esBug) {
    if (this.terminado || !this.juegoIniciado) return;
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
      pista.className = 'mj-pista warn';
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
      ? `🎉 ¡Encontraste los ${this.totalBugs} bugs! Acertaste porque identificaste correctamente los errores de sintaxis.`
      : `⏱ Tiempo agotado. Encontraste ${this.bugsEncontrados}/${this.totalBugs} bugs. Fallaste porque no identificaste todos los errores a tiempo.`;
    msg.style.display = 'block';

    this.container.querySelector('#mj-bgh-iniciar').style.display = 'none';
    this.container.querySelector('#mj-bgh-reiniciar').style.display = 'block';

    if (this.onComplete) {
      this.onComplete({ success, score, timeSpent });
    }
  }

  destroy() {
    this.terminado = true;
    this.minigameRunning = false;
    clearInterval(this.timer);
    clearInterval(this.spawnInterval);
    clearInterval(this.minigameTimer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }

  escapeHtml(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// ------------------------------------------------------------
// 2. BALANCE GAME (Contaduría)
// ------------------------------------------------------------
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
    this.nivel = 'principiante';
    this.juegoIniciado = false;
  }

  start(containerElement, onComplete, nivel = 'principiante') {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.nivel = nivel;
    this.terminado = false;
    this.colocarEn = {};
    this.tarjetaSeleccionada = null;
    this.juegoIniciado = false;
    this.container.innerHTML = '';

    let tarjetasBase = [];
    let tiempo = null;
    let explicacion = '';

    if (nivel === 'principiante') {
      tarjetasBase = [
        { id: 't1', concepto: 'Venta de productos', monto: 500, correcto: 'haber', icono: '💰' },
        { id: 't2', concepto: 'Compra de equipo', monto: 300, correcto: 'debe', icono: '💻' },
        { id: 't3', concepto: 'Pago de luz', monto: 150, correcto: 'debe', icono: '💡' }
      ];
      explicacion = 'Clasifica cada tarjeta en Debe (egresos) o Haber (ingresos).';
    } else if (nivel === 'intermedio') {
      tarjetasBase = [
        { id: 't1', concepto: 'Venta de productos', monto: 500, correcto: 'haber', icono: '💰' },
        { id: 't2', concepto: 'Compra de equipo', monto: 300, correcto: 'debe', icono: '💻' },
        { id: 't3', concepto: 'Pago de luz', monto: 150, correcto: 'debe', icono: '💡' },
        { id: 't4', concepto: 'Préstamo bancario', monto: 1000, correcto: 'haber', icono: '🏦' }
      ];
      tiempo = 20;
      explicacion = 'Clasifica cada tarjeta en Debe o Haber. Tienes 20 segundos.';
    } else {
      tarjetasBase = [
        { id: 't1', concepto: 'Venta de productos', monto: 500, correcto: 'haber', icono: '💰' },
        { id: 't2', concepto: 'Compra de equipo', monto: 300, correcto: 'debe', icono: '💻' },
        { id: 't3', concepto: 'Pago de luz', monto: 150, correcto: 'debe', icono: '💡' },
        { id: 't4', concepto: 'Préstamo bancario', monto: 1000, correcto: 'haber', icono: '🏦' },
        { id: 't5', concepto: 'Salarios', monto: 700, correcto: 'debe', icono: '👥' },
        { id: 't6', concepto: 'Intereses', monto: 800, correcto: 'haber', icono: '📈' }
      ];
      tiempo = 15;
      explicacion = 'Clasifica cada tarjeta en Debe o Haber. Tienes 15 segundos.';
    }

    this.tarjetas = tarjetasBase;

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-bg-wrap';
    wrap.innerHTML = `
      <h2>⚖ El Balance Perfecto - Contaduría (${nivel.toUpperCase()})</h2>
      <p class="mj-explicacion">${explicacion}</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-bg-timer">${tiempo ? tiempo : '∞'}</span>${tiempo ? 's' : ''}</span>
        <span>✅ <span id="mj-bg-score">0</span>/${this.tarjetas.length} colocadas</span>
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
      <div id="mj-bg-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-bg-msg"></div>
      <button id="mj-bg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-bg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    const mazo = this.container.querySelector('#mj-bg-mazo');
    this.tarjetas.forEach(t => {
      const card = document.createElement('div');
      card.className = 'mj-bg-card';
      card.dataset.id = t.id;
      card.dataset.correcto = t.correcto;
      card.innerHTML = `<span class="mj-bg-icon">${t.icono}</span><div>${t.concepto}</div><div class="monto">${t.monto}</div>`;
      card.style.pointerEvents = 'none';
      card.addEventListener('click', () => this.seleccionarTarjeta(card, t));
      mazo.appendChild(card);
    });

    this.container.querySelectorAll('.mj-bg-col').forEach(colEl => {
      colEl.addEventListener('click', (e) => {
        if (!this.juegoIniciado) return;
        if (e.target.closest('.mj-bg-card')) return;
        this.colocarEnColumna(colEl.dataset.col);
      });
    });

    this.container.querySelector('#mj-bg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-bg-iniciar').style.display = 'none';
      this.container.querySelectorAll('.mj-bg-card').forEach(c => c.style.pointerEvents = 'auto');
      if (tiempo) this.iniciarTimer(tiempo);
    });

    this.container.querySelector('#mj-bg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, this.nivel);
    });

    this.actualizarContador();
    this.actualizarBalanza();
  }

  iniciarTimer(tiempo) {
    this.inicio = Date.now();
    this.timer = setInterval(() => {
      const restantes = tiempo - Math.floor(Minijuegos.tiempoTranscurrido(this.inicio));
      const el = this.container.querySelector('#mj-bg-timer');
      if (el) el.textContent = Math.max(0, restantes);
      if (restantes <= 0) this.finalizar();
    }, 500);
  }

  seleccionarTarjeta(card, tarjeta) {
    if (this.terminado || !this.juegoIniciado) return;
    if (this.colocarEn[tarjeta.id]) return;
    if (this.tarjetaSeleccionada) this.tarjetaSeleccionada.classList.remove('seleccionada');
    this.tarjetaSeleccionada = card;
    card.classList.add('seleccionada');
    const pistaEl = this.container.querySelector('#mj-bg-pista');
    pistaEl.textContent = `👆 Seleccionaste: ${tarjeta.concepto}. Ahora haz clic en "Debe" o "Haber".`;
    pistaEl.className = 'mj-pista info';
    if (typeof SoundSystem !== 'undefined') SoundSystem.play('click');
  }

  colocarEnColumna(col) {
    if (this.terminado || !this.juegoIniciado) return;
    if (!this.tarjetaSeleccionada) {
      const pistaEl = this.container.querySelector('#mj-bg-pista');
      pistaEl.textContent = '⚠ Primero selecciona una tarjeta haciendo clic en ella.';
      pistaEl.className = 'mj-pista warn';
      return;
    }
    const id = this.tarjetaSeleccionada.dataset.id;
    if (this.colocarEn[id]) return;
    this.colocarEn[id] = col;
    const dz = this.container.querySelector(`.mj-bg-dropzone[data-col="${col}"]`);
    if (!dz) return;
    dz.appendChild(this.tarjetaSeleccionada);
    this.tarjetaSeleccionada.classList.remove('seleccionada');
    this.tarjetaSeleccionada.classList.add('colocada', col);
    this.tarjetaSeleccionada.style.pointerEvents = 'none';
    this.tarjetaSeleccionada = null;
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
      const suma = this.tarjetas.filter(t => this.colocarEn[t.id] === col).reduce((acc, t) => acc + t.monto, 0);
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
      texto.style.color = '#88cc88';
      balanza.classList.add('equilibrada');
    } else if (sumaDebe > sumaHaber) {
      balanza.textContent = '⚖⬇';
      texto.textContent = 'Debe pesa más';
      texto.style.color = '#cc8888';
      balanza.classList.remove('equilibrada');
    } else if (sumaHaber > sumaDebe) {
      balanza.textContent = '⚖⬆';
      texto.textContent = 'Haber pesa más';
      texto.style.color = '#88cc88';
      balanza.classList.remove('equilibrada');
    } else {
      balanza.textContent = '⚖';
      texto.textContent = 'Esperando tarjetas...';
      texto.style.color = '#a0a0b0';
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
      ? '🎉 ¡Balance perfecto! Acertaste porque clasificaste correctamente todos los conceptos.'
      : `⚠ Balance incompleto. Fallaste porque no clasificaste bien todos los conceptos. Debe: ${sumaDebe}, Haber: ${sumaHaber}.`;
    msg.style.display = 'block';
    this.container.querySelector('#mj-bg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-bg-reiniciar').style.display = 'block';
    if (this.onComplete) this.onComplete({ success, score, timeSpent });
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }
}

// ------------------------------------------------------------
// 3. CIRCUIT GAME (Electricidad)
// ------------------------------------------------------------
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
    this.nivel = 'principiante';
    this.juegoIniciado = false;
  }

  start(containerElement, onComplete, nivel = 'principiante') {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.nivel = nivel;
    this.terminado = false;
    this.juegoIniciado = false;
    this.container.innerHTML = '';

    if (nivel === 'principiante') {
      this.startPrincipiante();
      return;
    }
    if (nivel === 'intermedio') {
      this.startIntermedio();
      return;
    }
    this.startExperto();
  }

  // --- PRINCIPIANTE: Conecta los Cables en Orden ---
  startPrincipiante() {
    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-cg-wrap';
    wrap.innerHTML = `
      <h2>🔌 Conecta los Cables - Electricidad (PRINCIPIANTE)</h2>
      <p class="mj-explicacion">Conecta los cables en el orden correcto: primero el rojo (fase), luego el azul (neutro), luego el verde (tierra).</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-cg-timer">20</span>s</span>
        <span>🔌 <span id="mj-cg-status">Esperando conexiones</span></span>
      </div>
      <div class="mj-cg-tomacorrientes" id="mj-cg-tomacorrientes">
        <div class="mj-cg-tomacorriente" data-color="rojo" style="background:#3a1e1e; border-color:#cc8888;">🔴</div>
        <div class="mj-cg-tomacorriente" data-color="azul" style="background:#1e1e3a; border-color:#8888cc;">🔵</div>
        <div class="mj-cg-tomacorriente" data-color="verde" style="background:#1e3a1e; border-color:#88cc88;">🟢</div>
      </div>
      <div class="mj-cg-cables" id="mj-cg-cables">
        <div class="mj-cg-cable" draggable="true" data-color="rojo" style="background:#cc4444; color:white;">Cable Rojo</div>
        <div class="mj-cg-cable" draggable="true" data-color="azul" style="background:#4444cc; color:white;">Cable Azul</div>
        <div class="mj-cg-cable" draggable="true" data-color="verde" style="background:#44cc44; color:white;">Cable Verde</div>
      </div>
      <div id="mj-cg-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-cg-msg"></div>
      <button id="mj-cg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-cg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    const tomas = this.container.querySelectorAll('.mj-cg-tomacorriente');
    const cables = this.container.querySelectorAll('.mj-cg-cable');
    const status = this.container.querySelector('#mj-cg-status');
    const pista = this.container.querySelector('#mj-cg-pista');
    let conectados = 0;
    const ordenCorrecto = ['rojo', 'azul', 'verde'];
    let siguiente = 0;

    cables.forEach(cable => {
      cable.style.pointerEvents = 'none';
      cable.addEventListener('dragstart', (e) => {
        if (this.terminado || !this.juegoIniciado) return;
        e.dataTransfer.setData('text/plain', cable.dataset.color);
        cable.classList.add('dragging');
      });
      cable.addEventListener('dragend', () => {
        cable.classList.remove('dragging');
      });
    });

    tomas.forEach(toma => {
      toma.addEventListener('dragover', (e) => {
        e.preventDefault();
        toma.classList.add('dragover');
      });
      toma.addEventListener('dragleave', () => {
        toma.classList.remove('dragover');
      });
      toma.addEventListener('drop', (e) => {
        e.preventDefault();
        toma.classList.remove('dragover');
        if (this.terminado || !this.juegoIniciado) return;

        const colorCable = e.dataTransfer.getData('text/plain');
        const colorToma = toma.dataset.color;

        if (colorCable !== ordenCorrecto[siguiente]) {
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
          pista.textContent = `❌ Cortocircuito. Debes conectar primero el ${ordenCorrecto[siguiente]}.`;
          pista.className = 'mj-pista warn';
          this.finalizarPrincipiante(false);
          return;
        }

        if (colorCable === colorToma) {
          toma.textContent = '✅';
          toma.classList.add('correcto');
          const cable = this.container.querySelector(`.mj-cg-cable[data-color="${colorCable}"]`);
          if (cable) cable.remove();
          conectados++;
          siguiente++;
          status.textContent = `${conectados}/3 conectados`;
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
          pista.textContent = `✅ Cable ${colorCable} conectado correctamente.`;
          pista.className = 'mj-pista ok';
          if (conectados === 3) {
            this.finalizarPrincipiante(true);
          }
        } else {
          toma.classList.add('incorrecto');
          setTimeout(() => toma.classList.remove('incorrecto'), 500);
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
          pista.textContent = `❌ Cortocircuito. Ese no es el tomacorriente correcto.`;
          pista.className = 'mj-pista warn';
          this.finalizarPrincipiante(false);
        }
      });
    });

    this.container.querySelector('#mj-cg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-cg-iniciar').style.display = 'none';
      this.container.querySelectorAll('.mj-cg-cable').forEach(c => c.style.pointerEvents = 'auto');
      this.inicio = Date.now();
      let segundos = 20;
      this.timer = setInterval(() => {
        segundos--;
        const el = this.container.querySelector('#mj-cg-timer');
        if (el) el.textContent = Math.max(0, segundos);
        if (segundos <= 0 && !this.terminado) {
          this.finalizarPrincipiante(false);
        }
      }, 1000);
    });

    this.container.querySelector('#mj-cg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'principiante');
    });
  }

  finalizarPrincipiante(exito) {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const score = exito ? 100 : 0;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-cg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? '🎉 ¡Todos los cables conectados en orden! Acertaste porque seguiste la secuencia correcta.'
      : '⚠ Conexión incorrecta. Fallaste porque no seguiste el orden correcto (rojo → azul → verde).';
    msg.style.display = 'block';

    this.container.querySelector('#mj-cg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-cg-reiniciar').style.display = 'block';

    if (this.onComplete) {
      this.onComplete({ success: exito, score, timeSpent });
    }
  }

  // --- INTERMEDIO: Instala la Bombilla ---
  startIntermedio() {
    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-cg-wrap';
    wrap.innerHTML = `
      <h2>💡 Instala la Bombilla - Electricidad (INTERMEDIO)</h2>
      <p class="mj-explicacion">Selecciona los implementos de seguridad correctos y coloca la bombilla en el orden adecuado.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-cg-timer">30</span>s</span>
        <span>💡 <span id="mj-cg-status">Paso 1: Selecciona tu equipo</span></span>
      </div>
      <div class="mj-cg-implementos" id="mj-cg-implementos">
        <div class="mj-cg-implemento" data-correcto="true">🧤 Guantes dieléctricos</div>
        <div class="mj-cg-implemento" data-correcto="false">🧤 Guantes de látex</div>
        <div class="mj-cg-implemento" data-correcto="true">🥽 Gafas de seguridad</div>
        <div class="mj-cg-implemento" data-correcto="false">👓 Gafas de sol</div>
        <div class="mj-cg-implemento" data-correcto="true">⛑️ Casco aislante</div>
        <div class="mj-cg-implemento" data-correcto="false">🧢 Gorra</div>
      </div>
      <div class="mj-msg" id="mj-cg-msg"></div>
      <button id="mj-cg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-cg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    const implementos = this.container.querySelectorAll('.mj-cg-implemento');
    const status = this.container.querySelector('#mj-cg-status');
    let seleccionados = 0;
    const totalCorrectos = 3;
    const elegidos = new Set();

    this.container.querySelector('#mj-cg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-cg-iniciar').style.display = 'none';
      implementos.forEach(imp => imp.style.pointerEvents = 'auto');
      this.inicio = Date.now();
      let segundos = 30;
      this.timer = setInterval(() => {
        segundos--;
        const el = this.container.querySelector('#mj-cg-timer');
        if (el) el.textContent = Math.max(0, segundos);
        if (segundos <= 0 && !this.terminado) {
          this.finalizarIntermedio(false);
        }
      }, 1000);
    });

    implementos.forEach(imp => {
      imp.style.pointerEvents = 'none';
      imp.addEventListener('click', () => {
        if (this.terminado || !this.juegoIniciado) return;
        const correcto = imp.dataset.correcto === 'true';
        if (correcto) {
          if (elegidos.has(imp)) return;
          elegidos.add(imp);
          imp.classList.add('correcto');
          seleccionados++;
          status.textContent = `Paso 1: ${seleccionados}/${totalCorrectos} implementos`;
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
          if (seleccionados === totalCorrectos) {
            status.textContent = '¡Equipo completo! Ahora coloca la bombilla.';
            imp.disabled = true;
            this.iniciarColocacionBombilla();
          }
        } else {
          imp.classList.add('incorrecto');
          setTimeout(() => imp.classList.remove('incorrecto'), 500);
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
          this.finalizarIntermedio(false);
        }
      });
    });

    this.container.querySelector('#mj-cg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'intermedio');
    });
  }

  iniciarColocacionBombilla() {
    const contenedor = this.container.querySelector('.mj-cg-implementos');
    contenedor.innerHTML = `
      <div style="text-align:center; width:100%;">
        <p style="color:#a0a0b0; margin-bottom:15px;">Haz clic en el orden correcto:</p>
        <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
          <div class="mj-cg-paso" data-paso="1">1. Apagar interruptor</div>
          <div class="mj-cg-paso" data-paso="2">2. Desenroscar vieja</div>
          <div class="mj-cg-paso" data-paso="3">3. Enroscar nueva</div>
          <div class="mj-cg-paso" data-paso="4">4. Encender</div>
        </div>
      </div>
    `;
    const pasos = contenedor.querySelectorAll('.mj-cg-paso');
    let ordenActual = 1;

    pasos.forEach(paso => {
      paso.addEventListener('click', () => {
        if (this.terminado) return;
        const num = parseInt(paso.dataset.paso);
        if (num === ordenActual) {
          paso.classList.add('correcto');
          ordenActual++;
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
          if (ordenActual > 4) {
            this.finalizarIntermedio(true);
          }
        } else {
          paso.classList.add('incorrecto');
          setTimeout(() => paso.classList.remove('incorrecto'), 500);
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
          this.finalizarIntermedio(false);
        }
      });
    });
  }

  finalizarIntermedio(exito) {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const score = exito ? 100 : 0;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-cg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? '🎉 ¡Bombilla instalada de forma segura! Acertaste porque elegiste los implementos correctos y seguiste el orden adecuado.'
      : '⚠ Fallaste en el proceso. La instalación no es segura.';
    msg.style.display = 'block';

    this.container.querySelector('#mj-cg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-cg-reiniciar').style.display = 'block';

    if (this.onComplete) {
      this.onComplete({ success: exito, score, timeSpent });
    }
  }

  // --- EXPERTO: Completa el Circuito ---
  startExperto() {
    let gridSize = 4;
    let source = { x: 0, y: 0 };
    let target = { x: 3, y: 3 };

    this.gridSize = gridSize;
    this.source = source;
    this.target = target;

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-cg-wrap';
    wrap.innerHTML = `
      <h2>🔌 Completa el Circuito - Electricidad (EXPERTO)</h2>
      <p class="mj-explicacion">Haz clic en los cables para rotarlos 90° y conecta la fuente (+) con el receptor (-).</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-cg-timer">00</span>s</span>
        <span>🔌 <span id="mj-cg-status">Circuito abierto</span></span>
      </div>
      <div class="mj-cg-grid" id="mj-cg-grid"></div>
      <div id="mj-cg-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-cg-msg"></div>
      <button id="mj-cg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-cg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    this.inicializarGrid();
    this.renderGrid();

    this.container.querySelector('#mj-cg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-cg-iniciar').style.display = 'none';
      this.container.querySelectorAll('.mj-cg-cell').forEach(c => c.style.pointerEvents = 'auto');
      this.iniciarTimer();
    });

    this.container.querySelector('#mj-cg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'experto');
    });
  }

  iniciarTimer() {
    this.inicio = Date.now();
    this.timer = setInterval(() => {
      const el = this.container.querySelector('#mj-cg-timer');
      el.textContent = Math.floor(Minijuegos.tiempoTranscurrido(this.inicio)).toString().padStart(2, '0');
    }, 500);
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
        celda.style.pointerEvents = 'none';
        celda.addEventListener('click', () => this.rotarCelda(x, y, celda));
        grid.appendChild(celda);
      }
    }
  }

  simbolo(c) {
    if (c.tipo === 'source') return '+';
    if (c.tipo === 'target') return '-';
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
    if (this.terminado || !this.juegoIniciado) return;
    const c = this.celdas[y][x];
    if (c.tipo === 'source' || c.tipo === 'target') return;
    c.rot = (c.rot + 90) % 360;
    c.conexiones = this.rotarConexiones(this.conexionesBaseDeTipo(c.tipo), c.rot);
    celdaEl.textContent = this.simbolo(c);
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
      span.style.color = '#88cc88';
      pista.textContent = '🎉 ¡Excelente! La corriente fluye correctamente.';
      pista.className = 'mj-pista ok';
    } else {
      span.textContent = 'Circuito abierto';
      span.style.color = '#cc8888';
      pista.textContent = '💡 Gira más cables para conectar la fuente con el receptor.';
      pista.className = 'mj-pista info';
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
      if (actual.x === this.target.x && actual.y === this.target.y) return true;
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
      ? '🎉 ¡Circuito cerrado! Acertaste porque lograste conectar la fuente con el receptor.'
      : '⚠ El circuito sigue abierto. Fallaste porque no lograste conectar todos los cables.';
    msg.style.display = 'block';
    this.container.querySelector('#mj-cg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-cg-reiniciar').style.display = 'block';
    if (this.onComplete) this.onComplete({ success, score, timeSpent });
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }
}

// ------------------------------------------------------------
// 4. GEAR GAME (Mecánica)
// ------------------------------------------------------------
class GearGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.inicio = null;
    this.timer = null;
    this.terminado = false;
    this.nivel = 'principiante';
    this.juegoIniciado = false;
  }

  start(containerElement, onComplete, nivel = 'principiante') {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.nivel = nivel;
    this.terminado = false;
    this.juegoIniciado = false;
    this.container.innerHTML = '';

    if (nivel === 'principiante') {
      this.startEnsamblar();
      return;
    }
    if (nivel === 'intermedio') {
      this.startBalanza();
      return;
    }
    this.startEngranajes();
  }

  // --- PRINCIPIANTE: Ensambla la Máquina ---
  startEnsamblar() {
    const numPiezas = 5;
    const tiempoLimite = 30;

    const piezas = [
      { id: 'p1', nombre: 'Engranaje', emoji: '⚙️', posicion: 0 },
      { id: 'p2', nombre: 'Correa', emoji: '🔗', posicion: 1 },
      { id: 'p3', nombre: 'Eje', emoji: '🔩', posicion: 2 },
      { id: 'p4', nombre: 'Tornillo', emoji: '🔧', posicion: 3 },
      { id: 'p5', nombre: 'Tuerca', emoji: '🔩', posicion: 4 }
    ];

    const piezasMezcladas = [...piezas].sort(() => Math.random() - 0.5);

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-gg-wrap';
    wrap.innerHTML = `
      <h2>⚙ Ensambla la Máquina - Mecánica (PRINCIPIANTE)</h2>
      <p class="mj-explicacion">Arrastra cada pieza desde el mazo hasta su molde correspondiente.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-gg-timer">${tiempoLimite}</span>s</span>
        <span>🔧 <span id="mj-gg-score">0</span>/${numPiezas} colocadas</span>
      </div>
      <div class="mj-gg-maquina" id="mj-gg-maquina">
        ${piezas.map((p, i) => `
          <div class="mj-gg-slot" data-slot="${i}" data-pieza="${p.id}" style="font-size: 3rem; color: #8888cc; border-color: #4a4a6a;">
            <span class="mj-gg-slot-placeholder" style="opacity: 0.4;">${p.emoji}</span>
          </div>
        `).join('')}
      </div>
      <div class="mj-gg-mazo" id="mj-gg-mazo">
        ${piezasMezcladas.map(p => `
          <div class="mj-gg-pieza" draggable="true" data-id="${p.id}" data-posicion="${p.posicion}" style="font-size: 2rem; color: #cccc88; border-color: #6a6a4a;">
            ${p.emoji}
          </div>
        `).join('')}
      </div>
      <div id="mj-gg-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-gg-msg"></div>
      <button id="mj-gg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-gg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    let colocadas = 0;
    const totalPiezas = numPiezas;
    const mazo = this.container.querySelector('#mj-gg-mazo');
    const maquina = this.container.querySelector('#mj-gg-maquina');
    const scoreEl = this.container.querySelector('#mj-gg-score');
    const pistaEl = this.container.querySelector('#mj-gg-pista');

    const piezasEl = mazo.querySelectorAll('.mj-gg-pieza');
    piezasEl.forEach(pieza => {
      pieza.style.pointerEvents = 'none';
      pieza.addEventListener('dragstart', (e) => {
        if (this.terminado || !this.juegoIniciado) return;
        e.dataTransfer.setData('text/plain', pieza.dataset.id);
        pieza.classList.add('dragging');
      });
      pieza.addEventListener('dragend', () => {
        pieza.classList.remove('dragging');
      });
    });

    const slots = maquina.querySelectorAll('.mj-gg-slot');
    slots.forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('dragover');
      });
      slot.addEventListener('dragleave', () => {
        slot.classList.remove('dragover');
      });
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('dragover');
        if (this.terminado || !this.juegoIniciado) return;

        const piezaId = e.dataTransfer.getData('text/plain');
        const pieza = this.container.querySelector(`.mj-gg-pieza[data-id="${piezaId}"]`);
        if (!pieza) return;

        const piezaPosicion = parseInt(pieza.dataset.posicion);
        const slotPosicion = parseInt(slot.dataset.slot);

        if (piezaPosicion === slotPosicion) {
          slot.innerHTML = `<span class="mj-gg-slot-content" style="font-size: 3rem;">${pieza.textContent.trim()}</span>`;
          slot.classList.add('correcto');
          pieza.remove();
          colocadas++;
          scoreEl.textContent = colocadas;
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
          pistaEl.textContent = `✅ ¡${pieza.textContent.trim()} colocada correctamente!`;
          pistaEl.className = 'mj-pista ok';
          if (colocadas === totalPiezas) {
            this.finalizarEnsamblar(true);
          }
        } else {
          slot.classList.add('incorrecto');
          setTimeout(() => slot.classList.remove('incorrecto'), 500);
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
          pistaEl.textContent = `❌ Esa pieza no va aquí.`;
          pistaEl.className = 'mj-pista warn';
        }
      });
    });

    this.container.querySelector('#mj-gg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-gg-iniciar').style.display = 'none';
      this.container.querySelectorAll('.mj-gg-pieza').forEach(p => p.style.pointerEvents = 'auto');
      this.inicio = Date.now();
      let segundos = tiempoLimite;
      this.timer = setInterval(() => {
        segundos--;
        const el = this.container.querySelector('#mj-gg-timer');
        if (el) el.textContent = Math.max(0, segundos);
        if (segundos <= 0 && !this.terminado) {
          this.finalizarEnsamblar(false);
        }
      }, 1000);
    });

    this.container.querySelector('#mj-gg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'principiante');
    });
  }

  finalizarEnsamblar(exito) {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const score = exito ? 100 : 0;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-gg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? '🎉 ¡Máquina ensamblada! Acertaste porque colocaste cada pieza en su molde correcto.'
      : '⚠ Ensamblaje incompleto. Fallaste porque no colocaste todas las piezas a tiempo.';
    msg.style.display = 'block';

    this.container.querySelector('#mj-gg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-gg-reiniciar').style.display = 'block';

    if (this.onComplete) {
      this.onComplete({ success: exito, score, timeSpent });
    }
  }

  // --- INTERMEDIO: Balanza de Peso Real (Sumando Pesos) ---
  startBalanza() {
    const rondas = 3;
    let rondaActual = 0;
    const pesosDisponibles = [5, 10, 20, 30, 40, 50];

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-gg-wrap';
    wrap.innerHTML = `
      <h2>⚖ Balanza de Peso - Mecánica (INTERMEDIO)</h2>
      <p class="mj-explicacion">Equilibra la balanza sumando pesos en el plato derecho hasta igualar el peso del plato izquierdo.</p>
      <div class="mj-status">
        <span>Ronda: <span id="mj-gg-ronda">1</span>/${rondas}</span>
        <span>⚖ <span id="mj-gg-status">Elige un peso</span></span>
      </div>
      <div class="mj-gg-balanza-wrap">
        <div class="mj-gg-balanza">
          <div class="mj-gg-plato izq" id="mj-gg-plato-izq">?</div>
          <div class="mj-gg-balanza-emoji" id="mj-gg-balanza-emoji">⚖</div>
          <div class="mj-gg-plato der" id="mj-gg-plato-der">0 kg</div>
        </div>
      </div>
      <div class="mj-gg-pesos" id="mj-gg-pesos"></div>
      <div id="mj-gg-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-gg-msg"></div>
      <button id="mj-gg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-gg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    const platoIzq = this.container.querySelector('#mj-gg-plato-izq');
    const platoDer = this.container.querySelector('#mj-gg-plato-der');
    const balanzaEmoji = this.container.querySelector('#mj-gg-balanza-emoji');
    const status = this.container.querySelector('#mj-gg-status');
    const pista = this.container.querySelector('#mj-gg-pista');
    const contenedorPesos = this.container.querySelector('#mj-gg-pesos');
    const rondaEl = this.container.querySelector('#mj-gg-ronda');

    let pesoIzq = 0;
    let pesoDerTotal = 0;

    const nuevaRonda = () => {
      if (rondaActual >= rondas) {
        this.finalizarBalanza(true);
        return;
      }
      rondaActual++;
      rondaEl.textContent = rondaActual;
      pesoIzq = Math.floor(Math.random() * 6 + 1) * 10; // Entre 10 y 60 kg
      pesoDerTotal = 0;
      platoIzq.textContent = pesoIzq + ' kg';
      platoDer.textContent = '0 kg';
      balanzaEmoji.textContent = '⚖';
      balanzaEmoji.style.transform = 'rotate(10deg)';
      status.textContent = 'Suma pesos';
      status.style.color = '#a0a0b0';
      pista.textContent = `El plato izquierdo tiene ${pesoIzq} kg. Haz clic en los pesos para sumarlos a la derecha.`;
      pista.className = 'mj-pista info';

      contenedorPesos.innerHTML = '';
      pesosDisponibles.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'mj-btn';
        btn.style.width = 'auto';
        btn.style.padding = '10px 20px';
        btn.style.margin = '5px';
        btn.textContent = p + ' kg';
        btn.addEventListener('click', () => {
          if (this.terminado || !this.juegoIniciado) return;
          pesoDerTotal += p;
          platoDer.textContent = pesoDerTotal + ' kg';
          
          if (pesoDerTotal === pesoIzq) {
            balanzaEmoji.textContent = '⚖✨';
            balanzaEmoji.style.transform = 'rotate(0deg)';
            status.textContent = '¡Equilibrada!';
            status.style.color = '#88cc88';
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('correct');
            pista.textContent = `✅ ¡Correcto! ${pesoDerTotal} kg = ${pesoIzq} kg. La balanza está equilibrada.`;
            pista.className = 'mj-pista ok';
            setTimeout(() => nuevaRonda(), 1500);
          } else if (pesoDerTotal > pesoIzq) {
            balanzaEmoji.textContent = '⚖';
            balanzaEmoji.style.transform = 'rotate(-10deg)';
            status.textContent = 'Desequilibrada';
            status.style.color = '#cc8888';
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('wrong');
            pista.textContent = `❌ Te pasaste. ${pesoDerTotal} kg es más que ${pesoIzq} kg.`;
            pista.className = 'mj-pista warn';
          } else {
            balanzaEmoji.textContent = '⚖';
            balanzaEmoji.style.transform = 'rotate(5deg)';
            status.textContent = 'Falta peso';
            status.style.color = '#cccc88';
            pista.textContent = `Llevas ${pesoDerTotal} kg. Sigue sumando hasta llegar a ${pesoIzq} kg.`;
            pista.className = 'mj-pista info';
          }
        });
        contenedorPesos.appendChild(btn);
      });
    };

    this.container.querySelector('#mj-gg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-gg-iniciar').style.display = 'none';
      this.inicio = Date.now();
      nuevaRonda();
    });

    this.container.querySelector('#mj-gg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'intermedio');
    });
  }

  finalizarBalanza(exito) {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const score = exito ? 100 : 0;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-gg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? '🎉 ¡Balanza equilibrada en todas las rondas! Acertaste porque sumaste los pesos correctos.'
      : '⚠ No lograste equilibrar la balanza.';
    msg.style.display = 'block';

    this.container.querySelector('#mj-gg-reiniciar').style.display = 'block';

    if (this.onComplete) {
      this.onComplete({ success: exito, score, timeSpent });
    }
  }

  // --- EXPERTO: Relación de Engranajes (aleatorio) ---
  startEngranajes() {
    const rpmMotor = 120;
    const dientesMotor = 20;
    const dientesSalida = 20;
    const opciones = [10, 15, 20, 30, 40, 50];

    // Objetivo aleatorio e independiente
    const rpmObjetivo = Math.floor(Math.random() * 5 + 1) * 30; // 30, 60, 90, 120, 150 RPM

    const seleccion = [20, 20];

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-gg-wrap';
    wrap.innerHTML = `
      <h2>⚙ Relación de Engranajes - Mecánica (EXPERTO)</h2>
      <p class="mj-explicacion">Selecciona el tamaño de los 2 engranajes intermedios para alcanzar la velocidad objetivo.</p>
      <div class="mj-status">
        <span>🎯 Objetivo: <span id="mj-gg-obj">${rpmObjetivo}</span> RPM</span>
        <span>⏱ <span class="mj-tag" id="mj-gg-timer">00</span>s</span>
      </div>
      <div class="mj-gg-diagram" id="mj-gg-diagram"></div>
      <div class="mj-gg-controls" id="mj-gg-controls"></div>
      <div class="mj-gg-target" id="mj-gg-result">Velocidad final: -- RPM</div>
      <div id="mj-gg-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-gg-msg"></div>
      <button id="mj-gg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-gg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    const diagram = this.container.querySelector('#mj-gg-diagram');
    const controls = this.container.querySelector('#mj-gg-controls');
    const resultEl = this.container.querySelector('#mj-gg-result');
    const pistaEl = this.container.querySelector('#mj-gg-pista');

    const renderDiagrama = () => {
      diagram.innerHTML = '';
      const motor = document.createElement('div');
      motor.className = 'mj-gg-gear motor';
      motor.innerHTML = `<span class="mj-gg-teeth">${dientesMotor}</span><div>Motor<br>${rpmMotor} RPM</div>`;
      diagram.appendChild(motor);
      const flecha1 = document.createElement('div');
      flecha1.className = 'mj-gg-arrow';
      flecha1.textContent = '↓';
      diagram.appendChild(flecha1);
      seleccion.forEach((d, i) => {
        const gear = document.createElement('div');
        gear.className = 'mj-gg-gear';
        gear.innerHTML = `<span class="mj-gg-teeth">${d}</span><div>Int ${i + 1}</div>`;
        diagram.appendChild(gear);
        if (i < seleccion.length - 1) {
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
      salida.innerHTML = `<span class="mj-gg-teeth">${dientesSalida}</span><div>Salida</div>`;
      diagram.appendChild(salida);
    };

    const renderControles = () => {
      controls.innerHTML = '';
      seleccion.forEach((d, i) => {
        const ctrl = document.createElement('div');
        ctrl.className = 'mj-gg-control';
        ctrl.innerHTML = `<label>Engranaje ${i + 1}</label>`;
        const select = document.createElement('select');
        select.disabled = true;
        opciones.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = `${opt} dientes`;
          o.selected = opt === d;
          select.appendChild(o);
        });
        select.addEventListener('change', (e) => {
          if (!this.juegoIniciado) return;
          seleccion[i] = parseInt(e.target.value);
          renderDiagrama();
          actualizarResultado();
          if (typeof SoundSystem !== 'undefined') SoundSystem.play('click');
        });
        ctrl.appendChild(select);
        controls.appendChild(ctrl);
      });
    };

    const calcularRPM = () => {
      let rpm = rpmMotor;
      for (const d of seleccion) {
        rpm = rpm * (dientesMotor / d);
      }
      rpm = rpm * (dientesMotor / dientesSalida);
      return rpm;
    };

    const actualizarResultado = () => {
      const rpmFinal = calcularRPM();
      resultEl.textContent = `Velocidad final: ${rpmFinal.toFixed(1)} RPM`;
      const diff = Math.abs(rpmFinal - rpmObjetivo);
      const porcentaje = (diff / rpmObjetivo) * 100;
      if (porcentaje <= 5) {
        pistaEl.textContent = '✅ ¡Perfecto! Estás en el objetivo.';
        pistaEl.className = 'mj-pista ok';
      } else if (rpmFinal < rpmObjetivo) {
        pistaEl.textContent = '💡 Vas muy lento. Prueba con engranajes más pequeños.';
        pistaEl.className = 'mj-pista info';
      } else {
        pistaEl.textContent = '💡 Vas muy rápido. Prueba con engranajes más grandes.';
        pistaEl.className = 'mj-pista info';
      }
    };

    renderDiagrama();
    renderControles();
    actualizarResultado();

    this.container.querySelector('#mj-gg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-gg-iniciar').style.display = 'none';
      this.container.querySelectorAll('select').forEach(s => s.disabled = false);
      this.inicio = Date.now();
      let segundos = 30;
      this.timer = setInterval(() => {
        segundos--;
        const el = this.container.querySelector('#mj-gg-timer');
        if (el) el.textContent = Math.max(0, segundos);
        if (segundos <= 0 && !this.terminado) {
          this.finalizarEngranajes(false);
        }
      }, 1000);
    });

    this.container.querySelector('#mj-gg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'experto');
    });
  }

  finalizarEngranajes(exito) {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const score = exito ? 100 : 0;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-gg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? '🎉 ¡Velocidad alcanzada! Acertaste porque calculaste bien la relación de transmisión.'
      : '⚠ Velocidad incorrecta. Fallaste porque no lograste la relación de engranajes correcta.';
    msg.style.display = 'block';

    this.container.querySelector('#mj-gg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-gg-reiniciar').style.display = 'block';

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

// ------------------------------------------------------------
// 5. SIGNAL GAME (Telecomunicaciones)
// ------------------------------------------------------------
class SignalGame {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.inicio = null;
    this.timer = null;
    this.terminado = false;
    this.canvas = null;
    this.ctx = null;
    this.objetivo = { A: 0, f: 0, fase: 0 };
    this.usuario = { A: 1, f: 1, fase: 0 };
    this.tolerancia = 0.25;
    this.nivel = 'principiante';
    this.juegoIniciado = false;
  }

  start(containerElement, onComplete, nivel = 'principiante') {
    this.container = containerElement;
    this.onComplete = onComplete;
    this.nivel = nivel;
    this.terminado = false;
    this.juegoIniciado = false;
    this.container.innerHTML = '';

    if (nivel === 'experto') {
      this.startExperto();
      return;
    }
    if (nivel === 'intermedio') {
      this.startIntermedio();
      return;
    }
    this.startPrincipiante();
  }

  startPrincipiante() {
    this.tolerancia = 0.40;
    this.objetivo.A = parseFloat((0.5 + Math.random() * 1.0).toFixed(1));
    this.objetivo.f = parseFloat((0.5 + Math.random() * 1.0).toFixed(1));

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-sg-wrap';
    wrap.innerHTML = `
      <h2>📡 Ajuste de Señal - Telecomunicaciones (PRINCIPIANTE)</h2>
      <p class="mj-explicacion">Mueve los sliders de amplitud y frecuencia para igualar la onda de referencia (gris).</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-sg-timer">30</span>s</span>
        <span>📊 <span id="mj-sg-error">Error: --</span></span>
      </div>
      <div class="mj-sg-canvas-wrap">
        <canvas id="mj-sg-canvas" width="560" height="200"></canvas>
      </div>
      <div class="mj-sg-sliders">
        <div class="mj-sg-slider">
          <label>Amplitud <span class="mj-sg-val" id="mj-sg-val-A">1.0</span></label>
          <input type="range" id="mj-sg-slider-A" min="0.1" max="2.0" step="0.1" value="1.0" disabled>
        </div>
        <div class="mj-sg-slider">
          <label>Frecuencia <span class="mj-sg-val" id="mj-sg-val-f">1.0</span></label>
          <input type="range" id="mj-sg-slider-f" min="0.1" max="2.5" step="0.1" value="1.0" disabled>
        </div>
      </div>
      <div class="mj-msg" id="mj-sg-msg"></div>
      <button id="mj-sg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-sg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    this.canvas = this.container.querySelector('#mj-sg-canvas');
    this.ctx = this.canvas.getContext('2d');

    const sA = this.container.querySelector('#mj-sg-slider-A');
    const sF = this.container.querySelector('#mj-sg-slider-f');
    const vA = this.container.querySelector('#mj-sg-val-A');
    const vF = this.container.querySelector('#mj-sg-val-f');

    const actualizar = () => {
      if (!this.juegoIniciado) return;
      this.usuario.A = parseFloat(sA.value);
      this.usuario.f = parseFloat(sF.value);
      vA.textContent = this.usuario.A;
      vF.textContent = this.usuario.f;
      this.dibujar();
      this.actualizarError();
    };

    sA.addEventListener('input', actualizar);
    sF.addEventListener('input', actualizar);

    this.dibujar();

    this.container.querySelector('#mj-sg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-sg-iniciar').style.display = 'none';
      sA.disabled = false;
      sF.disabled = false;
      this.inicio = Date.now();
      let segundos = 30;
      this.timer = setInterval(() => {
        segundos--;
        const el = this.container.querySelector('#mj-sg-timer');
        if (el) el.textContent = Math.max(0, segundos);
        if (segundos <= 0 && !this.terminado) {
          this.finalizar(false);
        }
      }, 1000);
    });

    this.container.querySelector('#mj-sg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'principiante');
    });
  }

  startIntermedio() {
    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-sg-wrap';
    wrap.innerHTML = `
      <h2>📡 Laberinto de Señales - Telecomunicaciones (INTERMEDIO)</h2>
      <p class="mj-explicacion">La señal debe llegar al receptor. Ajusta el ángulo del espejo para desviar la onda y evitar los obstáculos.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-sg-timer">20</span>s</span>
        <span>🎯 <span id="mj-sg-status">Ajusta el espejo</span></span>
      </div>
      <div class="mj-sg-canvas-wrap">
        <canvas id="mj-sg-canvas" width="560" height="200"></canvas>
      </div>
      <div class="mj-sg-sliders">
        <div class="mj-sg-slider">
          <label>Ángulo del espejo: <span class="mj-sg-val" id="mj-sg-val-angulo">45</span>°</label>
          <input type="range" id="mj-sg-slider-angulo" min="0" max="90" step="1" value="45" disabled>
        </div>
      </div>
      <div id="mj-sg-pista" class="mj-pista"></div>
      <div class="mj-msg" id="mj-sg-msg"></div>
      <button id="mj-sg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-sg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    this.canvas = this.container.querySelector('#mj-sg-canvas');
    this.ctx = this.canvas.getContext('2d');
    const slider = this.container.querySelector('#mj-sg-slider-angulo');
    const val = this.container.querySelector('#mj-sg-val-angulo');
    const pista = this.container.querySelector('#mj-sg-pista');
    const msg = this.container.querySelector('#mj-sg-msg');

    const anguloCorrecto = Math.floor(Math.random() * 30) + 30; // 30 a 60 grados

    const dibujarLaberinto = () => {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Fondo de rejilla
      ctx.strokeStyle = '#2a2a3f';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let i = 0; i < h; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }

      // Obstáculos
      ctx.fillStyle = '#aa4444';
      ctx.shadowColor = '#aa4444';
      ctx.shadowBlur = 10;
      ctx.fillRect(200, 0, 20, 80);
      ctx.fillRect(200, 120, 20, 80);
      ctx.shadowBlur = 0;

      // Receptor
      ctx.fillStyle = '#44aa44';
      ctx.shadowColor = '#44aa44';
      ctx.shadowBlur = 10;
      ctx.fillRect(w - 40, h / 2 - 20, 40, 40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText('RX', w - 35, h / 2 + 5);

      // Fuente
      ctx.fillStyle = '#4444aa';
      ctx.shadowColor = '#4444aa';
      ctx.shadowBlur = 10;
      ctx.fillRect(20, h / 2 - 20, 40, 40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.fillText('TX', 30, h / 2 + 5);

      // Espejo
      const angulo = parseInt(slider.value);
      const rad = angulo * Math.PI / 180;
      const cx = 300;
      const cy = h / 2;
      ctx.strokeStyle = '#aaaa44';
      ctx.shadowColor = '#aaaa44';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 30 * Math.cos(rad), cy - 30 * Math.sin(rad));
      ctx.lineTo(cx + 30 * Math.cos(rad), cy + 30 * Math.sin(rad));
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Trayectoria de la señal
      ctx.strokeStyle = '#8888aa';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(60, h / 2);
      ctx.lineTo(cx, cy);
      ctx.lineTo(w - 40, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    slider.addEventListener('input', () => {
      if (!this.juegoIniciado) return;
      val.textContent = slider.value;
      dibujarLaberinto();
      const diff = Math.abs(parseInt(slider.value) - anguloCorrecto);
      if (diff <= 5) {
        pista.textContent = '✅ ¡Casi! La señal está llegando.';
        pista.className = 'mj-pista ok';
      } else {
        pista.textContent = '💡 Ajusta el ángulo del espejo para desviar la señal.';
        pista.className = 'mj-pista info';
      }
    });

    this.container.querySelector('#mj-sg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-sg-iniciar').style.display = 'none';
      slider.disabled = false;
      this.inicio = Date.now();
      let segundos = 20;
      this.timer = setInterval(() => {
        segundos--;
        const el = this.container.querySelector('#mj-sg-timer');
        if (el) el.textContent = Math.max(0, segundos);
        if (segundos <= 0 && !this.terminado) {
          this.finalizarIntermedio(false);
        }
      }, 1000);
    });

    this.container.querySelector('#mj-sg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'intermedio');
    });

    dibujarLaberinto();
  }

  finalizarIntermedio(exito) {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);

    const score = exito ? 100 : 0;
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);

    const msg = this.container.querySelector('#mj-sg-msg');
    msg.className = 'mj-msg ' + (exito ? 'ok' : 'err');
    msg.textContent = exito
      ? '🎉 ¡Señal recibida! Acertaste porque ajustaste el espejo al ángulo correcto.'
      : '⚠ La señal no llegó al receptor. Fallaste porque el ángulo del espejo no era el correcto.';
    msg.style.display = 'block';

    this.container.querySelector('#mj-sg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-sg-reiniciar').style.display = 'block';

    if (this.onComplete) {
      this.onComplete({ success: exito, score, timeSpent });
    }
  }

  startExperto() {
    this.tolerancia = 0.15;
    this.objetivo.A = parseFloat((0.5 + Math.random() * 1.0).toFixed(1));
    this.objetivo.f = parseFloat((0.5 + Math.random() * 1.5).toFixed(1));
    this.objetivo.fase = parseFloat((Math.random() * Math.PI).toFixed(2));

    const wrap = document.createElement('div');
    wrap.className = 'mj-container mj-sg-wrap';
    wrap.innerHTML = `
      <h2>📡 Ajuste de Señal con Fase - Telecomunicaciones (EXPERTO)</h2>
      <p class="mj-explicacion">Mueve los sliders de amplitud, frecuencia y fase para igualar la onda de referencia. Tolerancia del 15%.</p>
      <div class="mj-status">
        <span>⏱ <span class="mj-tag" id="mj-sg-timer">25</span>s</span>
        <span>📊 <span id="mj-sg-error">Error: --</span></span>
      </div>
      <div class="mj-sg-canvas-wrap">
        <canvas id="mj-sg-canvas" width="560" height="200"></canvas>
      </div>
      <div class="mj-sg-sliders">
        <div class="mj-sg-slider">
          <label>Amplitud <span class="mj-sg-val" id="mj-sg-val-A">1.0</span></label>
          <input type="range" id="mj-sg-slider-A" min="0.1" max="2.0" step="0.1" value="1.0" disabled>
        </div>
        <div class="mj-sg-slider">
          <label>Frecuencia <span class="mj-sg-val" id="mj-sg-val-f">1.0</span></label>
          <input type="range" id="mj-sg-slider-f" min="0.1" max="2.5" step="0.1" value="1.0" disabled>
        </div>
        <div class="mj-sg-slider">
          <label>Fase <span class="mj-sg-val" id="mj-sg-val-fase">0.0</span></label>
          <input type="range" id="mj-sg-slider-fase" min="0" max="3.14" step="0.01" value="0" disabled>
        </div>
      </div>
      <div class="mj-msg" id="mj-sg-msg"></div>
      <button id="mj-sg-iniciar" class="mj-btn">INICIAR JUEGO</button>
      <button id="mj-sg-reiniciar" class="mj-btn secundario" style="display:none;">REINICIAR</button>
    `;
    this.container.appendChild(wrap);

    this.canvas = this.container.querySelector('#mj-sg-canvas');
    this.ctx = this.canvas.getContext('2d');

    const sA = this.container.querySelector('#mj-sg-slider-A');
    const sF = this.container.querySelector('#mj-sg-slider-f');
    const sFase = this.container.querySelector('#mj-sg-slider-fase');
    const vA = this.container.querySelector('#mj-sg-val-A');
    const vF = this.container.querySelector('#mj-sg-val-f');
    const vFase = this.container.querySelector('#mj-sg-val-fase');

    const actualizar = () => {
      if (!this.juegoIniciado) return;
      this.usuario.A = parseFloat(sA.value);
      this.usuario.f = parseFloat(sF.value);
      this.usuario.fase = parseFloat(sFase.value);
      vA.textContent = this.usuario.A;
      vF.textContent = this.usuario.f;
      vFase.textContent = this.usuario.fase;
      this.dibujar();
      this.actualizarError();
    };

    sA.addEventListener('input', actualizar);
    sF.addEventListener('input', actualizar);
    sFase.addEventListener('input', actualizar);

    this.dibujar();

    this.container.querySelector('#mj-sg-iniciar').addEventListener('click', () => {
      this.juegoIniciado = true;
      this.container.querySelector('#mj-sg-iniciar').style.display = 'none';
      sA.disabled = false;
      sF.disabled = false;
      sFase.disabled = false;
      this.inicio = Date.now();
      let segundos = 25;
      this.timer = setInterval(() => {
        segundos--;
        const el = this.container.querySelector('#mj-sg-timer');
        if (el) el.textContent = Math.max(0, segundos);
        if (segundos <= 0 && !this.terminado) {
          this.finalizar(false);
        }
      }, 1000);
    });

    this.container.querySelector('#mj-sg-reiniciar').addEventListener('click', () => {
      this.destroy();
      this.start(this.container, this.onComplete, 'experto');
    });
  }

  dibujar() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const amp = 60;
    const escalaX = w / (2 * Math.PI * 3);

    // Fondo de rejilla
    ctx.strokeStyle = '#2a2a3f';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let i = 0; i < h; i += 20) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    ctx.strokeStyle = '#3a3a5f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();

    // Onda objetivo
    ctx.strokeStyle = '#6a6a8a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const t = x / escalaX;
      const y = cy - this.objetivo.A * amp * Math.sin(2 * Math.PI * this.objetivo.f * t + this.objetivo.fase);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Onda usuario
    const errA = Math.abs(this.usuario.A - this.objetivo.A) / this.objetivo.A;
    const errF = Math.abs(this.usuario.f - this.objetivo.f) / this.objetivo.f;
    const errFase = Math.abs(this.usuario.fase - this.objetivo.fase) / (Math.PI || 1);
    const err = (errA + errF + errFase) / 3;
    let color = '#cc8888';
    if (err <= this.tolerancia) color = '#88cc88';
    else if (err <= this.tolerancia * 2) color = '#cccc88';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const t = x / escalaX;
      const y = cy - this.usuario.A * amp * Math.sin(2 * Math.PI * this.usuario.f * t + this.usuario.fase);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#a0a0b0';
    ctx.font = '12px sans-serif';
    ctx.fillText('Objetivo (gris)', 10, 20);
    ctx.fillStyle = color;
    ctx.fillText('Tu señal', 10, 40);
  }

  actualizarError() {
    const errA = Math.abs(this.usuario.A - this.objetivo.A) / this.objetivo.A;
    const errF = Math.abs(this.usuario.f - this.objetivo.f) / this.objetivo.f;
    const errFase = Math.abs(this.usuario.fase - this.objetivo.fase) / (Math.PI || 1);
    const err = (errA + errF + errFase) / 3;
    const el = this.container.querySelector('#mj-sg-error');
    if (el) el.textContent = `Error: ${(err * 100).toFixed(1)}%`;
  }

  finalizar(exito) {
    if (this.terminado) return;
    this.terminado = true;
    clearInterval(this.timer);
    const errA = Math.abs(this.usuario.A - this.objetivo.A) / this.objetivo.A;
    const errF = Math.abs(this.usuario.f - this.objetivo.f) / this.objetivo.f;
    const errFase = Math.abs(this.usuario.fase - this.objetivo.fase) / (Math.PI || 1);
    const err = (errA + errF + errFase) / 3;
    const exitoFinal = err <= this.tolerancia;
    const score = exitoFinal ? 100 : parseFloat(Math.max(0, 100 - err * 100).toFixed(2));
    const timeSpent = Minijuegos.tiempoTranscurrido(this.inicio);
    const msg = this.container.querySelector('#mj-sg-msg');
    msg.className = 'mj-msg ' + (exitoFinal ? 'ok' : 'err');
    msg.textContent = exitoFinal
      ? '🎉 ¡Señal igualada! Acertaste porque ajustaste correctamente amplitud, frecuencia y fase.'
      : `⚠ Señal no coincide. Fallaste porque el error (${(err * 100).toFixed(1)}%) superó la tolerancia. Revisa amplitud, frecuencia y fase.`;
    msg.style.display = 'block';
    this.container.querySelector('#mj-sg-iniciar').style.display = 'none';
    this.container.querySelector('#mj-sg-reiniciar').style.display = 'block';
    if (this.onComplete) this.onComplete({ success: exitoFinal, score, timeSpent });
  }

  destroy() {
    this.terminado = true;
    clearInterval(this.timer);
    if (this.container) this.container.innerHTML = '';
    this.onComplete = null;
  }
}