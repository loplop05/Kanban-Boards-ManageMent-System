// boards.js

// IIFE: Immediately Invoked Function Expression
// runs immediately and keeps variables private (no global pollution)
(function () {

  // ==============================
  // 1) CHECK LOGIN SESSION
  // ==============================

  // Get current user session from localStorage
  const data = localStorage.getItem("currentUser");

  // If no user is saved => not logged in => redirect to login
  if (!data) {
    window.location.href = "login-page.html";
    return; 
  }

  // Convert saved string JSON to JS object
  const currentUser = JSON.parse(data);

  // ==============================
  // 2) READ boardId FROM URL
  // ==============================

  // Example URL: boards.html?boardId=123
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get("boardId"); // gets "123" from URL

  // If user opened boards.html without boardId => go back to dashboard
  if (!boardId) {
    window.location.href = (currentUser.role === "admin")
      ? "admin-dashboard.html"
      : "user-dashboard.html";
    return;
  }

  // ==============================
  // 3) ACCESS CONTROL (SECURITY CHECK)
  // ==============================

  
  if (!canUserAccessBoard(currentUser, boardId)) {
    alert("You don't have access to this board !");
    window.location.href = (currentUser.role === "admin")
      ? "admin-dashboard.html"
      : "user-dashboard.html";
    return;
  }

  // ==============================
  // 4) GET BOARD NAME FOR TITLE
  // ==============================

  // Get all boards list 
  const boards = getBoards();

 
  // If we find the board in boards[], use its real name
  let boardName = boardId;
  for (let i = 0; i < boards.length; i++) {
    if (boards[i].id === boardId) boardName = boards[i].name;
  }

  // Show board title + welcome message
  document.getElementById("boardTitle").textContent = boardName;
  document.getElementById("welcomeMsg").textContent = "Welcome " + currentUser.name;

  // ==============================
  // 5) GET PERMISSIONS (WHAT CAN USER DO?)
  // ==============================

  // actions object example:
  // { addCard:true, addList:false, moveCard:true, deleteCard:false }
  const actions = getBoardPermActions(currentUser, boardId);

  // Display permissions info in UI for debugging / clarity
  document.getElementById("permInfo").textContent =
    "Permissions: addCard=" + actions.addCard +
    ", addList=" + actions.addList +
    ", moveCard=" + actions.moveCard +
    ", deleteCard=" + actions.deleteCard;

  // ==============================
  // 6) ENABLE/DISABLE BUTTONS BASED ON PERMISSIONS
  // ==============================

  const addListBtn = document.getElementById("addListBtn");
  const addCardBtn = document.getElementById("addCardBtn");

  // If user doesn't have permission -> disable button
  addListBtn.disabled = !actions.addList;
  addCardBtn.disabled = !actions.addCard;

  // ==============================
  // 7) LOAD BOARD DATA (FROM localStorage)
  // ==============================

  // Each board has its own saved data key:
  // BOARD_DATA_<boardId>
  const key = "BOARD_DATA_" + boardId;

  // Read stored data
  let boardData = localStorage.getItem(key);

  // If no data exists yet => create starter sample data and save it
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

  // Convert saved board JSON into JS object we can edit
  const boardObj = JSON.parse(boardData);

  // ==============================
  // 8) RENDER BOARD UI + DRAG STATE
  // ==============================

  // Where we will render lists + cards
  const boardArea = document.getElementById("boardArea");

  // These variables store drag info (used for moving cards)
  let draggingCardId = "";
  let draggingFromListIndex = -1;

  // Save current boardObj back into localStorage
  function save() {
    localStorage.setItem(key, JSON.stringify(boardObj));
  }

  // Build UI (lists and cards) based on boardObj
  function render() {
    // clear old UI first
    boardArea.innerHTML = "";

    // Loop lists
    for (let i = 0; i < boardObj.lists.length; i++) {

      // Create list column container
      const col = document.createElement("div");
      col.className = "column";

      // Store the list index in HTML so we can read it on drop
      col.setAttribute("data-list-index", i);

      // List title
      const h2 = document.createElement("h2");
      h2.textContent = boardObj.lists[i].title;
      col.appendChild(h2);

      // ==============================
      // 9) DROP EVENTS (ONLY IF moveCard IS ALLOWED)
      // ==============================

      if (actions.moveCard) {
        // allow dropping by preventing default
        col.addEventListener("dragover", function (e) {
          e.preventDefault();
          col.classList.add("drag-over"); // visual effect
        });

        // remove hover effect when leaving column
        col.addEventListener("dragleave", function () {
          col.classList.remove("drag-over");
        });

        // when user drops card into this column
        col.addEventListener("drop", function (e) {
          e.preventDefault();
          col.classList.remove("drag-over");

          // destination list index from attribute
          const toIndex = parseInt(col.getAttribute("data-list-index"));

          // safety checks
          if (!draggingCardId) return;
          if (draggingFromListIndex === -1) return;

          // Move the card
          moveCard(draggingFromListIndex, toIndex, draggingCardId);

          // reset drag state
          draggingCardId = "";
          draggingFromListIndex = -1;
        });
      }

      // ==============================
      // 10) RENDER CARDS INSIDE EACH LIST
      // ==============================

      const cards = boardObj.lists[i].cards;

      for (let j = 0; j < cards.length; j++) {
        const c = cards[j];

        // Create card element
        const cardDiv = document.createElement("div");
        cardDiv.className = "task";
        cardDiv.textContent = c.text;

        // Draggable only if moveCard permission is true
        if (actions.moveCard) {
          cardDiv.draggable = true;

          // When drag starts, remember which card + which list it came from
          cardDiv.addEventListener("dragstart", function () {
            draggingCardId = c.id;
            draggingFromListIndex = i;
          });
        }

        // Delete card on DOUBLE CLICK only if deleteCard allowed
        if (actions.deleteCard) {
          cardDiv.addEventListener("dblclick", function () {
            const ok = confirm("Delete this card?");
            if (ok) {
              deleteCard(i, c.id);
            }
          });
        }

        // Add card to column
        col.appendChild(cardDiv);
      }

      // Add column to board area
      boardArea.appendChild(col);
    }
  }

  // ==============================
  // 11) MOVE CARD FUNCTION
  // ==============================

  function moveCard(fromListIndex, toListIndex, cardId) {
    // If dropped in same list, do nothing
    if (fromListIndex === toListIndex) return;

    // cards array in the FROM list
    const fromCards = boardObj.lists[fromListIndex].cards;

    // will hold the moved card object
    let moved = null;

    // find card by id, remove it from fromCards
    for (let i = 0; i < fromCards.length; i++) {
      if (fromCards[i].id === cardId) {
        moved = fromCards[i];
        fromCards.splice(i, 1); // remove from original list
        break;
      }
    }

    // if card not found, stop
    if (!moved) return;

    // push card into destination list
    boardObj.lists[toListIndex].cards.push(moved);

    // save + re-render
    save();
    render();
  }

  // ==============================
  // 12) DELETE CARD FUNCTION
  // ==============================

  function deleteCard(listIndex, cardId) {
    const cards = boardObj.lists[listIndex].cards;

    // find card by id and remove it
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].id === cardId) {
        cards.splice(i, 1);
        break;
      }
    }

    // save + re-render
    save();
    render();
  }

  // ==============================
  // 13) ADD LIST BUTTON
  // ==============================

  addListBtn.addEventListener("click", function () {
    // permission check (extra safety)
    if (!actions.addList) return;

    // ask user for list title
    const name = prompt("List title:");
    if (!name) return;

    // add new empty list
    boardObj.lists.push({ title: name, cards: [] });

    save();
    render();
  });

  // ==============================
  // 14) ADD CARD BUTTON
  // ==============================

  addCardBtn.addEventListener("click", function () {
    if (!actions.addCard) return;

    // ask card text
    const text = prompt("Card text:");
    if (!text) return;

    // ask user where to add the card
    const listName = prompt("Add to which list? مثال: To Do");
    if (!listName) return;

    // find list index by title (case-insensitive)
    let idx = -1;
    for (let i = 0; i < boardObj.lists.length; i++) {
      if (boardObj.lists[i].title.toLowerCase() === listName.toLowerCase()) {
        idx = i;
      }
    }

    // list not found
    if (idx === -1) {
      alert("List not found. Write the exact list name.");
      return;
    }

    // generate random id for card
    const newId = "c" + Math.floor(Math.random() * 100000);

    // add card into the list
    boardObj.lists[idx].cards.push({ id: newId, text: text });

    save();
    render();
  });

  // ==============================
  // 15) BACK BUTTON
  // ==============================

  document.getElementById("backBtn").addEventListener("click", function () {
    goTo((currentUser.role === "admin") ? "admin-dashboard.html" : "user-dashboard.html");
  });

  // ==============================
  // 16) LOGOUT BUTTON
  // ==============================

  document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    window.location.href = "login-page.html";
  });

  // ==============================
  // 17) PAGE TRANSITION HELPER
  // ==============================


  function goTo(url) {
    document.body.classList.add("fade-out");
    setTimeout(function () {
      window.location.href = url;
    }, 250);
  }

  // First render when page loads
  render();

})();
