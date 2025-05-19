"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { AccountForm } from "./account-form";
import { WardMemberships } from "./components/WardMemberships";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="wards">My Wards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6">
          <Suspense fallback={<SkeletonCard />}>
            <AccountForm />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="wards" className="space-y-6">
          <Suspense fallback={<SkeletonCard />}>
            <WardMemberships />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
} 