import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      await signIn(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Welcome back</h2>
          <p className="mt-2 text-slate-600">Sign in to your account</p>
        </div>

        <Card className="border border-slate-200">
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    {...form.register("email")}
                    className="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600" data-testid="error-email">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    data-testid="input-password"
                    {...form.register("password")}
                    className="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition-colors duration-200"
                    placeholder="Enter your password"
                  />
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600" data-testid="error-password">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center" data-testid="error-message">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-signin"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                >
                  {isLoading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    data-testid="link-signup"
                    className="font-medium text-primary hover:text-blue-600 transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
