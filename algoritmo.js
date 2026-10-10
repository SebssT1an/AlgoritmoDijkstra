const N_MIN = 7;
const N_MAX = 16;
const INF = Infinity;

function nombre(i) {
  return String.fromCharCode(65 + i);
}

function indice(letra) {
  return letra.charCodeAt(0) - 65;
}

function crearGrafo(n) {
  const ady = [];
  for (let i = 0; i < n; i++) ady.push({});
  return { n: n, ady: ady };
}

function listaAristas(g) {
  const aristas = [];
  for (let u = 0; u < g.n; u++) {
    for (const v in g.ady[u]) {
      aristas.push({ desde: u, hasta: Number(v), peso: g.ady[u][v] });
    }
  }
  return aristas;
}

function hayCamino(g, a, b) {
  const pila = [a];
  const visto = new Set([a]);
  while (pila.length > 0) {
    const x = pila.pop();
    if (x === b) return true;
    for (const y in g.ady[x]) {
      const w = Number(y);
      if (!visto.has(w)) {
        visto.add(w);
        pila.push(w);
      }
    }
  }
  return false;
}

function agregarArista(g, u, v, peso) {
  if (u === v) return "No se permiten lazos: el origen y el destino de la arista deben ser distintos.";
  if (!Number.isInteger(peso) || peso <= 0) return "El peso debe ser un numero entero positivo.";
  if (v in g.ady[u]) return "La arista " + nombre(u) + " → " + nombre(v) + " ya existe.";
  if (hayCamino(g, v, u)) {
    return "La arista " + nombre(u) + " → " + nombre(v) + " formaria un ciclo, porque ya existe un camino de " +
           nombre(v) + " a " + nombre(u) + ". El grafo debe ser aciclico.";
  }
  g.ady[u][v] = peso;
  return null;
}

function quitarArista(g, u, v) {
  if (!(v in g.ady[u])) return "La arista " + nombre(u) + " → " + nombre(v) + " no existe.";
  delete g.ady[u][v];
  return null;
}

function generarAleatorio(n, densidad, pesoMin, pesoMax) {
  densidad = densidad || Math.min(0.38, 2.4 / n);
  pesoMin = pesoMin || 1;
  pesoMax = pesoMax || 9;

  const g = crearGrafo(n);

  const orden = [];
  for (let i = 0; i < n; i++) orden.push(i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = orden[i]; orden[i] = orden[j]; orden[j] = tmp;
  }

  const pesoAlAzar = function () {
    return pesoMin + Math.floor(Math.random() * (pesoMax - pesoMin + 1));
  };

  for (let pos = 1; pos < n; pos++) {
    const v = orden[pos];
    const u = orden[Math.floor(Math.random() * pos)];
    g.ady[u][v] = pesoAlAzar();
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const u = orden[i], v = orden[j];
      if (!(v in g.ady[u]) && Math.random() < densidad) {
        g.ady[u][v] = pesoAlAzar();
      }
    }
  }
  return g;
}

function grafoDeLaLectura() {
  const g = crearGrafo(8);                   // A..H
  const aristas = [
    ["A", "B", 3], ["A", "C", 1], ["C", "D", 2], ["C", "F", 5],
    ["B", "D", 2], ["B", "G", 5], ["D", "E", 4], ["D", "F", 2],
    ["E", "G", 1], ["E", "H", 1], ["F", "H", 3]
  ];
  for (const a of aristas) {
    g.ady[indice(a[0])][indice(a[1])] = a[2];
  }
  return g;
}

function matrizAdyacencia(g) {
  const m = [];
  for (let i = 0; i < g.n; i++) {
    const fila = [];
    for (let j = 0; j < g.n; j++) fila.push(j in g.ady[i] ? g.ady[i][j] : null);
    m.push(fila);
  }
  return m;
}

function alcanzablesDesde(g, origen) {
  const alcanzables = [];
  for (let v = 0; v < g.n; v++) {
    if (v !== origen && hayCamino(g, origen, v)) alcanzables.push(v);
  }
  return alcanzables;
}

function dijkstraPasos(g, origen, destino) {
  const n = g.n;

  const etiquetas = [];
  const visitados = [];
  for (let i = 0; i < n; i++) { etiquetas.push(null); visitados.push(false); }
  etiquetas[origen] = { d: 0, pred: null, iter: 0 };

  const pasos = [];

  function foto(titulo, detalle, actual, relajadas, empates) {
    pasos.push({
      titulo: titulo,
      detalle: detalle,
      etiquetas: etiquetas.map(function (e) { return e === null ? null : { d: e.d, pred: e.pred, iter: e.iter }; }),
      visitados: visitados.slice(),
      actual: (actual === undefined ? null : actual),
      relajadas: relajadas || [],
      empates: empates || [],
      final: false,
      camino: []
    });
  }

  foto(
    "Paso 1. Vertice origen",
    ["Se etiqueta el origen " + nombre(origen) + " con [0, -]0.",
     "Los demas vertices todavia no tienen etiqueta.",
     "Ningun vertice ha sido visitado."],
    origen
  );

  let iteracion = 0;

  while (true) {
    // Paso 3: el no visitado con menor acumulado
    let u = null, mejor = INF;
    for (let i = 0; i < n; i++) {
      if (!visitados[i] && etiquetas[i] !== null && etiquetas[i].d < mejor) {
        mejor = etiquetas[i].d;
        u = i;
      }
    }

    if (u === null) break;   // no queda nadie alcanzable sin visitar

    iteracion++;
    visitados[u] = true;

    const detalle = [
      "Se elige " + nombre(u) + ": es el vértice no visitado con menor acumulado (d = " + mejor + ").",
      nombre(u) + " pasa a visitados, su etiqueta ya es definitiva."
    ];
    const relajadas = [];
    const empates = [];

    const vecinos = Object.keys(g.ady[u]).map(Number).sort(function (a, b) { return a - b; });

    if (vecinos.length === 0) {
      detalle.push(nombre(u) + " no tiene aristas salientes, no hay nada que actualizar.");
    }

    for (const v of vecinos) {
      const peso = g.ady[u][v];
      const nueva = etiquetas[u].d + peso;

      if (visitados[v]) {
        detalle.push("  " + nombre(u) + " → " + nombre(v) + " (peso " + peso + "): " + nombre(v) + " ya está visitado, se ignora.");
        continue;
      }

      if (etiquetas[v] === null) {
        etiquetas[v] = { d: nueva, pred: u, iter: iteracion };
        detalle.push("  " + nombre(u) + " → " + nombre(v) + ": " + etiquetas[u].d + " + " + peso + " = " + nueva +
                     "  →  " + nombre(v) + " recibe la etiqueta [" + nueva + ", " + nombre(u) + "]" + iteracion);
        relajadas.push([u, v, true]);
      } else if (nueva < etiquetas[v].d) {
        const antes = etiquetas[v].d;
        etiquetas[v] = { d: nueva, pred: u, iter: iteracion };
        detalle.push("  " + nombre(u) + " → " + nombre(v) + ": " + etiquetas[u].d + " + " + peso + " = " + nueva +
                     " < " + antes + "  →  se reemplaza por [" + nueva + ", " + nombre(u) + "]" + iteracion);
        relajadas.push([u, v, true]);
      } else if (nueva === etiquetas[v].d) {
        // Empate. La lectura dice conservar la etiqueta que ya estaba, pero el
        // empate significa que hay otro camino de la misma longitud minima.
        detalle.push("  " + nombre(u) + " → " + nombre(v) + ": " + etiquetas[u].d + " + " + peso + " = " + nueva +
                     " = " + etiquetas[v].d + "  →  empate. Se conserva la etiqueta actual, pero esto indica otro camino mínimo hacia " + nombre(v) + ".");
        empates.push([u, v]);
        relajadas.push([u, v, false]);
      } else {
        detalle.push("  " + nombre(u) + " → " + nombre(v) + ": " + etiquetas[u].d + " + " + peso + " = " + nueva +
                     " ≥ " + etiquetas[v].d + "  →  no mejora, se conserva la etiqueta actual.");
        relajadas.push([u, v, false]);
      }
    }

    foto("Iteración " + iteracion + ": vértice " + nombre(u), detalle, u, relajadas, empates);
  }

  const resumen = [];
  let camino = [];

  if (etiquetas[destino] !== null) {
    let x = destino;
    while (x !== null) {
      camino.push(x);
      x = etiquetas[x].pred;
    }
    camino.reverse();

    resumen.push("Distancia mínima de " + nombre(origen) + " a " + nombre(destino) + ": " + etiquetas[destino].d + ".");
    resumen.push("Camino: " + camino.map(nombre).join(" → "));
    resumen.push("Se obtiene siguiendo los vértices de procedencia desde " + nombre(destino) + " hasta " + nombre(origen) + " y leyendo la secuencia al revés.");

    const sinEtiqueta = [];
    for (let i = 0; i < n; i++) if (etiquetas[i] === null) sinEtiqueta.push(nombre(i));
    if (sinEtiqueta.length > 0) {
      resumen.push("Vértices no alcanzables desde " + nombre(origen) + ": " + sinEtiqueta.join(", ") + ".");
    }
  } else {
    resumen.push("No existe ningún camino dirigido de " + nombre(origen) + " a " + nombre(destino) + ".");
    resumen.push("El algoritmo etiquetó todos los vértices que sí son alcanzables desde " + nombre(origen) + ".");
  }

  pasos.push({
    titulo: "Resultado",
    detalle: resumen,
    etiquetas: etiquetas.map(function (e) { return e === null ? null : { d: e.d, pred: e.pred, iter: e.iter }; }),
    visitados: visitados.slice(),
    actual: destino,
    relajadas: [],
    empates: [],
    final: true,
    camino: camino
  });

  return pasos;
}

function distanciasDesde(g, origen) {
  const d = new Array(g.n).fill(INF);
  const vis = new Array(g.n).fill(false);
  d[origen] = 0;
  while (true) {
    let u = null, mejor = INF;
    for (let i = 0; i < g.n; i++) if (!vis[i] && d[i] < mejor) { mejor = d[i]; u = i; }
    if (u === null) break;
    vis[u] = true;
    for (const v in g.ady[u]) {
      const w = Number(v);
      if (d[u] + g.ady[u][v] < d[w]) d[w] = d[u] + g.ady[u][v];
    }
  }
  return d;
}

function mejorParOrigenDestino(g) {
  let mejorOrigen = 0, masAlcanzados = -1, mejorDestino = null;

  for (let o = 0; o < g.n; o++) {
    const d = distanciasDesde(g, o);
    let cuantos = 0, lejano = null, mayor = -1;
    for (let v = 0; v < g.n; v++) {
      if (v !== o && d[v] < INF) {
        cuantos++;
        if (d[v] > mayor) { mayor = d[v]; lejano = v; }
      }
    }
    if (cuantos > masAlcanzados) { masAlcanzados = cuantos; mejorOrigen = o; mejorDestino = lejano; }
  }
  return { origen: mejorOrigen, destino: mejorDestino === null ? (mejorOrigen + 1) % g.n : mejorDestino };
}