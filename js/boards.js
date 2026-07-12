// boards.js
// Modern Kanban Board Controller with rich interactive states, collapsible sidebar,
// search filters, drag & drop dropzones, and detailed card slide-over modal.

(function () {
  // ==========================================
  // 1) AUTH & SESSION SECURITY CHECKS
  // ==========================================
  const sessionData = localStorage.getItem("currentUser");
  if (!sessionData) {
    window.location.href = "login-page.html";
    return;
  }
  const currentUser = JSON.parse(sessionData);

  const params = new URLSearchParams(window.location.search);
  const boardId = params.get("boardId");

  if (!boardId) {
    window.location.href = (currentUser.role === "admin") ? "admin-dashboard.html" : "user-dashboard.html";
    return;
  }

  if (!canUserAccessBoard(currentUser, boardId)) {
    alert("Access Denied: You do not have permission to view this board.");
    window.location.href = (currentUser.role === "admin") ? "admin-dashboard.html" : "user-dashboard.html";
    return;
  }

  // ==========================================
  // 2) LAYOUT & COLLAPSIBLE SIDEBAR SETUP
  // ==========================================
  const sidebar = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebarToggle");
  const toggleIcon = document.getElementById("toggleIcon");
  const sidebarTexts = document.querySelectorAll(".sidebar-text");
  const sidebarBrand = document.getElementById("sidebarBrand");
  const userProfileInfo = document.getElementById("userProfileInfo");

  // Read sidebar state
  let isSidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

  function applySidebarState() {
    if (isSidebarCollapsed) {
      sidebar.classList.remove("w-64");
      sidebar.classList.add("w-20");
      toggleIcon.classList.add("rotate-180");
      sidebarTexts.forEach(el => el.classList.add("hidden"));
      sidebarBrand.classList.add("justify-center");
      sidebarBrand.querySelector("span")?.classList.add("hidden");
      userProfileInfo.classList.add("justify-center");
      userProfileInfo.querySelector(".flex-1")?.classList.add("hidden");
    } else {
      sidebar.classList.remove("w-20");
      sidebar.classList.add("w-64");
      toggleIcon.classList.remove("rotate-180");
      sidebarTexts.forEach(el => el.classList.remove("hidden"));
      sidebarBrand.classList.remove("justify-center");
      sidebarBrand.querySelector("span")?.classList.remove("hidden");
      userProfileInfo.classList.remove("justify-center");
      userProfileInfo.querySelector(".flex-1")?.classList.remove("hidden");
    }
  }

  sidebarToggleBtn.addEventListener("click", () => {
    isSidebarCollapsed = !isSidebarCollapsed;
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
    applySidebarState();
  });

  // Apply initial sidebar state
  applySidebarState();

  // Populate Current User Details in Sidebar
  const avatarMeta = getUserAvatarMeta(currentUser.username);
  const userAvatarEl = document.getElementById("currentUserAvatar");
  userAvatarEl.textContent = avatarMeta.initials;
  userAvatarEl.className = `w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ${avatarMeta.color}`;
  document.getElementById("currentUserName").textContent = currentUser.name;
  document.getElementById("currentUserRole").textContent = currentUser.role;

  // Initialize comments section avatar
  const commentAvatarEl = document.getElementById("commentInputAvatar");
  if (commentAvatarEl) {
    commentAvatarEl.textContent = avatarMeta.initials;
    commentAvatarEl.className = `w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${avatarMeta.color}`;
  }

  // Populate Sidebar Workspaces
  function renderWorkspaces() {
    const workspacesList = document.getElementById("workspacesList");
    workspacesList.innerHTML = "";
    const allowedBoards = getUserBoards(currentUser);

    allowedBoards.forEach(b => {
      const isActive = b.id === boardId;
      const btn = document.createElement("button");
      btn.className = `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all text-sm font-medium ${
        isActive 
          ? "bg-brand-600/10 border border-brand-500/20 text-brand-400" 
          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
      }`;
      btn.innerHTML = `
        <i data-lucide="layout-grid" class="w-4 h-4 shrink-0"></i>
        <span class="sidebar-text truncate">${b.name}</span>
      `;
      btn.addEventListener("click", () => {
        window.location.href = `boards.html?boardId=${b.id}`;
      });
      workspacesList.appendChild(btn);
    });
  }
  renderWorkspaces();

  // Populate Sidebar Team Members
  function renderTeamMembers() {
    const list = document.getElementById("teamMembersList");
    list.innerHTML = "";
    
    USERS.forEach(u => {
      const meta = getUserAvatarMeta(u.username);
      const isMe = u.username === currentUser.username;
      
      const div = document.createElement("div");
      div.className = "flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all";
      div.innerHTML = `
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ${meta.color}">
          ${meta.initials}
        </div>
        <div class="flex-1 min-w-0 sidebar-text flex items-center justify-between">
          <span class="text-xs font-medium text-slate-300 truncate">${u.name} ${isMe ? "(You)" : ""}</span>
          <span class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
            u.role === 'admin' 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }">${u.role}</span>
        </div>
      `;
      list.appendChild(div);
    });
  }
  renderTeamMembers();


  // ==========================================
  // 3) DATA MIGRATION & SCHEMAS
  // ==========================================
  const boardsList = getBoards();
  let boardName = boardId;
  boardsList.forEach(b => {
    if (b.id === boardId) boardName = b.name;
  });

  document.getElementById("boardTitle").textContent = boardName;

  const actions = getBoardPermActions(currentUser, boardId);

  // Render permissions info in header
  const permInfo = document.getElementById("permInfo");
  permInfo.innerHTML = `
    <span class="flex items-center gap-1"><i data-lucide="${actions.addCard ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5 ${actions.addCard ? 'text-emerald-400' : 'text-rose-400'}"></i> Add Task</span>
    <span class="flex items-center gap-1"><i data-lucide="${actions.addList ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5 ${actions.addList ? 'text-emerald-400' : 'text-rose-400'}"></i> Add List</span>
    <span class="flex items-center gap-1"><i data-lucide="${actions.moveCard ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5 ${actions.moveCard ? 'text-emerald-400' : 'text-rose-400'}"></i> Drag Cards</span>
    <span class="flex items-center gap-1"><i data-lucide="${actions.deleteCard ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5 ${actions.deleteCard ? 'text-emerald-400' : 'text-rose-400'}"></i> Delete Task</span>
  `;

  // Board Data key in LocalStorage
  const key = "BOARD_DATA_" + boardId;
  let boardData = localStorage.getItem(key);

  // Default lists matching layout & architecture request
  const standardLists = ["Backlog", "In Progress", "Review", "Done"];

  // Helper to parse/migrate data structure
  function migrateBoardObj(dataString) {
    let parsed = null;
    try {
      parsed = JSON.parse(dataString);
    } catch (e) {
      parsed = null;
    }

    if (!parsed || !parsed.lists) {
      // Create new fresh schema
      parsed = {
        lists: standardLists.map(title => ({ title, cards: [] }))
      };
    }

    // Standardize columns to: Backlog, In Progress, Review, Done
    const migratedLists = standardLists.map(colTitle => {
      // Try to find if a column with this name (or equivalent) already exists
      let existingList = parsed.lists.find(l => l.title.toLowerCase() === colTitle.toLowerCase());
      
      // Legacy mapping support
      if (!existingList) {
        if (colTitle === "Backlog") {
          existingList = parsed.lists.find(l => l.title.toLowerCase() === "to do");
        } else if (colTitle === "Done") {
          existingList = parsed.lists.find(l => l.title.toLowerCase() === "completed");
        }
      }

      const cards = existingList ? existingList.cards : [];

      // Enforce full schemas on cards
      const mappedCards = cards.map(c => {
        return {
          id: c.id || "c" + Math.floor(Math.random() * 100000),
          title: c.title || c.text || "Untitled Task",
          desc: c.desc || "",
          priority: c.priority || "Low",
          tag: c.tag || "Feature",
          dueDate: c.dueDate || getFutureDate(5),
          assignee: c.assignee || USERS[Math.floor(Math.random() * USERS.length)].username,
          comments: c.comments || [],
          attachments: c.attachments || []
        };
      });

      return {
        title: colTitle,
        cards: mappedCards
      };
    });

    parsed.lists = migratedLists;
    return parsed;
  }

  // Set boardObj from storage/migration
  const boardObj = migrateBoardObj(boardData);

  function save() {
    localStorage.setItem(key, JSON.stringify(boardObj));
  }

  // Utility to calculate future date YYYY-MM-DD
  function getFutureDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  }


  // ==========================================
  // 4) DRAG AND DROP STATE
  // ==========================================
  let draggingCardId = null;
  let draggingFromListIndex = -1;

  // Search filter query
  let searchQuery = "";


  // ==========================================
  // 5) RENDER BOARD UI
  // ==========================================
  const boardArea = document.getElementById("boardArea");

  function render() {
    boardArea.innerHTML = "";
    let totalTasksCount = 0;

    for (let i = 0; i < boardObj.lists.length; i++) {
      const list = boardObj.lists[i];
      
      // Filter cards by search query
      const filteredCards = list.cards.filter(c => {
        const titleMatch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const tagMatch = c.tag.toLowerCase().includes(searchQuery.toLowerCase());
        const priorityMatch = c.priority.toLowerCase().includes(searchQuery.toLowerCase());
        const assigneeMatch = c.assignee.toLowerCase().includes(searchQuery.toLowerCase());
        return titleMatch || tagMatch || priorityMatch || assigneeMatch;
      });

      totalTasksCount += list.cards.length;

      // Column Container
      const col = document.createElement("div");
      col.className = "w-80 shrink-0 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/60 rounded-2xl flex flex-col max-h-[calc(100vh-180px)] column-zone overflow-hidden";
      col.setAttribute("data-list-index", i);

      // Column Header
      const header = document.createElement("div");
      header.className = "p-4 flex items-center justify-between border-b border-dark-700/20";
      header.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm text-white select-none">${list.title}</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 select-none">${filteredCards.length}</span>
        </div>
      `;
      col.appendChild(header);

      // Dropzone/Cards Container
      const dropzone = document.createElement("div");
      dropzone.className = "flex-1 overflow-y-auto p-3 space-y-3 transition-all";
      
      // Native drag-and-drop list listeners (only if moveCard allowed)
      if (actions.moveCard) {
        dropzone.addEventListener("dragover", e => {
          e.preventDefault();
        });

        dropzone.addEventListener("dragenter", e => {
          e.preventDefault();
          dropzone.classList.add("border-2", "border-dashed", "border-brand-500/40", "bg-brand-500/5", "rounded-xl");
        });

        dropzone.addEventListener("dragleave", () => {
          dropzone.classList.remove("border-2", "border-dashed", "border-brand-500/40", "bg-brand-500/5", "rounded-xl");
        });

        dropzone.addEventListener("drop", e => {
          e.preventDefault();
          dropzone.classList.remove("border-2", "border-dashed", "border-brand-500/40", "bg-brand-500/5", "rounded-xl");

          const toIndex = parseInt(col.getAttribute("data-list-index"));
          if (draggingCardId === null || draggingFromListIndex === -1) return;

          moveCard(draggingFromListIndex, toIndex, draggingCardId);
          draggingCardId = null;
          draggingFromListIndex = -1;
        });
      }

      // Render filtered cards inside this column
      filteredCards.forEach(c => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "kanban-card bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-glass select-none relative group";
        cardDiv.setAttribute("data-card-id", c.id);

        if (actions.moveCard) {
          cardDiv.draggable = true;
          
          cardDiv.addEventListener("dragstart", () => {
            draggingCardId = c.id;
            draggingFromListIndex = i;
            cardDiv.classList.add("opacity-40", "dragging");
          });

          cardDiv.addEventListener("dragend", () => {
            cardDiv.classList.remove("opacity-40", "dragging");
            draggingCardId = null;
            draggingFromListIndex = -1;
          });
        }

        // Priority Badge styles
        let priorityClass = "";
        if (c.priority === "High") {
          priorityClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
        } else if (c.priority === "Medium") {
          priorityClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
        } else {
          priorityClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        }

        // Semantic Tag styles
        let tagClass = "";
        if (c.tag === "Bug") {
          tagClass = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
        } else if (c.tag === "Hotfix") {
          tagClass = "bg-red-500/10 text-red-400 border border-red-500/20";
        } else if (c.tag === "Refactor") {
          tagClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
        } else {
          // Feature
          tagClass = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
        }

        const assigneeAvatar = getUserAvatarMeta(c.assignee);

        cardDiv.innerHTML = `
          <!-- Card Badges -->
          <div class="flex items-center justify-between gap-1.5 mb-2.5">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${tagClass}">${c.tag}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${priorityClass}">${c.priority}</span>
            </div>
            <!-- Quick Edit Hover Controls -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 absolute right-3 top-3">
              ${
                actions.deleteCard 
                  ? `<button class="delete-quick-btn p-1 rounded-md bg-dark-800 text-rose-400 hover:text-white hover:bg-rose-600 transition-all shadow-md"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>`
                  : ""
              }
            </div>
          </div>

          <!-- Card Title -->
          <h4 class="text-sm font-semibold text-white tracking-wide mb-3 leading-snug break-words pr-2">${c.title}</h4>

          <!-- Card Footer Details -->
          <div class="flex items-center justify-between pt-2.5 border-t border-dark-700/10">
            <!-- Due Date -->
            <div class="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>${c.dueDate || "No date"}</span>
            </div>
            
            <!-- Assignee avatar initials -->
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${assigneeAvatar.color} shadow-sm" title="Assigned to ${c.assignee}">
              ${assigneeAvatar.initials}
            </div>
          </div>
        `;

        // Card Click opens Modal
        cardDiv.addEventListener("click", (e) => {
          // If clicked quick delete button, stop modal from triggering
          if (e.target.closest(".delete-quick-btn")) {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this task?")) {
              deleteCard(i, c.id);
            }
            return;
          }
          openDetailsModal(c, i);
        });

        dropzone.appendChild(cardDiv);
      });

      col.appendChild(dropzone);

      // Inline card creation form at the bottom
      const inlineFormContainer = document.createElement("div");
      inlineFormContainer.className = "p-3 border-t border-dark-700/20";
      
      if (actions.addCard) {
        inlineFormContainer.innerHTML = `
          <!-- Add Button -->
          <button class="inline-add-trigger w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 hover:border hover:border-slate-800 text-xs font-semibold transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Task
          </button>
          
          <!-- Expandable Quick Form (Hidden by default) -->
          <div class="inline-add-form hidden space-y-2">
            <input type="text" class="quick-title-input w-full bg-dark-950/60 border border-dark-700/50 focus:border-brand-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none" placeholder="Task summary...">
            <div class="flex items-center justify-between gap-2">
              <button class="quick-save-btn flex-1 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold transition-all">Add Task</button>
              <button class="quick-cancel-btn p-1.5 rounded-xl bg-dark-800 text-slate-400 hover:text-white hover:bg-dark-700 transition-all"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
          </div>
        `;

        const trigger = inlineFormContainer.querySelector(".inline-add-trigger");
        const form = inlineFormContainer.querySelector(".inline-add-form");
        const titleInput = inlineFormContainer.querySelector(".quick-title-input");
        const saveBtn = inlineFormContainer.querySelector(".quick-save-btn");
        const cancelBtn = inlineFormContainer.querySelector(".quick-cancel-btn");

        trigger.addEventListener("click", () => {
          // Collapse other open add forms first
          document.querySelectorAll(".inline-add-form").forEach(f => f.classList.add("hidden"));
          document.querySelectorAll(".inline-add-trigger").forEach(t => t.classList.remove("hidden"));

          trigger.classList.add("hidden");
          form.classList.remove("hidden");
          titleInput.focus();
        });

        const cancelHandler = () => {
          form.classList.add("hidden");
          trigger.classList.remove("hidden");
          titleInput.value = "";
        };

        cancelBtn.addEventListener("click", cancelHandler);

        saveBtn.addEventListener("click", () => {
          const title = titleInput.value.trim();
          if (!title) return;
          
          const newId = "c" + Math.floor(Math.random() * 100000);
          const newCard = {
            id: newId,
            title: title,
            desc: "",
            priority: "Low",
            tag: "Feature",
            dueDate: getFutureDate(5),
            assignee: currentUser.username,
            comments: [],
            attachments: []
          };

          boardObj.lists[i].cards.push(newCard);
          save();
          render();
        });

        // Trigger on Enter
        titleInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            saveBtn.click();
          } else if (e.key === "Escape") {
            cancelHandler();
          }
        });
      } else {
        // Locked state when permission is denied
        inlineFormContainer.innerHTML = `
          <button disabled class="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-600 bg-slate-900/10 cursor-not-allowed text-xs font-semibold">
            <i data-lucide="lock" class="w-4 h-4"></i> Creation Locked
          </button>
        `;
      }

      col.appendChild(inlineFormContainer);
      boardArea.appendChild(col);
    }

    // Update Header Dashboard Stats
    document.getElementById("boardStats").textContent = `${totalTasksCount} Tasks`;

    // Process Lucide Icon creation
    lucide.createIcons();
  }


  // ==========================================
  // 6) CARD DRAG-AND-DROP HANDLER
  // ==========================================
  function moveCard(fromListIndex, toListIndex, cardId) {
    if (fromListIndex === toListIndex) return;

    const fromCards = boardObj.lists[fromListIndex].cards;
    let cardToMove = null;

    for (let j = 0; j < fromCards.length; j++) {
      if (fromCards[j].id === cardId) {
        cardToMove = fromCards[j];
        fromCards.splice(j, 1);
        break;
      }
    }

    if (!cardToMove) return;

    boardObj.lists[toListIndex].cards.push(cardToMove);
    save();
    render();
  }

  function deleteCard(listIndex, cardId) {
    const cards = boardObj.lists[listIndex].cards;
    for (let j = 0; j < cards.length; j++) {
      if (cards[j].id === cardId) {
        cards.splice(j, 1);
        break;
      }
    }
    save();
    render();
  }


  // ==========================================
  // 7) SEARCH INTERFACE
  // ==========================================
  const searchInput = document.getElementById("cardSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      render();
    });
  }


  // ==========================================
  // 8) SLIDE-OVER CARD DETAILS MODAL
  // ==========================================
  let activeCard = null;
  let activeCardListIndex = -1;

  const cardModal = document.getElementById("cardModal");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalPanel = document.getElementById("modalPanel");

  const modalCardId = document.getElementById("modalCardId");
  const modalCardTitle = document.getElementById("modalCardTitle");
  const modalCardPriority = document.getElementById("modalCardPriority");
  const modalCardTag = document.getElementById("modalCardTag");
  const modalCardAssignee = document.getElementById("modalCardAssignee");
  const modalCardDueDate = document.getElementById("modalCardDueDate");
  const modalCardDesc = document.getElementById("modalCardDesc");
  
  const saveDescBtn = document.getElementById("saveDescBtn");
  const addCommentBtn = document.getElementById("addCommentBtn");
  const modalCommentInput = document.getElementById("modalCommentInput");
  const modalCommentsList = document.getElementById("modalCommentsList");
  
  const modalAttachmentsList = document.getElementById("modalAttachmentsList");
  const modalUploadBtn = document.getElementById("modalUploadBtn");
  const modalAttachFileInput = document.getElementById("modalAttachFileInput");

  const modalDeleteCardBtn = document.getElementById("modalDeleteCardBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");

  // Load assignees dropdown
  function loadAssigneesDropdown() {
    modalCardAssignee.innerHTML = "";
    USERS.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.username;
      opt.textContent = `${u.name} (${u.username})`;
      modalCardAssignee.appendChild(opt);
    });
  }

  function openDetailsModal(card, listIndex) {
    activeCard = card;
    activeCardListIndex = listIndex;

    loadAssigneesDropdown();

    // Populate fields
    modalCardId.textContent = card.id;
    modalCardTitle.value = card.title;
    modalCardPriority.value = card.priority;
    modalCardTag.value = card.tag;
    modalCardAssignee.value = card.assignee;
    modalCardDueDate.value = card.dueDate;
    modalCardDesc.value = card.desc;

    // Disables editing if not allowed
    const writeDisabled = !actions.addCard; // If can't add cards, usually can't edit either
    modalCardTitle.disabled = writeDisabled;
    modalCardPriority.disabled = writeDisabled;
    modalCardTag.disabled = writeDisabled;
    modalCardAssignee.disabled = writeDisabled;
    modalCardDueDate.disabled = writeDisabled;
    modalCardDesc.disabled = writeDisabled;
    saveDescBtn.disabled = writeDisabled;
    modalUploadBtn.disabled = writeDisabled;

    if (writeDisabled) {
      saveDescBtn.classList.add("hidden");
      modalUploadBtn.classList.add("hidden");
    } else {
      saveDescBtn.classList.remove("hidden");
      modalUploadBtn.classList.remove("hidden");
    }

    // Populate comments
    renderModalComments();

    // Populate attachments
    renderModalAttachments();

    // Handle delete button visibility
    if (actions.deleteCard) {
      modalDeleteCardBtn.classList.remove("hidden");
    } else {
      modalDeleteCardBtn.classList.add("hidden");
    }

    // Modal open animation
    cardModal.classList.remove("hidden");
    setTimeout(() => {
      modalOverlay.classList.remove("opacity-0");
      modalOverlay.classList.add("opacity-100");
      modalPanel.classList.remove("translate-x-full");
      modalPanel.classList.add("translate-x-0");
    }, 50);

    lucide.createIcons();
  }

  function closeDetailsModal() {
    if (!activeCard) return;

    modalOverlay.classList.remove("opacity-100");
    modalOverlay.classList.add("opacity-0");
    modalPanel.classList.remove("translate-x-0");
    modalPanel.classList.add("translate-x-full");

    setTimeout(() => {
      cardModal.classList.add("hidden");
      activeCard = null;
      activeCardListIndex = -1;
      render(); // Redraw board to reflect changes
    }, 300);
  }

  closeModalBtn.addEventListener("click", closeDetailsModal);
  modalOverlay.addEventListener("click", closeDetailsModal);

  // Auto-save fields on change (Title, Priority, Tag, Assignee, DueDate)
  modalCardTitle.addEventListener("change", () => {
    if (!activeCard) return;
    activeCard.title = modalCardTitle.value.trim() || "Untitled Task";
    save();
  });
  modalCardPriority.addEventListener("change", () => {
    if (!activeCard) return;
    activeCard.priority = modalCardPriority.value;
    save();
  });
  modalCardTag.addEventListener("change", () => {
    if (!activeCard) return;
    activeCard.tag = modalCardTag.value;
    save();
  });
  modalCardAssignee.addEventListener("change", () => {
    if (!activeCard) return;
    activeCard.assignee = modalCardAssignee.value;
    save();
  });
  modalCardDueDate.addEventListener("change", () => {
    if (!activeCard) return;
    activeCard.dueDate = modalCardDueDate.value;
    save();
  });

  // Description save
  saveDescBtn.addEventListener("click", () => {
    if (!activeCard) return;
    activeCard.desc = modalCardDesc.value.trim();
    save();
    alert("Description updated.");
  });

  // Comments Rendering
  function renderModalComments() {
    modalCommentsList.innerHTML = "";
    if (!activeCard || !activeCard.comments) return;

    if (activeCard.comments.length === 0) {
      modalCommentsList.innerHTML = `<p class="text-xs text-slate-500 italic py-2">No comments yet. Start the conversation!</p>`;
      return;
    }

    activeCard.comments.forEach(c => {
      const meta = getUserAvatarMeta(c.user);
      const timeStr = new Date(c.time).toLocaleString();

      const item = document.createElement("div");
      item.className = "flex gap-3 bg-white/5 border border-white/5 rounded-xl p-3.5";
      item.innerHTML = `
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${meta.color}">
          ${meta.initials}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-bold text-slate-300 truncate">${c.user}</span>
            <span class="text-[10px] text-slate-500 font-semibold">${timeStr}</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed break-words">${c.text}</p>
        </div>
      `;
      modalCommentsList.appendChild(item);
    });
  }

  // Comment Creation
  addCommentBtn.addEventListener("click", () => {
    if (!activeCard) return;
    const text = modalCommentInput.value.trim();
    if (!text) return;

    const newComment = {
      user: currentUser.name,
      text: text,
      time: new Date().toISOString()
    };

    activeCard.comments.unshift(newComment); // New comments at top
    save();
    modalCommentInput.value = "";
    renderModalComments();
  });

  // Attachments Rendering
  function renderModalAttachments() {
    modalAttachmentsList.innerHTML = "";
    if (!activeCard || !activeCard.attachments) return;

    if (activeCard.attachments.length === 0) {
      modalAttachmentsList.innerHTML = `<p class="text-xs text-slate-500 italic py-1">No attachments. Upload a file below.</p>`;
      return;
    }

    activeCard.attachments.forEach((att, idx) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs hover:border-slate-700 transition-all";
      row.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <i data-lucide="file-text" class="w-4 h-4 text-brand-400 shrink-0"></i>
          <div class="min-w-0">
            <span class="font-semibold text-slate-300 truncate block">${att.name}</span>
            <span class="text-[10px] text-slate-500">${att.size} • ${new Date(att.date).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a href="#" class="text-brand-400 hover:text-brand-300 font-bold" onclick="alert('File download simulated!'); return false;">Download</a>
          ${
            actions.addCard 
              ? `<button class="delete-att-btn text-rose-400 hover:text-rose-300 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>`
              : ""
          }
        </div>
      `;

      const deleteBtn = row.querySelector(".delete-att-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          activeCard.attachments.splice(idx, 1);
          save();
          renderModalAttachments();
          lucide.createIcons();
        });
      }

      modalAttachmentsList.appendChild(row);
    });
    lucide.createIcons();
  }

  // Upload File Simulation
  modalUploadBtn.addEventListener("click", () => {
    modalAttachFileInput.click();
  });

  modalAttachFileInput.addEventListener("change", (e) => {
    if (!activeCard) return;
    const file = e.target.files[0];
    if (!file) return;

    // Simulate upload
    const mockAttachment = {
      name: file.name,
      size: formatBytes(file.size),
      date: new Date().toISOString()
    };

    activeCard.attachments.push(mockAttachment);
    save();
    renderModalAttachments();
    modalAttachFileInput.value = ""; // Reset
  });

  // Size formatter helper
  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Modal Delete Task
  modalDeleteCardBtn.addEventListener("click", () => {
    if (!activeCard || !actions.deleteCard) return;

    if (confirm("Are you sure you want to delete this task?")) {
      deleteCard(activeCardListIndex, activeCard.id);
      closeDetailsModal();
    }
  });


  // ==========================================
  // 9) GLOBAL UTILITIES & OTHER BUTTONS
  // ==========================================

  // Back Button
  document.getElementById("backBtn").addEventListener("click", () => {
    goTo((currentUser.role === "admin") ? "admin-dashboard.html" : "user-dashboard.html");
  });

  // Logout Button
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    goTo("login-page.html");
  });

  function goTo(url) {
    document.body.classList.add("fade-out");
    setTimeout(() => {
      window.location.href = url;
    }, 250);
  }

  // Initialize
  render();

})();

// ==========================================
// 10) USER INITIALS & COLOR GENERATOR
// ==========================================
function getUserAvatarMeta(username) {
  const name = (username || "").trim().toLowerCase();
  if (name.includes("admin")) {
    return { initials: "AD", color: "bg-rose-500 shadow-rose-500/20" };
  } else if (name.includes("ammar")) {
    return { initials: "AM", color: "bg-indigo-500 shadow-indigo-500/20" };
  } else if (name.includes("haneen")) {
    return { initials: "HA", color: "bg-pink-500 shadow-pink-500/20" };
  } else if (name.includes("abdullah")) {
    return { initials: "AB", color: "bg-emerald-500 shadow-emerald-500/20" };
  }
  
  // Generic fallback
  const first = name.substring(0, Math.min(name.length, 2)).toUpperCase();
  return { initials: first || "U", color: "bg-slate-500 shadow-slate-500/20" };
}
