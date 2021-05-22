var chartOptions = {
  container: document.querySelector("#peakFlowChart"),
  autoSize: true,
  title: {
    text: "Peak Flow Stats for period",
    fontSize: 18,
  },
  subtitle: {
    text: "",
  },
  series: [
    {
      type: "line",
      xKey: "DateNumber",
      yKey: "AVGMeanValue",
      stroke: "#01c185",
      marker: {
        stroke: "#01c185",
        fill: "#01c185",
      },
      tooltip: {
        renderer: (el) => {
          return `<div class="ag-chart-tooltip-title">${
            el.datum.DateLabel
          }</div><div class="ag-chart-tooltip-content">${Math.round(el.datum.AVGMeanValue)}</div>`;
        },
      },
    },
  ],
  axes: [
    {
      position: "bottom",
      type: "time",
      title: {
        text: "Date",
      },
      tick: {
        count: agCharts.time.month,
      },
      label: {
        format: "%b %Y",
      },
    },
    {
      position: "left",
      type: "number",
      title: {
        text: "Average Mean Value",
      },
    },
  ],
};

// setup the grid after the page has finished loading
document.addEventListener("DOMContentLoaded", () => {
  const columnDefs = [
    { field: "MedicationName" },
    { field: "Instructions" },
    {
      field: "Fields",
      valueFormatter: (e) => {
        return JSON.stringify(e.value);
      },
    },
  ];
  const gridOptions = {
    columnDefs,
    defaultColDef: {
      width: "auto",
      resizable: true,
    },
    domLayout: "autoHeight",
  };

  var gridDiv = document.querySelector("#myGrid");
  new agGrid.Grid(gridDiv, gridOptions);

  // TABLE FROM MEDICATION
  fetch("https://graphqlmesh-dev.patientcloud.ai/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query {
          TinyMedicationRequest(PatientID: "SMART-665677") {
            MedicationName
            Instructions
            Fields(fields: ["dispenseRequest.quantity.unit", "medicationCodeableConcept.coding"])
          }
        }
        `,
    }),
  })
    .then((res) => res.json())
    .then(function (res) {
      gridOptions.api.setRowData(res.data.TinyMedicationRequest);
      gridOptions.api.sizeColumnsToFit();
    });

  // CHART FROM PEAK FLOW
  fetch("https://graphqlmesh-dev.patientcloud.ai/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query {
          TinyPeakFlowStats(PatientID: "SMART-665677", interval: { period: MONTH, range: 50 }, dateorder: DESC) {
            statsForPeriod {
              AVGMeanValue
              DateLabel
              DateNumber
            }
            statsAllTime {
              BestValue
              EIGHTYPCBestValue
              AVGMeanValue
            }
          }
        }
          `,
    }),
  })
    .then((res) => res.json())
    .then(function (res) {
      chartOptions.data = res.data.TinyPeakFlowStats.statsForPeriod.map((e) => {
        return { ...e, DateNumber: new Date(e.DateNumber.split("-").reverse().join("-")) };
      });
      var chart = agCharts.AgChart.create(chartOptions);
    });
});
