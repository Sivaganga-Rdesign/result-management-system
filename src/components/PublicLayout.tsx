import { GraduationCap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 flex items-center justify-between border-b bg-card px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold">ResultPro</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/admin/login">
            <Button variant="outline" size="sm">
              <Shield className="mr-2 h-4 w-4" />
              Admin Login
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
