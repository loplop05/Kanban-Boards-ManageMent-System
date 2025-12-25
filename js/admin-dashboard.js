// admin-dashboard.js

(function () {
  const data = localStorage.getItem("currentUser");
  if (!data) {
    window.location.href = "login-page.html";
    return;
  }

  const user = JSON.parse(data);

  // only admin
  if (user.role !== "admin") {
    window.location.href = "user-dashboard.html";
    return;
  }

  document.getElementById("welcomeMsg").textContent = "Welcome " + user.name;
  document.getElementById("loginInfo").textContent =
    "Login time: " + new Date(user.loginTime).toLocaleString();

  // show users list
  const ul = document.getElementById("usersList");
  ul.innerHTML = "";
  for (let i = 0; i < USERS.length; i++) {
    const li = document.createElement("li");
    li.textContent = USERS[i].username + " (" + USERS[i].role + ")";
    ul.appendChild(li);
  }

  // board select
  const boards = getBoards();
  const perms = getPerms();

  const select = document.getElementById("boardSelect");
  select.innerHTML = "";
  for (let i = 0; i < boards.length; i++) {
    const opt = document.createElement("option");
    opt.value = boards[i].id;
    opt.textContent = boards[i].name + " (" + boards[i].id + ")";
    select.appendChild(opt);
  }

  // allowed users checkboxes (only normal users)
  const allowedBox = document.getElementById("allowedUsersBox");
  function renderAllowedUsers(boardId) {
    allowedBox.innerHTML = "";

    for (let i = 0; i < USERS.length; i++) {
      if (USERS[i].role !== "user") continue;

      const u = USERS[i];
      const row = document.createElement("div");

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "allow_" + u.username;

      // checked?
      const allowedArr = (perms[boardId] && perms[boardId].allowedUsers) ? perms[boardId].allowedUsers : [];
      cb.checked = allowedArr.indexOf(u.username) !== -1;

      const label = document.createElement("label");
      label.htmlFor = cb.id;
      label.textContent = " " + u.username;

      row.appendChild(cb);
      row.appendChild(label);
      allowedBox.appendChild(row);
    }
  }

  // permission checkboxes
  const pAddCard = document.getElementById("pAddCard");
  const pAddList = document.getElementById("pAddList");
  const pMoveCard = document.getElementById("pMoveCard");
  const pDeleteCard = document.getElementById("pDeleteCard");

  function loadBoardSettings(boardId) {
    // make sure exists
    if (!perms[boardId]) {
      perms[boardId] = {
        allowedUsers: [],
        perms: { addCard: false, addList: false, moveCard: false, deleteCard: false }
      };
    }

    renderAllowedUsers(boardId);

    pAddCard.checked = !!perms[boardId].perms.addCard;
    pAddList.checked = !!perms[boardId].perms.addList;
    pMoveCard.checked = !!perms[boardId].perms.moveCard;
    pDeleteCard.checked = !!perms[boardId].perms.deleteCard;
  }

  select.addEventListener("change", function () {
    loadBoardSettings(select.value);
  });

  document.getElementById("saveBtn").addEventListener("click", function () {
    const boardId = select.value;

    // allowed users
    const allowed = [];
    for (let i = 0; i < USERS.length; i++) {
      if (USERS[i].role !== "user") continue;
      const uname = USERS[i].username;
      const cb = document.getElementById("allow_" + uname);
      if (cb && cb.checked) allowed.push(uname);
    }

    perms[boardId].allowedUsers = allowed;
    perms[boardId].perms = {
      addCard: pAddCard.checked,
      addList: pAddList.checked,
      moveCard: pMoveCard.checked,
      deleteCard: pDeleteCard.checked
    };

    savePerms(perms);
    alert("Saved ✅");
  });

  // initial load
  loadBoardSettings(select.value);

  document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    window.location.href = "login-page.html";
  });
})();
