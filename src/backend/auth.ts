import type { AuthProvider } from "@refinedev/core";
import { apiRequest, setToken, clearToken, getToken } from "./api";

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

type ApiUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  middleInitial: string;
  lastName: string;
  avatarUrl: string;
  displayName: string;
};

type AuthParams = {
  email?: string;
  password?: string;
  [key: string]: unknown;
};

export async function fetchMe(): Promise<ApiUser | null> {
  if (!getToken()) return null;
  try {
    const data = await apiRequest<{ user: ApiUser }>("/api/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const user = await fetchMe();
  if (!user) return null;
  return {
    firstName: user.firstName || "",
    middleInitial: user.middleInitial || "",
    lastName: user.lastName || "",
    email: user.email || "",
    avatar: user.avatarUrl || "",
  };
}

export async function saveProfile(
  profile: UserProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest("/api/auth/profile", {
      method: "PATCH",
      body: {
        firstName: profile.firstName,
        middleInitial: profile.middleInitial,
        lastName: profile.lastName,
        email: profile.email,
        avatarUrl: profile.avatar,
      },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest("/api/auth/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export const authProvider: AuthProvider = {
  async login({ email, password }: AuthParams) {
    if (!email || !password) {
      return {
        success: false,
        error: { name: "Login failed", message: "Email and password are required." },
      };
    }
    try {
      const data = await apiRequest<{ token: string; user: ApiUser }>(
        "/api/auth/login",
        { method: "POST", body: { email, password }, auth: false }
      );
      setToken(data.token);
      return { success: true, redirectTo: "/" };
    } catch (err) {
      return {
        success: false,
        error: { name: "Login failed", message: (err as Error).message },
      };
    }
  },

  async register({ email, password }: AuthParams) {
    if (!email || !password) {
      return {
        success: false,
        error: { name: "Register failed", message: "Email and password are required." },
      };
    }
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      return { success: true, redirectTo: "/login" };
    } catch (err) {
      return {
        success: false,
        error: { name: "Register failed", message: (err as Error).message },
      };
    }
  },

  async logout() {
    clearToken();
    return { success: true, redirectTo: "/login" };
  },

  async check() {
    const user = await fetchMe();
    if (user) return { authenticated: true };
    return { authenticated: false, redirectTo: "/login" };
  },

  async getIdentity() {
    const user = await fetchMe();
    if (!user) return null;
    return {
      id: user.id,
      name: user.displayName,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
      avatar: user.avatarUrl || "",
    };
  },

  async onError(error) {
    return { error };
  },
};

export default authProvider;
