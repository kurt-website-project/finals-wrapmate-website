import type { AuthProvider } from "@refinedev/core";

/**
 * WrapMate prototype auth provider.
 *
 * This is a client-side-only (localStorage) implementation suitable for a
 * prototype — there is no backend. It follows the Refine v5 AuthProvider
 * interface so the built-in SignInForm / SignUpForm components work via the
 * useLogin / useRegister / useLogout / useGetIdentity hooks.
 */

export type UserRole = "operator" | "admin";

export type WrapMateUser = {
  username: string;
  role: UserRole;
};

/** Editable profile fields shown on the Settings page. */
export type UserProfile = {
  firstName: string;
  middleInitial: string;
  lastName: string;
  email: string;
  avatar: string; // data URL or empty string
};

/** A stored account record. */
type StoredUser = {
  email: string;
  password: string;
  role: UserRole;
  profile?: UserProfile;
};

const USERS_KEY = "wrapmate_users";
const CURRENT_USER_KEY = "wrapmate_current_user";

/**
 * Seed accounts. These keep the original prototype logins working:
 *   - operator@wrapmate.local / operator123   (also usable as "operator")
 *   - admin@wrapmate.local    / admin123       (also usable as "admin")
 */
const SEED_USERS: StoredUser[] = [
  { email: "operator@wrapmate.local", password: "operator123", role: "operator" },
  { email: "admin@wrapmate.local", password: "admin123", role: "admin" },
];

/** Map a bare username alias to its seeded email. */
const USERNAME_ALIASES: Record<string, string> = {
  operator: "operator@wrapmate.local",
  admin: "admin@wrapmate.local",
};

function loadUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);

  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return [...SEED_USERS];
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [...SEED_USERS];
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return [...SEED_USERS];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Derive a friendly display username from an email (part before "@"). */
function usernameFromEmail(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

/** Resolve an identifier (email OR bare-username alias) to a canonical email. */
function resolveIdentifier(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  return USERNAME_ALIASES[value] ?? value;
}

function setCurrentUser(user: WrapMateUser) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): WrapMateUser | null {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as WrapMateUser;
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

/** Build a default profile for a user that has never saved one. */
function defaultProfile(user: StoredUser): UserProfile {
  const username = usernameFromEmail(user.email);
  return {
    firstName: capitalizeWord(username),
    middleInitial: "",
    lastName: "",
    email: user.email,
    avatar: "",
  };
}

function capitalizeWord(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Find the current logged-in user's stored record (by email). */
function findCurrentStoredUser(): { users: StoredUser[]; index: number } | null {
  const current = getCurrentUser();
  if (!current) return null;

  const users = loadUsers();
  // The current user's email: resolve from alias or match by derived username.
  const canonical = resolveIdentifier(current.username);
  let index = users.findIndex((u) => u.email.toLowerCase() === canonical);

  if (index === -1) {
    index = users.findIndex(
      (u) => usernameFromEmail(u.email) === current.username
    );
  }

  if (index === -1) return null;
  return { users, index };
}

/**
 * Returns the current user's profile, creating sensible defaults if none has
 * been saved yet.
 */
export function getProfile(): UserProfile | null {
  const found = findCurrentStoredUser();
  if (!found) return null;

  const user = found.users[found.index];
  return user.profile ?? defaultProfile(user);
}

/** Save the current user's profile to localStorage. Returns the saved profile. */
export function saveProfile(
  profile: UserProfile
): { success: boolean; error?: string } {
  const found = findCurrentStoredUser();
  if (!found) return { success: false, error: "No authenticated user." };

  const { users, index } = found;
  users[index] = { ...users[index], profile };
  saveUsers(users);
  return { success: true };
}

/**
 * Change the current user's password. Verifies the current password first.
 * Really updates the stored password — the next login requires the new one.
 */
export function changePassword(
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const found = findCurrentStoredUser();
  if (!found) return { success: false, error: "No authenticated user." };

  const { users, index } = found;

  if (users[index].password !== currentPassword) {
    return { success: false, error: "Your current password is incorrect." };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters long.",
    };
  }

  users[index] = { ...users[index], password: newPassword };
  saveUsers(users);
  return { success: true };
}

type AuthParams = {
  email?: string;
  password?: string;
  providerName?: string;
  [key: string]: unknown;
};

export const authProvider: AuthProvider = {
  async login({ email, password }: AuthParams) {
    if (!email || !password) {
      return {
        success: false,
        error: {
          name: "Login failed",
          message: "Email and password are required.",
        },
      };
    }

    const canonicalEmail = resolveIdentifier(email);
    const users = loadUsers();
    const account = users.find((u) => u.email.toLowerCase() === canonicalEmail);

    if (!account || account.password !== password) {
      return {
        success: false,
        error: {
          name: "Login failed",
          message: "Invalid email or password.",
        },
      };
    }

    setCurrentUser({
      username: usernameFromEmail(account.email),
      role: account.role,
    });

    return { success: true, redirectTo: "/" };
  },

  async register({ email, password }: AuthParams) {
    if (!email || !password) {
      return {
        success: false,
        error: {
          name: "Register failed",
          message: "Email and password are required.",
        },
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: {
          name: "Register failed",
          message: "Password must be at least 8 characters long.",
        },
      };
    }

    const canonicalEmail = resolveIdentifier(email);
    const users = loadUsers();

    if (users.some((u) => u.email.toLowerCase() === canonicalEmail)) {
      return {
        success: false,
        error: {
          name: "Register failed",
          message: "An account with this email already exists.",
        },
      };
    }

    // New sign-ups are always operators. Admin stays seeded-only.
    const newUser: StoredUser = {
      email: canonicalEmail,
      password,
      role: "operator",
    };

    users.push(newUser);
    saveUsers(users);

    // Professional flow: do NOT auto-login. The user is sent to the login
    // page to sign in with the credentials they just created. The success
    // toast is shown by the SignUpForm's onSuccess handler.
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  async logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    return { success: true, redirectTo: "/login" };
  },

  async check() {
    const user = getCurrentUser();

    if (user) {
      return { authenticated: true };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },

  async getIdentity() {
    const user = getCurrentUser();
    if (!user) return null;

    const profile = getProfile();

    // Prefer the saved full name (First + M.I. + Last) when present,
    // otherwise fall back to the login username.
    const fullName = profile
      ? [profile.firstName, profile.middleInitial, profile.lastName]
          .map((part) => (part ?? "").trim())
          .filter(Boolean)
          .join(" ")
      : "";

    const displayName = fullName || user.username;

    return {
      id: user.username,
      name: displayName,
      displayName,
      username: user.username,
      role: user.role,
      avatar: profile?.avatar || "",
      profile: profile ?? undefined,
    };
  },

  async onError(error) {
    return { error };
  },
};

export default authProvider;
