// boards.js

(function () {
  const data = localStorage.getItem("currentUser");
  if (!data) {
    window.location.href = "login-page.html";
    return;
  }
  const currentUser = JSON.parse(data);

  // read boardId from URL
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get("boardId");

  if (!boardId) {
    // if missing boardId just go back
    window.location.href = (currentUser.role === "admin") ? "admin-dashboard.html" : "user-dashboard.html";
    return;
  }

  // access check
  if (!canUserAccessBoard(currentUser, boardId)) {
    alert("You don't have access to this board !");
    window.location.href = (currentUser.role === "admin") ? "admin-dashboard.html" : "user-dashboard.html";
    return;
  }

  const boards = getBoards();
  let boardName = boardId;
  for (let i = 0; i < boards.length; i++) {
    if (boards[i].id === boardId) boardName = boards[i].name;
  }

  document.getElementById("boardTitle").textContent = boardName;
  document.getElementById("welcomeMsg").textContent = "Welcome " + currentUser.name;

  const actions = getBoardPermActions(currentUser, boardId);
  document.getElementById("permInfo").textContent =
    "Permissions: addCard=" + actions.addCard +
    ", addList=" + actions.addList +
    ", moveCard=" + actions.moveCard +
    ", deleteCard=" + actions.deleteCard;

  // buttons enable/disable by permission
  const addListBtn = document.getElementById("addListBtn");
  const addCardBtn = document.getElementById("addCardBtn");

  addListBtn.disabled = !actions.addList;
  addCardBtn.disabled = !actions.addCard;

  // board data stored per boardId
  // structure:
  // { lists: [ {title:"To Do", cards:[{id:"c1", text:"Design UI"}]} ] }
  const key = "BOARD_DATA_" + boardId;
  let boardData = localStorage.getItem(key);

  if (!boardData) {
    const starter = {
      lists: [
        { title: "To Do", cards: [{ id: "c1", text: "Design UI" }, { id: "c2", text: "Write report" }] },
        { title: "In Progress", cards: [{ id: "c3", text: "Fix bugs" }] },
        { title: "Done", cards: [{ id: "c4", text: "Setup database" }] }
      ]
    };
    localStorage.setItem(key, JSON.stringify(starter));
    boardData = JSON.stringify(starter);
  }

  const boardObj = JSON.parse(boardData);

  // render
  const boardArea = document.getElementById("boardArea");
  let draggingCardId = "";
  let draggingFromListIndex = -1;

  function save() {
    localStorage.setItem(key, JSON.stringify(boardObj));
  }

  function render() {
    boardArea.innerHTML = "";

    for (let i = 0; i < boardObj.lists.length; i++) {
      const col = document.createElement("div");
      col.className = "column";
      col.setAttribute("data-list-index", i);

      const h2 = document.createElement("h2");
      h2.textContent = boardObj.lists[i].title;
      col.appendChild(h2);

      // drop events only if moveCard allowed
      if (actions.moveCard) {
        col.addEventListener("dragover", function (e) { e.preventDefault(); col.classList.add("drag-over"); });
        col.addEventListener("dragleave", function () { col.classList.remove("drag-over"); });
        col.addEventListener("drop", function (e) {
          e.preventDefault();
          col.classList.remove("drag-over");
          const toIndex = parseInt(col.getAttribute("data-list-index"));

          if (!draggingCardId) return;
          if (draggingFromListIndex === -1) return;

          moveCard(draggingFromListIndex, toIndex, draggingCardId);
          draggingCardId = "";
          draggingFromListIndex = -1;
        });
      }

      // cards
      const cards = boardObj.lists[i].cards;
      for (let j = 0; j < cards.length; j++) {
        const c = cards[j];

        const cardDiv = document.createElement("div");
        cardDiv.className = "task";
        cardDiv.textContent = c.text;

        // draggable only if moveCard
        if (actions.moveCard) {
          cardDiv.draggable = true;
          cardDiv.addEventListener("dragstart", function () {
            draggingCardId = c.id;
            draggingFromListIndex = i;
          });
        }

        // delete on double click (only if deleteCard)
        if (actions.deleteCard) {
          cardDiv.addEventListener("dblclick", function () {
            const ok = confirm("Delete this card?");
            if (ok) {
              deleteCard(i, c.id);
            }
          });
        }

        col.appendChild(cardDiv);
      }

      boardArea.appendChild(col);
    }
  }

  function moveCard(fromListIndex, toListIndex, cardId) {
    if (fromListIndex === toListIndex) return;

    const fromCards = boardObj.lists[fromListIndex].cards;
    let moved = null;

    for (let i = 0; i < fromCards.length; i++) {
      if (fromCards[i].id === cardId) {
        moved = fromCards[i];
        fromCards.splice(i, 1);
        break;
      }
    }

    if (!moved) return;
    boardObj.lists[toListIndex].cards.push(moved);
    save();
    render();
  }

  function deleteCard(listIndex, cardId) {
    const cards = boardObj.lists[listIndex].cards;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].id === cardId) {
        cards.splice(i, 1);
        break;
      }
    }
    save();
    render();
  }

  addListBtn.addEventListener("click", function () {
    if (!actions.addList) return;
    const name = prompt("List title:");
    if (!name) return;
    boardObj.lists.push({ title: name, cards: [] });
    save();
    render();
  });

  addCardBtn.addEventListener("click", function () {
    if (!actions.addCard) return;
    const text = prompt("Card text:");
    if (!text) return;

    // choose list
    const listName = prompt("Add to which list? مثال: To Do");
    if (!listName) return;

    let idx = -1;
    for (let i = 0; i < boardObj.lists.length; i++) {
      if (boardObj.lists[i].title.toLowerCase() === listName.toLowerCase()) idx = i;
    }
    if (idx === -1) {
      alert("List not found. Write the exact list name.");
      return;
    }

    const newId = "c" + Math.floor(Math.random() * 100000);
    boardObj.lists[idx].cards.push({ id: newId, text: text });
    save();
    render();
  });

  document.getElementById("backBtn").addEventListener("click", function () {
    goTo((currentUser.role === "admin") ? "admin-dashboard.html" : "user-dashboard.html");
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

  render();
})();
