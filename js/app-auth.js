(function () {
  function setElementDisplay(selector, display) {
    const element =
      selector.startsWith("#")
        ? document.getElementById(selector.slice(1))
        : document.querySelector(selector);

    if (element) {
      element.style.display = display;
    }
  }

  async function enterAppMode() {
    setElementDisplay("#auth-section", "none");

    document.body.classList.add("authenticated", "app");
    document.body.classList.remove("files-mode");

    setElementDisplay(".sidebar", "block");
    setElementDisplay(".content", "block");
    setElementDisplay("#hamburger", "flex");

    await initApp();
  }

  function enterAuthMode() {
    setElementDisplay("#auth-section", "block");

    document.body.classList.remove(
      "authenticated",
      "app",
      "files-mode",
      "sidebar-open"
    );

    setElementDisplay(".sidebar", "none");
    setElementDisplay(".content", "none");
    setElementDisplay("#hamburger", "none");
  }

  function setupAuthFormToggles() {
    const showSignup = document.getElementById("show-signup");
    const showLogin = document.getElementById("show-login");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (showSignup && loginForm && signupForm) {
      showSignup.onclick = () => {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
      };
    }

    if (showLogin && loginForm && signupForm) {
      showLogin.onclick = () => {
        signupForm.style.display = "none";
        loginForm.style.display = "block";
      };
    }
  }

  function setupLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const email = document.getElementById("email")?.value;
      const password = document.getElementById("password")?.value;
      const statusEl = document.getElementById("login-status");

      const { error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        if (statusEl) {
          statusEl.textContent = `❌ Помилка входу: ${error.message}`;
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = "✅ Успішний вхід";
      }

      await enterAppMode();
    });
  }

  function setupSignupForm() {
    const form = document.getElementById("signup-form");
    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const email = document.getElementById("signup-email")?.value;
      const password = document.getElementById("signup-password")?.value;
      const confirm = document.getElementById("signup-password-confirm")?.value;
      const statusEl = document.getElementById("signup-status");

      if (password !== confirm) {
        if (statusEl) {
          statusEl.textContent = "❌ Пароли не совпадают";
        }
        return;
      }

      const { error } = await client.auth.signUp({ email, password });

      if (error) {
        if (statusEl) {
          statusEl.textContent = `❌ Ошибка регистрации: ${error.message}`;
        }
        return;
      }

      if (statusEl) {
        statusEl.style.color = "green";
        statusEl.textContent = "✅ Регистрация успешна! Проверьте почту.";
      }
    });
  }

  async function checkInitialSession() {
    const preloader = document.getElementById("preloader");

    try {
      let {
        data: { session }
      } = await client.auth.getSession();

      if (!session) {
        const refreshed = await client.auth.refreshSession();
        session = refreshed.data.session;
      }

      if (session) {
        await enterAppMode();
      } else {
        enterAuthMode();
      }
    } finally {
      document.body.classList.add("auth-checked");

      if (preloader) {
        preloader.classList.add("hidden");
      }
    }
  }

  setupAuthFormToggles();
  setupLoginForm();
  setupSignupForm();
  checkInitialSession();
})();
