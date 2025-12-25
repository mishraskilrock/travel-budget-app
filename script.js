let data = [];
let trips = [];

fetch("rates.json")
  .then(res => res.json())
  .then(json => {
    if (Array.isArray(json)) {
      data = json;
    } else if (json["Hotel Rates"]) {
      data = json["Hotel Rates"];
    } else {
      alert("rates.json structure not valid");
      return;
    }
    populateCities();
  })
  .catch(err => {
    console.error(err);
    alert("Unable to load rates.json");
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

  [...new Set(
    data.filter(d => d.City === city.value).map(d => d.Hotel)
  )].forEach(h => hotel.innerHTML += `<option>${h}</option>`);
}

function populateRooms() {
  room.innerHTML = `<option value="">Select Room</option>`;

  [...new Set(
    data.filter(d =>
      d.City === city.value &&
      d.Hotel === hotel.value
    ).map(d => d["ROOM CATEGORY"])
  )].forEach(r => room.innerHTML += `<option>${r}</option>`);
}

function populatePlans() {
  extraCount.disabled = false;
  extraCount.value = 0;

  const r = data.find(d =>
    d.City === city.value &&
    d.Hotel === hotel.value &&
    d["ROOM CATEGORY"] === room.value
  );

  if (!r) return;

  if (r["EXTRA PERSON"] === null || r["EXTRA PERSON"] === "-" || isNaN(r["EXTRA PERSON"])) {
    extraCount.value = 0;
    extraCount.disabled = true;
  }
}

// BLACKOUT
function checkSupplement(row, start, end){
  if(!row["SUPPLEMENTARY"] || row["SUPP START DATE"]==="NaT") return 0;

  const s = new Date(row["SUPP START DATE"]);
  const e = new Date(row["SUPP END END"]);
  const inDate = new Date(start);
  const outDate = new Date(end);

  if(inDate <= e && outDate >= s){
    return Number(row["SUPPLEMENTARY"]) || 0;
  }
  return 0;
}

function addLocation() {

  if(!city.value || !hotel.value || !room.value || !plan.value){
    alert("Please select all fields");
    return;
  }

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
    d["ROOM CATEGORY"] === room.value
  );

  const single = Number(singleCount.value);
  const double = Number(doubleCount.value);
  const extra = Number(extraCount.value);

  let perNight =
    (single * (r.SINGLE || 0)) +
    (double * (r.DOUBLE || 0)) +
    (extra * (r["EXTRA PERSON"] || 0));

  let lunch = Number(r.LUNCH) || 0;
  let dinner = Number(r.DINNER) || 0;

  if(plan.value === "MP") perNight += dinner;
  if(plan.value === "AP") perNight += (lunch + dinner);

  let total = perNight * nights;

  total += checkSupplement(r, startDate.value, endDate.value);

  trips.push({
    city: r.City,
    hotel: r.Hotel,
    room: r["ROOM CATEGORY"],
    plan: plan.value,
    nights,
    start: startDate.value,
    end: endDate.value,
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
      <p>Stay: ${t.start} to ${t.end}</p>
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
  plan.value = "";
  singleCount.value = 0;
  doubleCount.value = 1;
  extraCount.value = 0;
  startDate.value = "";
  endDate.value = "";
}

// PDF
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const img = new Image();
  img.src = "https://raw.githubusercontent.com/mishraskilrock/travel-budget-app/main/Inland_logo.PNG";
  doc.addImage(img, "PNG", 10, 5, 40, 25);

  doc.text(result.innerText, 10, 40);

  let y = 120;
  doc.text("TERMS & CONDITIONS", 10, y);
  y += 10;
  doc.text("• Check-in 12 PM & Check-out 12 PM next day", 10, y);
  y += 8;
  doc.text("• One parking per room subject to availability", 10, y);
  y += 8;
  doc.text("• 50% advance on confirmation", 10, y);
  y += 8;
  doc.text("• Balance 2 days before check-in", 10, y);
  y += 8;
  doc.text("• Peak season supplement applicable", 10, y);
  y += 8;
  doc.text("• Govt taxes extra", 10, y);

  doc.save("Travel_Budget.pdf");
}

// EMAIL
function confirmBooking() {
  if (trips.length === 0) {
    alert("Please add at least one location");
    return;
  }

  downloadPDF();

  let body = "Dear Team,%0D%0A%0D%0A";
  body += "I agree with the below travel quotation:%0D%0A%0D%0A";

  trips.forEach((t, i) => {
    body += `Location ${i + 1}: ${t.city}%0D%0A`;
    body += `Hotel: ${t.hotel}%0D%0A`;
    body += `Stay: ${t.start} to ${t.end}%0D%0A`;
    body += `Budget: INR ${t.total}%0D%0A%0D%0A`;
  });

  body += "Please find attached PDF.%0D%0ARegards,%0D%0AClient";

  window.location.href =
    "mailto:abctravel@xyz.com" +
    "?subject=Travel Budget Confirmation" +
    "&body=" + body;
}
