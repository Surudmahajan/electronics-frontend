<div id="phasor"></div>
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script>
function renderPhasor(data) {
  const traces = data.vectors.map(v => ({
    type: "scatterpolar",
    r: [0, v.magnitude],
    theta: [0, v.angle_deg],
    mode: "lines+text",
    name: v.label,
    text: ["", v.label],
    textposition: "top right"
  }));

  Plotly.newPlot("phasor", traces, {
    polar: { radialaxis: { visible: true } },
    showlegend: true
  });
}

// MOCK BACKEND RESPONSE (simulate API)
const response = {
  visual_type: "phasor",
  vectors: [
    { label: "V_R", magnitude: 120, angle_deg: 0 },
    { label: "V_L", magnitude: 80, angle_deg: 90 },
    { label: "V_C", magnitude: 50, angle_deg: -90 },
    { label: "V", magnitude: 230, angle_deg: 15 }
  ]
};

renderPhasor(response);
</script>
