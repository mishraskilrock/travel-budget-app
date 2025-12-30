/****************************************************
 * GLOBAL VARIABLES
 ****************************************************/
let data = [];
let travelSummary = [];

/****************************************************
 * DEBUG LOGGER
 ****************************************************/
function debug(msg, obj = "") {
  console.log(`[TravelApp DEBUG] ${msg}`, obj);
}

/****************************************************
 * SAFE ELEMENT GETTER
 ****************************************************/
function getVal(id, def = "") {
  const el = document.getElementById(id);
  return el ? el.value : def;
}

function getNum(id) {
  const el = document.getElementById(id);
  return el ? Number(el.value || 0) : 0;
}

/****************************************************
 * LOAD JSON DATA
 ****************************************************/
debug("Application loading...");

fetch("./rates.json")
  .then(res => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then(json => {
    if (!Array.isArray(json)) {
      throw new Error("rates.json must be an array");
    }
    data = json;
    debug("Rates loaded successfully", data.length);
    populateCities();
  })
  .catch(err => {
    console.error("[TravelApp ERROR] Failed to load rates.json", err);
    alert(
      "Rates could not be loaded.\n\n" +
      "Open DevTools → Console for exact error."
    );
  });

/****************************************************
 * DROPDOWNS
 ****************************************************/
function populateCities() {
  const city = document.getElementById("city");
  city.innerHTML = `<option value="">Select City</option>`;

  [...new Set(data.map(d => d.City).filter(Boolean))]
    .forEach(c => city.innerHTML += `<option>${c}</option>`);
}

function populateHotels() {
  const city = getVal("city");
  debug("Selected city:", city);

  const hotel = document.getElementById("hotel");
  hotel.innerHTML = `<option value="">Select Hotel</option>`;
  resetBelow("hotel");

  [...new Set(data.filter(d => d.City === city).map(d => d.Hotel))]
    .forEach(h => hotel.innerHTML += `<option>${h}</option>`);
}

function populateRooms() {
  const city = getVal("city");
  const hotel = getVal("hotel");
  debug("Selected hotel:", hotel);

  const room = document.getElementById("room");
  room.innerHTML = `<option value="">Select Room</option>`;
  resetBelow("room");

  [...new Set(
    data.filter(d => d.City === city && d.Hotel === hotel)
        .map(d => d["ROOM CATEGORY"])
  )].forEach(r => room.innerHTML += `<option>${r}</option>`);
}

function populatePlans() {
  const city = getVal("city");
  const hotel = getVal("hotel");
  const room = getVal("room");
  debug("Selected room:", room);

  const plan = document.getElementById("plan");
  plan.innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(
    data.filter(d =>
      d.City === city &&
      d.Hotel === hotel &&
      d["ROOM CATEGORY"] === room
    ).map(d => d.PLAN)
  )].forEach(p => plan.innerHTML += `<option>${p}</option>`);
}

/****************************************************
 * CALCULATE & ADD LOCATION
 ****************************************************/
function calculate() {
  const city = getVal("city");
  const hotel = getVal("hotel");
  const room = getVal("room");
  const plan = getVal("plan");

  const single = getNum("singleRooms");
  const double = getNum("doubleRooms");
  const extra  = getNum("extraPersons");

  const startDate = new Date(getVal("startDate"));
  const endDate   = new Date(getVal("endDate"));

  /*

  if (!city || !hotel || !room || !plan || !startDate || !endDate) {
    alert("Please complete all selections");
    return;
  }

  */

  const nights = Math.max(
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)), 1
  );

  const rate = data.find(d =>
    d.City === city &&
    d.Hotel === hotel &&
    d["ROOM CATEGORY"] === room &&
    d.PLAN === plan
  );

  if (!rate) {
    alert("Rate not found for selected combination");
    return;
  }

  const total =
    nights *
    (
      single * rate.SINGLE +
      double * rate.DOUBLE +
      extra  * rate["EXTRA PERSON"]
    );

  const summary = {
    city, hotel, room, plan,
    nights, single, double, extra,
    total
  };

  travelSummary.push(summary);
  debug("Location added:", summary);

  renderSummary();
  resetForm();
}

/****************************************************
 * SUMMARY
 ****************************************************/
function renderSummary() {
  const result = document.getElementById("result");
  let html = `<h3>Travel Budget Summary</h3>`;
  let grandTotal = 0;

  travelSummary.forEach((s, i) => {
    grandTotal += s.total;
    html += `
      <div class="summary-card">
        <h4>Location ${i + 1}: ${s.city}</h4>
        <p><b>Hotel:</b> ${s.hotel}</p>
        <p><b>Room:</b> ${s.room}</p>
        <p><b>Plan:</b> ${s.plan}</p>
        <p><b>Nights:</b> ${s.nights}</p>
        <p><b>Single Rooms:</b> ${s.single}</p>
        <p><b>Double Rooms:</b> ${s.double}</p>
        <p><b>Extra Persons:</b> ${s.extra}</p>
        <p><b>Location Total:</b> ₹${s.total.toLocaleString()}</p>
      </div>
    `;
  });

  html += `<h2>Grand Total: ₹${grandTotal.toLocaleString()}</h2>`;
  result.innerHTML = html;
}

/****************************************************
 * PDF
 ****************************************************/
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text("Travel Budget Summary", 20, y);
  y += 10;

  travelSummary.forEach((s, i) => {
    doc.setFontSize(12);
    doc.text(`Location ${i + 1}: ${s.city}`, 20, y); y += 7;
    doc.text(`Hotel: ${s.hotel}`, 20, y); y += 6;
    doc.text(`Room: ${s.room}`, 20, y); y += 6;
    doc.text(`Plan: ${s.plan}`, 20, y); y += 6;
    doc.text(`Nights: ${s.nights}`, 20, y); y += 6;
    doc.text(`Single: ${s.single}, Double: ${s.double}, Extra: ${s.extra}`, 20, y); y += 6;
    doc.text(`Total: ₹${s.total}`, 20, y); y += 10;
  });

  doc.save("Travel_Budget.pdf");
}

/****************************************************
 * EMAIL CONFIRM
 ****************************************************/
function confirmAndEmail() {
  const email = prompt("Enter email ID to confirm booking:");
  if (!email) return;

  const subject = "Travel Package Confirmation";
  const body = encodeURIComponent(
    "I agree with the travel quotation.\nPlease proceed with booking."
  );

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

/****************************************************
 * HELPERS
 ****************************************************/
function resetForm() {
  document.querySelectorAll("select, input").forEach(el => el.value = "");
}

function resetBelow(id) {
  if (id === "hotel") {
    document.getElementById("room").innerHTML = `<option value="">Select Room</option>`;
    document.getElementById("plan").innerHTML = `<option value="">Select Plan</option>`;
  }
  if (id === "room") {
    document.getElementById("plan").innerHTML = `<option value="">Select Plan</option>`;
  }
}


