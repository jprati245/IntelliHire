import { ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Branding Panel - Hidden on mobile */}
      <div className="relative hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/20" />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">IntelliHire</span>
          </div>

          {/* Hero Content */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Discover Your
              <br />
              Career Potential
            </h1>
            <p className="max-w-md text-lg text-primary-foreground/80">
              Take comprehensive assessments designed to identify your skills,
              aptitudes, and ideal career paths. Join thousands of professionals
              who have found their calling.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-primary-foreground/70">
                  Assessments Completed
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-primary-foreground/70">
                  User Satisfaction
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">200+</div>
                <div className="text-sm text-primary-foreground/70">
                  Career Paths
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-primary-foreground/60">
            © 2024 IntelliHire. All rights reserved.
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 border-b bg-primary p-4 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-primary-foreground">
            IntelliHire
          </span>
        </div>

        {/* Form Content */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
