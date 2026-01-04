function goTo(page) {
  document.body.classList.add("fade-out");
  setTimeout(function () {
    window.location.href = page;
  }, 450);
}

function requireLogin() {
  const saved = localStorage.getItem("currentUser");
  if (!saved) {
    goTo("login-page.html");
    return null;
  }
  return JSON.parse(saved);
}

/* basic boards data  */
const BOARDS = [
  {
    id: 1,
    name: "Board 1 - Tasks",
    lists: [
      { id: 101, title: "To Do", cards: [
        { id: 1001, title: "Finish report" },
        { id: 1002, title: "Send email" }
      ]},
      { id: 102, title: "Doing", cards: [
        { id: 1003, title: "UI Fix" }
      ]},
      { id: 103, title: "Done", cards: [
        { id: 1004, title: "Create login page" }
      ]}
    ]
  },
  {
    id: 2,
    name: "Board 2 - Project",
    lists: [
      { id: 201, title: "Backlog", cards: [
        { id: 2001, title: "Plan features" }
      ]},
      { id: 202, title: "In Progress", cards: [
        { id: 2002, title: "Build boards page" }
      ]},
      { id: 203, title: "Completed", cards: [
        { id: 2003, title: "Setup users" }
      ]}
    ]
  }
];

let draggedCardId = null;

const user = requireLogin();
if (user) {
  const perms = (user.role === "admin") ? null : getUserPermissions(user.username);

  document.getElementById("infoLine").textContent =
    "Logged in as: " + user.username + " (" + user.role + ")";

  // fill board dropdown
  const select = document.getElementById("boardSelect");
  select.innerHTML = "";

  // admin sees all boards, user sees only allowed boards
  for (let i = 0; i < BOARDS.length; i++) {
    const b = BOARDS[i];

    if (user.role !== "admin") {
      if (!perms[b.id]) continue;
    }

    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    select.appendChild(opt);
  }

  // if user has no boards
  if (select.options.length === 0) {
    document.getElementById("permLine").textContent = "No boards assigned to you.";
    document.getElementById("boardArea").innerHTML = "";
  } else {
    renderBoard(parseInt(select.value));
  }

  select.addEventListener("change", function () {
    renderBoard(parseInt(select.value));
  });

  document.getElementById("backBtn").addEventListener("click", function () {
    if (user.role === "admin") goTo("admin-dashboard.html");
    else goTo("user-dashboard.html");
  });

  document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("loginTime");
    goTo("login-page.html");
  });

  function userCan(boardId, action) {
    if (user.role === "admin") return true;
    if (!perms[boardId]) return false;
    return perms[boardId][action] === true;
  }

  function renderBoard(boardId) {
    const board = getBoardById(boardId);
    if (!board) return;

    // show permissions line
    if (user.role === "admin") {
      document.getElementById("permLine").textContent =
        "Admin: full access on all boards.";
    } else {
      const p = perms[boardId];
      document.getElementById("permLine").textContent =
        "Permissions: addCard=" + !!p.addCard +
        ", addList=" + !!p.addList +
        ", moveCard=" + !!p.moveCard +
        ", deleteCard=" + !!p.deleteCard;
    }

    const area = document.getElementById("boardArea");
    area.innerHTML = "";

    for (let i = 0; i < board.lists.length; i++) {
      const list = board.lists[i];

      const col = document.createElement("div");
      col.className = "list-col";

      const h = document.createElement("h2");
      h.textContent = list.title;
      col.appendChild(h);

      const dz = document.createElement("div");
      dz.className = "dropzone";
      dz.dataset.boardId = boardId;
      dz.dataset.listId = list.id;

      dz.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      dz.addEventListener("drop", function (e) {
        e.preventDefault();

        if (!userCan(boardId, "moveCard")) {
          alert("You are not allowed to move cards in this board.");
          return;
        }

        if (draggedCardId === null) return;

        moveCardToList(boardId, draggedCardId, list.id);
        renderBoard(boardId);
      });

      // cards
      for (let c = 0; c < list.cards.length; c++) {
        const card = list.cards[c];

        const cardDiv = document.createElement("div");
        cardDiv.className = "card-item";
        cardDiv.draggable = true;
        cardDiv.dataset.cardId = card.id;

        cardDiv.textContent = card.title;

        // show small ID badge
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "#" + card.id;
        cardDiv.appendChild(badge);

        cardDiv.addEventListener("dragstart", function () {
          draggedCardId = card.id;
        });

        cardDiv.addEventListener("dragend", function () {
          draggedCardId = null;
        });

        // delete on double click (if allowed)
        cardDiv.addEventListener("dblclick", function () {
          if (!userCan(boardId, "deleteCard")) {
            alert("You are not allowed to delete cards in this board.");
            return;
          }
          deleteCard(boardId, card.id);
          renderBoard(boardId);
        });

        dz.appendChild(cardDiv);
      }

      col.appendChild(dz);
      area.appendChild(col);
    }
  }

  function getBoardById(boardId) {
    for (let i = 0; i < BOARDS.length; i++) {
      if (BOARDS[i].id === boardId) return BOARDS[i];
    }
    return null;
  }

  function moveCardToList(boardId, cardId, targetListId) {
    const board = getBoardById(boardId);
    if (!board) return;

    let foundCard = null;

    // remove from old list
    for (let i = 0; i < board.lists.length; i++) {
      const list = board.lists[i];
      for (let c = 0; c < list.cards.length; c++) {
        if (list.cards[c].id === cardId) {
          foundCard = list.cards[c];
          list.cards.splice(c, 1);
          break;
        }
      }
      if (foundCard) break;
    }

    if (!foundCard) return;

    // add to new list
    for (let i = 0; i < board.lists.length; i++) {
      if (board.lists[i].id === targetListId) {
        board.lists[i].cards.push(foundCard);
        return;
      }
    }
  }

  function deleteCard(boardId, cardId) {
    const board = getBoardById(boardId);
    if (!board) return;

    for (let i = 0; i < board.lists.length; i++) {
      const list = board.lists[i];
      for (let c = 0; c < list.cards.length; c++) {
        if (list.cards[c].id === cardId) {
          list.cards.splice(c, 1);
          return;
        }
      }
    }
  }
}
