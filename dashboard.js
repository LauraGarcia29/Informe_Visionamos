// ===================== CONFIGURACIÓN DE BOLSAS =====================
const bolsas = [
  {
    id: "bolsa1",
    nombre: "Bolsa 1 · 40.000 operaciones",
    capacidad: 40000,
    inicio: "2023-04-01",
    fin: "2024-03-31",
  },
  {
    id: "bolsa2",
    nombre: "Bolsa 2 · 40.000 operaciones",
    capacidad: 40000,
    inicio: "2024-04-01",
    fin: "2025-02-28",
  },
  {
    id: "bolsa3",
    nombre: "Bolsa 3 · 30.000 operaciones",
    capacidad: 30000,
    inicio: "2025-03-01",
    fin: "2026-02-28",
  },
];

const monthNamesEs = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// ===================== REFERENCIAS AL DOM =====================
const bolsaSelect = document.getElementById("bolsaSelect");
const mesSelect = document.getElementById("mesSelect");
const entidadSelect = document.getElementById("entidadSelect");

const kpiBolsaTotal = document.getElementById("kpiBolsaTotal");
const kpiBolsaConsumida = document.getElementById("kpiBolsaConsumida");
const kpiBolsaConsumidaPct = document.getElementById("kpiBolsaConsumidaPct");
const kpiBolsaDisponible = document.getElementById("kpiBolsaDisponible");
const kpiBolsaDisponiblePct = document.getElementById(
  "kpiBolsaDisponiblePct"
);
const kpiValidaciones = document.getElementById("kpiValidaciones");

const gaugeFill = document.getElementById("gaugeFill");
const gaugeLabel = document.getElementById("gaugeLabel");

const filtroResumen = document.getElementById("filtroResumen");
const errorMsg = document.getElementById("errorMsg");
const rangoBolsaLabel = document.getElementById("rangoBolsaLabel");
const detalleTitulo = document.getElementById("detalleTitulo");

const tablaBody = document.getElementById("tablaBody");
const totValidacion = document.getElementById("totValidacion");
const totDeudor = document.getElementById("totDeudor");
const totCodeudor = document.getElementById("totCodeudor");
const totTotal = document.getElementById("totTotal");

// Nuevos cuadros de resumen por tipo (debajo de la barra de consumo)
const resValidacion = document.getElementById("resValidacion");
const resDeudor = document.getElementById("resDeudor");
const resCodeudor = document.getElementById("resCodeudor");

// ===================== ESTADO =====================
let allData = [];
let currentBolsaData = [];

// ===================== HELPERS =====================
function formatNumber(n) {
  if (isNaN(n)) return "0";
  return n.toLocaleString("es-CO");
}

function formatPercent(p) {
  if (isNaN(p)) return "0%";
  return p.toFixed(1).replace(".", ",") + "%";
}

// mesStr viene como "2025-11-01"
function labelFromMesStr(mesStr) {
  const [y, m] = String(mesStr).split("-");
  const idx = parseInt(m, 10) - 1;
  const nombre = monthNamesEs[idx] || "";
  return `${nombre.toUpperCase()} ${y}`;
}

function getBolsaById(id) {
  return bolsas.find((b) => b.id === id) || bolsas[0];
}

// helpers para no reventar si algún elemento es null
function safeText(el, value) {
  if (el) el.textContent = value;
}

function safeWidth(el, value) {
  if (el) el.style.width = value;
}

// ===================== CARGA DE DATOS =====================
async function loadData() {
  try {
    const resp = await fetch("base-operaciones.json");
    if (!resp.ok) {
      throw new Error(
        "No se pudo cargar base-operaciones.json (revisa ruta y nombre)."
      );
    }
    const raw = await resp.json();

    allData = raw.map((row) => {
      const mesStr = String(row["MES"]).trim(); // "2025-11-01"
      const mesKey = mesStr.slice(0, 7); // "2025-11"

      return {
        mesStr,
        mesKey,
        mesLabel: labelFromMesStr(mesStr),
        year: row["AÑO"],
        entidad: row["ENTIDAD"],
        validacion: Number(row["VALIDACIÓN DE IDENTIDAD"] || 0),
        deudor: Number(row["ANÁLISIS DEUDOR"] || 0),
        codeudor: Number(row["ANÁLISIS CODEUDOR"] || 0),
        total: Number(row["TOTAL"] || 0),
      };
    });

    console.log("Meses encontrados en JSON:", [
      ...new Set(allData.map((r) => r.mesKey)),
    ]);
    console.log(
      "Registros noviembre 2025 en JSON:",
      allData.filter((r) => r.mesKey === "2025-11").length
    );

    initBolsaSelect();
    bolsaSelect.value = "bolsa3"; // por defecto bolsa vigente
    onBolsaChange();
  } catch (err) {
    console.error(err);
    if (errorMsg) {
      errorMsg.style.display = "block";
      errorMsg.textContent = err.message;
    }
  }
}

// ===================== INICIALIZACIÓN DE FILTROS =====================
function initBolsaSelect() {
  if (!bolsaSelect) return;

  bolsaSelect.innerHTML = "";
  bolsas.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.nombre;
    bolsaSelect.appendChild(opt);
  });
}

function onBolsaChange() {
  const bolsa = getBolsaById(bolsaSelect.value);

  safeText(
    rangoBolsaLabel,
    `${bolsa.inicio.split("-").reverse().join("/")} – ${bolsa.fin
      .split("-")
      .reverse()
      .join("/")}`
  );

  // Filtramos usando strings "YYYY-MM-DD", no Date
  currentBolsaData = allData.filter(
    (r) => r.mesStr >= bolsa.inicio && r.mesStr <= bolsa.fin
  );

  console.log(
    "Meses en la bolsa seleccionada:",
    [...new Set(currentBolsaData.map((r) => r.mesKey))]
  );

  const monthSet = new Map();
  const entidadesSet = new Set();

  currentBolsaData.forEach((r) => {
    if (!monthSet.has(r.mesKey)) monthSet.set(r.mesKey, r.mesLabel);
    entidadesSet.add(r.entidad);
  });

  // Meses
  if (mesSelect) {
    mesSelect.innerHTML = "";
    const optAllMes = document.createElement("option");
    optAllMes.value = "all";
    optAllMes.textContent = "Todos";
    mesSelect.appendChild(optAllMes);

    [...monthSet.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .forEach(([key, label]) => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = label;
        mesSelect.appendChild(opt);
      });
  }

  // Entidades
  if (entidadSelect) {
    entidadSelect.innerHTML = "";
    const optAllEnt = document.createElement("option");
    optAllEnt.value = "all";
    optAllEnt.textContent = "Todas";
    entidadSelect.appendChild(optAllEnt);

    [...entidadesSet]
      .sort((a, b) => (a < b ? -1 : 1))
      .forEach((ent) => {
        const opt = document.createElement("option");
        opt.value = ent;
        opt.textContent = ent;
        entidadSelect.appendChild(opt);
      });
  }

  updateDashboard();
}

// ===================== ACTUALIZAR DASHBOARD =====================
function updateDashboard() {
  const bolsa = getBolsaById(bolsaSelect.value);
  const selectedMesKey = mesSelect ? mesSelect.value : "all";
  const selectedEntidad = entidadSelect ? entidadSelect.value : "all";

  let filtered = currentBolsaData;
  if (selectedMesKey !== "all") {
    filtered = filtered.filter((r) => r.mesKey === selectedMesKey);
  }
  if (selectedEntidad !== "all") {
    filtered = filtered.filter((r) => r.entidad === selectedEntidad);
  }

  // Caso sin registros
  if (filtered.length === 0) {
    if (tablaBody) {
      tablaBody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">Sin registros para este filtro</td></tr>';
    }

    safeText(kpiBolsaTotal, formatNumber(bolsa.capacidad));
    safeText(kpiBolsaConsumida, "0");
    safeText(kpiBolsaConsumidaPct, "0% de la bolsa");
    safeText(kpiBolsaDisponible, formatNumber(bolsa.capacidad));
    safeText(kpiBolsaDisponiblePct, "100% disponible");
    safeText(kpiValidaciones, "0");

    // Barra
    safeWidth(gaugeFill, "0%");
    safeText(
      gaugeLabel,
      "0% de la bolsa consumida · Consumidas: 0 / Total: " +
        formatNumber(bolsa.capacidad) +
        " / Restantes: " +
        formatNumber(bolsa.capacidad)
    );

    safeText(totValidacion, "0");
    safeText(totDeudor, "0");
    safeText(totCodeudor, "0");
    safeText(totTotal, "0");

    // resumen por tipo
    safeText(resValidacion, "0");
    safeText(resDeudor, "0");
    safeText(resCodeudor, "0");

    safeText(detalleTitulo, "");
    safeText(filtroResumen, "");
    return;
  }

  // Totales de lo que se ve en la tabla (filtro)
  const totalsFilter = filtered.reduce(
    (acc, r) => {
      acc.validacion += r.validacion;
      acc.deudor += r.deudor;
      acc.codeudor += r.codeudor;
      acc.total += r.total;
      return acc;
    },
    { validacion: 0, deudor: 0, codeudor: 0, total: 0 }
  );

  // Actualizar cuadros de resumen (debajo de la barra)
  safeText(resValidacion, formatNumber(totalsFilter.validacion));
  safeText(resDeudor, formatNumber(totalsFilter.deudor));
  safeText(resCodeudor, formatNumber(totalsFilter.codeudor));

  // Totales de toda la bolsa (para KPIs)
  const totalsBolsa = currentBolsaData.reduce(
    (acc, r) => {
      acc.validacion += r.validacion;
      acc.deudor += r.deudor;
      acc.codeudor += r.codeudor;
      // 1 operación = análisis deudor + análisis codeudor
      acc.operaciones += r.deudor + r.codeudor;
      return acc;
    },
    { validacion: 0, deudor: 0, codeudor: 0, operaciones: 0 }
  );

  const bolsaConsumida = totalsBolsa.operaciones;
  const bolsaDisponible = Math.max(bolsa.capacidad - bolsaConsumida, 0);
  const pctConsumida =
    bolsa.capacidad > 0 ? (bolsaConsumida / bolsa.capacidad) * 100 : 0;
  const pctDisponible = 100 - pctConsumida;

  // KPIs
  safeText(kpiBolsaTotal, formatNumber(bolsa.capacidad));
  safeText(kpiBolsaConsumida, formatNumber(bolsaConsumida));
  safeText(
    kpiBolsaConsumidaPct,
    formatPercent(pctConsumida) + " de la bolsa"
  );
  safeText(kpiBolsaDisponible, formatNumber(bolsaDisponible));
  safeText(
    kpiBolsaDisponiblePct,
    formatPercent(pctDisponible) + " disponible"
  );
  safeText(kpiValidaciones, formatNumber(totalsBolsa.validacion));

  // Barra
  safeWidth(gaugeFill, Math.min(pctConsumida, 100) + "%");
  safeText(
    gaugeLabel,
    formatPercent(pctConsumida) +
      " de la bolsa consumida · Consumidas: " +
      formatNumber(bolsaConsumida) +
      " / Total: " +
      formatNumber(bolsa.capacidad) +
      " / Restantes: " +
      formatNumber(bolsaDisponible)
  );

  // Resumen filtros
  let resumen = "Mostrando ";
  if (selectedMesKey === "all") {
    resumen += "todos los meses";
  } else if (mesSelect) {
    resumen += mesSelect.options[mesSelect.selectedIndex].text;
  }
  resumen += " · ";
  if (selectedEntidad === "all") {
    resumen += "todas las entidades";
  } else {
    resumen += `entidad ${selectedEntidad}`;
  }
  resumen += ` · ${filtered.length} registros.`;
  safeText(filtroResumen, resumen);

  safeText(detalleTitulo, `${filtered.length} registros`);

  // Tabla
  filtered.sort((a, b) => {
    if (a.mesKey === b.mesKey) return a.entidad.localeCompare(b.entidad);
    return a.mesKey < b.mesKey ? -1 : 1;
  });

  if (tablaBody) {
    tablaBody.innerHTML = "";
    filtered.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.mesLabel}</td>
        <td>${r.entidad}</td>
        <td>${formatNumber(r.validacion)}</td>
        <td>${formatNumber(r.deudor)}</td>
        <td>${formatNumber(r.codeudor)}</td>
        <td>${formatNumber(r.total)}</td>
      `;
      tablaBody.appendChild(tr);
    });
  }

  safeText(totValidacion, formatNumber(totalsFilter.validacion));
  safeText(totDeudor, formatNumber(totalsFilter.deudor));
  safeText(totCodeudor, formatNumber(totalsFilter.codeudor));
  safeText(totTotal, formatNumber(totalsFilter.total));
}

// ===================== EVENTOS & ARRANQUE =====================
if (bolsaSelect) bolsaSelect.addEventListener("change", onBolsaChange);
if (mesSelect) mesSelect.addEventListener("change", updateDashboard);
if (entidadSelect)
  entidadSelect.addEventListener("change", updateDashboard);

loadData();
