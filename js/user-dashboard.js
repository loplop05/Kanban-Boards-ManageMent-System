// Immediately Invoked Function Expression (IIFE)
// Runs the script immediately and keeps variables/functions private
(function () {

  // ==============================
  // 1) CHECK LOGIN SESSION
  // ==============================

  // Read current logged-in user from localStorage
  const data = localStorage.getItem("currentUser");

  // If no user is saved => not logged in => go to login page
  if (!data) {
    window.location.href = "login-page.html";
    return; // stop running the rest of the code
  }

  // Convert saved JSON string into a JavaScript object
  const user = JSON.parse(data);

  // ==============================
  // 2) ROLE PROTECTION (ONLY USERS)
  // ==============================

  // This page is only for role "user"
  // If the logged-in person is not a user => redirect to admin page
  if (user.role !== "user") {
    window.location.href = "admin-dashboard.html";
    return;
  }

  // ==============================
  // 3) SHOW USER INFO IN THE PAGE
  // ==============================

  // Display welcome message using the user's name
  document.getElementById("welcomeMsg").textContent = "Welcome " + user.name;

  // Display login time (convert ISO string to readable local time)
  document.getElementById("loginInfo").textContent =
    "Login time: " + new Date(user.loginTime).toLocaleString();

  // ==============================
  // 4) LOAD USER BOARDS + RENDER THEM
  // ==============================

  // Get boards that this user is allowed to see (function exists elsewhere)
  const boards = getUserBoards(user);

  // Get the <ul> element where boards will be listed
  const ul = document.getElementById("boardsList");

  // Clear the list first (important when page reloads / re-renders)
  ul.innerHTML = "";

  // Loop through boards array and create a list row for each board
  for (let i = 0; i < boards.length; i++) {
    const b = boards[i]; // current board object (ex: {id, name, ...})

    // Create <li> row container
    const li = document.createElement("li");
    li.className = "board-row"; // for styling (CSS)

    // Create left section (board name + id)
    const left = document.createElement("div");
    left.textContent = b.name + " (" + b.id + ")";

    // Create "Open" button
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "Open";

    // When user clicks Open => go to boards page with boardId in URL
    btn.addEventListener("click", function () {
      goTo("boards.html?boardId=" + b.id);
    });

    // Add left section and button into the row
    li.appendChild(left);
    li.appendChild(btn);

    // Add row into the main list
    ul.appendChild(li);
  }

  // ==============================
  // 5) OPEN FIRST BOARD BUTTON
  // ==============================

  // If user clicks "Open First" => open first board if exists
  document.getElementById("openFirstBtn").addEventListener("click", function () {
    if (boards.length > 0) {
      goTo("boards.html?boardId=" + boards[0].id);
    }
  });

  // ==============================
  // 6) LOGOUT BUTTON
  // ==============================

  // Removes currentUser from localStorage and goes back to login page
  document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    window.location.href = "login-page.html";
  });

  // ==============================
  // 7) SMOOTH PAGE TRANSITION FUNCTION
  // ==============================

  // Adds fade-out animation class then redirects after 250ms
  
  function goTo(url) {
    document.body.classList.add("fade-out");
    setTimeout(function () {
      window.location.href = url;
    }, 250);
  }

})();
