import { useRef, useState } from "react";
import { useGetIdentity, useNotification } from "@refinedev/core";
import { Camera, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import { IDENTITY_UPDATED_EVENT } from "@/backend/wrapmate-store";
import {
  getProfile,
  saveProfile,
  changePassword,
  type UserProfile,
} from "@/backend/auth";

type Identity = {
  username?: string;
  role?: string;
};

function capitalize(value?: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function Settings() {
  const { data: identity, refetch } = useGetIdentity<Identity>();
  const { open } = useNotification();

  const initialProfile = getProfile();
  const [profile, setProfile] = useState<UserProfile>(
    initialProfile ?? {
      firstName: "",
      middleInitial: "",
      lastName: "",
      email: "",
      avatar: "",
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const role = capitalize(identity?.role);

  function updateField(field: keyof UserProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      open?.({
        type: "error",
        message: "Invalid file",
        description: "Please choose an image file.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField("avatar", String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleRemovePhoto() {
    updateField("avatar", "");
  }

  function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = saveProfile(profile);
    if (!result.success) {
      open?.({
        type: "error",
        message: "Could not save profile",
        description: result.error ?? "Please try again.",
      });
      return;
    }

    refetch?.();
    window.dispatchEvent(new Event(IDENTITY_UPDATED_EVENT));
    open?.({
      type: "success",
      message: "Profile saved",
      description: "Your profile changes have been saved.",
    });
  }

  function handleUpdatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      open?.({
        type: "error",
        message: "Passwords don't match",
        description: "New password and confirmation must match.",
      });
      return;
    }

    const result = changePassword(currentPassword, newPassword);
    if (!result.success) {
      open?.({
        type: "error",
        message: "Could not update password",
        description: result.error ?? "Please try again.",
      });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    open?.({
      type: "success",
      message: "Password updated",
      description: "Use your new password the next time you sign in.",
    });
  }

  const initials = (profile.firstName || identity?.username || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>

      <section className="settings-card">
        <h2 className="settings-card-title">Profile</h2>

        <form onSubmit={handleSaveProfile}>
          <div className="settings-avatar-row">
            <div className="settings-avatar-wrap">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Profile"
                  className="settings-avatar"
                />
              ) : (
                <div className="settings-avatar settings-avatar-fallback">
                  {initials}
                </div>
              )}
              <button
                type="button"
                className="settings-avatar-camera"
                onClick={handlePhotoClick}
                aria-label="Change photo"
              >
                <Camera />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="settings-file-input"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="settings-avatar-meta">
              <strong>{role || "User"}</strong>
              <span>Click the camera to change your photo.</span>
              {profile.avatar && (
                <button
                  type="button"
                  className="settings-remove-photo"
                  onClick={handleRemovePhoto}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="settings-grid-3">
            <label className="settings-field">
              <span>First Name</span>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
              />
            </label>

            <label className="settings-field">
              <span>M.I.</span>
              <input
                type="text"
                maxLength={2}
                value={profile.middleInitial}
                onChange={(e) => updateField("middleInitial", e.target.value)}
              />
            </label>

            <label className="settings-field">
              <span>Last Name</span>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
              />
            </label>
          </div>

          <label className="settings-field">
            <span>Email</span>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </label>

          <div className="settings-actions">
            <button type="submit" className="settings-button">
              <Save />
              Save Profile
            </button>
          </div>
        </form>
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">
          <KeyRound className="settings-card-title-icon" />
          Change Password
        </h2>

        <form onSubmit={handleUpdatePassword}>
          <label className="settings-field">
            <span>Current Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>

          <div className="settings-grid-2">
            <label className="settings-field">
              <span>New Password</span>
              <div className="settings-input-affix">
                <input
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="settings-input-affix-button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>

            <label className="settings-field">
              <span>Confirm New Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          </div>

          <div className="settings-actions">
            <button type="submit" className="settings-button">
              <KeyRound />
              Update Password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
