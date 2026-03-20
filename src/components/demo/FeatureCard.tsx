"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color: string;
  gradient: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  color,
  gradient,
}: FeatureCardProps) {
  const { data: session } = useSession();
  const router = useRouter();

  function handleClick() {
    if (session) {
      router.push(href);
    } else {
      void signIn("cognito", { redirectTo: href });
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`group p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br ${gradient} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full`}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <h3 className="font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
        {description}
      </p>
      <div
        className="flex items-center gap-1 mt-4 text-xs font-medium"
        style={{ color }}
      >
        Get started <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}
