import { auth } from "@/lib/auth"
import User from "@/models/User"
import connectDB from "@/lib/mongodb"

export interface UserProfile {
  name?: string
  email?: string
  phone?: string
  college?: string
  branch?: string
  semester?: number
  cgpa?: number
  graduationYear?: number
  skills?: string[]
  linkedin?: string
  github?: string
  portfolio?: string
}

export class AutoFillService {
  async getUserProfile(userId: string): Promise<UserProfile> {
    await connectDB()
    
    const user = await User.findById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    return {
      name: user.name || undefined,
      email: user.email || undefined,
      phone: user.profile?.phone || undefined,
      college: user.profile?.college || undefined,
      branch: user.profile?.branch || undefined,
      semester: user.profile?.semester,
      cgpa: user.profile?.cgpa,
      graduationYear: user.profile?.graduationYear,
      skills: user.profile?.skills || [],
      linkedin: user.profile?.linkedin || undefined,
      github: user.profile?.github || undefined,
      portfolio: user.profile?.portfolio || undefined
    }
  }

  generateAutoFillScript(profile: UserProfile, applicationUrl: string): string {
    return `
      (function() {
        const profile = ${JSON.stringify(profile)};
        
        // Common field name patterns
        const fieldPatterns = {
          name: ['name', 'full_name', 'fullname', 'first_name', 'applicant_name'],
          email: ['email', 'email_address', 'applicant_email'],
          phone: ['phone', 'phone_number', 'mobile', 'contact'],
          college: ['college', 'university', 'institution', 'school'],
          branch: ['branch', 'department', 'major', 'stream'],
          semester: ['semester', 'current_semester'],
          cgpa: ['cgpa', 'gpa', 'percentage', 'marks'],
          graduationYear: ['graduation_year', 'passing_year', 'year'],
          skills: ['skills', 'technical_skills', 'key_skills'],
          linkedin: ['linkedin', 'linkedin_url', 'linkedin_profile'],
          github: ['github', 'github_url', 'github_profile'],
          portfolio: ['portfolio', 'website', 'portfolio_url']
        };

        // Function to find and fill input fields
        function fillField(patterns: string[], value: any) {
          if (!value && value !== 0) return;
          
          const stringValue = String(value);
          patterns.forEach(pattern => {
            // Try by name attribute
            const byName = document.querySelector(\`[name="\${pattern}"]\`);
            if (byName) {
              byName.value = stringValue;
              byName.dispatchEvent(new Event('input', { bubbles: true }));
              byName.dispatchEvent(new Event('change', { bubbles: true }));
              return;
            }
            
            // Try by id
            const byId = document.getElementById(pattern);
            if (byId) {
              byId.value = stringValue;
              byId.dispatchEvent(new Event('input', { bubbles: true }));
              byId.dispatchEvent(new Event('change', { bubbles: true }));
              return;
            }
            
            // Try by placeholder
            const byPlaceholder = document.querySelector(\`[placeholder*="\${pattern}"]\`);
            if (byPlaceholder) {
              byPlaceholder.value = stringValue;
              byPlaceholder.dispatchEvent(new Event('input', { bubbles: true }));
              byPlaceholder.dispatchEvent(new Event('change', { bubbles: true }));
              return;
            }
          });
        }

        // Fill basic fields
        fillField(fieldPatterns.name, profile.name || '');
        fillField(fieldPatterns.email, profile.email || '');
        fillField(fieldPatterns.phone, profile.phone || '');
        fillField(fieldPatterns.college, profile.college || '');
        fillField(fieldPatterns.branch, profile.branch || '');
        fillField(fieldPatterns.semester, profile.semester || '');
        fillField(fieldPatterns.cgpa, profile.cgpa || '');
        fillField(fieldPatterns.graduationYear, profile.graduationYear || '');

        // Fill skills (comma-separated)
        if (profile.skills && profile.skills.length > 0) {
          const skillsText = profile.skills.join(', ');
          fillField(fieldPatterns.skills, skillsText);
        }

        // Fill social links
        fillField(fieldPatterns.linkedin, profile.linkedin || '');
        fillField(fieldPatterns.github, profile.github || '');
        fillField(fieldPatterns.portfolio, profile.portfolio || '');

        console.log('Auto-fill completed for:', applicationUrl);
      })();
    `
  }

  async generateAutoFillLink(applicationUrl: string, userId: string): Promise<string> {
    const profile = await this.getUserProfile(userId)
    const script = this.generateAutoFillScript(profile, applicationUrl)
    
    // Create a data URL with the auto-fill script
    const encodedScript = encodeURIComponent(script)
    return `javascript:${encodedScript}`
  }
}

export function createAutoFillService(): AutoFillService {
  return new AutoFillService()
}
