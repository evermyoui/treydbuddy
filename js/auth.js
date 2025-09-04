// ========================
// Fetch users.json and store in localStorage if not present
// ========================
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("users")) {
    fetch("data/users.json")
      .then(response => response.json())
      .then(users => {
        localStorage.setItem("users", JSON.stringify(users));
      })
      .catch(error => {
        console.error("Failed to load users.json:", error);
      });
  }
});

// ========================
// auth.js (mock auth)
// ========================
function login(username, password) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    return { success: true, message: "Login successful" };
  } else {
    return { success: false, message: "Invalid username or password" };
  }
}

function register(username, password) {
  let users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: "Username already exists" };
  }

  const newUser = {
    id: Date.now(),
    username,
    password,
  };

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  return { success: true, message: "Registration successful" };
}

function logout() {
  localStorage.removeItem("loggedInUser");
  return { success: true, message: "Logged out" };
}

function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("loggedInUser"));
}

// ========================
// main.js (form handlers)
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const createAccountBtn = document.getElementById("createAccount");
  const continueGuestBtn = document.getElementById("continueGuest");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      const result = login(email, password);

      if (result.success) {
        window.location.href = "dashboard.html"; // redirect to dashboard
      } else {
        alert("❌ " + result.message);
      }
    });
  }

  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", () => {
      const email = prompt("Enter email or student ID:");
      const password = prompt("Enter password:");

      if (!email || !password) {
        alert("❌ Registration cancelled or invalid.");
        return;
      }

      const result = register(email, password);
      alert(result.message);
    });
  }

  if (continueGuestBtn) {
    continueGuestBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "events.html"; // guest view
    });
  }
});

