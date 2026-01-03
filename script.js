let data = [];
let trips = [];

fetch("rates.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    populateCities();
  });

function populateCities() {
  city.innerHTML = `<option value="">Select City</option>`;
  [...new Set(data.map(d => d.City))].forEach(c =>
    city.innerHTML += `<option>${c}</option>`
  );
}

function populateHotels() {
  hotel.innerHTML = `<option value="">Select Hotel</option>`;
  room.innerHTML = `<option value="">Select Room</option>`;
  plan.innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(data.filter(d => d.City === city.value).map(d => d.Hotel))]
    .forEach(h => hotel.innerHTML += `<option>${h}</option>`);
}

function populateRooms() {
  room.innerHTML = `<option value="">Select Room</option>`;
  plan.innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(
    data.filter(d =>
      d.City === city.value &&
      d.Hotel === hotel.value
    ).map(d => d["ROOM CATEGORY"])
  )].forEach(r => room.innerHTML += `<option>${r}</option>`);
}

function populatePlans() {
  plan.innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(
    data.filter(d =>
      d.City === city.value &&
      d.Hotel === hotel.value &&
      d["ROOM CATEGORY"] === room.value
    ).map(d => d.PLAN)
  )].forEach(p => plan.innerHTML += `<option>${p}</option>`);
}

function addLocation() {
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  if (!startDate.value || !endDate.value || end <= start) {
    alert("Please select valid dates");
    return;
  }

  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const r = data.find(d =>
    d.City === city.value &&
    d.Hotel === hotel.value &&
    d["ROOM CATEGORY"] === room.value &&
    d.PLAN === plan.value
  );

  const single = Number(singleCount.value);
  const double = Number(doubleCount.value);
  const extra = Number(extraCount.value);

  const perNight =
    (single * r.SINGLE) +
    (double * r.DOUBLE) +
    (extra * r["EXTRA PERSON"]);

  /* ===== BLACKOUT DAY / SUPPLEMENTARY LOGIC - START ===== */
  let supplementaryPerNight = 0;

  if (
    r["SUPP START DATE"] &&
    r["SUPP END END"] &&
    r.SUPPLEMENTARY
  ) {
    const suppStart = new Date(r["SUPP START DATE"]);
    const suppEnd = new Date(r["SUPP END END"]);

    // Check if booking dates overlap with blackout period
    if (start <= suppEnd && end >= suppStart) {
      supplementaryPerNight = Number(r.SUPPLEMENTARY);
    }
  }
  /* ===== BLACKOUT DAY / SUPPLEMENTARY LOGIC - END ===== */

  const total = (perNight + supplementaryPerNight) * nights;

  trips.push({
    city: r.City,
    hotel: r.Hotel,
    room: r["ROOM CATEGORY"],
    plan: r.PLAN,
    nights,
    single,
    double,
    extra,
    total
  });

  renderSummary();
  resetForm();
}

function renderSummary() {
  let html = `<h3>Travel Budget Summary</h3>`;
  let grand = 0;

  trips.forEach((t, i) => {
    grand += t.total;
    html += `
      <hr>
      <p><b>Location ${i + 1}: ${t.city}</b></p>
      <p>Hotel: ${t.hotel}</p>
      <p>Room: ${t.room} (${t.plan})</p>
      <p>Nights: ${t.nights}</p>
      <p>Single: ${t.single}, Double: ${t.double}, Extra: ${t.extra}</p>
      <p><b>Budget:</b> ₹${t.total}</p>
    `;
  });

  html += `<hr><h4>Grand Total: ₹${grand}</h4>`;
  result.innerHTML = html;
}

function resetForm() {
  city.selectedIndex = 0;
  hotel.innerHTML = `<option value="">Select Hotel</option>`;
  room.innerHTML = `<option value="">Select Room</option>`;
  plan.innerHTML = `<option value="">Select Plan</option>`;
  singleCount.value = 0;
  doubleCount.value = 1;
  extraCount.value = 0;
  startDate.value = "";
  endDate.value = "";
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(result.innerText, 10, 10);
  doc.save("Travel_Budget.pdf");
}

function confirmBooking() {
  if (trips.length === 0) {
    alert("Please add at least one location");
    return;
  }

  downloadPDF();

  let body = "Dear Team,%0D%0A%0D%0A";
  body += "I agree with the below travel quotation and would like to proceed with booking.%0D%0A%0D%0A";

  trips.forEach((t, i) => {
    body += `Location ${i + 1}: ${t.city}%0D%0A`;
    body += `Hotel: ${t.hotel}%0D%0A`;
    body += `Room: ${t.room} (${t.plan})%0D%0A`;
    body += `Nights: ${t.nights}%0D%0A`;
    body += `Single: ${t.single}, Double: ${t.double}, Extra: ${t.extra}%0D%0A`;
    body += `Budget: INR ${t.total}%0D%0A%0D%0A`;
  });

  body += "Please find attached PDF.%0D%0A%0D%0ARegards,%0D%0AClient";

  window.location.href =
    "mailto:abctravel@xyz.com" +
    "?subject=Travel Budget Confirmation" +
    "&body=" + body;
}
