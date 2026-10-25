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
let authMode = "login";
let currentUser = null;
let resetToken = null;

// What each form mode shows: login, create account, ask for a recovery link, set a new password.
const authModes = {
    login: { title: "INGRESAR", submit: "Ingresar", fields: ["email", "password"], switchText: "¿No tenés cuenta?", switchTo: "register", switchLabel: "Crear cuenta" },
    register: { title: "CREAR CUENTA", submit: "Crear cuenta", fields: ["name", "email", "password"], switchText: "¿Ya tenés cuenta?", switchTo: "login", switchLabel: "Ingresar" },
    forgot: { title: "RECUPERAR CONTRASEÑA", submit: "Enviar enlace", fields: ["email"], switchText: "¿Te acordaste?", switchTo: "login", switchLabel: "Ingresar" },
    reset: { title: "NUEVA CONTRASEÑA", submit: "Guardar contraseña", fields: ["password"], switchText: "¿Te acordaste?", switchTo: "login", switchLabel: "Ingresar" },
};

const renderAuthState = () => {
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
        await postAuth("logout").catch(console.error);
        currentUser = null;
        renderAuthState();
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
        const data = await postAuth(authMode, bodies[authMode]);
        if (authMode === "forgot") {
            authInfo.textContent = data.message;
            return;
        }
        if (authMode === "reset") resetToken = null;
        currentUser = data.user;
        renderAuthState();
        authDialog.close();
    } catch (error) {
        authError.textContent = error.message;
    } finally {
        authSubmit.disabled = false;
    }
});

// Opened from the recovery email: /?reset=<token>.
const resetParam = new URLSearchParams(location.search).get("reset");
if (resetParam) {
    resetToken = resetParam;
    history.replaceState(null, "", "/");
    openAuthDialog("reset");
}

fetch("/api/auth/me")
    .then((response) => response.json())
    .then((data) => {
        currentUser = data.user || null;
        renderAuthState();
    })
    .catch(console.error);
