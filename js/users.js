// users.js

const USERS = [
  { username: "admin", password: "admin", role: "admin", name: "Admin" },

  { username: "ammar", password: "1234", role: "user", name: "Ammar" },
  { username: "haneen", password: "1234", role: "user", name: "Haneen" },
  { username: "abdullah", password: "1234", role: "user", name: "Abdullah" }
];

function findUser(username, password) {
  username = (username || "").trim().toLowerCase();
  password = (password || "").trim();

  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    if (u.username.toLowerCase() === username && u.password === password) {
      return u;
    }
  }
  return null;
}

/* =========================
   BOARDS + PERMISSIONS -> its based on localStorage
    - getBoards()
    - getPerms()
    - savePerms(permsObj)
  
   ========================= */

const DEFAULT_BOARDS = [
  { id: "table1", name: "Table 1 - Tasks" },
  { id: "table2", name: "Table 2 - Project" },
  { id: "table3", name: "Table 3 - Study" }
];

// permissions example per board:
// allowedUsers: ["ammar","haneen"]
// perms: { addCard:true, addList:true, moveCard:true, deleteCard:true }
const DEFAULT_PERMS = {
  table1: {
    allowedUsers: ["ammar", "haneen"],
    perms: { addCard: true, addList: true, moveCard: true, deleteCard: false }
  },
  table2: {
    allowedUsers: ["ammar", "abdullah"],
    perms: { addCard: true, addList: false, moveCard: true, deleteCard: true }
  },
  table3: {
    allowedUsers: ["haneen"],
    perms: { addCard: true, addList: true, moveCard: true, deleteCard: false }
  }
};

function getBoards() {
  const raw = localStorage.getItem("BOARDS");
  if (raw) return JSON.parse(raw);
  localStorage.setItem("BOARDS", JSON.stringify(DEFAULT_BOARDS));
  return DEFAULT_BOARDS;
}

function getPerms() {
  const raw = localStorage.getItem("PERMS");
  if (raw) return JSON.parse(raw);
  localStorage.setItem("PERMS", JSON.stringify(DEFAULT_PERMS));
  return DEFAULT_PERMS;
}

function savePerms(permsObj) {
  localStorage.setItem("PERMS", JSON.stringify(permsObj));
}

function isAdmin(currentUser) {
  return currentUser && currentUser.role === "admin";
}

function canUserAccessBoard(currentUser, boardId) {
  if (!currentUser) return false;
  if (isAdmin(currentUser)) return true;

  const perms = getPerms();
  const p = perms[boardId];
  if (!p) return false;

  for (let i = 0; i < p.allowedUsers.length; i++) {
    if (p.allowedUsers[i] === currentUser.username) return true;
  }
  return false;
}

function getUserBoards(currentUser) {
  const boards = getBoards();
  if (!currentUser) return [];
  if (isAdmin(currentUser)) return boards;

  const perms = getPerms();
  const out = [];
  for (let i = 0; i < boards.length; i++) {
    const b = boards[i];
    const p = perms[b.id];
    if (!p) continue;

    for (let j = 0; j < p.allowedUsers.length; j++) {
      if (p.allowedUsers[j] === currentUser.username) {
        out.push(b);
        break;
      }
    }
  }
  return out;
}

function getBoardPermActions(currentUser, boardId) {
  // admin full access
  if (isAdmin(currentUser)) {
    return { addCard: true, addList: true, moveCard: true, deleteCard: true };
  }

  const perms = getPerms();
  const p = perms[boardId];
  if (!p) return { addCard: false, addList: false, moveCard: false, deleteCard: false };

  // if not allowed user => no actions
  let allowed = false;

  for (let i = 0; i < p.allowedUsers.length; i++) {

    if (p.allowedUsers[i] === currentUser.username) allowed = true;
    
  }
  if (!allowed) return { addCard: false, addList: false, moveCard: false, deleteCard: false };

  return p.perms;
}
