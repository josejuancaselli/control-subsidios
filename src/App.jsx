import { useEffect, useMemo, useState } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import { DEPTOS, SEED } from "./data";

const EMPTY = { baja: "", fecha: "", alta: "", confirmado: false, obs: "" };
const COL = collection(db, "bajas");

const estado = (r) => (!r.alta ? "Vacante" : r.confirmado ? "Cubierto" : "A confirmar");
const claseEstado = { Vacante: "vacante", "A confirmar": "aconfirmar", Cubierto: "cubierto" };
const dias = (r) => (r.fecha && !r.alta ? Math.floor((Date.now() - new Date(r.fecha + "T00:00:00")) / 864e5) : null);
const fmt = (f) => (f ? f.split("-").reverse().join("/") : "");

function Fila({ r, depto }) {
  const [f, setF] = useState({ ...EMPTY, ...r });
  const firma = JSON.stringify(r);
  useEffect(() => { if (r) setF({ ...EMPTY, ...r }); }, [firma]); // eslint-disable-line

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const commit = async (next = f) => {
    const data = {
      baja: next.baja.trim(), fecha: next.fecha, alta: next.alta.trim(),
      confirmado: !!next.confirmado && !!next.alta.trim(), obs: next.obs.trim(),
    };
    if (r?.id) {
      if (!data.baja) return setF({ ...EMPTY, ...r });
      if (Object.keys(data).some((k) => data[k] !== (r[k] ?? EMPTY[k]))) await updateDoc(doc(db, "bajas", r.id), data);
    } else if (data.baja) {
      setF(EMPTY);
      await addDoc(COL, { ...data, depto, createdAt: serverTimestamp() });
    }
  };

  const borrar = () => {
    if (window.confirm(`¿Eliminar la baja de "${r.baja}"?`)) deleteDoc(doc(db, "bajas", r.id));
  };

  const txt = (k, ph) => (
    <input value={f[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} onBlur={() => commit()} />
  );
  const est = r?.id ? estado(f) : null;
  const d = r?.id ? dias(f) : null;

  return (
    <tr className={r?.id ? "" : "libre"}>
      <td>{txt("baja", "+ Nueva baja (apellido y nombre)")}</td>
      <td><input type="date" value={f.fecha} onChange={(e) => set("fecha", e.target.value)} onBlur={() => commit()} /></td>
      <td>{txt("alta", r?.id ? "(vacante)" : "")}</td>
      <td className="centro">
        <input
          type="checkbox" checked={f.confirmado} disabled={!f.alta.trim()}
          onChange={(e) => { const n = { ...f, confirmado: e.target.checked }; setF(n); commit(n); }}
        />
      </td>
      <td className="centro">{est && <span className={`tag ${claseEstado[est]}`}>{est}</span>}</td>
      <td className="centro dias">{d !== null ? `${d} d` : ""}</td>
      <td>{txt("obs", "")}</td>
      <td className="centro">{r?.id && <button className="x" title="Eliminar" onClick={borrar}>✕</button>}</td>
    </tr>
  );
}

export default function App() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [ver, setVer] = useState("Todos");
  const [importando, setImportando] = useState(false);

  useEffect(
    () => onSnapshot(COL, (s) => setRows(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => setError(e.message)),
    []
  );

  const porDepto = useMemo(() => {
    const m = Object.fromEntries(DEPTOS.map((d) => [d, []]));
    (rows || []).forEach((r) => (m[r.depto] ||= []).push(r));
    Object.values(m).forEach((l) => l.sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9") || a.baja.localeCompare(b.baja)));
    return m;
  }, [rows]);

  const cuenta = (l) => ({
    bajas: l.length,
    cubiertas: l.filter((r) => estado(r) === "Cubierto").length,
    aconfirmar: l.filter((r) => estado(r) === "A confirmar").length,
    vacantes: l.filter((r) => estado(r) === "Vacante").length,
  });
  const resumen = Object.keys(porDepto).map((d) => ({ depto: d, ...cuenta(porDepto[d]) }));
  const total = resumen.reduce(
    (t, x) => ({ bajas: t.bajas + x.bajas, cubiertas: t.cubiertas + x.cubiertas, aconfirmar: t.aconfirmar + x.aconfirmar, vacantes: t.vacantes + x.vacantes }),
    { bajas: 0, cubiertas: 0, aconfirmar: 0, vacantes: 0 }
  );

  const importar = async () => {
    setImportando(true);
    const b = writeBatch(db);
    SEED.forEach((r) => b.set(doc(COL), { ...r, createdAt: serverTimestamp() }));
    await b.commit();
    setImportando(false);
  };

  const exportar = () => {
    const reg = Object.entries(porDepto).flatMap(([d, l]) =>
      l.map((r) => ({
        "Departamento judicial": d, "Baja": r.baja, "Fecha de baja": fmt(r.fecha), "Alta": r.alta,
        "Confirmado": r.alta ? (r.confirmado ? "Sí" : "No") : "", "Estado": estado(r), "Observaciones": r.obs || "",
      }))
    );
    const res = [...resumen, { depto: "TOTAL", ...total }].map((x) => ({
      "Departamento judicial": x.depto, "Bajas": x.bajas, "Cubiertas (confirmadas)": x.cubiertas,
      "A confirmar": x.aconfirmar, "Cupos disponibles (vacantes)": x.vacantes,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reg), "Registro");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(res), "Resumen");
    XLSX.writeFile(wb, `control_subsidios_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const visible = (l) => (ver === "Todos" ? l : l.filter((r) => estado(r) === ver));

  return (
    <div className="app">
      <header>
        <h1>Control de subsidios</h1>
        <div className="acciones">
          <select value={ver} onChange={(e) => setVer(e.target.value)} aria-label="Filtrar">
            <option>Todos</option><option>Vacante</option><option>A confirmar</option><option>Cubierto</option>
          </select>
          <button onClick={exportar} disabled={!rows}>Exportar a Excel</button>
        </div>
      </header>

      {error && <p className="error">Error de Firestore: {error}</p>}
      {rows === null && !error && <p>Cargando…</p>}
      {rows && rows.length === 0 && (
        <p className="aviso">
          La base está vacía.{" "}
          <button onClick={importar} disabled={importando}>Importar los {SEED.length} registros iniciales</button>
        </p>
      )}

      <section>
        <h2>Resumen</h2>
        <table className="resumen">
          <thead>
            <tr><th>Departamento judicial</th><th>Bajas</th><th>Cubiertas</th><th>A confirmar</th><th>Cupos disponibles</th></tr>
          </thead>
          <tbody>
            {resumen.map((x) => (
              <tr key={x.depto} className={x.vacantes ? "conv" : ""}>
                <td><a href={`#d-${x.depto}`}>{x.depto}</a></td>
                <td>{x.bajas}</td><td>{x.cubiertas}</td><td>{x.aconfirmar}</td><td className="vac">{x.vacantes}</td>
              </tr>
            ))}
            <tr className="total">
              <td>TOTAL</td><td>{total.bajas}</td><td>{total.cubiertas}</td><td>{total.aconfirmar}</td><td className="vac">{total.vacantes}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {rows && DEPTOS.map((d) => (
        <section key={d} id={`d-${d}`}>
          <h2>{d} <small>{cuenta(porDepto[d]).vacantes} vacante(s)</small></h2>
          <div className="scroll">
            <table className="reg">
              <thead>
                <tr><th>Baja</th><th>Fecha de baja</th><th>Alta</th><th>Confirmado</th><th>Estado</th><th>Vacante hace</th><th>Observaciones</th><th></th></tr>
              </thead>
              <tbody>
                {visible(porDepto[d]).map((r) => <Fila key={r.id} r={r} depto={d} />)}
                <Fila key={`nuevo-${d}`} r={null} depto={d} />
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
