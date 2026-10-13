"use client";

import { useState } from "react";

import { useLogin, useLink } from "@refinedev/core";
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

type LoginVariables = {
  email: string;
  password: string;
};

export const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const Link = useLink();

  const { mutate: login } = useLogin<LoginVariables>();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    login({
      email,
      password,
    });
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
            Welcome back
          </CardTitle>
          <CardDescription
            className={cn("text-muted-foreground", "font-medium")}
          >
            Sign in to manage packaging orders.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className={cn("px-0")}>
          <form onSubmit={handleSignIn}>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="lg" className={cn("w-full", "mt-6")}>
              Sign in
            </Button>
          </form>
        </CardContent>

        <Separator />

        <CardFooter>
          <div className={cn("w-full", "text-center text-sm")}>
            <span className={cn("text-sm", "text-muted-foreground")}>
              No account?{" "}
            </span>
            <Link
              to="/register"
              className={cn("font-semibold", "underline")}
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

SignInForm.displayName = "SignInForm";
