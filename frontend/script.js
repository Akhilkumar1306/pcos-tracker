// 🔐 CHECK LOGIN
if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}

// =======================
// SIGNUP
// =======================
function signup() {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    fetch("https://pcos-tracker-1.onrender.com/api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        window.location.href = "index.html";
    });
}

// =======================
// LOGIN
// =======================
function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    fetch("https://pcos-tracker-1.onrender.com/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";
        } else {
            alert(data.error);
        }
    });
}

// =======================
// LOGOUT
// =======================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

// =======================
// SAVE TASKS
// =======================
function saveTasks() {
    const today = new Date().toLocaleDateString('en-CA');
    const token = localStorage.getItem("token");

    const data = {
        date: today,
        exercise: document.getElementById("exercise").checked,
        medicine: document.getElementById("medicine").checked,
        diet: document.getElementById("diet").checked,
        water: document.getElementById("water").checked,
        sleep: document.getElementById("sleep").checked
    };

    fetch("https://pcos-tracker-1.onrender.com/api/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        alert("Saved successfully!");
        updateProgress();
        generateCalendar();
        calculateStreak();
    })
    .catch(() => alert("Error saving"));
}

// =======================
// PAGE LOAD
// =======================
window.onload = function () {
    loadToday();
    generateCalendar();
    calculateStreak();
};

// =======================
// GENERATE CALENDAR
// =======================
function generateCalendar() {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayBox = document.createElement("div");
        dayBox.classList.add("day");
        dayBox.innerText = day;
        calendar.appendChild(dayBox);
    }

    const token = localStorage.getItem("token");

    fetch("https://pcos-tracker-1.onrender.com/api/tasks", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(allData => {

        if (!Array.isArray(allData)) {
            console.log("❌ API ERROR:", allData);
            return;
        }

        const map = {};
        allData.forEach(d => {
            map[d.date] = d;
        });

        console.log("MAP:", map);

        const boxes = calendar.children;

        for (let i = 0; i < boxes.length; i++) {
            const day = i + 1;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const data = map[dateStr];

            if (data) {
                const allDone = Object.values(data)
                    .filter(v => typeof v === "boolean")
                    .every(v => v === true);

                boxes[i].classList.add(allDone ? "done" : "missed");
            }

            boxes[i].onclick = () => showDayDetails(dateStr);
        }
    });
}

// =======================
// SHOW DAY DETAILS
// =======================
function showDayDetails(dateStr) {
    const container = document.getElementById("dayDetails");
    const token = localStorage.getItem("token");

    fetch(`https://pcos-tracker-1.onrender.com/api/tasks/${dateStr}`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(d => {
        if (!d || !d.date) {
            container.innerHTML = `<p>No data for ${dateStr}</p>`;
            return;
        }

        container.innerHTML = `
            <h3>${dateStr}</h3>
            <p>Exercise: ${d.exercise ? "✔" : "❌"}</p>
            <p>Medicine: ${d.medicine ? "✔" : "❌"}</p>
            <p>Diet: ${d.diet ? "✔" : "❌"}</p>
            <p>Water: ${d.water ? "✔" : "❌"}</p>
            <p>Sleep: ${d.sleep ? "✔" : "❌"}</p>
        `;
    });
}

// =======================
// RESET
// =======================
function resetToday() {
    document.getElementById("exercise").checked = false;
    document.getElementById("medicine").checked = false;
    document.getElementById("diet").checked = false;
    document.getElementById("water").checked = false;
    document.getElementById("sleep").checked = false;

    updateProgress();
}

// =======================
// PROGRESS
// =======================
function updateProgress() {
    let total = 5;
    let count = 0;

    if (document.getElementById("exercise").checked) count++;
    if (document.getElementById("medicine").checked) count++;
    if (document.getElementById("diet").checked) count++;
    if (document.getElementById("water").checked) count++;
    if (document.getElementById("sleep").checked) count++;

    let percent = Math.round((count / total) * 100);

    document.getElementById("progressText").innerText = percent + "%";
    document.getElementById("progressFill").style.width = percent + "%";
}

// =======================
// STREAK
// =======================
function calculateStreak() {
    const token = localStorage.getItem("token");

    fetch("https://pcos-tracker-1.onrender.com/api/tasks", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(allData => {

        if (!Array.isArray(allData)) {
            console.log("❌ API ERROR:", allData);
            return;
        }

        const map = {};
        allData.forEach(d => {
            map[d.date] = d;
        });

        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);

            const dateStr = d.toLocaleDateString('en-CA');
            const data = map[dateStr];

            if (!data) break;

            const allDone = Object.values(data)
                .filter(v => typeof v === "boolean")
                .every(v => v === true);

            if (allDone) streak++;
            else break;
        }

        document.getElementById("streak").innerText = streak + " days";
    });
}

// =======================
// LOAD TODAY
// =======================
function loadToday() {
    const today = new Date().toLocaleDateString('en-CA');
    const token = localStorage.getItem("token");

    fetch(`https://pcos-tracker-1.onrender.com/api/tasks/${today}`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(data => {
        if (!data || !data.date) return;

        document.getElementById("exercise").checked = data.exercise;
        document.getElementById("medicine").checked = data.medicine;
        document.getElementById("diet").checked = data.diet;
        document.getElementById("water").checked = data.water;
        document.getElementById("sleep").checked = data.sleep;

        updateProgress();
    });
}

function showLoader() {
    document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}