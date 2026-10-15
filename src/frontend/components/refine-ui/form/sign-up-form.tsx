"use client";

import { useState } from "react";

import { useRegister, useLink, useNotification } from "@refinedev/core";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/frontend/components/ui/card";
import { Separator } from "@/frontend/components/ui/separator";
import { InputPassword } from "@/frontend/components/refine-ui/form/input-password";
import { cn } from "@/frontend/lib/utils";

type RegisterVariables = {
  email: string;
  password: string;
};

export const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { open } = useNotification();

  const Link = useLink();

  const { mutate: register } = useRegister<RegisterVariables>();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      open?.({
        type: "error",
        message: "Invalid email",
        description: "Please enter a valid email address.",
      });

      return;
    }

    if (password.length < 8) {
      open?.({
        type: "error",
        message: "Password too short",
        description: "Your password must be at least 8 characters long.",
      });

      return;
    }

    if (password !== confirmPassword) {
      open?.({
        type: "error",
        message: "Passwords don't match",
        description:
          "Please make sure both password fields contain the same value.",
      });

      return;
    }

    register(
      {
        email: email.trim(),
        password,
      },
      {
        onSuccess: (data) => {
          if (data?.success) {
            open?.({
              type: "success",
              message: "Account created successfully",
              description: "Please sign in with your new credentials.",
            });
          }
        },
      }
    );
  };

  return (
    <div
      className={cn(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "px-6",
        "py-8",
        "min-h-svh"
      )}
    >
      <div className="wrapmate-login-brand">
        <img
          src="/logo-mark.png"
          alt="WrapMate logo"
          className="wrapmate-logo-mark"
        />
        <span>WrapMate</span>
      </div>

      <Card className={cn("sm:w-[456px]", "p-12", "mt-6")}>
        <CardHeader className={cn("px-0")}>
          <CardTitle className={cn("text-3xl", "font-semibold")}>
            Create your account
          </CardTitle>
          <CardDescription
            className={cn("text-muted-foreground", "font-medium")}
          >
            Sign up to manage packaging orders.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className={cn("px-0")}>
          <form onSubmit={handleSignUp}>
            <div className={cn("flex", "flex-col", "gap-2")}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div
              className={cn("relative", "flex", "flex-col", "gap-2", "mt-6")}
            >
              <Label htmlFor="password">Password</Label>
              <InputPassword
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className={cn("text-xs", "text-muted-foreground")}>
                Must be at least 8 characters long.
              </p>
            </div>

            <div
              className={cn("relative", "flex", "flex-col", "gap-2", "mt-6")}
            >
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <InputPassword
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="lg" className={cn("w-full", "mt-6")}>
              Sign up
            </Button>
          </form>
        </CardContent>

        <Separator />

        <CardFooter>
          <div className={cn("w-full", "text-center text-sm")}>
            <span className={cn("text-sm", "text-muted-foreground")}>
              Have an account?{" "}
            </span>
            <Link to="/login" className={cn("font-semibold", "underline")}>
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

SignUpForm.displayName = "SignUpForm";
