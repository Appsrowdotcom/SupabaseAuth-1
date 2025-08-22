import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, UserPlus, Loader2 } from "lucide-react";
import { z } from "zod";

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError("");

    try {
      await signUp(data.email, data.password, data.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Create account</h2>
          <p className="mt-2 text-slate-600">Join our project management platform</p>
        </div>

        <Card className="border border-slate-200">
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    data-testid="input-signup-email"
                    {...form.register("email")}
                    className="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600" data-testid="error-signup-email">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    data-testid="input-signup-password"
                    {...form.register("password")}
                    className="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors duration-200"
                    placeholder="Create a password"
                  />
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600" data-testid="error-signup-password">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    data-testid="input-confirm-password"
                    {...form.register("confirmPassword")}
                    className="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors duration-200"
                    placeholder="Confirm your password"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600" data-testid="error-confirm-password">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </Label>
                  <Select onValueChange={(value) => form.setValue("role", value as "pm" | "team_member")}>
                    <SelectTrigger data-testid="select-role" className="appearance-none relative block w-full px-3 py-3 border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors duration-200">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pm" data-testid="option-pm">Project Manager</SelectItem>
                      <SelectItem value="team_member" data-testid="option-team-member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.role && (
                    <p className="mt-1 text-sm text-red-600" data-testid="error-role">
                      {form.formState.errors.role.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center" data-testid="error-signup-message">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-create-account"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-secondary hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors duration-200"
                >
                  {isLoading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    data-testid="link-signin"
                    className="font-medium text-secondary hover:text-indigo-600 transition-colors"
                  >
                    Sign in
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
