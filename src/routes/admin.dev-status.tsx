import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Github, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequireAdmin } from "./admin";

const REPO_URL = "https://github.com/UlrichHippin/freshdream-booking";

export const Route = createFileRoute("/admin/dev-status")({
  component: () => (
    <RequireAdmin>
      <DevStatusPage />
    </RequireAdmin>
  ),
});

function DevStatusPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <p className="text-sm font-medium">Developer Status</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Github className="h-5 w-5" /> GitHub Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Repository</p>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all font-mono text-sm text-primary hover:underline"
              >
                {REPO_URL}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Internal developer reference only. Not visible on the public booking page.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
