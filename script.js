const BASE_URL = "https://surudmahajan12-electronics.hf.space";

const endpoints = {
    dc: [
        "/dc/kcl-kvl",
        "/dc/series-parallel",
        "/dc/voltage-divider",
        "/dc/current-divider",
        "/dc/mesh",
        "/dc/nodal",
        "/dc/thevenin",
        "/dc/norton",
        "/dc/max-power"
    ],
    ac: [
        "/ac/waveform",
        "/ac/impedance",
        "/ac/rlc",
        "/ac/power",
        "/ac/resonance"
    ],
    machines: [
        "/machines/dc-motor",
        "/machines/induction-motor",
        "/machines/inverter",
        "/machines/ups",
        "/machines/smps",
        "/machines/batteries",
        "/machines/comparison"
    ],
    digital: [
        "/digital/convert",
        "/digital/binary-add",
        "/digital/binary-sub",
        "/digital/bcd",
        "/digital/gray"
    ],
    logic: [
        "/logic/truth-table",
        "/logic/simplify",
        "/logic/kmap",
        "/logic/universal-gates"
    ],
    combinational: [
        "/combinational/half-adder",
        "/combinational/full-adder",
        "/combinational/half-subtractor",
        "/combinational/full-subtractor",
        "/combinational/mux",
        "/combinational/demux",
        "/combinational/encoder",
        "/combinational/decoder",
        "/combinational/comparator"
    ]
};

const engineSelect = document.getElementById("engine");
const endpointSelect = document.getElementById("endpoint");

function loadEndpoints() {
    endpointSelect.innerHTML = "";
    endpoints[engineSelect.value].forEach(ep => {
        const opt = document.createElement("option");
        opt.value = ep;
        opt.textContent = ep;
        endpointSelect.appendChild(opt);
    });
}

engineSelect.addEventListener("change", loadEndpoints);
loadEndpoints();

async function callAPI() {
    const url = BASE_URL + endpointSelect.value;
    const payload = document.getElementById("payload").value;

    const method = endpointSelect.value.includes("dc-motor") ||
                   endpointSelect.value.includes("comparison") ||
                   endpointSelect.value.includes("batteries") ||
                   endpointSelect.value.includes("universal-gates")
                   ? "GET"
                   : "POST";

    const options = {
        method: method,
        headers: { "Content-Type": "application/json" }
    };

    if (method === "POST") {
        options.body = payload;
    }

    const res = await fetch(url, options);
    const data = await res.json();

    document.getElementById("response").textContent =
        JSON.stringify(data, null, 2);
}
