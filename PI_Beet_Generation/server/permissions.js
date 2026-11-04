const DEFAULT_ADMIN_EMAIL = 'generationbeet@gmail.com';
function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email,
        isAdmin: user.approved_admin === true || user.email.toLowerCase() === DEFAULT_ADMIN_EMAIL };
}
module.exports = { DEFAULT_ADMIN_EMAIL, publicUser };
