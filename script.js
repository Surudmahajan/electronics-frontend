const BASE_URL = "https://surudmahajan12-electronics.hf.space";

const problems = {
    dc: {
        "KCL / KVL": {
            endpoint: "/dc/kcl-kvl",
            fields: [
                { id: "eq1", label: "Equation 1" },
                { id: "eq2", label: "Equation 2" },
                { id: "vars", label: "Variables (comma separated)" }
            ]
        }
    }
};

const domainSelect = document.getElementById("domain");
const problemSelect = document.getElementById("problem");
const inputsDiv = document.getElementById("inputs");
const output = document.getElementById("output");

function loadProblems() {
    problemSelect.innerHTML = "";

    const domainProblems = problems[domainSelect.value];
    const keys = Object.keys(domainProblems);

    keys.forEach((p, index) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        problemSelect.appendChild(opt);

        if (index === 0) {
            problemSelect.value = p; // force first selection
        }
    });

    loadInputs(); // now safe
}

function loadInputs() {
    inputsDiv.innerHTML = "";

    const problem =
        problems[domainSelect.value][problemSelect.value];

    problem.fields.forEach(f => {
        const label = document.createElement("label");
        label.textContent = f.label;

        const input = document.createElement("input");
        input.id = f.id;
        input.placeholder = f.label;

        inputsDiv.appendChild(label);
        inputsDiv.appendChild(input);
    });
}

domainSelect.addEventListener("change", loadProblems);
problemSelect.addEventListener("change", loadInputs);

// INITIAL LOAD
loadProblems();

async function solve() {
    const equations = [
        document.getElementById("eq1").value,
        document.getElementById("eq2").value
    ];

    const variables = document
        .getElementById("vars")
        .value.split(",")
        .map(v => v.trim());

    const payload = { equations, variables };

    const endpoint =
        problems[domainSelect.value][problemSelect.value].endpoint;

    const res = await fetch(BASE_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
}


