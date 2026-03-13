"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { TalentRadarChart } from "@/components/talent-map/TalentRadarChart";
import { TalentScoreList } from "@/components/talent-map/TalentScoreList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTalentProfileStore } from "@/store/talent-profile.store";

export default function TalentMapPage() {
  const { dimensions, topTalents, avoidanceAreas, profileComplete } = useTalentProfileStore();
  const hasData = dimensions.some((d) => d.score > 0);

  if (!hasData) {
    return (
      <div className="max-w-2xl mx-auto">
        <AnimatedSection>
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Your Talent Map is Empty</h2>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">
              Complete at least one assessment to start building your talent profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ikigai">
                <Button>Start Ikigai Generator <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
              <Link href="/scenarios">
                <Button variant="outline">Try Scenario Tests</Button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Your Talent Map</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Aggregated from all your assessments
            </p>
          </div>
          {topTalents.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {topTalents.slice(0, 2).map((t) => (
                <Badge key={t} variant="default">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      </AnimatedSection>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Radar Chart */}
        <AnimatedSection delay={0.1}>
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
                Competency Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TalentRadarChart dimensions={dimensions} />
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Score List + Avoidance */}
        <div className="space-y-4">
          <AnimatedSection delay={0.2}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
                  Dimension Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TalentScoreList dimensions={dimensions} />
              </CardContent>
            </Card>
          </AnimatedSection>

          {avoidanceAreas.length > 0 && (
            <AnimatedSection delay={0.3}>
              <Card className="border-[var(--accent)]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[var(--accent)]">Avoid in Career Paths</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {avoidanceAreas.map((a) => (
                      <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          )}

          <AnimatedSection delay={0.35}>
            <Link href="/roadmap">
              <Button className="w-full">
                Generate My Roadmap <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
