import { Router } from "express";
import { supabase } from "../supabase.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
} from "../auth.js";
import { requireAuth } from "../middleware.js";

const router = Router();

function usernameFromEmail(email) {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

function publicUser(u) {
  const fullName = [u.first_name, u.middle_initial, u.last_name]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(" ");
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    firstName: u.first_name,
    middleInitial: u.middle_initial,
    lastName: u.last_name,
    avatarUrl: u.avatar_url,
    displayName: fullName || u.username,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const username = usernameFromEmail(normalizedEmail);

    const { error } = await supabase.from("users").insert({
      username,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "operator",
      first_name: username.charAt(0).toUpperCase() + username.slice(1),
    });
    if (error) throw error;

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const { firstName, middleInitial, lastName, email, avatarUrl } = req.body;
    const update = {};
    if (firstName !== undefined) update.first_name = firstName;
    if (middleInitial !== undefined) update.middle_initial = middleInitial;
    if (lastName !== undefined) update.last_name = lastName;
    if (email !== undefined) update.email = email.trim().toLowerCase();
    if (avatarUrl !== undefined) update.avatar_url = avatarUrl;

    const { data: user, error } = await supabase
      .from("users")
      .update(update)
      .eq("id", req.user.id)
      .select("*")
      .single();
    if (error) throw error;

    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.patch("/password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters long." });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!(await verifyPassword(currentPassword || "", user.password_hash))) {
      return res
        .status(400)
        .json({ error: "Your current password is incorrect." });
    }

    const passwordHash = await hashPassword(newPassword);
    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", req.user.id);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
