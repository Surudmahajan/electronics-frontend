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

function loadProblems() {
    problemSelect.innerHTML = "";
    Object.keys(problems[domainSelect.value]).forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        problemSelect.appendChild(opt);
    });
    loadInputs();
}

function loadInputs() {
    inputsDiv.innerHTML = "";
    const problem = problems[domainSelect.value][problemSelect.value];

    problem.fields.forEach(f => {
        const label = document.createElement("label");
        label.textContent = f.label;

        const input = document.createElement("input");
        input.id = f.id;

        inputsDiv.appendChild(label);
        inputsDiv.appendChild(input);
    });
}

domainSelect.addEventListener("change", loadProblems);
problemSelect.addEventListener("change", loadInputs);

loadProblems();

async function solve() {
    const problem = problems[domainSelect.value][problemSelect.value];

    const equations = [
        document.getElementById("eq1").value,
        document.getElementById("eq2").value
    ];

    const variables = document
        .getElementById("vars")
        .value.split(",")
        .map(v => v.trim());

    const payload = { equations, variables };

    const res = await fetch(BASE_URL + problem.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    document.getElementById("output").textContent =
        JSON.stringify(data, null, 2);
}

