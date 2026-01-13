
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

  handleExtraPersonRule();
}

function populatePlans() {
  plan.innerHTML = `<option value="">Select Plan</option>`;

  const r = data.find(d =>
    d.City === city.value &&
    d.Hotel === hotel.value &&
    d["ROOM CATEGORY"] === room.value
  );

  if (!r) return;

  if (r.LUNCH == null && r.DINNER == null) {
    plan.innerHTML += `<option value="CP" selected>CP</option>`;
    plan.disabled = true;
  } else {
    plan.disabled = false;
    plan.innerHTML += `<option>CP</option>`;
    plan.innerHTML += `<option>MP</option>`;
    plan.innerHTML += `<option>AP</option>`;
  }

  handleExtraPersonRule();
}

function handleExtraPersonRule() {
  const r = data.find(d =>
    d.City === city.value &&
    d.Hotel === hotel.value &&
    d["ROOM CATEGORY"] === room.value
  );

  if (!r) return;

  if (r["EXTRA PERSON"] == null || r["EXTRA PERSON"] === "-") {
    extraCount.value = 0;
    extraCount.disabled = true;
  } else {
    extraCount.disabled = false;
  }
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
    d["ROOM CATEGORY"] === room.value
  );

  const single = Number(singleCount.value);
  const double = Number(doubleCount.value);
  const extra = Number(extraCount.value);
  const selectedPlan = plan.value || r.PLAN;

  let perNight =
    (single * r.SINGLE) +
    (double * r.DOUBLE) +
    (extra * (r["EXTRA PERSON"] || 0));

  const persons = (single * 1) + (double * 2) + extra;

  if (selectedPlan === "MP") perNight += persons * (r.DINNER || 0);
  if (selectedPlan === "AP") perNight += persons * ((r.LUNCH || 0) + (r.DINNER || 0));

  let supplementaryPerNight = 0;
  if (r["SUPP START DATE"] && r["SUPP END END"] && r.SUPPLEMENTARY) {
    const ss = new Date(r["SUPP START DATE"]);
    const se = new Date(r["SUPP END END"]);
    if (start <= se && end >= ss) supplementaryPerNight = Number(r.SUPPLEMENTARY);
  }

  const total = (perNight + supplementaryPerNight) * nights;

  trips.push({
    city: r.City,
    hotel: r.Hotel,
    room: r["ROOM CATEGORY"],
    plan: selectedPlan,
    nights,
    startDate: startDate.value,
    endDate: endDate.value,
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
      <p><b>Dates:</b> ${t.startDate} to ${t.endDate}</p>
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
  plan.disabled = false;
  extraCount.disabled = false;
  singleCount.value = 0;
  doubleCount.value = 1;
  extraCount.value = 0;
  startDate.value = "";
  endDate.value = "";
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;

  const logo = new Image();
  logo.src = "Inland_logo.PNG";
  doc.addImage(logo, "PNG", 80, 5, 50, 20);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Travel Budget Summary", 105, 35, { align: "center" });

  y = 45;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  let grand = 0;

  trips.forEach((t, i) => {
    grand += t.total;
    doc.text(`Location ${i + 1}: ${t.city}`, 10, y); y += 5;
    doc.text(`Dates: ${t.startDate} to ${t.endDate}`, 10, y); y += 5;
    doc.text(`Hotel: ${t.hotel}`, 10, y); y += 5;
    doc.text(`Room: ${t.room} (${t.plan})`, 10, y); y += 5;
    doc.text(`Nights: ${t.nights}`, 10, y); y += 5;
    doc.text(`Budget: INR ${t.total}`, 10, y); y += 8;
  });

  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: INR ${grand}`, 10, y + 5);

  y += 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Terms & Conditions:", 10, y); y += 5;
  doc.text("• Check-in: 12:00 PM | Check-out: 12:00 PM next day", 10, y); y += 5;
  doc.text("• One parking per room subject to availability", 10, y); y += 5;
  doc.text("• 50% payment on confirmation, balance 2 days before check-in", 10, y); y += 5;
  doc.text("• Standard hotel cancellation policies apply", 10, y);

  doc.save("Travel_Budget.pdf");
}

function confirmBooking() {
  if (trips.length === 0) {
    alert("Please add at least one location");
    return;
  }
  downloadPDF();
}

let cabTrips = [];

function openTab(id){
  document.querySelectorAll(".tab-content").forEach(tab => tab.style.display="none");
  document.getElementById(id).style.display="block";

  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  event.target.classList.add("active");

  renderFinalSummary();
}

function calculateCab(){
  const type = cabType.value;
  const km = Number(cabKm.value);
  const days = Number(cabDays.value);

  if(!type || km <=0 || days<=0){
    alert("Enter valid cab details");
    return;
  }

  const sampleCity = data[0];
  const rate = sampleCity[type];

  const base = km * rate;
  const driver = 1000;
  const toll = 200;
  const total = base + driver + toll;

  cabTrips.push({
    type,
    km,
    days,
    rate,
    total
  });

  renderCabSummary();
  renderFinalSummary();
}

function renderCabSummary(){
  let html = `<h3>Cab Summary</h3>`;
  let total = 0;

  cabTrips.forEach((c,i)=>{
    total+=c.total;
    html+=`
    <hr>
    <p><b>Cab ${i+1}: ${c.type}</b></p>
    <p>KM: ${c.km}</p>
    <p>Days: ${c.days}</p>
    <p>Rate per KM: ₹${c.rate}</p>
    <p><b>Total: ₹${c.total}</b></p>`;
  });

  html+=`<hr><h4>Cab Grand Total: ₹${total}</h4>`;
  cabResult.innerHTML=html;
}

function renderFinalSummary(){
  let hotelTotal = trips.reduce((a,b)=>a+b.total,0);
  let cabTotal = cabTrips.reduce((a,b)=>a+b.total,0);
  let grand = hotelTotal + cabTotal;

  finalSummary.innerHTML = `
    <p><b>Hotel Total:</b> ₹${hotelTotal}</p>
    <p><b>Cab Total:</b> ₹${cabTotal}</p>
    <hr>
    <h3>Grand Total: ₹${grand}</h3>
  `;
}

function downloadCabPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Cab Budget Summary", 70, 20);

  let y=40;
  let total = 0;

  cabTrips.forEach((c,i)=>{
    total+=c.total;
    doc.text(`Cab ${i+1}: ${c.type}`,10,y); y+=6;
    doc.text(`KM: ${c.km}`,10,y); y+=6;
    doc.text(`Days: ${c.days}`,10,y); y+=6;
    doc.text(`Total: ₹${c.total}`,10,y); y+=10;
  });

  doc.text(`Grand Total: ₹${total}`,10,y+10);

  doc.save("Cab_Summary.pdf");
}

function downloadTotalPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Complete Travel Summary", 60, 20);

  let y=40;

  doc.text("Hotel Total: ₹" + trips.reduce((a,b)=>a+b.total,0),10,y);
  y+=10;
  doc.text("Cab Total: ₹" + cabTrips.reduce((a,b)=>a+b.total,0),10,y);
  y+=10;
  doc.text("---------------------------",10,y);
  y+=10;
  doc.text("Grand Total: ₹" + (trips.reduce((a,b)=>a+b.total,0)+cabTrips.reduce((a,b)=>a+b.total,0)),10,y);

  doc.save("Total_Travel_Summary.pdf");
}
