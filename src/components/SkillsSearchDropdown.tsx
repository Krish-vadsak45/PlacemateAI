"use client"

import React, { useState, useRef, useEffect } from "react"
import { Search, X, Check, Code, Plus, AlertCircle, ChevronDown } from "lucide-react"
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
  selectedSkills?: string[] | string
  onChange: (skills: string[]) => void
  maxSkills?: number
}

// Safely normalize input into an array of trimmed strings
function parseSkills(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((s) => String(s).trim()).filter(Boolean)
  }
  if (typeof input === "string") {
    return input.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return []
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
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Local state for immediate reactivity
  const [currentSkills, setCurrentSkills] = useState<string[]>(() => parseSkills(selectedSkills))

  // Keep local state in sync when parent prop changes
  useEffect(() => {
    setCurrentSkills(parseSkills(selectedSkills))
  }, [selectedSkills])

  // Focus search input whenever dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const filteredSkills = MASTER_SKILLS_CATALOG.filter((skill) =>
    skill.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const isMaxReached = currentSkills.length >= maxSkills

  const toggleSkill = (skill: string) => {
    const trimmedSkill = skill.trim()
    if (!trimmedSkill) return

    const exists = currentSkills.some(
      (s) => s.toLowerCase() === trimmedSkill.toLowerCase()
    )

    let updated: string[]
    if (exists) {
      updated = currentSkills.filter(
        (s) => s.toLowerCase() !== trimmedSkill.toLowerCase()
      )
    } else {
      if (currentSkills.length >= maxSkills) {
        return
      }
      updated = [...currentSkills, trimmedSkill]
    }

    // Instantly update local UI
    setCurrentSkills(updated)
    // Notify parent
    onChange(updated)
  }

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim()
    if (!trimmed) return
    const exists = currentSkills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    )
    if (!exists) {
      if (currentSkills.length >= maxSkills) {
        return
      }
      const updated = [...currentSkills, trimmed]
      setCurrentSkills(updated)
      onChange(updated)
      setCustomSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const updated = currentSkills.filter(
      (s) => s.toLowerCase() !== skillToRemove.trim().toLowerCase()
    )
    setCurrentSkills(updated)
    onChange(updated)
  }

  return (
    <div className={`space-y-2 relative ${isOpen ? "z-40" : "z-10"}`} ref={containerRef}>
      {/* Search & Toggle Box */}
      <div 
        onClick={() => setIsOpen((prev) => !prev)}
        className={`min-h-[44px] w-full rounded-xl border bg-card p-2 text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
          isOpen ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/50"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {currentSkills.length === 0 ? (
            <span className="text-muted-foreground flex items-center gap-2 px-2 py-1 select-none">
              <Search className="h-3.5 w-3.5" />
              Click to search &amp; select technical skills (Max {maxSkills})...
            </span>
          ) : (
            currentSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 border border-primary/20 text-primary shadow-xs"
              >
                <span>{skill}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSkill(skill)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation()
                      removeSkill(skill)
                    }
                  }}
                  className="hover:bg-primary/20 rounded p-0.5 transition-colors cursor-pointer text-primary/70 hover:text-primary"
                  title={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground pr-1 shrink-0">
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
        </div>
      </div>

      {/* Counter Badge & Helper */}
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 font-medium">
          <Code className="h-3 w-3" /> Select up to {maxSkills} skills matched for AI profile scoring
        </span>
        <span className={`font-bold ${isMaxReached ? "text-amber-500" : "text-foreground"}`}>
          {currentSkills.length} / {maxSkills} Selected
        </span>
      </div>

      {/* Dropdown Panel: Positioned absolute directly below the trigger box */}
      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl p-3.5 shadow-2xl bg-card border border-border animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search skills (e.g. Python, React, AWS, Docker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (filteredSkills.length > 0) {
                    toggleSkill(filteredSkills[0])
                  } else if (searchQuery.trim() && !isMaxReached) {
                    toggleSkill(searchQuery.trim())
                    setSearchQuery("")
                  }
                }
              }}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Max Warning Alert */}
          {isMaxReached && (
            <div className="mb-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Maximum limit of {maxSkills} skills reached. Click any selected skill to deselect.</span>
            </div>
          )}

          {/* Skill Catalog List: Scrollable container */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredSkills.map((skill) => {
              const isSelected = currentSkills.some(
                (s) => s.toLowerCase() === skill.toLowerCase()
              )
              const isDisabled = !isSelected && isMaxReached

              return (
                <div
                  key={skill}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isDisabled) return
                    toggleSkill(skill)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      if (isDisabled) return
                      toggleSkill(skill)
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left select-none ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed text-muted-foreground"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{skill}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </div>
              )
            })}

            {filteredSkills.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <p>No matching skills found in catalog.</p>
                {searchQuery.trim() && !isMaxReached && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toggleSkill(searchQuery.trim())
                      setSearchQuery("")
                    }}
                    className="h-7 text-xs rounded-lg gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add &quot;{searchQuery.trim()}&quot;
                  </Button>
                )}
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
              className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addCustomSkill()}
              disabled={!customSkillInput.trim() || isMaxReached}
              className="h-8 text-xs gap-1 rounded-xl shrink-0 cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => setIsOpen(false)}
              className="h-8 text-xs rounded-xl shrink-0 cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
