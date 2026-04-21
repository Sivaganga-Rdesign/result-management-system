import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, GraduationCap, ArrowLeft, BookOpen, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (adminLogin(password)) {
        toast({ title: "Welcome, Admin!", description: "You have been logged in successfully." });
        navigate("/admin/dashboard");
      } else {
        toast({ title: "Login Failed", description: "Incorrect password. Please try again.", variant: "destructive" });
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-primary overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary" />
          <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-secondary/50" />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <GraduationCap className="h-7 w-7 text-secondary-foreground" />
            </div>
            <div>
              <span className="font-serif text-2xl text-primary-foreground">ResultPro</span>
              <p className="text-primary-foreground/60 text-xs">Management System</p>
            </div>
          </div>

          {/* Center content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-serif text-primary-foreground leading-tight">
                Manage Academic<br />
                Results with<br />
                <span className="text-secondary">Confidence.</span>
              </h1>
              <p className="text-primary-foreground/70 mt-4 text-lg max-w-md">
                A comprehensive platform to manage students, track performance, and generate insightful analytics.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md">
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10">
                <Users className="h-6 w-6 text-secondary mb-2" />
                <p className="text-sm font-medium text-primary-foreground">Student Management</p>
              </div>
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10">
                <BookOpen className="h-6 w-6 text-secondary mb-2" />
                <p className="text-sm font-medium text-primary-foreground">Result Tracking</p>
              </div>
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10">
                <BarChart3 className="h-6 w-6 text-secondary mb-2" />
                <p className="text-sm font-medium text-primary-foreground">Class Analytics</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-primary-foreground/40 text-sm">
            © {new Date().getFullYear()} ResultPro Academy. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Back button */}
        <div className="p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Student Portal
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl">ResultPro</span>
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                <Shield className="h-3 w-3" />
                Admin Access Only
              </div>
              <h2 className="text-3xl font-serif">Welcome Back</h2>
              <p className="text-muted-foreground">Enter your admin credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-11 h-12 text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Sign In to Dashboard
                  </span>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Hint</span>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Default password: <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-foreground">admin123</code>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
