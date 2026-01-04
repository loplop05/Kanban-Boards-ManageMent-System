// ===== Session helpers (Login / Logout) =====

// Save the logged-in user into localStorage (so refresh won't log them out)
function saveSession(user) {
  // Store the whole user object (username, role, name, etc.)
  localStorage.setItem("currentUser", JSON.stringify(user));

  // Store login time separately (useful for showing "Login time:" on dashboard)
  localStorage.setItem("loginTime", new Date().toLocaleString());
}

// Read the logged-in user from localStorage
function getSession() {
  const s = localStorage.getItem("currentUser");

  // If nothing is stored → no one is logged in
  if (!s) return null;

  // Convert JSON string back to object
  return JSON.parse(s);
}

// Clear all session-related values (full logout)
function clearSession() {
  localStorage.removeItem("currentUser");     // user object
  localStorage.removeItem("loginTime");       // login timestamp
  localStorage.removeItem("currentBoardId");  // last opened board (optional)
}

// Protect pages that require authentication
// If not logged in → redirect to login page
function requireLogin() {
  const u = getSession();

  // If no user, block access
  if (!u) {
    window.location.href = "login-page.html";
    return null; // stop page logic if caller checks result
  }

  // Return user so the page can use it (name, role, etc.)
  return u;
}


// ===== Smooth page transitions (fade-in / fade-out) =====

// Enable transition animations when navigating between pages
function enableTransitions() {
  // When page loads, fade it in
  document.body.classList.add("fade-in");

  // Select only navigation links that you want animated
  // Example: <a href="user-dashboard.html" data-nav>Dashboard</a>
  const links = document.querySelectorAll("a[data-nav]");

  for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function (e) {
      e.preventDefault(); // stop instant navigation

      // Get destination URL from the link
      const url = this.getAttribute("href");

      // Start fade-out animation
      document.body.classList.remove("fade-in");
      document.body.classList.add("fade-out");

      // Wait until animation ends, then navigate
      setTimeout(function () {
        window.location.href = url;
      }, 450); // must match your CSS animation duration
    });
  }
}
