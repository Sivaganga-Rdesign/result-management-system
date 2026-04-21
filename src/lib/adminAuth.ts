const ADMIN_KEY = "rms_admin_auth";
const ADMIN_PASSWORD = "admin123"; // Default admin password

export function isAdminLoggedIn(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === "true";
}

export function adminLogin(password: string): boolean {
  // Check against stored password or default
  const storedPassword = localStorage.getItem("rms_admin_password") || ADMIN_PASSWORD;
  if (password === storedPassword) {
    sessionStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}

export function changeAdminPassword(oldPassword: string, newPassword: string): boolean {
  const storedPassword = localStorage.getItem("rms_admin_password") || ADMIN_PASSWORD;
  if (oldPassword === storedPassword) {
    localStorage.setItem("rms_admin_password", newPassword);
    return true;
  }
  return false;
}
