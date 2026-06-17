import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Lock, UserCircle } from "lucide-react";
import { ProfileIdentityCard } from "@/components/account/ProfileIdentityCard";
import { ProfileInfoForm } from "@/components/account/ProfileInfoForm";
import { ProfilePasswordForm } from "@/components/account/ProfilePasswordForm";
import { NotificationSettings } from "@/components/account/NotificationSettings";
import { DashboardSectionCard } from "@/components/dashboard/DashboardSectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dashboardSectionStack } from "@/lib/dashboard-mobile";

export function ProfilePageContent() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });

  const profileUser = data?.user ?? user;

  if (!user) return null;

  return (
    <div className={`max-w-3xl ${dashboardSectionStack}`}>
      {isLoading || !profileUser ? (
        <div className="h-44 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <ProfileIdentityCard user={profileUser} />
      )}

      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="mb-1 flex h-auto w-full flex-wrap gap-1.5 bg-transparent p-0 sm:gap-2">
          <TabsTrigger
            value="informations"
            className="tea-water-fill-none h-10 flex-1 rounded-xl border-2 border-border/50 bg-card px-3 text-xs font-semibold data-[state=active]:border-primary/45 data-[state=active]:bg-primary/15 data-[state=active]:text-primary sm:h-11 sm:flex-none sm:px-5 sm:text-sm"
          >
            <UserCircle className="mr-1.5 size-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger
            value="securite"
            className="tea-water-fill-none h-10 flex-1 rounded-xl border-2 border-border/50 bg-card px-3 text-xs font-semibold data-[state=active]:border-primary/45 data-[state=active]:bg-primary/15 data-[state=active]:text-primary sm:h-11 sm:flex-none sm:px-5 sm:text-sm"
          >
            <Lock className="mr-1.5 size-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="tea-water-fill-none h-10 flex-1 rounded-xl border-2 border-border/50 bg-card px-3 text-xs font-semibold data-[state=active]:border-primary/45 data-[state=active]:bg-primary/15 data-[state=active]:text-primary sm:h-11 sm:flex-none sm:px-5 sm:text-sm"
          >
            <Bell className="mr-1.5 size-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informations" className="mt-4">
          <DashboardSectionCard
            title="Modifier mes informations"
            subtitle="Nom, email, téléphone et ville"
          >
            <ProfileInfoForm onSaved={() => qc.invalidateQueries({ queryKey: ["profile"] })} />
          </DashboardSectionCard>
        </TabsContent>

        <TabsContent value="securite" className="mt-4">
          <DashboardSectionCard title="Mot de passe" subtitle="Protège l'accès à ton compte EZOA-TO">
            <ProfilePasswordForm />
          </DashboardSectionCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
