(function () {

  // Get the login form element
  const form = document.querySelector(".login-form");

  // Get the message element (used to show errors like wrong login)
  const msg = document.getElementById("msg");

  // ==============================
  // CHECK IF USER IS ALREADY LOGGED IN
  // ==============================

  // Read saved user data from localStorage
  const saved = localStorage.getItem("currentUser");

  // If user data exists, the user is already logged in
  if (saved) {
    // Convert JSON string back into an object
    const u = JSON.parse(saved);

    // Redirect based on user role
    if (u.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "user-dashboard.html";
    }
  }

  // ==============================
  // HANDLE LOGIN FORM SUBMISSION
  // ==============================

  // Listen for submit event on the login form
  form.addEventListener("submit", function (e) {

    // Prevent page reload (default form behavior)
    e.preventDefault();

    // Clear any previous error message
    msg.textContent = "";

    // Get username input value
    const username = document.getElementById("username").value;

    // Get password input value
    const password = document.getElementById("password").value;

    // Try to find a matching user 
    const user = findUser(username, password);

  
    if (!user) {
      msg.textContent = "Wrong username or password!";
      return; 
    }

    // ==============================
    // SAVE LOGIN SESSION
    // ==============================

  
    const loginTime = new Date().toISOString();

    // Save user data in localStorage
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        username: user.username,
        name: user.name,
        role: user.role,
        loginTime: loginTime
      })
    );

    // ==============================
    // REDIRECT AFTER SUCCESSFUL LOGIN
    // ==============================

    // Admin goes to admin dashboard
    if (user.role === "admin") {
      window.location.href = "admin-dashboard.html";
    }
    // Normal user goes to user dashboard
    else {
      window.location.href = "user-dashboard.html";
    }
  });

})();
