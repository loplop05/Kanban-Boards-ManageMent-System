function saveSession(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("loginTime", new Date().toLocaleString());
}

function getSession() {
  const s = localStorage.getItem("currentUser");
  if (!s) return null;
  return JSON.parse(s);
}

function clearSession() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("loginTime");
  localStorage.removeItem("currentBoardId");
}

function requireLogin() {
  const u = getSession();
  if (!u) {
    window.location.href = "login-page.html";
    return null;
  }
  return u;
}


function enableTransitions() {
  document.body.classList.add("fade-in");

  const links = document.querySelectorAll("a[data-nav]");
  for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function (e) {
      e.preventDefault();
      const url = this.getAttribute("href");
      document.body.classList.remove("fade-in");
      document.body.classList.add("fade-out");
      setTimeout(function () {
        window.location.href = url;
      }, 450);
    });
  }
}
