// Grab the elements from our HTML
const container = document.getElementById('seat-container');
const reserveBtn = document.getElementById('reserve-btn');
const statusText = document.getElementById('status');

// Define our event layout (e.g., 5 rows of 6 seats)
const rows = 5;
const cols = 6;
const totalSeats = rows * cols;

// 1. Generate the seats on the screen
for (let i = 0; i < totalSeats; i++) {
    const seat = document.createElement('div');
    seat.classList.add('seat');
    
    // Randomly mark roughly 20% of seats as already "occupied" for realism
    if (Math.random() < 0.2) {
        seat.classList.add('occupied');
    }

    // 2. Add click interaction to each seat
    seat.addEventListener('click', () => {
        // Only allow selection if the seat is NOT occupied
        if (!seat.classList.contains('occupied')) {
            seat.classList.toggle('selected');
            updateStatus();
        }
    });

    container.appendChild(seat);
}

// 3. Update the text showing how many seats are selected
function updateStatus() {
    const selectedSeats = document.querySelectorAll('.seat.selected');
    statusText.innerText = `You have selected ${selectedSeats.length} seat(s).`;
}

// 4. Handle the Checkout / Reserve button
reserveBtn.addEventListener('click', () => {
    const selectedSeats = document.querySelectorAll('.seat.selected');
    
    if (selectedSeats.length === 0) {
        alert("Please select at least one seat first!");
        return;
    }

    // Convert selected seats to occupied
    selectedSeats.forEach(seat => {
        seat.classList.remove('selected');
        seat.classList.add('occupied');
    });
    
    updateStatus();
    alert("Reservation confirmed! (Note: This is just a front-end demo)");
});