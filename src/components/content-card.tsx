import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ContentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function ContentCard({ title, children, className = "" }: ContentCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">{title}</CardTitle>
        <div className="flex justify-center">
          <Separator className="w-60 mt-4 mb-4" />
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
