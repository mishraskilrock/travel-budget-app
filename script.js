let excelData = [];

// Load Excel
document.getElementById("fileInput").addEventListener("change", function (e) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const workbook = XLSX.read(e.target.result, { type: "binary" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    excelData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    populateCities();
  };
  reader.readAsBinaryString(e.target.files[0]);
});

// Utility to get unique values
function uniqueValues(column, filterFn) {
  return [...new Set(excelData.filter(filterFn).map(r => r[column]).filter(Boolean))];
}

// Populate City
function populateCities() {
  const city = document.getElementById("city");
  city.innerHTML = '<option value="">Select City</option>' +
    uniqueValues("City", () => true)
      .map(v => `<option>${v}</option>`)
      .join("");

  city.onchange = populateHotels;
}

// Populate Hotel
function populateHotels() {
  const cityVal = city.value;
  hotel.innerHTML = '<option value="">Select Hotel</option>' +
    uniqueValues("Hotel", r => r.City === cityVal)
      .map(v => `<option>${v}</option>`)
      .join("");

  room.innerHTML = plan.innerHTML = '<option>Select</option>';
  hotel.onchange = populateRooms;
}

// Populate Room
function populateRooms() {
  room.innerHTML = '<option value="">Select Room</option>' +
    uniqueValues("ROOM CATEGORY", r =>
      r.City === city.value &&
      r.Hotel === hotel.value
    ).map(v => `<option>${v}</option>`).join("");

  plan.innerHTML = '<option>Select Plan</option>';
  room.onchange = populatePlans;
}

// Populate Plan
function populatePlans() {
  plan.innerHTML = '<option value="">Select Plan</option>' +
    uniqueValues("PLAN", r =>
      r.City === city.value &&
      r.Hotel === hotel.value &&
      r["ROOM CATEGORY"] === room.value
    ).map(v => `<option>${v}</option>`).join("");
}

// Calculate Budget
function calculate() {
  const row = excelData.find(r =>
    r.City === city.value &&
    r.Hotel === hotel.value &&
    r["ROOM CATEGORY"] === room.value &&
    r.PLAN === plan.value
  );

  if (!row) {
    result.innerText = "❌ No matching data found";
    return;
  }

  const total =
    (Number(single.value) || 0) * Number(row.SINGLE) +
    (Number(double.value) || 0) * Number(row.DOUBLE) +
    (Number(extra.value) || 0) * Number(row["EXTRA PERSON"]);

  result.innerText = `Total Budget: ₹${total}`;
}

// Export PDF
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Travel Budget Summary", 10, 10);
  doc.text(`City: ${city.value}`, 10, 20);
  doc.text(`Hotel: ${hotel.value}`, 10, 30);
  doc.text(`Room: ${room.value}`, 10, 40);
  doc.text(`Plan: ${plan.value}`, 10, 50);
  doc.text(result.innerText, 10, 60);

  doc.save("Travel_Budget.pdf");
}