// user-dashboard.js

(function () {
  const data = localStorage.getItem("currentUser");
  if (!data) {
    window.location.href = "login-page.html";
    return;
  }

  const user = JSON.parse(data);

  // only users
  if (user.role !== "user") {
    window.location.href = "admin-dashboard.html";
    return;
  }

  document.getElementById("welcomeMsg").textContent = "Welcome " + user.name;
  document.getElementById("loginInfo").textContent =
    "Login time: " + new Date(user.loginTime).toLocaleString();

  const boards = getUserBoards(user);
  const ul = document.getElementById("boardsList");
  ul.innerHTML = "";

  for (let i = 0; i < boards.length; i++) {
    const b = boards[i];

    const li = document.createElement("li");
    li.className = "board-row";

    const left = document.createElement("div");
    left.textContent = b.name + " (" + b.id + ")";

    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "Open";
    btn.addEventListener("click", function () {
      goTo("boards.html?boardId=" + b.id);
    });

    li.appendChild(left);
    li.appendChild(btn);
    ul.appendChild(li);
  }

  document.getElementById("openFirstBtn").addEventListener("click", function () {
    if (boards.length > 0) goTo("boards.html?boardId=" + boards[0].id);
  });

  document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    window.location.href = "login-page.html";
  });

  function goTo(url) {
    document.body.classList.add("fade-out");
    setTimeout(function () {
      window.location.href = url;
    }, 250);
  }
})();
