import type { AuthProvider } from "@refinedev/core";

export type UserRole = "operator" | "admin";

export type WrapMateUser = {
  username: string;
  role: UserRole;
};

export type UserProfile = {
  firstName: string;
  middleInitial: string;
  lastName: string;
  email: string;
  avatar: string;
};

type StoredUser = {
  email: string;
  password: string;
  role: UserRole;
  profile?: UserProfile;
};

const USERS_KEY = "wrapmate_users";
const CURRENT_USER_KEY = "wrapmate_current_user";

const SEED_USERS: StoredUser[] = [
  { email: "operator@wrapmate.local", password: "operator123", role: "operator" },
  { email: "admin@wrapmate.local", password: "admin123", role: "admin" },
];

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

function usernameFromEmail(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

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

function findCurrentStoredUser(): { users: StoredUser[]; index: number } | null {
  const current = getCurrentUser();
  if (!current) return null;

  const users = loadUsers();
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

export function getProfile(): UserProfile | null {
  const found = findCurrentStoredUser();
  if (!found) return null;

  const user = found.users[found.index];
  return user.profile ?? defaultProfile(user);
}

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

    const newUser: StoredUser = {
      email: canonicalEmail,
      password,
      role: "operator",
    };

    users.push(newUser);
    saveUsers(users);

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
