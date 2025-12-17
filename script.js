let data = [];

fetch("rates.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    populateCities();
  });

function populateCities() {
  const city = document.getElementById("city");
  city.innerHTML = `<option value="">Select City</option>`;
  [...new Set(data.map(d => d.City))].forEach(c => {
    city.innerHTML += `<option>${c}</option>`;
  });
}

function populateHotels() {
  const city = document.getElementById("city").value;
  const hotel = document.getElementById("hotel");
  hotel.innerHTML = `<option value="">Select Hotel</option>`;
  document.getElementById("room").innerHTML = `<option value="">Select Room</option>`;
  document.getElementById("plan").innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(data.filter(d => d.City === city).map(d => d.Hotel))]
    .forEach(h => hotel.innerHTML += `<option>${h}</option>`);
}

function populateRooms() {
  const cityVal = document.getElementById("city").value;
  const hotelVal = document.getElementById("hotel").value;
  const room = document.getElementById("room");

  room.innerHTML = `<option value="">Select Room</option>`;
  document.getElementById("plan").innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(
    data
      .filter(d => d.City === cityVal && d.Hotel === hotelVal)
      .map(d => d["ROOM CATEGORY"])
  )].forEach(r => {
    room.innerHTML += `<option>${r}</option>`;
  });
}


function populatePlans() {
  const cityVal = city.value;
  const hotelVal = hotel.value;
  const roomVal = room.value;
  const plan = document.getElementById("plan");
  plan.innerHTML = `<option value="">Select Plan</option>`;

  [...new Set(
    data.filter(d =>
      d.City === cityVal &&
      d.Hotel === hotelVal &&
      d["ROOM CATEGORY"] === roomVal
    ).map(d => d.PLAN)
  )].forEach(p => plan.innerHTML += `<option>${p}</option>`);
}

function calculate() {
  const cityVal = city.value;
  const hotelVal = hotel.value;
  const roomVal = room.value;
  const planVal = plan.value;
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);

  if (!startDate.value || !endDate.value || end <= start) {
    alert("Please select valid dates");
    return;
  }

  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const r = data.find(d =>
    d.City === cityVal &&
    d.Hotel === hotelVal &&
    d["ROOM CATEGORY"] === roomVal &&
    d.PLAN === planVal
  );

  const perNight = r.DOUBLE + (2 * r["EXTRA PERSON"]);
  const total = perNight * nights;

  document.getElementById("result").innerHTML = `
    <h3>Travel Budget Summary</h3>
    <p><b>City:</b> ${r.City}</p>
    <p><b>Hotel:</b> ${r.Hotel}</p>
    <p><b>Room:</b> ${r["ROOM CATEGORY"]}</p>
    <p><b>Plan:</b> ${r.PLAN}</p>
    <p><b>Total Nights:</b> ${nights}</p>
    <p><b>Per Night Cost:</b> ₹${perNight}</p>
    <p><b>Total Budget:</b> <b>₹${total}</b></p>
  `;
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Travel Budget Summary", 20, 20);
  doc.text(document.getElementById("result").innerText, 20, 30);
  doc.save("Travel_Budget.pdf");
}

