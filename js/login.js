// login.js

(function () {
  const form = document.querySelector(".login-form");
  const msg = document.getElementById("msg");

  // already logged in?
  const saved = localStorage.getItem("currentUser");
  if (saved) {
    const u = JSON.parse(saved);
    if (u.role === "admin") window.location.href = "admin-dashboard.html";
    else window.location.href = "user-dashboard.html";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.textContent = "";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const user = findUser(username, password);
    if (!user) {
      msg.textContent = "Wrong username or password!";
      return;
    }

    const loginTime = new Date().toISOString();
    localStorage.setItem("currentUser", JSON.stringify({
      username: user.username,
      name: user.name,
      role: user.role,
      loginTime: loginTime
    }));

    if (user.role === "admin") window.location.href = "admin-dashboard.html";
    else window.location.href = "user-dashboard.html";
  });
})();
