export const DEPTOS = [
  "Azul", "Bahía Blanca 1", "Bahía Blanca 2", "Dolores", "Junín", "La Plata 1", "La Plata 2",
  "Lomas", "Mar del Plata", "Mercedes", "Morón", "Quilmes", "San Isidro", "San Martín",
  "San Nicolás", "Trenque Lauquen",
];

// Registros iniciales de la planilla (se importan con el botón, una sola vez).
const s = (depto, baja, fecha, alta = "", confirmado = false, obs = "") => ({ depto, baja, fecha, alta, confirmado, obs });
export const SEED = [
  s("Azul", "Baeza Cesar", "2026-06-01"),
  s("Azul", "Miranda Silvia", "2026-06-01"),
  s("Azul", "Montenegro Celeste", "2026-07-01"),
  s("Azul", "Brizuela Ana", "2026-08-01"),
  s("Azul", "Torres Ramiro", "2026-08-01", "Silva Gerardo", true),
  s("Azul", "De Lio", "2026-09-01", "Federico", true),
  s("Bahía Blanca 1", "Igoa Cesar", "2026-06-01"),
  s("Bahía Blanca 1", "Krog Ernesto", "2026-07-01"),
  s("Bahía Blanca 1", "Moriconi Laura", "2026-07-01", "Horuna"),
  s("Bahía Blanca 1", "Abaca Osvaldo", "2026-08-01", "Sanchez"),
  s("Bahía Blanca 1", "Gomez Alejandro", "2026-09-01", "Herrera Gabriel"),
  s("Bahía Blanca 1", "Sacarino Mibguel", "2026-08-01", "Lagun"),
  s("Bahía Blanca 1", "Lara Mayco Matias", "2026-09-01", "Herrera Chavez"),
  s("Bahía Blanca 2", "Sanchez Rocio", "2026-09-01", "Ullmann"),
  s("Bahía Blanca 2", "Wust Yamila", "2026-07-01"),
  s("Bahía Blanca 2", "Androbetto Mirta", "2026-07-01"),
  s("Bahía Blanca 2", "Babiuk", "2026-09-01", "Lacandia"),
  s("Dolores", "Ugartemendia", "2026-04-01", "Molina"),
  s("Dolores", "Fernandez Agustina", "", "Lagos Etcheverry", false, "Sin fecha de baja en la planilla original: completar."),
];
