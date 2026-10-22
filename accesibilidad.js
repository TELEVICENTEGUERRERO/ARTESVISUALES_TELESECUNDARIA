/*
 * accesibilidad.js
 * ---------------------------------------------------------------------------
 * Panel de accesibilidad del sitio (se carga en todas las paginas).
 *
 * HISTORIAL DE CAMBIOS
 *   CAMBIO 1 (este archivo): control del tamano de la fuente (A- / A+ / Restablecer),
 *            con guardado de la preferencia entre paginas.
 *   CAMBIO 2 (este archivo): tema claro / oscuro, con guardado de la preferencia.
 *            Los colores del tema oscuro estan en css/accesibilidad.css.
 *   REDISENO UNIFICADO:      las subpaginas adoptan el diseno del index (ver css/sitio.css);
 *            este archivo no cambia, solo sus colores oscuros en accesibilidad.css.
 *   CAMBIO 4 (este archivo): idioma espanol / ingles. El espanol es el original; el ingles se
 *            aplica en el navegador con el diccionario de js/idiomas/en.js (ver "CAMBIO 4").
 *   CORRECCION MOVIL:        desbordes horizontales en pantallas chicas (solo CSS,
 *            ver el final de css/accesibilidad.css).
 *   CAMBIO 3 (este archivo): narrador que lee en voz alta el contenido de la pagina,
 *            con pausa, detener, velocidad y eleccion de voz.
 *
 * El panel se arma con una seccion por funcion (ver crearSeccion), de modo que
 * los cambios 2 y 3 solo agregan una seccion nueva sin tocar lo que ya existe.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  /* =========================================================================
   * CAMBIO 1: TAMANO DE FUENTE
   * ========================================================================= */

  // Clave con la que se guarda la preferencia en el navegador (localStorage).
  var CLAVE_FUENTE = 'accesibilidad:tamanoFuente';

  // Niveles disponibles, como porcentaje del tamano base del navegador.
  // El indice 0 (100 %) es el tamano original del sitio.
  var NIVELES_FUENTE = [100, 115, 130, 150, 175];

  // Nivel actualmente aplicado (indice dentro de NIVELES_FUENTE).
  var nivelFuente = 0;

  // Lee el nivel guardado. Si no existe, no es valido o el navegador bloquea
  // localStorage (modo privado, por ejemplo), usa el nivel original.
  function leerNivelGuardado() {
    try {
      var guardado = parseInt(window.localStorage.getItem(CLAVE_FUENTE), 10);
      if (guardado >= 0 && guardado < NIVELES_FUENTE.length) {
        return guardado;
      }
    } catch (e) { /* sin acceso a localStorage: se ignora */ }
    return 0;
  }

  // Guarda el nivel para que se conserve al cambiar de pagina o recargar.
  function guardarNivel(nivel) {
    try {
      window.localStorage.setItem(CLAVE_FUENTE, String(nivel));
    } catch (e) { /* sin acceso a localStorage: se ignora */ }
  }

  // Aplica el nivel cambiando el font-size del elemento <html>.
  // Como casi todo el CSS del sitio usa unidades rem, todo el texto escala junto.
  // En el nivel 100 % se quita el estilo para respetar la configuracion del navegador.
  function aplicarFuente(nivel) {
    var raiz = document.documentElement;
    if (NIVELES_FUENTE[nivel] === 100) {
      raiz.style.removeProperty('font-size');
    } else {
      raiz.style.fontSize = NIVELES_FUENTE[nivel] + '%';
    }
    nivelFuente = nivel;
  }

  // Se aplica de inmediato (el script va en el <head>) para evitar que la
  // pagina se vea un instante con el tamano original antes de ajustarse.
  aplicarFuente(leerNivelGuardado());

  /* =========================================================================
   * CAMBIO 2: TEMA CLARO / OSCURO
   * ========================================================================= */

  // Clave con la que se guarda el tema elegido en el navegador (localStorage).
  var CLAVE_TEMA = 'accesibilidad:tema';

  // Si es true y la persona nunca ha elegido un tema, se usa el del sistema
  // (el modo oscuro del celular o de la computadora). Cambiar a false para que
  // el sitio siempre abra en tema claro la primera vez.
  var SEGUIR_TEMA_DEL_SISTEMA = true;

  // Tema actualmente aplicado: 'claro' u 'oscuro'.
  var temaActual = 'claro';

  // Lee el tema guardado. Devuelve null si no hay uno valido o si el navegador
  // bloquea localStorage.
  function leerTemaGuardado() {
    try {
      var guardado = window.localStorage.getItem(CLAVE_TEMA);
      if (guardado === 'claro' || guardado === 'oscuro') { return guardado; }
    } catch (e) { /* sin acceso a localStorage: se ignora */ }
    return null;
  }

  function guardarTema(tema) {
    try {
      window.localStorage.setItem(CLAVE_TEMA, tema);
    } catch (e) { /* sin acceso a localStorage: se ignora */ }
  }

  // Tema con el que arranca la pagina: el guardado, o el del sistema, o el claro.
  function elegirTemaInicial() {
    var guardado = leerTemaGuardado();
    if (guardado) { return guardado; }
    if (SEGUIR_TEMA_DEL_SISTEMA && window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'oscuro';
    }
    return 'claro';
  }

  // Aplica el tema poniendo data-tema="claro|oscuro" en <html>.
  // Todos los colores del tema oscuro cuelgan de ese atributo en el CSS.
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    temaActual = tema;
  }

  // Igual que con la fuente: se aplica de inmediato (script en el <head>) para
  // que no haya un destello de tema claro antes de pasar al oscuro.
  aplicarTema(elegirTemaInicial());

  /* =========================================================================
   * UTILIDADES PARA CONSTRUIR EL PANEL
   * ========================================================================= */

  // Crea un elemento HTML con atributos y texto opcionales.
  function crear(etiqueta, atributos, texto) {
    var nodo = document.createElement(etiqueta);
    if (atributos) {
      Object.keys(atributos).forEach(function (k) { nodo.setAttribute(k, atributos[k]); });
    }
    if (texto) { nodo.textContent = texto; }
    return nodo;
  }

  // Crea una seccion del panel (titulo + contenido). Los cambios 2 y 3
  // usaran esta misma funcion para agregar sus controles.
  function crearSeccion(titulo, contenido) {
    var seccion = crear('div', { 'class': 'a11y-seccion' });
    seccion.appendChild(crear('p', { 'class': 'a11y-titulo' }, titulo));
    seccion.appendChild(contenido);
    return seccion;
  }

  // Un boton cuyo estado "deshabilitado" se maneja con aria-disabled en lugar
  // del atributo disabled, para que no pierda el foco del teclado al llegar al limite.
  function crearBoton(clase, texto, etiquetaAria, alClick) {
    var boton = crear('button', { type: 'button', 'class': 'a11y-btn ' + clase, 'aria-label': etiquetaAria }, texto);
    boton.addEventListener('click', function () {
      if (boton.getAttribute('aria-disabled') === 'true') { return; }
      alClick();
    });
    return boton;
  }

  /* =========================================================================
   * CAMBIO 1: CONTROLES DE TAMANO DE FUENTE EN EL PANEL
   * ========================================================================= */

  function crearControlFuente() {
    var fila = crear('div', { 'class': 'a11y-fila' });

    var valor = crear('span', { 'class': 'a11y-valor', 'aria-live': 'polite' });

    var btnMenos = crearBoton('a11y-btn-fuente', 'A-', tr('Reducir tamaño del texto'), function () {
      cambiarNivel(nivelFuente - 1);
    });
    var btnMas = crearBoton('a11y-btn-fuente a11y-btn-mas', 'A+', tr('Aumentar tamaño del texto'), function () {
      cambiarNivel(nivelFuente + 1);
    });
    var btnReset = crearBoton('a11y-btn-reset', tr('Restablecer'), tr('Restablecer tamaño original del texto'), function () {
      cambiarNivel(0);
    });

    // Refresca el porcentaje visible y deshabilita los botones en los extremos.
    function actualizar() {
      valor.textContent = NIVELES_FUENTE[nivelFuente] + '%';
      btnMenos.setAttribute('aria-disabled', nivelFuente === 0 ? 'true' : 'false');
      btnMas.setAttribute('aria-disabled', nivelFuente === NIVELES_FUENTE.length - 1 ? 'true' : 'false');
      btnReset.setAttribute('aria-disabled', nivelFuente === 0 ? 'true' : 'false');
    }

    function cambiarNivel(nuevo) {
      nuevo = Math.max(0, Math.min(NIVELES_FUENTE.length - 1, nuevo));
      aplicarFuente(nuevo);
      guardarNivel(nuevo);
      actualizar();
    }

    fila.appendChild(btnMenos);
    fila.appendChild(valor);
    fila.appendChild(btnMas);

    var contenedor = crear('div');
    contenedor.appendChild(fila);
    contenedor.appendChild(btnReset);
    actualizar();
    return contenedor;
  }

  /* =========================================================================
   * CAMBIO 2: CONTROL DE TEMA EN EL PANEL
   * ========================================================================= */

  // Iconos decorativos (aria-hidden) de los dos botones de tema.
  var ICONO_SOL =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="4.2" fill="currentColor"/>' +
    '<path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  var ICONO_LUNA =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
    '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>';

  function crearControlTema() {
    var grupo = crear('div', { 'class': 'a11y-segmentos', role: 'group', 'aria-label': tr('Tema de color') });
    var botones = {};

    // Marca como presionado (aria-pressed) el boton del tema activo.
    function actualizar() {
      Object.keys(botones).forEach(function (valor) {
        botones[valor].setAttribute('aria-pressed', valor === temaActual ? 'true' : 'false');
      });
    }

    function elegir(valor) {
      aplicarTema(valor);
      guardarTema(valor);
      actualizar();
    }

    [['claro', 'Claro', ICONO_SOL], ['oscuro', 'Oscuro', ICONO_LUNA]].forEach(function (def) {
      var boton = crear('button', { type: 'button', 'class': 'a11y-btn a11y-btn-tema' });
      var icono = crear('span', { 'class': 'a11y-icono', 'aria-hidden': 'true' });
      icono.innerHTML = def[2];
      boton.appendChild(icono);
      boton.appendChild(document.createTextNode(tr(def[1])));
      boton.addEventListener('click', function () { elegir(def[0]); });
      botones[def[0]] = boton;
      grupo.appendChild(boton);
    });

    actualizar();
    return grupo;
  }

  /* =========================================================================
   * CAMBIO 4: IDIOMA (espanol / ingles)
   *
   * El espanol es el original y los archivos HTML NO se modifican. Para ver el sitio en
   * ingles, este codigo cambia los textos en el navegador usando el diccionario de
   * js/idiomas/en.js, y al volver a espanol restaura los textos originales tal cual.
   *
   * Como funciona:
   *   - Cada "unidad" es un grupo de texto (con su negrita, etc.) dentro de un bloque:
   *     un parrafo, un titulo, un elemento de lista, una celda...
   *   - La clave del diccionario es el texto original en espanol; el valor, su traduccion.
   *   - Si una unidad no esta en el diccionario, se queda en espanol (no se rompe nada).
   *   - Los textos que otros scripts agregan despues (galeria, mensajes) tambien se traducen,
   *     porque se vigilan los cambios de la pagina mientras esta en ingles.
   *
   * Para quien mantenga el sitio: despues de cambiar un texto en espanol, abre la consola del
   * navegador y ejecuta  A11yIdioma.pendientes()  para ver que falta por agregar a en.js.
   * ========================================================================= */

  // Clave para guardar el idioma elegido (localStorage) y diccionarios disponibles.
  var CLAVE_IDIOMA = 'accesibilidad:idioma';
  var TRADUCCIONES = window.A11Y_IDIOMAS || {};     // lo define js/idiomas/en.js
  var idiomaActual = 'es';

  // La traduccion necesita funciones modernas; si el navegador no las tiene, el sitio sigue en espanol.
  var traduccionSoportada = typeof window.WeakSet === 'function' &&
                            typeof window.MutationObserver === 'function' &&
                            'content' in document.createElement('template');

  function idiomaDisponible(codigo) {
    return codigo === 'es' || (traduccionSoportada && !!TRADUCCIONES[codigo]);
  }

  // Idioma de arranque: el guardado, si existe y esta disponible.
  var idiomaGuardado = leerGuardado(CLAVE_IDIOMA);
  if (idiomaGuardado && idiomaGuardado !== 'es' && idiomaDisponible(idiomaGuardado)) {
    idiomaActual = idiomaGuardado;
  }

  // Se avisa de inmediato el idioma a lectores de pantalla y navegadores (atributo lang de <html>).
  // Si hay que traducir, el cuerpo se oculta hasta terminar para que no se vea el espanol un instante.
  document.documentElement.setAttribute('lang', idiomaActual);
  if (idiomaActual !== 'es') { document.documentElement.classList.add('a11y-traduciendo'); }

  function tieneOwn(objeto, clave) {
    return Object.prototype.hasOwnProperty.call(objeto, clave);
  }

  // Textos de la interfaz del panel: tr('Texto en espanol') devuelve su version en el idioma actual.
  function tr(texto) {
    var dic = (idiomaActual !== 'es' && TRADUCCIONES[idiomaActual]) ? TRADUCCIONES[idiomaActual].ui : null;
    return (dic && tieneOwn(dic, texto)) ? dic[texto] : texto;
  }

  function normalizarClave(texto) {
    return String(texto).replace(/\s+/g, ' ').trim();
  }

  // Textos planos (atributos alt y aria-label, titulo de la pestana, avisos alert/confirm).
  function trTexto(texto) {
    var dic = (idiomaActual !== 'es' && TRADUCCIONES[idiomaActual]) ? TRADUCCIONES[idiomaActual].textos : null;
    var clave = normalizarClave(texto);
    return (dic && tieneOwn(dic, clave)) ? dic[clave] : texto;
  }

  // Los avisos de las paginas (alert y confirm) se traducen sin tocar sus scripts.
  var alertaNativa = window.alert;
  var confirmacionNativa = window.confirm;
  window.alert = function (mensaje) {
    return alertaNativa.call(window, mensaje === undefined ? mensaje : trTexto(String(mensaje)));
  };
  window.confirm = function (mensaje) {
    return confirmacionNativa.call(window, mensaje === undefined ? mensaje : trTexto(String(mensaje)));
  };

  // ---------- Unidades de texto ----------
  // Elementos de formato que se consideran parte del mismo texto (negritas, span...).
  var ETIQUETAS_EN_LINEA = { STRONG: 1, B: 1, EM: 1, I: 1, U: 1, SPAN: 1, SMALL: 1, SUB: 1, SUP: 1,
                             MARK: 1, CODE: 1, ABBR: 1, BR: 1, FONT: 1, Q: 1, CITE: 1 };
  // Elementos que nunca se traducen (codigo, marcos, controles nativos). Los <video> NO se omiten:
  // su unico texto es el aviso "Tu navegador no soporta..." que se ve si el video no se puede reproducir.
  var ETIQUETAS_OMITIDAS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, IFRAME: 1, SVG: 1,
                             CANVAS: 1, TEMPLATE: 1, SELECT: 1, TEXTAREA: 1, OBJECT: 1, HEAD: 1 };
  var ATRIBUTOS_TRADUCIBLES = ['alt', 'aria-label'];

  // Nodos creados por la traduccion: se reconocen para no volver a traducirlos.
  var nodosTraducidos = traduccionSoportada ? new window.WeakSet() : null;
  var unidadesAplicadas = [];   // { padre, es: [nodos originales], en: [nodos en el otro idioma] }
  var faltantes = {};           // textos que no estan en el diccionario
  var tituloOriginal = null;
  var observador = null;

  function tieneLetras(texto) {
    return /[A-Za-z\u00c1\u00c9\u00cd\u00d3\u00da\u00dc\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1]/.test(texto);
  }

  function escaparHTML(texto) {
    return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;');
  }

  // Texto de una unidad como HTML (asi coincide con las claves del diccionario).
  function serializar(nodos) {
    return nodos.map(function (n) { return n.nodeType === 3 ? escaparHTML(n.nodeValue) : n.outerHTML; }).join('');
  }

  // Elemento de formato que no contiene otros elementos (si los tiene, se trata como bloque).
  function esEnLinea(nodo) {
    if (nodo.nodeType !== 1 || !ETIQUETAS_EN_LINEA[nodo.tagName]) { return false; }
    for (var h = nodo.firstElementChild; h; h = h.nextElementSibling) {
      if (!ETIQUETAS_EN_LINEA[h.tagName]) { return false; }
    }
    return true;
  }

  function debeOmitirse(el) {
    return !!ETIQUETAS_OMITIDAS[el.tagName.toUpperCase()] ||
           el.classList.contains('a11y-widget') ||
           el.getAttribute('translate') === 'no';
  }

  // Recorre los hijos de "raiz": agrupa texto y elementos de formato seguidos en una "unidad",
  // y baja a los elementos de bloque (parrafos, listas, celdas, enlaces, botones...).
  function recolectarUnidades(raiz, salida) {
    var corrida = [];

    function cerrar() {
      if (!corrida.length) { return; }
      var nodos = corrida;
      corrida = [];
      var utiles = nodos.filter(function (n) { return !(n.nodeType === 3 && !n.nodeValue.trim()); });
      if (!utiles.length) { return; }
      // Un unico elemento que envuelve todo (ej. <li><span>texto</span></li>): se baja un nivel.
      if (utiles.length === 1 && utiles[0].nodeType === 1) { recolectarUnidades(utiles[0], salida); return; }
      var texto = '';
      utiles.forEach(function (n) { texto += n.textContent; });
      if (!tieneLetras(texto)) { return; }               // solo numeros, simbolos o espacios
      salida.push({ padre: raiz, nodos: nodos, clave: normalizarClave(serializar(nodos)) });
    }

    for (var n = raiz.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 8) { continue; }                // comentarios
      if (nodosTraducidos.has(n)) { cerrar(); continue; }// ya traducido
      if (n.nodeType === 3) { corrida.push(n); continue; }
      if (n.nodeType !== 1) { continue; }
      if (debeOmitirse(n)) { cerrar(); continue; }
      if (esEnLinea(n)) { corrida.push(n); continue; }
      cerrar();
      recolectarUnidades(n, salida);
    }
    cerrar();
    return salida;
  }

  // Cambia una unidad por su traduccion, guardando los nodos originales para poder restaurarlos.
  function aplicarUnidad(unidad, traduccion) {
    var original = serializar(unidad.nodos);
    var plantilla = document.createElement('template');
    plantilla.innerHTML = (/^\s/.test(original) ? ' ' : '') + traduccion + (/\s$/.test(original) ? ' ' : '');
    var nuevos = Array.prototype.slice.call(plantilla.content.childNodes);
    if (!nuevos.length) { return; }
    var referencia = unidad.nodos[0];
    nuevos.forEach(function (n) {
      unidad.padre.insertBefore(n, referencia);
      nodosTraducidos.add(n);
    });
    unidad.nodos.forEach(function (n) {
      if (n.parentNode === unidad.padre) { unidad.padre.removeChild(n); }
    });
    unidadesAplicadas.push({ padre: unidad.padre, es: unidad.nodos, en: nuevos });
  }

  // Devuelve el texto original a una unidad. Si la pagina ya cambio ese contenido por su cuenta, no se toca.
  function revertirUnidad(registro) {
    var referencia = null;
    registro.en.forEach(function (n) { if (!referencia && n.parentNode === registro.padre) { referencia = n; } });
    if (!referencia) { return; }
    registro.es.forEach(function (n) { registro.padre.insertBefore(n, referencia); });
    registro.en.forEach(function (n) { if (n.parentNode === registro.padre) { registro.padre.removeChild(n); } });
  }

  function dentroDeTraducido(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (nodosTraducidos.has(e)) { return true; }
    }
    return false;
  }

  // Atributos alt / aria-label. El valor original se guarda en data-a11y-es-<atributo>.
  function traducirAtributos(raiz) {
    var elementos = Array.prototype.slice.call(raiz.querySelectorAll('[alt],[aria-label]'));
    if (raiz.hasAttribute('alt') || raiz.hasAttribute('aria-label')) { elementos.unshift(raiz); }
    elementos.forEach(function (el) {
      if (el.closest('.a11y-widget')) { return; }
      ATRIBUTOS_TRADUCIBLES.forEach(function (nombre) {
        var valor = el.getAttribute(nombre);
        if (!valor || !tieneLetras(valor) || el.hasAttribute('data-a11y-es-' + nombre)) { return; }
        var dic = (TRADUCCIONES[idiomaActual] || {}).textos || {};
        var clave = normalizarClave(valor);
        if (tieneOwn(dic, clave)) {
          el.setAttribute('data-a11y-es-' + nombre, valor);
          el.setAttribute(nombre, dic[clave]);
        } else {
          faltantes[clave] = true;
        }
      });
    });
  }

  function revertirAtributos() {
    ATRIBUTOS_TRADUCIBLES.forEach(function (nombre) {
      var marcados = document.querySelectorAll('[data-a11y-es-' + nombre + ']');
      Array.prototype.forEach.call(marcados, function (el) {
        el.setAttribute(nombre, el.getAttribute('data-a11y-es-' + nombre));
        el.removeAttribute('data-a11y-es-' + nombre);
      });
    });
  }

  function traducirTitulo() {
    if (tituloOriginal === null) { tituloOriginal = document.title; }
    document.title = trTexto(tituloOriginal);
  }

  function revertirTitulo() {
    if (tituloOriginal !== null) { document.title = tituloOriginal; tituloOriginal = null; }
  }

  // Traduce el contenido de uno o varios elementos.
  function traducirRaices(raices) {
    var dic = (TRADUCCIONES[idiomaActual] || {}).bloques || {};
    raices.forEach(function (raiz) {
      if (raiz.closest('.a11y-widget') || dentroDeTraducido(raiz)) { return; }
      recolectarUnidades(raiz, []).forEach(function (unidad) {
        if (tieneOwn(dic, unidad.clave)) { aplicarUnidad(unidad, dic[unidad.clave]); }
        else { faltantes[unidad.clave] = true; }
      });
      traducirAtributos(raiz);
    });
    if (observador) { observador.takeRecords(); }        // se descartan los cambios hechos por esta misma funcion
  }

  // Mientras la pagina esta en ingles, el contenido que otros scripts agregan (galeria, mensajes
  // de error, "Cargando...") tambien se traduce.
  function alMutar(registros) {
    if (idiomaActual === 'es') { return; }
    var raices = [];
    function agregar(el) {
      if (el && el.nodeType === 1 && raices.indexOf(el) < 0 && document.body.contains(el)) { raices.push(el); }
    }
    registros.forEach(function (r) {
      agregar(r.type === 'characterData' ? r.target.parentNode : r.target);
    });
    if (raices.length) { traducirRaices(raices); }
  }

  function traducirTodo() {
    faltantes = {};
    traducirRaices([document.body]);
    traducirTitulo();
    if (!observador) { observador = new window.MutationObserver(alMutar); }
    observador.observe(document.body, { childList: true, subtree: true, characterData: true });
    var cantidad = Object.keys(faltantes).length;
    if (cantidad && window.console) {
      window.console.warn('[Idioma] ' + cantidad + ' texto(s) sin traducir. Ejecuta A11yIdioma.pendientes() en la consola para verlos.');
    }
  }

  function revertirTodo() {
    if (observador) { observador.disconnect(); }
    unidadesAplicadas.forEach(revertirUnidad);
    unidadesAplicadas.length = 0;
    revertirAtributos();
    revertirTitulo();
    faltantes = {};
  }

  // Cambia el idioma de toda la pagina.
  function aplicarIdioma(codigo) {
    idiomaActual = codigo;
    document.documentElement.setAttribute('lang', codigo);
    if (codigo === 'es') { revertirTodo(); } else { traducirTodo(); }
  }

  // Lista los textos de la pagina que faltan en el diccionario de un idioma (por defecto, ingles).
  // Sirve para mantener el sitio: se usa desde la consola del navegador.
  function pendientes(codigo) {
    var dic = TRADUCCIONES[codigo || 'en'] || {};
    var bloques = dic.bloques || {};
    var textos = dic.textos || {};
    var lista = [];
    recolectarUnidades(document.body, []).forEach(function (u) {
      if (!tieneOwn(bloques, u.clave)) { lista.push({ tipo: 'bloque', clave: u.clave }); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[alt],[aria-label]'), function (el) {
      if (el.closest('.a11y-widget')) { return; }
      ATRIBUTOS_TRADUCIBLES.forEach(function (nombre) {
        var valor = el.getAttribute('data-a11y-es-' + nombre) || el.getAttribute(nombre);
        if (valor && tieneLetras(valor) && !tieneOwn(textos, normalizarClave(valor))) {
          lista.push({ tipo: 'texto', clave: normalizarClave(valor) });
        }
      });
    });
    var titulo = tituloOriginal !== null ? tituloOriginal : document.title;
    if (tieneLetras(titulo) && !tieneOwn(textos, normalizarClave(titulo))) {
      lista.push({ tipo: 'texto', clave: normalizarClave(titulo) });
    }
    return lista;
  }

  window.A11yIdioma = {
    actual: function () { return idiomaActual; },
    pendientes: pendientes
  };

  /* =========================================================================
   * CAMBIO 3: NARRADOR (lectura en voz alta)
   *
   * Usa la voz sintetizada del propio navegador (Web Speech API): no necesita
   * servidores, cuentas ni internet para la mayoria de las voces.
   *
   * Como funciona:
   *   1. Al pulsar "Leer pagina" se recolectan los bloques de texto visibles
   *      (titulos, parrafos, listas, tablas), en el orden en que aparecen.
   *   2. Cada bloque se divide en trozos cortos y se leen uno tras otro. Los trozos
   *      cortos evitan un fallo conocido de Chrome que corta las lecturas largas.
   *   3. El bloque que se esta leyendo se resalta y la pagina se desplaza hasta el.
   * ========================================================================= */

  // Claves para guardar la velocidad y la voz elegidas (localStorage).
  var CLAVE_VELOCIDAD = 'accesibilidad:narradorVelocidad';
  var CLAVE_VOZ = 'accesibilidad:narradorVoz';

  // Velocidades disponibles (1 = normal). El indice 1 es la de arranque.
  var VELOCIDADES = [0.75, 1, 1.25, 1.5];

  // Largo maximo de cada trozo hablado, en caracteres.
  var MAX_CARACTERES = 180;

  // Elementos que se leen, y zonas que se omiten (menus, pie, el propio panel, controles).
  var SELECTOR_LEIBLE = 'h1, h2, h3, h4, h5, h6, p, li, label, figcaption, table';
  var SELECTOR_OMITIDO = '.a11y-widget, nav, footer, script, style, noscript, iframe, video, ' +
                         'button, select, textarea, [hidden], [aria-hidden="true"]';

  // Si el navegador no tiene sintesis de voz, el narrador se desactiva con un aviso.
  var narradorSoportado = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
  var sintesis = narradorSoportado ? window.speechSynthesis : null;

  var vocesIdioma = [];           // voces del idioma activo (espanol o ingles) disponibles en este dispositivo
  var vozElegida = null;          // voz que se usa para leer
  var indiceVelocidad = 1;        // posicion dentro de VELOCIDADES
  var estadoNarrador = 'detenido';// 'detenido' | 'leyendo' | 'pausado'
  var bloquesNarrador = [];       // [{ el, texto }] bloques de la pagina
  var colaNarrador = [];          // [{ bloque, texto }] trozos que se van hablando
  var posNarrador = 0;            // trozo actual dentro de colaNarrador
  var fichaNarrador = 0;          // se incrementa al cancelar: permite ignorar eventos "viejos"
  var locucionActual = null;      // referencia viva al trozo que suena (evita que Chrome la recoja)
  var bloqueResaltado = null;     // elemento resaltado en este momento
  var mensajeNarrador = '';       // aviso para la persona ("Lectura terminada.", errores...)
  var oyentesNarrador = [];       // funciones que repintan los controles cuando algo cambia

  function leerGuardado(clave) {
    try { return window.localStorage.getItem(clave); } catch (e) { return null; }
  }

  function escribirGuardado(clave, valor) {
    try { window.localStorage.setItem(clave, valor); } catch (e) { /* se ignora */ }
  }

  // Avisa a los controles (boton rapido y panel) que deben actualizarse.
  function notificarNarrador() {
    oyentesNarrador.forEach(function (fn) { fn(); });
  }

  // ---------- Velocidad guardada ----------
  var velocidadGuardada = parseInt(leerGuardado(CLAVE_VELOCIDAD), 10);
  if (velocidadGuardada >= 0 && velocidadGuardada < VELOCIDADES.length) {
    indiceVelocidad = velocidadGuardada;
  }

  // Texto de la velocidad: coma decimal en espanol (1,25x) y punto en ingles (1.25x).
  function textoVelocidad(i) {
    var numero = String(VELOCIDADES[i]);
    return (idiomaActual === 'es' ? numero.replace('.', ',') : numero) + 'x';
  }

  // ---------- Voces ----------
  // Preferencia en espanol: Mexico, luego EE. UU., luego cualquier otro espanol.
  // Preferencia en ingles: EE. UU., luego Reino Unido, luego cualquier otro ingles.
  // A igualdad, primero las voces locales (funcionan sin internet).
  function puntajeVoz(voz) {
    var base;
    if (idiomaActual === 'es') {
      base = /^es[-_]MX/i.test(voz.lang) ? 3 : (/^es[-_]US/i.test(voz.lang) ? 2 : 1);
    } else {
      base = /^en[-_]US/i.test(voz.lang) ? 3 : (/^en[-_]GB/i.test(voz.lang) ? 2 : 1);
    }
    return base * 2 + (voz.localService ? 1 : 0);
  }

  // La voz elegida se guarda por separado para cada idioma (la de espanol conserva su clave original).
  function claveVoz() {
    return idiomaActual === 'es' ? CLAVE_VOZ : CLAVE_VOZ + '-' + idiomaActual;
  }

  function cargarVoces() {
    if (!narradorSoportado) { return; }
    var todas = sintesis.getVoices() || [];
    var patron = new RegExp('^' + idiomaActual + '([-_]|$)', 'i');     // voces del idioma activo
    vocesIdioma = todas.filter(function (v) { return patron.test(v.lang); });
    vocesIdioma.sort(function (a, b) { return puntajeVoz(b) - puntajeVoz(a); });

    // Se recupera la voz guardada si sigue existiendo; si no, la mejor disponible.
    var guardada = leerGuardado(claveVoz());
    vozElegida = null;
    vocesIdioma.forEach(function (v) { if (!vozElegida && v.name === guardada) { vozElegida = v; } });
    if (!vozElegida) { vozElegida = vocesIdioma[0] || null; }
    notificarNarrador();
  }

  if (narradorSoportado) {
    cargarVoces();
    // Muchos navegadores cargan la lista de voces despues de abrir la pagina.
    if (sintesis.addEventListener) {
      sintesis.addEventListener('voiceschanged', cargarVoces);
    } else {
      sintesis.onvoiceschanged = cargarVoces;
    }
  }

  // ---------- Recoleccion del texto a leer ----------
  // Quita emojis (la voz los lee como "carita sonriente"), conserva (c), (r) y (tm),
  // lee los horarios como "08:00 a 11:20" y compacta los espacios.
  var REGEX_EMOJI;
  try {
    REGEX_EMOJI = new RegExp('[\\p{Extended_Pictographic}\\u200d\\ufe0f]', 'gu');
  } catch (e) {
    REGEX_EMOJI = /[\u200d\ufe0f\u2600-\u27bf]|[\ud83c-\ud83e][\udc00-\udfff]/g;   // navegadores antiguos
  }

  function limpiarTexto(texto) {
    return texto
      .replace(REGEX_EMOJI, function (m) { return (m === '\u00a9' || m === '\u00ae' || m === '\u2122') ? m : ''; })
      .replace(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g, function (m, desde, hasta) {
        return desde + (idiomaActual === 'es' ? ' a ' : ' to ') + hasta;
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Texto propio de un elemento. Se trabaja sobre una copia para poder quitar las listas
  // anidadas (cada <li> interno se lee por separado) y convertir los <br> en espacios.
  function textoDeElemento(el) {
    var copia = el.cloneNode(true);
    var sobrantes = copia.querySelectorAll('ul, ol, script, style, button, select, textarea, iframe, video, .a11y-widget');
    var i;
    for (i = 0; i < sobrantes.length; i++) { sobrantes[i].parentNode.removeChild(sobrantes[i]); }
    var saltos = copia.querySelectorAll('br');
    for (i = 0; i < saltos.length; i++) { saltos[i].parentNode.replaceChild(document.createTextNode(' '), saltos[i]); }
    return limpiarTexto(copia.textContent || '');
  }

  function esVisible(el) {
    return el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  }

  // Tablas: se lee fila por fila, anteponiendo el encabezado de cada columna.
  // Ej.: "11:40 a 14:00. LUNES: ARTES VISUALES. MARTES: Clase libre..."
  // Las celdas que abarcan toda la fila (colspan) se leen sin encabezado.
  function bloquesDeTabla(tabla) {
    var resultado = [];
    var filas = Array.prototype.slice.call(tabla.rows);
    if (!filas.length) { return resultado; }

    var encabezados = [];
    var primera = filas[0];
    var esEncabezado = primera.cells.length > 0 && Array.prototype.every.call(primera.cells, function (c) {
      return c.tagName === 'TH';
    });
    if (esEncabezado) {
      Array.prototype.forEach.call(primera.cells, function (c) {
        for (var k = 0; k < (c.colSpan || 1); k++) { encabezados.push(limpiarTexto(c.textContent || '')); }
      });
      filas.shift();   // la fila de encabezados no se lee: ya se usa en cada celda
    }

    filas.forEach(function (fila) {
      var partes = [];
      var col = 0;
      Array.prototype.forEach.call(fila.cells, function (celda) {
        var texto = limpiarTexto(celda.textContent || '');
        var ancho = celda.colSpan || 1;
        if (texto) {
          var cubreTodo = encabezados.length > 1 && ancho >= encabezados.length - 1;
          if (col === 0 || cubreTodo || !encabezados[col]) {
            partes.push(texto);
          } else {
            partes.push(encabezados[col] + ': ' + texto);
          }
        }
        col += ancho;
      });
      var textoFila = partes.join('. ');
      if (textoFila && esVisible(fila)) { resultado.push({ el: fila, texto: textoFila }); }
    });
    return resultado;
  }

  // Recorre la pagina en orden y devuelve los bloques de texto visibles.
  function recolectarBloques() {
    var resultado = [];
    var nodos = document.querySelectorAll(SELECTOR_LEIBLE);
    for (var i = 0; i < nodos.length; i++) {
      var el = nodos[i];
      if (el.closest(SELECTOR_OMITIDO) || !esVisible(el)) { continue; }
      if (el.tagName === 'TABLE') {
        resultado = resultado.concat(bloquesDeTabla(el));
        continue;
      }
      if (el.closest('table')) { continue; }                                 // ya cubierto por la tabla
      if (el.tagName !== 'LI' && el.parentElement && el.parentElement.closest('li')) { continue; } // ya va dentro del <li>
      var texto = textoDeElemento(el);
      if (texto) { resultado.push({ el: el, texto: texto }); }
    }
    return resultado;
  }

  // Divide un texto largo en trozos de hasta "max" caracteres, cortando donde hay
  // puntuacion. Un texto corto se queda en un solo trozo (para no cortar siglas como "C.C.T.").
  function trocear(texto, max) {
    if (texto.length <= max) { return [texto]; }
    var salida = [];
    var actual = '';
    var oraciones = texto.match(/[^.!?;:]+[.!?;:]*\s*/g) || [texto];

    function cerrarActual() {
      if (actual.trim()) { salida.push(actual.trim()); }
      actual = '';
    }

    oraciones.forEach(function (oracion) {
      if (oracion.length > max) {
        // Oracion muy larga: se corta primero por comas (pausas naturales al hablar) y solo
        // si una frase entre comas sigue siendo demasiado larga, por palabras.
        cerrarActual();
        var trozo = '';
        var frases = oracion.match(/[^,]+,?\s*/g) || [oracion];
        frases.forEach(function (frase) {
          if (frase.length > max) {
            if (trozo.trim()) { salida.push(trozo.trim()); trozo = ''; }
            var porPalabras = '';
            frase.split(/\s+/).forEach(function (palabra) {
              if (porPalabras && (porPalabras + ' ' + palabra).length > max) {
                salida.push(porPalabras.trim());
                porPalabras = palabra;
              } else {
                porPalabras += ' ' + palabra;
              }
            });
            if (porPalabras.trim()) { salida.push(porPalabras.trim()); }
          } else if (trozo && (trozo + frase).length > max) {
            salida.push(trozo.trim());
            trozo = frase;
          } else {
            trozo += frase;
          }
        });
        if (trozo.trim()) { salida.push(trozo.trim()); }
      } else if ((actual + oracion).length > max) {
        cerrarActual();
        actual = oracion;
      } else {
        actual += oracion;
      }
    });
    cerrarActual();

    // Evita trozos de una o dos palabras ("...pinceladas / tradicionales."): cualquier trozo
    // muy corto se une al anterior si el total cabe con un pequeno margen (30 caracteres).
    var unidos = [];
    salida.forEach(function (trozo) {
      var ultimo = unidos.length - 1;
      if (ultimo >= 0 && trozo.length < 30 && unidos[ultimo].length + 1 + trozo.length <= max + 30) {
        unidos[ultimo] += ' ' + trozo;
      } else {
        unidos.push(trozo);
      }
    });
    return unidos;
  }

  function armarCola() {
    bloquesNarrador = recolectarBloques();
    colaNarrador = [];
    bloquesNarrador.forEach(function (bloque, indice) {
      trocear(bloque.texto, MAX_CARACTERES).forEach(function (trozo) {
        colaNarrador.push({ bloque: indice, texto: trozo });
      });
    });
  }

  // ---------- Resaltado del bloque que se lee ----------
  function reducirMovimiento() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function quitarResaltado() {
    if (bloqueResaltado) {
      bloqueResaltado.classList.remove('a11y-leyendo');
      bloqueResaltado = null;
    }
  }

  // Resalta el bloque y, si queda fuera de la zona visible (o bajo el menu fijo), lo centra.
  function resaltar(el) {
    if (bloqueResaltado === el) { return; }
    quitarResaltado();
    el.classList.add('a11y-leyendo');
    bloqueResaltado = el;
    var caja = el.getBoundingClientRect();
    var alto = window.innerHeight || document.documentElement.clientHeight;
    if (caja.top < 110 || caja.bottom > alto - 70) {
      el.scrollIntoView({ block: 'center', behavior: reducirMovimiento() ? 'auto' : 'smooth' });
    }
  }

  // ---------- Reproduccion ----------
  // Dice el trozo actual y, al terminar, pasa al siguiente.
  function hablarTrozo() {
    if (estadoNarrador !== 'leyendo') { return; }
    if (posNarrador >= colaNarrador.length) { terminarLectura(); return; }

    var trozo = colaNarrador[posNarrador];
    resaltar(bloquesNarrador[trozo.bloque].el);
    notificarNarrador();

    var miFicha = fichaNarrador;
    var locucion = new window.SpeechSynthesisUtterance(trozo.texto);
    locucion.lang = vozElegida ? vozElegida.lang : (idiomaActual === 'es' ? 'es-MX' : 'en-US');
    if (vozElegida) { locucion.voice = vozElegida; }
    locucion.rate = VELOCIDADES[indiceVelocidad];

    locucion.onend = function () {
      if (miFicha !== fichaNarrador || estadoNarrador !== 'leyendo') { return; }   // lectura cancelada o en pausa
      posNarrador++;
      hablarTrozo();
    };
    locucion.onerror = function (e) {
      if (miFicha !== fichaNarrador) { return; }
      if (e && (e.error === 'canceled' || e.error === 'interrupted')) { return; }  // cancelaciones normales
      // Sin ninguna voz instalada (ej. algunos equipos Linux) el aviso es mas especifico.
      var sinVoces = !(sintesis.getVoices() || []).length;
      detenerLectura(sinVoces ? tr('Este dispositivo no tiene voces instaladas para leer en voz alta.')
                              : tr('No se pudo reproducir la voz en este dispositivo.'));
    };

    locucionActual = locucion;
    sintesis.speak(locucion);
  }

  // (Re)empieza a hablar desde el trozo actual. Si habia algo sonando se cancela antes;
  // algunos navegadores descartan un speak() inmediato a un cancel(), por eso la pausa corta.
  // Si no habia nada sonando se habla de inmediato, dentro del gesto de la persona (iOS lo exige).
  function reiniciarLectura() {
    fichaNarrador++;
    var ocupado = sintesis.speaking || sintesis.pending;
    sintesis.cancel();
    if (ocupado) { setTimeout(hablarTrozo, 80); } else { hablarTrozo(); }
  }

  function iniciarLectura() {
    if (!narradorSoportado) { return; }
    armarCola();
    if (!colaNarrador.length) {
      mensajeNarrador = tr('No hay texto para leer en esta página.');
      estadoNarrador = 'detenido';
      notificarNarrador();
      return;
    }
    posNarrador = 0;
    estadoNarrador = 'leyendo';
    mensajeNarrador = vocesIdioma.length ? '' : tr('No hay una voz en español instalada; se usará la predeterminada del dispositivo.');
    notificarNarrador();
    reiniciarLectura();
  }

  // La pausa se hace cancelando y recordando el trozo actual (al continuar se repite
  // ese trozo desde su inicio). Funciona igual en todos los navegadores; el pause()
  // nativo falla en varios (por ejemplo, Chrome en Android).
  function pausarLectura() {
    if (estadoNarrador !== 'leyendo') { return; }
    estadoNarrador = 'pausado';
    fichaNarrador++;
    sintesis.cancel();
    notificarNarrador();
  }

  function continuarLectura() {
    if (estadoNarrador !== 'pausado') { return; }
    estadoNarrador = 'leyendo';
    notificarNarrador();
    reiniciarLectura();
  }

  function detenerLectura(mensaje) {
    fichaNarrador++;
    if (sintesis) { sintesis.cancel(); }
    estadoNarrador = 'detenido';
    posNarrador = 0;
    quitarResaltado();
    mensajeNarrador = mensaje || '';
    notificarNarrador();
  }

  function terminarLectura() {
    detenerLectura(tr('Lectura terminada.'));
  }

  // Un solo boton que alterna: leer, pausar o continuar segun el estado.
  function alternarLectura() {
    if (estadoNarrador === 'detenido') { iniciarLectura(); }
    else if (estadoNarrador === 'leyendo') { pausarLectura(); }
    else { continuarLectura(); }
  }

  function cambiarVelocidad(nuevo) {
    nuevo = Math.max(0, Math.min(VELOCIDADES.length - 1, nuevo));
    if (nuevo === indiceVelocidad) { return; }
    indiceVelocidad = nuevo;
    escribirGuardado(CLAVE_VELOCIDAD, String(nuevo));
    notificarNarrador();
    if (estadoNarrador === 'leyendo') { reiniciarLectura(); }   // el cambio se oye de inmediato
  }

  function cambiarVoz(nombre) {
    var nueva = null;
    vocesIdioma.forEach(function (v) { if (v.name === nombre) { nueva = v; } });
    if (!nueva) { return; }
    vozElegida = nueva;
    escribirGuardado(claveVoz(), nueva.name);
    notificarNarrador();
    if (estadoNarrador === 'leyendo') { reiniciarLectura(); }
  }

  // Al salir de la pagina o recargarla, la voz debe callarse.
  window.addEventListener('pagehide', function () {
    if (narradorSoportado) { sintesis.cancel(); }
  });

  /* =========================================================================
   * CAMBIO 3: CONTROLES DEL NARRADOR
   * ========================================================================= */

  // Iconos decorativos (aria-hidden) del narrador.
  function iconoNarrador(nombre, tam) {
    var formas = {
      altavoz: '<path d="M3 9.5v5h4l5 4v-13l-5 4.5H3z" fill="currentColor"/>' +
               '<path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
      reproducir: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
      pausa: '<rect x="6" y="5" width="4.2" height="14" rx="1" fill="currentColor"/>' +
             '<rect x="13.8" y="5" width="4.2" height="14" rx="1" fill="currentColor"/>',
      detener: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>'
    };
    return '<svg viewBox="0 0 24 24" width="' + tam + '" height="' + tam + '" aria-hidden="true" focusable="false">' +
           formas[nombre] + '</svg>';
  }

  // Textos que dependen del estado (etiqueta accesible, texto visible e icono).
  function datosBotonPrincipal() {
    if (estadoNarrador === 'leyendo') { return { texto: tr('Pausar'), aria: tr('Pausar la lectura'), icono: 'pausa' }; }
    if (estadoNarrador === 'pausado') { return { texto: tr('Continuar'), aria: tr('Continuar la lectura'), icono: 'reproducir' }; }
    return { texto: tr('Leer página'), aria: tr('Leer la página en voz alta'), icono: 'reproducir' };
  }

  // Boton flotante rapido junto al boton de accesibilidad: leer / pausar / continuar
  // sin abrir el panel. Es la funcion mas usada, por eso queda siempre a la vista.
  function crearBotonRapidoNarrador() {
    var boton = crear('button', { type: 'button', 'class': 'a11y-narrar' });

    function actualizar() {
      var datos = datosBotonPrincipal();
      boton.setAttribute('aria-label', datos.aria);
      boton.setAttribute('data-estado', estadoNarrador);
      boton.innerHTML = iconoNarrador(estadoNarrador === 'detenido' ? 'altavoz' : datos.icono, 26);
    }

    boton.addEventListener('click', alternarLectura);
    oyentesNarrador.push(actualizar);
    actualizar();
    return boton;
  }

  // Seccion del panel: boton principal, detener, velocidad, voz y mensajes de estado.
  function crearControlNarrador() {
    var contenedor = crear('div');

    // Navegadores sin sintesis de voz: solo se muestra el aviso.
    if (!narradorSoportado) {
      contenedor.appendChild(crear('div', { 'class': 'a11y-estado' }, tr('Este navegador no permite la lectura en voz alta.')));
      return contenedor;
    }

    // Fila 1: leer/pausar/continuar + detener.
    var fila1 = crear('div', { 'class': 'a11y-fila' });
    var btnPrincipal = crear('button', { type: 'button', 'class': 'a11y-btn a11y-btn-narrar' });
    var iconoPrincipal = crear('span', { 'class': 'a11y-icono', 'aria-hidden': 'true' });
    var textoPrincipal = crear('span');
    btnPrincipal.appendChild(iconoPrincipal);
    btnPrincipal.appendChild(textoPrincipal);
    btnPrincipal.addEventListener('click', alternarLectura);

    var btnDetener = crear('button', { type: 'button', 'class': 'a11y-btn a11y-btn-detener', 'aria-label': tr('Detener la lectura') });
    var iconoDetener = crear('span', { 'class': 'a11y-icono', 'aria-hidden': 'true' });
    iconoDetener.innerHTML = iconoNarrador('detener', 18);
    btnDetener.appendChild(iconoDetener);
    btnDetener.appendChild(document.createTextNode(tr('Detener')));
    btnDetener.addEventListener('click', function () {
      if (btnDetener.getAttribute('aria-disabled') === 'true') { return; }
      detenerLectura('');
    });
    fila1.appendChild(btnPrincipal);
    fila1.appendChild(btnDetener);

    // Fila 2: velocidad (- / valor / +).
    var fila2 = crear('div', { 'class': 'a11y-fila' });
    var valorVelocidad = crear('span', { 'class': 'a11y-valor', 'aria-live': 'polite' });
    var btnMenos = crearBoton('a11y-btn-fuente', '-', tr('Reducir la velocidad de lectura'), function () {
      cambiarVelocidad(indiceVelocidad - 1);
    });
    var btnMas = crearBoton('a11y-btn-fuente a11y-btn-mas', '+', tr('Aumentar la velocidad de lectura'), function () {
      cambiarVelocidad(indiceVelocidad + 1);
    });
    fila2.appendChild(btnMenos);
    fila2.appendChild(valorVelocidad);
    fila2.appendChild(btnMas);

    // Fila 3: eleccion de voz. Solo aparece si hay mas de una voz en espanol.
    var filaVoz = crear('div', { 'class': 'a11y-fila-voz' });
    var etiquetaVoz = crear('label', { 'class': 'a11y-etiqueta', 'for': 'a11y-voz' }, tr('Voz'));
    var selectorVoz = crear('select', { id: 'a11y-voz', 'class': 'a11y-select' });
    selectorVoz.addEventListener('change', function () { cambiarVoz(selectorVoz.value); });
    filaVoz.appendChild(etiquetaVoz);
    filaVoz.appendChild(selectorVoz);

    // Estado: mensaje (leido por lectores de pantalla) y progreso (solo visual).
    var estado = crear('div', { 'class': 'a11y-estado', role: 'status', 'aria-live': 'polite' });
    var textoEstado = crear('span');
    var textoProgreso = crear('span', { 'class': 'a11y-progreso', 'aria-hidden': 'true' });
    estado.appendChild(textoEstado);
    estado.appendChild(textoProgreso);

    var vocesPintadas = '';

    function actualizar() {
      var datos = datosBotonPrincipal();
      btnPrincipal.setAttribute('aria-label', datos.aria);
      iconoPrincipal.innerHTML = iconoNarrador(datos.icono, 18);
      if (textoPrincipal.textContent !== datos.texto) { textoPrincipal.textContent = datos.texto; }

      btnDetener.setAttribute('aria-disabled', estadoNarrador === 'detenido' ? 'true' : 'false');

      var velocidad = tr('Velocidad') + ' ' + textoVelocidad(indiceVelocidad);
      if (valorVelocidad.textContent !== velocidad) { valorVelocidad.textContent = velocidad; }
      btnMenos.setAttribute('aria-disabled', indiceVelocidad === 0 ? 'true' : 'false');
      btnMas.setAttribute('aria-disabled', indiceVelocidad === VELOCIDADES.length - 1 ? 'true' : 'false');

      // El selector de voz se rearma solo cuando cambia la lista de voces.
      var firma = vocesIdioma.map(function (v) { return v.name; }).join('|');
      if (firma !== vocesPintadas) {
        vocesPintadas = firma;
        selectorVoz.innerHTML = '';
        vocesIdioma.forEach(function (v) {
          var opcion = crear('option', { value: v.name }, v.name);
          selectorVoz.appendChild(opcion);
        });
      }
      if (vozElegida) { selectorVoz.value = vozElegida.name; }
      if (vocesIdioma.length > 1) { filaVoz.removeAttribute('hidden'); } else { filaVoz.setAttribute('hidden', ''); }

      // Mensaje de estado: se actualiza solo si cambia, para no repetir avisos.
      var mensaje = mensajeNarrador;
      if (!mensaje && estadoNarrador === 'leyendo') { mensaje = tr('Leyendo.'); }
      if (!mensaje && estadoNarrador === 'pausado') { mensaje = tr('Lectura en pausa.'); }
      if (textoEstado.textContent !== mensaje) { textoEstado.textContent = mensaje; }

      var progreso = '';
      if (estadoNarrador !== 'detenido' && colaNarrador[posNarrador]) {
        progreso = ' ' + tr('Bloque') + ' ' + (colaNarrador[posNarrador].bloque + 1) + ' ' + tr('de') + ' ' + bloquesNarrador.length + '.';
      }
      if (textoProgreso.textContent !== progreso) { textoProgreso.textContent = progreso; }
    }

    oyentesNarrador.push(actualizar);
    contenedor.appendChild(fila1);
    contenedor.appendChild(fila2);
    contenedor.appendChild(filaVoz);
    contenedor.appendChild(estado);
    actualizar();
    return contenedor;
  }

  /* =========================================================================
   * PANEL FLOTANTE (boton + ventana desplegable)
   * ========================================================================= */

  // ---------- CAMBIO 4: selector de idioma en el panel ----------
  // Un boton por idioma (Espanol, English, y los que se agreguen en js/idiomas/). Usa el mismo
  // estilo que los botones de tema. Cada boton lleva su propio atributo lang para que los
  // lectores de pantalla pronuncien bien su nombre.
  function crearControlIdioma() {
    var codigos = ['es'].concat(Object.keys(TRADUCCIONES).filter(function (c) { return idiomaDisponible(c); }));
    if (codigos.length < 2) { return null; }       // sin diccionarios no hay nada que elegir

    var grupo = crear('div', { 'class': 'a11y-segmentos', role: 'group', 'aria-label': 'Idioma / Language' });
    codigos.forEach(function (codigo) {
      var nombre = codigo === 'es' ? 'Español' : (TRADUCCIONES[codigo].nombre || codigo);
      var boton = crear('button', {
        type: 'button',
        'class': 'a11y-btn a11y-btn-tema a11y-btn-idioma',
        'data-idioma': codigo,
        lang: codigo,
        'aria-pressed': codigo === idiomaActual ? 'true' : 'false'
      }, nombre);
      boton.addEventListener('click', function () { cambiarIdioma(codigo); });
      grupo.appendChild(boton);
    });
    return grupo;
  }

  // El panel se puede volver a armar (al cambiar de idioma hay que renovar todos sus textos),
  // por eso el boton, el panel y el contenedor actuales se guardan en variables.
  var widgetActual = null;
  var panelActual = null;
  var toggleActual = null;
  var escuchasGlobalesListas = false;

  function abrirPanel(abierto) {
    if (!panelActual) { return; }
    if (abierto) { panelActual.removeAttribute('hidden'); } else { panelActual.setAttribute('hidden', ''); }
    toggleActual.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  }

  function construirPanel() {
    var widget = crear('div', { 'class': 'a11y-widget' });

    // Boton flotante que abre/cierra el panel. Icono SVG decorativo (aria-hidden).
    var toggle = crear('button', {
      type: 'button',
      'class': 'a11y-toggle',
      'aria-label': tr('Opciones de accesibilidad'),
      'aria-expanded': 'false',
      'aria-controls': 'a11y-panel'
    });
    toggle.innerHTML =
      '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="4.5" r="2.2" fill="currentColor"/>' +
      '<path d="M5 8.5h14M12 8.5v5m0 0l-3.5 7m3.5-7l3.5 7" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

    var panel = crear('div', {
      id: 'a11y-panel',
      'class': 'a11y-panel',
      role: 'group',
      'aria-label': tr('Opciones de accesibilidad'),
      hidden: ''
    });

    // CAMBIO 4: seccion de idioma, primera del panel. Su titulo es bilingue a proposito
    // para que se entienda sin importar el idioma activo.
    var controlIdioma = crearControlIdioma();
    if (controlIdioma) { panel.appendChild(crearSeccion('Idioma / Language', controlIdioma)); }

    // CAMBIO 3: seccion del narrador, por ser la funcion principal.
    panel.appendChild(crearSeccion(tr('Narrador (leer en voz alta)'), crearControlNarrador()));

    // CAMBIO 1: seccion de tamano de texto.
    panel.appendChild(crearSeccion(tr('Tamaño del texto'), crearControlFuente()));

    // CAMBIO 2: seccion de tema claro / oscuro.
    panel.appendChild(crearSeccion(tr('Tema de color'), crearControlTema()));

    toggle.addEventListener('click', function () {
      abrirPanel(panel.hasAttribute('hidden'));
    });

    // El boton va ANTES que el panel en el DOM para que, al abrirlo con el teclado,
    // la tecla Tab entre directamente a los controles del panel. La posicion visual
    // no cambia porque el panel esta posicionado de forma absoluta en el CSS.
    // CAMBIO 3: boton rapido del narrador, a la izquierda del boton de accesibilidad.
    // Va primero en el DOM para que en el orden de Tab quede antes que el boton de accesibilidad.
    if (narradorSoportado) { widget.appendChild(crearBotonRapidoNarrador()); }
    widget.appendChild(toggle);
    widget.appendChild(panel);
    document.body.appendChild(widget);

    widgetActual = widget;
    panelActual = panel;
    toggleActual = toggle;

    // Los controles globales se registran una sola vez, aunque el panel se rearme.
    if (!escuchasGlobalesListas) {
      escuchasGlobalesListas = true;

      // Escape cierra el panel y devuelve el foco al boton.
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panelActual && !panelActual.hasAttribute('hidden')) {
          abrirPanel(false);
          toggleActual.focus();
        }
      });

      // Un clic fuera del panel lo cierra. Para saber si el clic fue dentro se usa la RUTA ORIGINAL
      // del evento (composedPath), no el elemento pulsado en este momento: al pulsar el boton del
      // narrador o cambiar de idioma, el icono o todo el panel se reemplazan durante el clic y el
      // elemento pulsado queda desconectado de la pagina, por lo que parecia un clic "afuera".
      document.addEventListener('click', function (e) {
        var ruta = typeof e.composedPath === 'function' ? e.composedPath() : [];
        var dentro = ruta.some(function (n) { return n && n.classList && n.classList.contains('a11y-widget'); }) ||
                     !!(e.target.closest && e.target.closest('.a11y-widget'));
        if (!dentro) { abrirPanel(false); }
      });
    }
  }

  // Vuelve a armar el panel con los textos del idioma actual. Conserva si estaba abierto y
  // devuelve el foco al control indicado, para no desorientar a quien usa el teclado.
  function reconstruirPanel(selectorFoco) {
    var estabaAbierto = !!panelActual && !panelActual.hasAttribute('hidden');
    oyentesNarrador.length = 0;       // los controles anteriores ya no existen
    if (widgetActual && widgetActual.parentNode) { widgetActual.parentNode.removeChild(widgetActual); }
    construirPanel();
    if (estabaAbierto) { abrirPanel(true); }
    if (selectorFoco) {
      var destino = widgetActual.querySelector(selectorFoco);
      if (destino) { destino.focus(); }
    }
  }

  // CAMBIO 4: cambio de idioma pedido desde el panel.
  function cambiarIdioma(codigo) {
    if (codigo === idiomaActual || !idiomaDisponible(codigo)) { return; }

    // Una lectura en curso estaba en el otro idioma: se detiene.
    if (narradorSoportado && estadoNarrador !== 'detenido') { detenerLectura(''); }
    mensajeNarrador = '';

    escribirGuardado(CLAVE_IDIOMA, codigo);
    aplicarIdioma(codigo);                       // traduce (o restaura) el contenido de la pagina
    if (narradorSoportado) { cargarVoces(); }    // el narrador pasa a las voces del nuevo idioma
    reconstruirPanel('[data-idioma="' + codigo + '"]');
  }

  // Arranque cuando el <body> ya existe: primero se traduce la pagina (si corresponde) y luego se
  // arma el panel en el idioma elegido. try/finally garantiza que la pagina nunca quede oculta.
  function iniciarPagina() {
    try {
      if (idiomaActual !== 'es') { traducirTodo(); }
    } finally {
      document.documentElement.classList.remove('a11y-traduciendo');
    }
    construirPanel();
  }

  // Seguro adicional: si algo fallara antes, la pagina se muestra igual a los pocos segundos.
  setTimeout(function () { document.documentElement.classList.remove('a11y-traduciendo'); }, 2500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarPagina);
  } else {
    iniciarPagina();
  }
})();
