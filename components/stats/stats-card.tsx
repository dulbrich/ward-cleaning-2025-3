"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
}

export default function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}
