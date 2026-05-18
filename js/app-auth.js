(function () {
  function getResidentTokenFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return (params.get("rt") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function setElementDisplay(selector, display) {
    const element =
      selector.startsWith("#")
        ? document.getElementById(selector.slice(1))
        : document.querySelector(selector);

    if (element) {
      element.style.display = display;
    }
  }

  function applyResidentPayload(payload) {
    if (!payload || typeof payload !== "object") return false;

    window.us = payload.us || {};
    window.b = payload.b || {};
    window.org = payload.org || "";
    window.adr = payload.adr || "";
    window.dt = payload.dt || "";
    window.what = payload.what || {};
    window.kto = payload.kto || {};
    window.nach = payload.nach || {};
    window.nachnote = payload.nachnote || {};
    window.allnach = payload.allnach || {};
    window.oplat = payload.oplat || {};
    window.ls = payload.ls || {};
    window.plat = payload.plat || {};
    window.files = { files: [] };

    us = window.us;
    b = window.b;
    org = window.org;
    adr = window.adr;
    dt = window.dt;
    what = window.what;
    kto = window.kto;
    nach = window.nach;
    nachnote = window.nachnote;
    allnach = window.allnach;
    oplat = window.oplat;
    ls = window.ls;
    plat = window.plat;
    files = window.files;

    const homeCode = String(payload.home_code || getParam("homeCode") || "");
    window.homes = [
      {
        code: homeCode,
        name: payload.name || org || "",
        token: String(payload.token || "")
      }
    ];
    homes = window.homes;

    const accountId =
      String(payload.account_id || "") || Object.keys(window.ls || {})[0] || "";
    if (!accountId || !window.ls || !window.ls[accountId]) return false;

    const kv = String(window.ls[accountId].kv || "");
    if (homeCode) setParam("homeCode", homeCode);
    setParam("actionCode", "accounts");
    if (kv) setParam("kv", kv);

    if (typeof fillMissingDates === "function") {
      fillMissingDates(window.nach);
    }
    if (typeof initLS === "function") {
      initLS();
    }
    return true;
  }

  async function tryEnterResidentMode() {
    const token = getResidentTokenFromUrl();
    if (!token) return false;

    setElementDisplay("#auth-section", "none");
    setElementDisplay(".sidebar", "none");
    setElementDisplay(".topbar", "none");
    setElementDisplay(".content", "block");
    setElementDisplay("#hamburger", "none");

    document.body.classList.add("resident-mode", "app");
    document.body.classList.remove(
      "authenticated",
      "files-mode",
      "sidebar-open"
    );
    document.documentElement.style.setProperty("--topbar-offset", "0px");

    const { data, error } = await client.rpc("resident_get_ls", {
      p_token: token
    });

    if (error || !data) {
      return false;
    }

    return applyResidentPayload(data);
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
      const enteredResidentMode = await tryEnterResidentMode();
      if (enteredResidentMode) {
        return;
      }

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
