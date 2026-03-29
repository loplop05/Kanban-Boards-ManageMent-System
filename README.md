# Kanban Boards Management System

This project is a browser-based Kanban app I built to make it easy for small teams to organize work while keeping control over who can do what on each board. Everything runs on vanilla HTML, CSS, and JavaScript with localStorage for persistence, so it works without a backend.

## What I built
- A role-aware login flow that directs admins and regular users to their own dashboards.
- An admin dashboard for granting board access and toggling what actions each user can take (add lists, add cards, move cards, delete cards).
- A user dashboard that only shows boards the user is allowed to see, with quick entry into each board.
- A drag-and-drop Kanban board interface with lists and cards that respect the permissions set by the admin.
- LocalStorage-backed data for users, boards, and permissions so the app is ready to use out of the box.

## The problem it solves
Teams often want a simple Kanban tool but still need per-board guardrails. This app lets an admin decide which users can view a board and which actions they can take, without needing servers or deployments. It keeps casual collaboration safe while staying lightweight.

## How to try it
1) Open `app/login-page.html` in a browser.  
2) Sign in as:
   - Admin: `admin` / `admin`
   - Users: `ammar` / `1234`, `haneen` / `1234`, `abdullah` / `1234`
3) As admin, assign users to boards and set their permissions.  
4) As a user, open your boards and organize cards via drag and drop.

## What’s inside
- `app/` HTML pages for login, dashboards, and boards.
- `js/` logic for authentication, permissions, and board interactions.
- `css/` Styling for the dashboards and Kanban experience.
