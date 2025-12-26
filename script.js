/****************************************************
 * GLOBAL VARIABLES
 ****************************************************/
let data = [];
let travelSummary = [];
let locationCounter = 1;

/****************************************************
 * DEBUG LOGGER (VERY IMPORTANT)
 ****************************************************/
function debug(msg, obj = "") {
  console.log(`[TravelApp DEBUG] ${msg}`, obj);
}

/****************************************************
 * LOAD JSON DATA
 ****************************************************/
debug("Application loading...");

fetch("./rates.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    return response.json();
  })
  .then(json => {
  if (!Array.isArray(json)) {
    throw new Error("Invalid JSON structure: expected an array");
  }

  data = json;
  debug("Rates loaded successfully", data.length);
  populateCities();
})
  .catch(error => {
    console.error("[TravelApp ERROR] Failed to load rates.json", error);
    alert(
      "Rates could not be loaded.\n\n" +
      "Please check:\n" +
      "1. rates.json exists in repo root\n" +
      "2. JSON structure is { data: [...] }\n" +
      "3. Console for detailed error"
    );
  });

/****************************************************
 * DROPDOWN POPULATION FUNCTIONS
 ****************************************************/
function populateCities() {
  debug("Populating cities");
  const citySelect = document.getElementById("city");
  citySelect.innerHTML = `<option value="">Select City</option>`;

  [...new Set(data.map(d => d.City).filter(Boolean))].forEach(city => {
    citySelect.innerHTML += `<option>${city}</option>`;
  });
}

function populateHotels() {
  const city = document.getElementById("city").value;
  debug("Selected city:", city);

  const hotelSelect = document.getElementById("hotel");
  hotelSelect.innerHTML = `<option value="">Select Hotel</option>`;

  resetBelow("hotel");

  [...new Set(
    data.filter(d => d.City === city).map(d => d.Hotel)
  )].forEach(hotel => {
    hotelSelect.innerHTML += `<option>${hotel}</option>`;
  });
}

function populateRooms() {
  const city = document.getElementById("city").value;
  const hotel = document.getElementById("hotel").value;
  debug("Selected hotel:", hotel);

  const roomSelect = document.getElementById("room");
  roomSelect.innerHTML = `<option value="">Select Room</option>`;

  resetBelow("room");

  [...new Set(
    data.filter(d => d.City === city && d.Hotel === hotel)
        .map(d => d["ROOM CATEGORY"])
  )].forEach(room => {
    roomSelect.innerHTML += `<option>${room}</option>`;
  });
}

function populatePlans() {
  const city = cityVal();
  const hotel = hotelVal();
  const room = roomVal();

  debug("Selected room:", room);

  const planSelect = document.getElementById("plan");
  planSelect.innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(
    data.filter(d =>
      d.City === city &&
      d.Hotel === hotel &&
      d["ROOM CATEGORY"] === room
    ).map(d => d.PLAN)
  )].forEach(plan => {
    planSelect.innerHTML += `<option>${plan}</option>`;
  });
}

/****************************************************
 * CALCULATION LOGIC
 ****************************************************/
function calculate() {
  const city = cityVal();
  const hotel = hotelVal();
  const room = roomVal();
  const plan = planVal();

  const singleRooms = +document.getElementById("singleRooms").value || 0;
  const doubleRooms = +document.getElementById("doubleRooms").value || 0;
  const extraPersons = +document.getElementById("extraPersons").value || 0;

  const startDate = new Date(document.getElementById("startDate").value);
  const endDate = new Date(document.getElementById("endDate").value);

  if (!city || !hotel || !room || !plan || !startDate || !endDate) {
    alert("Please fill all required fields");
    return;
  }

  const nights = Math.max(
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
    1
  );

  const rate = data.find(d =>
    d.City === city &&
    d.Hotel === hotel &&
    d["ROOM CATEGORY"] === room &&
    d.PLAN === plan
  );

  if (!rate) {
    alert("Rate not found");
    return;
  }

  const total =
    nights *
    (
      singleRooms * rate.SINGLE +
      doubleRooms * rate.DOUBLE +
      extraPersons * rate["EXTRA PERSON"]
    );

  const summary = {
    city, hotel, room, plan,
    nights, singleRooms, doubleRooms, extraPersons,
    total
  };

  travelSummary.push(summary);
  debug("Location added:", summary);

  renderSummary();
  resetForm();
}

/****************************************************
 * SUMMARY RENDERING
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
        <p><b>Single Rooms:</b> ${s.singleRooms}</p>
        <p><b>Double Rooms:</b> ${s.doubleRooms}</p>
        <p><b>Extra Persons:</b> ${s.extraPersons}</p>
        <p><b>Location Total:</b> ₹${s.total.toLocaleString()}</p>
      </div>
    `;
  });

  html += `<h2>Total Budget: ₹${grandTotal.toLocaleString()}</h2>`;
  result.innerHTML = html;
}

/****************************************************
 * PDF DOWNLOAD
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
    doc.text(`Location ${i + 1}: ${s.city}`, 20, y); y += 8;
    doc.text(`Hotel: ${s.hotel}`, 20, y); y += 6;
    doc.text(`Room: ${s.room}`, 20, y); y += 6;
    doc.text(`Plan: ${s.plan}`, 20, y); y += 6;
    doc.text(`Nights: ${s.nights}`, 20, y); y += 6;
    doc.text(`Single: ${s.singleRooms}, Double: ${s.doubleRooms}, Extra: ${s.extraPersons}`, 20, y); y += 6;
    doc.text(`Total: ₹${s.total}`, 20, y); y += 10;
  });

  doc.save("Travel_Budget.pdf");
}

/****************************************************
 * CONFIRM & EMAIL (CLIENT SIDE SAFE)
 ****************************************************/
function confirmAndEmail() {
  const email = prompt("Enter your email ID to confirm booking:");
  if (!email) return;

  const subject = "Travel Package Confirmation";
  const body = encodeURIComponent(
    "I agree with the travel quotation.\n\nPlease find the attached budget PDF.\n\nThank you."
  );

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

/****************************************************
 * UTILITIES
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

const cityVal = () => document.getElementById("city").value;
const hotelVal = () => document.getElementById("hotel").value;
const roomVal = () => document.getElementById("room").value;
const planVal = () => document.getElementById("plan").value;

