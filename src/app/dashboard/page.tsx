import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PlacementCard from "@/components/PlacementCard"
import PlacementList from "@/components/PlacementList"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Sparkles, Calendar, TrendingUp, Target, Briefcase, CheckCircle, Clock } from "lucide-react"
import GmailMonitorToggle from "@/components/GmailMonitorToggle"

export default async function Dashboard() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gray-200 dark:bg-gray-800">
                <Briefcase className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 pl-1">
              Track your placement opportunities
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="default" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button size="default" className="gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200">
              <Plus className="h-4 w-4" />
              Add Opportunity
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Gmail Monitor Toggle */}
          <GmailMonitorToggle />

          {/* Welcome Card */}
          <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="relative flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800">
                <Sparkles className="h-8 w-8 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome, {session.user.name}!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Get started by connecting your Gmail account to automatically detect placement emails.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="relative flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <Clock className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Upcoming Deadlines</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">No upcoming deadlines</p>
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="relative flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <CheckCircle className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Applications</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">No applications yet</p>
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="relative flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <TrendingUp className="h-6 w-6 text-gray-700 dark:text-gray-300" />
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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800">
                <Briefcase className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Recent Opportunities
              </h2>
            </div>
            <PlacementList />
          </div>
        </div>
      </div>
    </div>
  )
}
