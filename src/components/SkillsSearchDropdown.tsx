"use client"

import React, { useState, useRef, useEffect } from "react"
import { Search, X, Check, Code, Plus, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export const MASTER_SKILLS_CATALOG = [
  // Core CS Topics
  "Data Structures & Algorithms", "System Design", "Object-Oriented Programming (OOP)", 
  "Database Management Systems (DBMS)", "Operating Systems", "Computer Networks", 
  "Software Engineering", "Problem Solving",

  // Programming Languages
  "Python", "C++", "Java", "JavaScript", "TypeScript", "C", "C#", "Go", "Rust", 
  "Kotlin", "Swift", "PHP", "R", "SQL", "HTML5", "CSS3", "Bash / Shell", "Dart", 
  "Scala", "MATLAB", "Ruby",

  // Web Development
  "React.js", "Next.js", "Node.js", "Express.js", "Angular", "Vue.js", "Django", 
  "Flask", "FastAPI", "Spring Boot", "ASP.NET Core", "GraphQL", "REST APIs", 
  "Tailwind CSS", "Bootstrap", "Redux", "WebSockets", "Microservices", "jQuery",

  // AI, Machine Learning & Data Science
  "Machine Learning", "Deep Learning", "Artificial Intelligence", "Data Science", 
  "TensorFlow", "PyTorch", "Scikit-Learn", "OpenCV", "NLP (Natural Language Processing)", 
  "Computer Vision", "Pandas", "NumPy", "Generative AI", "LLMs (Large Language Models)", 
  "LangChain", "RAG Architecture", "Keras", "Matplotlib", "Seaborn",

  // Cloud & DevOps
  "AWS (Amazon Web Services)", "Google Cloud Platform (GCP)", "Microsoft Azure", 
  "Docker", "Kubernetes", "CI/CD Pipelines", "GitHub Actions", "Terraform", 
  "Linux / Unix", "Nginx", "Serverless Architecture", "Cloudflare",

  // Databases
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "SQLite", "Oracle DB", 
  "Cassandra", "Supabase", "DynamoDB", "Prisma ORM", "Elasticsearch",

  // Tools & Testing
  "Git", "GitHub", "GitLab", "Postman", "VS Code", "JIRA", "Figma", "Selenium", 
  "Puppeteer", "Jest", "Cypress", "Web Scraping",

  // Mobile, Security & Emerging Tech
  "Flutter", "React Native", "Android Development", "iOS Development", 
  "Cyber Security", "Ethical Hacking", "Blockchain", "Web3", "IoT (Internet of Things)", 
  "Embedded Systems"
]

interface SkillsSearchDropdownProps {
  selectedSkills: string[]
  onChange: (skills: string[]) => void
  maxSkills?: number
}

export default function SkillsSearchDropdown({
  selectedSkills = [],
  onChange,
  maxSkills = 20,
}: SkillsSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [customSkillInput, setCustomSkillInput] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredSkills = MASTER_SKILLS_CATALOG.filter((skill) =>
    skill.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const isMaxReached = selectedSkills.length >= maxSkills

  const toggleSkill = (skill: string) => {
    const trimmedSkill = skill.trim()
    if (!trimmedSkill) return

    if (selectedSkills.includes(trimmedSkill)) {
      onChange(selectedSkills.filter((s) => s !== trimmedSkill))
    } else {
      if (selectedSkills.length >= maxSkills) {
        return
      }
      onChange([...selectedSkills, trimmedSkill])
    }
  }

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim()
    if (trimmed && !selectedSkills.includes(trimmed)) {
      if (selectedSkills.length >= maxSkills) {
        return
      }
      onChange([...selectedSkills, trimmed])
      setCustomSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    onChange(selectedSkills.filter((s) => s !== skillToRemove))
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search & Toggle Box */}
      <div className="relative">
        <div 
          onClick={() => setIsOpen(true)}
          className="min-h-[44px] w-full rounded-xl border border-border bg-card p-2 text-xs transition-all cursor-pointer hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 flex flex-wrap items-center gap-1.5"
        >
          {selectedSkills.length === 0 ? (
            <span className="text-muted-foreground flex items-center gap-2 px-2 py-1">
              <Search className="h-3.5 w-3.5" />
              Click to search &amp; select technical skills (Max {maxSkills})...
            </span>
          ) : (
            selectedSkills.map((skill) => (
              <span
                key={skill}
                className="glass-3d-pill inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150"
              >
                {skill}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSkill(skill)
                  }}
                  className="hover:bg-primary/20 rounded p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Counter Badge & Helper */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Code className="h-3 w-3" /> Select up to {maxSkills} skills matched for AI profile scoring
          </span>
          <span className={`font-bold ${isMaxReached ? "text-amber-500" : "text-foreground"}`}>
            {selectedSkills.length} / {maxSkills} Selected
          </span>
        </div>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="glass-3d-panel absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search Input Bar */}
            <div className="relative mb-2.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search skills (e.g. Python, React, AWS, Docker)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Max Warning Alert */}
            {isMaxReached && (
              <div className="mb-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Maximum limit of {maxSkills} skills reached. Deselect one to add another.</span>
              </div>
            )}

            {/* Skill Catalog List */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    disabled={!isSelected && isMaxReached}
                    onClick={() => toggleSkill(skill)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : isMaxReached
                        ? "opacity-50 cursor-not-allowed text-muted-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>{skill}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                )
              })}

              {filteredSkills.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No matching skills found.
                </div>
              )}
            </div>

            {/* Custom Skill Entry Bar */}
            <div className="mt-3 pt-2.5 border-t border-border flex items-center gap-2">
              <input
                type="text"
                placeholder="Add custom skill if not listed..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
                disabled={isMaxReached}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCustomSkill}
                disabled={!customSkillInput.trim() || isMaxReached}
                className="h-8 text-xs gap-1 rounded-xl shrink-0"
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
