export const SCHEMAS = {

  /* =========================
     DC CIRCUITS
  ========================= */

  "dc:kcl-kvl": {
    title: "DC KCL / KVL",
    fields: [
      { name: "equations", label: "Equations (one per line)", type: "multiline" },
      { name: "variables", label: "Variables (comma separated)", type: "text" }
    ]
  },

  "dc:series-parallel": {
    title: "Series / Parallel Resistance",
    fields: [
      { name: "values", label: "Resistances (comma separated)", type: "text" }
    ]
  },

  "dc:voltage-divider": {
    title: "Voltage Divider",
    fields: [
      { name: "values", label: "Resistances (comma separated)", type: "text" },
      { name: "input_value", label: "Input Voltage (V)", type: "number" }
    ]
  },

  "dc:current-divider": {
    title: "Current Divider",
    fields: [
      { name: "values", label: "Resistances (comma separated)", type: "text" },
      { name: "input_value", label: "Input Current (A)", type: "number" }
    ]
  },

  "dc:mesh": {
    title: "DC Mesh Analysis",
    fields: [
      { name: "equations", label: "Mesh Equations (one per line)", type: "multiline" },
      { name: "variables", label: "Mesh Currents (comma separated)", type: "text" }
    ]
  },

  "dc:nodal": {
    title: "DC Nodal Analysis",
    fields: [
      { name: "equations", label: "Node Equations (one per line)", type: "multiline" },
      { name: "variables", label: "Node Voltages (comma separated)", type: "text" }
    ]
  },

  "dc:superposition": {
    title: "Superposition Theorem",
    fields: [
      { name: "equations", label: "Equations (one per line)", type: "multiline" },
      { name: "variables", label: "Variables (comma separated)", type: "text" }
    ]
  },

  "dc:thevenin": {
    title: "Thevenin Equivalent",
    fields: [
      { name: "voc", label: "Open Circuit Voltage Voc (V)", type: "number" },
      { name: "rth", label: "Thevenin Resistance Rth (Ω)", type: "number" }
    ]
  },

  "dc:norton": {
    title: "Norton Equivalent",
    fields: [
      { name: "voc", label: "Open Circuit Voltage Voc (V)", type: "number" },
      { name: "rth", label: "Thevenin Resistance Rth (Ω)", type: "number" }
    ]
  },

  "dc:max-power": {
    title: "Maximum Power Transfer",
    fields: [
      { name: "voc", label: "Open Circuit Voltage Voc (V)", type: "number" },
      { name: "rth", label: "Thevenin Resistance Rth (Ω)", type: "number" }
    ]
  },

  /* =========================
     AC CIRCUITS
  ========================= */

  "ac:waveform": {
    title: "Sinusoidal Waveform",
    fields: [
      { name: "peak", label: "Peak Voltage", type: "number" },
      { name: "frequency", label: "Frequency (Hz)", type: "number" },
      { name: "phase", label: "Phase (degrees)", type: "number" }
    ]
  },

  "ac:impedance": {
    title: "AC Impedance",
    fields: [
      { name: "r", label: "Resistance (Ω)", type: "number" },
      { name: "l", label: "Inductance (H)", type: "number" },
      { name: "c", label: "Capacitance (F)", type: "number" },
      { name: "frequency", label: "Frequency (Hz)", type: "number" }
    ]
  },

  "ac:rlc": {
    title: "RLC Circuit",
    fields: [
      { name: "r", label: "Resistance (Ω)", type: "number" },
      { name: "l", label: "Inductance (H)", type: "number" },
      { name: "c", label: "Capacitance (F)", type: "number" },
      { name: "frequency", label: "Frequency (Hz)", type: "number" }
    ]
  },

  "ac:power": {
    title: "AC Power",
    fields: [
      { name: "voltage", label: "Voltage (V)", type: "number" },
      { name: "current", label: "Current (A)", type: "number" },
      { name: "power_factor", label: "Power Factor", type: "number" }
    ]
  },

  "ac:resonance": {
    title: "Series Resonance",
    fields: [
      { name: "l", label: "Inductance (H)", type: "number" },
      { name: "c", label: "Capacitance (F)", type: "number" }
    ]
  },

  /* =========================
     DIGITAL BASICS
  ========================= */

  "digital:convert": {
    title: "Number System Conversion",
    fields: [
      { name: "number", label: "Number", type: "text" },
      { name: "from_base", label: "From Base", type: "number" },
      { name: "to_base", label: "To Base", type: "number" }
    ]
  },

  "digital:binary-add": {
    title: "Binary Addition",
    fields: [
      { name: "a", label: "Binary A", type: "text" },
      { name: "b", label: "Binary B", type: "text" }
    ]
  },

  "digital:binary-sub": {
    title: "Binary Subtraction",
    fields: [
      { name: "a", label: "Binary A", type: "text" },
      { name: "b", label: "Binary B", type: "text" }
    ]
  },

  "digital:bcd": {
    title: "BCD Conversion",
    fields: [
      { name: "binary", label: "Binary Number", type: "text" }
    ]
  },

  "digital:gray": {
    title: "Gray Code Conversion",
    fields: [
      { name: "binary", label: "Binary Number", type: "text" }
    ]
  },

  /* =========================
     LOGIC & BOOLEAN
  ========================= */

  "logic:truth-table": {
    title: "Truth Table",
    fields: [
      { name: "expression", label: "Boolean Expression", type: "text" },
      { name: "variables", label: "Variables (comma separated)", type: "text" }
    ]
  },

  "logic:simplify": {
    title: "Boolean Simplification",
    fields: [
      { name: "expression", label: "Boolean Expression", type: "text" },
      { name: "variables", label: "Variables (comma separated)", type: "text" }
    ]
  },

  "logic:kmap": {
    title: "K-Map",
    fields: [
      { name: "variables", label: "Variables (comma separated)", type: "text" },
      { name: "minterms", label: "Minterms (comma separated)", type: "text" }
    ]
  },

  /* =========================
     COMBINATIONAL CIRCUITS
  ========================= */

  "combinational:half-adder": {
    title: "Half Adder",
    fields: [
      { name: "a", label: "Input A (0 or 1)", type: "number" },
      { name: "b", label: "Input B (0 or 1)", type: "number" }
    ]
  },

  "combinational:full-adder": {
    title: "Full Adder",
    fields: [
      { name: "a", label: "Input A (0 or 1)", type: "number" },
      { name: "b", label: "Input B (0 or 1)", type: "number" }
    ]
  },

  "combinational:half-subtractor": {
    title: "Half Subtractor",
    fields: [
      { name: "a", label: "Input A", type: "number" },
      { name: "b", label: "Input B", type: "number" }
    ]
  },

  "combinational:full-subtractor": {
    title: "Full Subtractor",
    fields: [
      { name: "a", label: "Input A", type: "number" },
      { name: "b", label: "Input B", type: "number" }
    ]
  },

  "combinational:mux": {
    title: "Multiplexer",
    fields: [
      { name: "inputs", label: "Inputs (comma separated)", type: "text" },
      { name: "select", label: "Select Line Index", type: "number" }
    ]
  },

  "combinational:demux": {
    title: "Demultiplexer",
    fields: [
      { name: "inputs", label: "Number of Outputs", type: "number" },
      { name: "select", label: "Select Line Index", type: "number" }
    ]
  },

  "combinational:encoder": {
    title: "Encoder",
    fields: [
      { name: "inputs", label: "Inputs (comma separated)", type: "text" }
    ]
  },

  "combinational:decoder": {
    title: "Decoder",
    fields: [
      { name: "inputs", label: "Number of Outputs", type: "number" },
      { name: "select", label: "Select Line Index", type: "number" }
    ]
  },

  "combinational:comparator": {
    title: "Comparator",
    fields: [
      { name: "a", label: "Input A", type: "number" },
      { name: "b", label: "Input B", type: "number" }
    ]
  }

};
