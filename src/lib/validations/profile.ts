import { z } from "zod"

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number").optional().or(z.literal("")),
  college: z.string().min(2, "College name must be at least 2 characters").optional().or(z.literal("")),
  collegeEmail: z.string().email("Invalid college email address"),
  branch: z.string().min(2, "Branch must be at least 2 characters").optional().or(z.literal("")),
  semester: z.number().int().min(1).max(8).optional(),
  cgpa: z.number().min(0).max(10).optional(),
  graduationYear: z.number().int().min(2024).max(2030).optional(),
  skills: z.string().optional(),
  resume: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  portfolio: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
  placementCellEmail: z.string().email("Invalid placement cell email address"),
})

export type ProfileFormData = z.infer<typeof profileSchema>
