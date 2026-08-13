import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Save, User as UserIcon, Mail, Phone, GraduationCap, Link, Code, Globe } from "lucide-react"

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and skills</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            This information will be used to auto-fill application forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" defaultValue={session.user.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input id="email" type="email" defaultValue={session.user.email || ""} disabled />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College Name</Label>
                <Input id="college" placeholder="Your College" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input id="branch" placeholder="Computer Engineering" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Current Semester</Label>
                <Input id="semester" type="number" placeholder="6" min="1" max="8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cgpa">CGPA</Label>
                <Input id="cgpa" type="number" step="0.01" placeholder="8.5" min="0" max="10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input id="graduationYear" type="number" placeholder="2027" min="2024" max="2030" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Technical Skills</Label>
              <Textarea 
                id="skills" 
                placeholder="JavaScript, React, Node.js, MongoDB, Python, etc."
                rows={3}
              />
              <p className="text-sm text-gray-500">Separate skills with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume Link</Label>
              <Input id="resume" placeholder="https://drive.google.com/your-resume" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input id="linkedin" placeholder="https://linkedin.com/in/your-profile" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  GitHub
                </Label>
                <Input id="github" placeholder="https://github.com/your-username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Portfolio
                </Label>
                <Input id="portfolio" placeholder="https://your-portfolio.com" />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button variant="outline">Cancel</Button>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
