import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PlacementCard from "@/components/PlacementCard"
import PlacementList from "@/components/PlacementList"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Sparkles, Calendar, TrendingUp, Target } from "lucide-react"
import GmailMonitorToggle from "@/components/GmailMonitorToggle"

export default async function Dashboard() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">Track your placement opportunities</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-red-500/50 hover:bg-red-500/10 transition-all">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 transition-all">
              <Plus className="h-4 w-4" />
              Add Opportunity
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Gmail Monitor Toggle */}
          <GmailMonitorToggle />

          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 shadow-lg hover:scale-[1.01] transition-transform">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md animate-bounce">
                <Sparkles className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Welcome, {session.user.name}!
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Get started by connecting your Gmail account to automatically detect placement emails.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Upcoming Deadlines</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">No upcoming deadlines</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Applications</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">No applications yet</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Statistics</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
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
            </div>
          </div>

          {/* Recent Opportunities */}
          <div>
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 bg-clip-text text-transparent">
              Recent Opportunities
            </h2>
            <PlacementList />
          </div>
        </div>
      </div>
    </div>
  )
}
