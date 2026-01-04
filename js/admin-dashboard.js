// admin-dashboard.js
// This file controls the Admin Dashboard page:
// - Verifies the logged-in user (from localStorage)
// - Blocks non-admins from accessing this page
// - Lists all users
// - Lets admin choose a board and set who can access it + what actions are allowed
// - Saves permissions to storage

(function () {
  // ===== 1) AUTH / ACCESS CHECKS =====

  // Read the currently logged-in user from localStorage
  const data = localStorage.getItem("currentUser");

  // If no user is logged in → go to login page
  if (!data) {
    window.location.href = "login-page.html";
    return;
  }

  // Convert stored JSON string into a real object
  const user = JSON.parse(data);

  // Only admins can open this page
  // If not admin → redirect to normal user dashboard
  if (user.role !== "admin") {
    window.location.href = "user-dashboard.html";
    return;
  }

  // ===== 2) SHOW WELCOME / LOGIN INFO =====

  // Show welcome message with admin name
  document.getElementById("welcomeMsg").textContent = "Welcome " + user.name;

  // Show login time (stored inside currentUser.loginTime)
  document.getElementById("loginInfo").textContent =
    "Login time: " + new Date(user.loginTime).toLocaleString();

  // ===== 3) SHOW USERS LIST =====

  // Fill the users list (UL) with all system users
  const ul = document.getElementById("usersList");
  ul.innerHTML = ""; // clear before adding

  for (let i = 0; i < USERS.length; i++) {
    const li = document.createElement("li");
    li.textContent = USERS[i].username + " (" + USERS[i].role + ")";
    ul.appendChild(li);
  }

  // ===== 4) LOAD BOARDS + PERMISSIONS =====

  // Boards come from your app storage (getBoards is assumed to exist)
  const boards = getBoards();

  // Permissions object for all boards (getPerms is assumed to exist)
  // Example structure:
  // perms[boardId] = { allowedUsers: [...], perms: { addCard: true/false, ... } }
  const perms = getPerms();

  // ===== 5) FILL BOARD SELECT DROPDOWN =====

  const select = document.getElementById("boardSelect");
  select.innerHTML = ""; // clear options first

  for (let i = 0; i < boards.length; i++) {
    const opt = document.createElement("option");
    opt.value = boards[i].id; // board id (used as key)
    opt.textContent = boards[i].name + " (" + boards[i].id + ")";
    select.appendChild(opt);
  }

  // ===== 6) RENDER ALLOWED USERS CHECKBOXES =====

  // Container where we will put checkboxes for allowed users
  const allowedBox = document.getElementById("allowedUsersBox");

  // This function creates checkboxes for normal users only (role === "user")
  // and checks them if the user is currently allowed for this board.
  function renderAllowedUsers(boardId) {
    allowedBox.innerHTML = ""; // clear old checkboxes

    for (let i = 0; i < USERS.length; i++) {
      // Only show normal users here (skip admins/managers/etc.)
      if (USERS[i].role !== "user") continue;

      const u = USERS[i];
      const row = document.createElement("div");

      // Create checkbox
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "allow_" + u.username;

      // Determine if this user is allowed for this board
      const allowedArr =
        perms[boardId] && perms[boardId].allowedUsers
          ? perms[boardId].allowedUsers
          : [];

      // Check the box if username exists in allowedUsers array
      cb.checked = allowedArr.indexOf(u.username) !== -1;

      // Create label next to checkbox
      const label = document.createElement("label");
      label.htmlFor = cb.id;
      label.textContent = " " + u.username;

      row.appendChild(cb);
      row.appendChild(label);
      allowedBox.appendChild(row);
    }
  }

  // ===== 7) PERMISSIONS CHECKBOXES (ACTIONS) =====

  // These checkboxes control what actions are allowed on the selected board
  const pAddCard = document.getElementById("pAddCard");
  const pAddList = document.getElementById("pAddList");
  const pMoveCard = document.getElementById("pMoveCard");
  const pDeleteCard = document.getElementById("pDeleteCard");

  // Load settings for a specific board into the UI (checkboxes)
  function loadBoardSettings(boardId) {
    // If this board has no permissions object yet, create a default one
    if (!perms[boardId]) {
      perms[boardId] = {
        allowedUsers: [],
        perms: {
          addCard: false,
          addList: false,
          moveCard: false,
          deleteCard: false
        }
      };
    }

    // Render allowed users checkboxes for this board
    renderAllowedUsers(boardId);

    // Load action permissions into the UI checkboxes
    pAddCard.checked = !!perms[boardId].perms.addCard;
    pAddList.checked = !!perms[boardId].perms.addList;
    pMoveCard.checked = !!perms[boardId].perms.moveCard;
    pDeleteCard.checked = !!perms[boardId].perms.deleteCard;
  }

  // When admin changes the selected board, load that board settings
  select.addEventListener("change", function () {
    loadBoardSettings(select.value);
  });

  // ===== 8) SAVE BUTTON =====

  document.getElementById("saveBtn").addEventListener("click", function () {
    const boardId = select.value;

    // Collect all checked users as allowed users for this board
    const allowed = [];
    for (let i = 0; i < USERS.length; i++) {
      if (USERS[i].role !== "user") continue;

      const uname = USERS[i].username;
      const cb = document.getElementById("allow_" + uname);

      if (cb && cb.checked) allowed.push(uname);
    }

    // Save allowed users array into perms object
    perms[boardId].allowedUsers = allowed;

    // Save action permissions into perms object
    perms[boardId].perms = {
      addCard: pAddCard.checked,
      addList: pAddList.checked,
      moveCard: pMoveCard.checked,
      deleteCard: pDeleteCard.checked
    };

    // Persist perms to storage (savePerms is assumed to exist)
    savePerms(perms);

    alert("Saved permissions for board " + boardId);
  });

  // ===== 9) INITIAL LOAD =====

  // Load settings for the first board in the dropdown (default selected)
  loadBoardSettings(select.value);

  // ===== 10) LOGOUT BUTTON =====

  document.getElementById("logoutBtn").addEventListener("click", function () {
    // Clear logged-in user from storage
    localStorage.removeItem("currentUser");

    // Go back to login page
    window.location.href = "login-page.html";
  });
})();
