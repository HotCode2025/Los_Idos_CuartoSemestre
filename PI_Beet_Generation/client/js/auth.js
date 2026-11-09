const authBtn = document.getElementById("auth-btn");
const authGreeting = document.getElementById("auth-greeting");
const authDialog = document.getElementById("auth-dialog");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authNameField = document.getElementById("auth-name-field");
const authEmailField = document.getElementById("auth-email-field");
const authPasswordField = document.getElementById("auth-password-field");
const authPasswordLabel = document.getElementById("auth-password-label");
const authForgot = document.getElementById("auth-forgot");
const authError = document.getElementById("auth-error");
const authInfo = document.getElementById("auth-info");
const authSubmit = document.getElementById("auth-submit");
const authSwitch = document.getElementById("auth-switch");
const authSwitchText = document.getElementById("auth-switch-text");
const authToast = document.getElementById("auth-toast");
const authToastMessage = document.getElementById("auth-toast-message");
let authToastTimer;

const hideAuthToast = () => {
    clearTimeout(authToastTimer);
    authToast.classList.remove("is-visible");
};

const showAuthToast = (message) => {
    clearTimeout(authToastTimer);
    authToastMessage.textContent = message;
    authToast.classList.add("is-visible");
    authToastTimer = setTimeout(hideAuthToast, 5000);
};

document.getElementById("auth-toast-close").addEventListener("click", hideAuthToast);

let authMode = "login";
let currentUser = null;
let resetToken = null;

// Qué muestra cada modo del formulario: ingresar, crear cuenta, pedir un enlace de recuperación y elegir una contraseña nueva.
const authModes = {
    login: { title: "INGRESAR", submit: "Ingresar", fields: ["email", "password"], switchText: "¿No tenés cuenta?", switchTo: "register", switchLabel: "Crear cuenta" },
    register: { title: "CREAR CUENTA", submit: "Crear cuenta", fields: ["name", "email", "password"], switchText: "¿Ya tenés cuenta?", switchTo: "login", switchLabel: "Ingresar" },
    forgot: { title: "RECUPERAR CONTRASEÑA", submit: "Enviar enlace", fields: ["email"], switchText: "¿Te acordaste?", switchTo: "login", switchLabel: "Ingresar" },
    reset: { title: "NUEVA CONTRASEÑA", submit: "Guardar contraseña", fields: ["password"], switchText: "¿Te acordaste?", switchTo: "login", switchLabel: "Ingresar" },
};

const renderAuthState = () => {
    document.getElementById("admin-link").hidden = !currentUser?.isAdmin;
    authGreeting.hidden = !currentUser;
    authGreeting.textContent = currentUser ? `Hola, ${currentUser.name}` : "";
    authBtn.textContent = currentUser ? "Salir" : "Ingresar";
};

const setAuthMode = (mode) => {
    authMode = mode;
    const config = authModes[mode];
    authTitle.textContent = config.title;
    authSubmit.textContent = config.submit;
    authSwitchText.textContent = config.switchText;
    authSwitch.textContent = config.switchLabel;
    authNameField.hidden = !config.fields.includes("name");
    authEmailField.hidden = !config.fields.includes("email");
    authPasswordField.hidden = !config.fields.includes("password");
    authForgot.hidden = mode !== "login";
    authPasswordLabel.textContent = mode === "reset" ? "Contraseña nueva" : "Contraseña";
    authForm.elements.password.autocomplete = mode === "login" ? "current-password" : "new-password";
    authError.textContent = "";
    authInfo.textContent = "";
};

const postAuth = async (path, body) => {
    const response = await fetch(`/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
    return data;
};

const openAuthDialog = (mode) => {
    authForm.reset();
    setAuthMode(mode);
    authDialog.showModal();
};

authBtn.addEventListener("click", async () => {
    if (currentUser) {
        authBtn.disabled = true;
        try {
            await CartStore.authenticate(() => postAuth("logout"));
            currentUser = null;
            renderAuthState();
            showAuthToast("Cerraste sesión correctamente.");
        } catch (error) { alert(error.message); }
        finally { authBtn.disabled = false; }
        return;
    }
    openAuthDialog("login");
});

authSwitch.addEventListener("click", () => setAuthMode(authModes[authMode].switchTo));
authForgot.addEventListener("click", () => setAuthMode("forgot"));
document.getElementById("auth-close").addEventListener("click", () => authDialog.close());

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { name, email, password } = authForm.elements;
    const bodies = {
        login: { email: email.value, password: password.value },
        register: { name: name.value, email: email.value, password: password.value },
        forgot: { email: email.value },
        reset: { token: resetToken, password: password.value },
    };
    authSubmit.disabled = true;
    authError.textContent = "";
    authInfo.textContent = "";
    try {
        const data = authMode === "forgot"
            ? await postAuth(authMode, bodies[authMode])
            : await CartStore.authenticate(() => postAuth(authMode, bodies[authMode]));
        if (authMode === "forgot") {
            authInfo.textContent = data.message;
            return;
        }
        if (authMode === "reset") resetToken = null;
        currentUser = data.user;
        renderAuthState();
        authDialog.close();
        const message = authMode === "register"
            ? `Cuenta creada. ¡Bienvenida/o, ${currentUser.name}!`
            : authMode === "reset"
                ? "Contraseña actualizada. Ya iniciaste sesión."
                : `¡Hola, ${currentUser.name}! Iniciaste sesión correctamente.`;
        showAuthToast(message);
    } catch (error) {
        authError.textContent = error.message;
    } finally {
        authSubmit.disabled = false;
    }
});

// Se abre desde el correo de recuperación: /?reset=<token>.
const resetParam = new URLSearchParams(location.search).get("reset");
if (resetParam) {
    resetToken = resetParam;
    history.replaceState(null, "", "/");
    openAuthDialog("reset");
}

CartStore.ready
    .then((user) => {
        currentUser = user;
        renderAuthState();
    })
    .catch(console.error);

if (new URLSearchParams(location.search).get("login") === "1") {
    history.replaceState(null, "", "/");
    openAuthDialog("login");
}
