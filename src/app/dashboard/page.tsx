import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PlacementCard from "@/components/PlacementCard"
import PlacementList from "@/components/PlacementList"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"
import GmailMonitorToggle from "@/components/GmailMonitorToggle"

export default async function Dashboard() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track your placement opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Opportunity
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <GmailMonitorToggle />

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-primary mb-2">Welcome, {session.user.name}!</h2>
          <p className="text-primary/80">
            Get started by connecting your Gmail account to automatically detect placement emails.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
            <p className="text-muted-foreground text-sm">No upcoming deadlines</p>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Applications</h3>
            <p className="text-muted-foreground text-sm">No applications yet</p>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Opportunities:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Applied:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Selected:</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Opportunities</h2>
          <PlacementList />
        </div>
      </div>
    </div>
  )
}
