import puppeteer from 'puppeteer'

export interface FormField {
  id: string
  label: string
  type: 'text' | 'paragraph' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'time'
  options?: string[]
  required: boolean
}

export interface FormStructure {
  formUrl: string
  formId: string
  title: string
  fields: FormField[]
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  branch: string
  year: string
  cgpa: string
  skills: string[]
  experience: string
}

export class PuppeteerFormService {
  private browser: any = null

  /**
   * Initialize Puppeteer browser
   */
  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    return this.browser
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Resolve short URL to full URL
   */
  async resolveShortUrl(shortUrl: string): Promise<string> {
    try {
      const browser = await this.initializeBrowser()
      const page = await browser.newPage()
      
      await page.goto(shortUrl, { waitUntil: 'networkidle2' })
      const fullUrl = page.url()
      
      await page.close()
      
      console.log(`Resolved ${shortUrl} to ${fullUrl}`)
      return fullUrl
    } catch (error) {
      console.error('Error resolving short URL:', error)
      return shortUrl // Return original if resolution fails
    }
  }

  /**
   * Extract form structure using Puppeteer
   */
  async extractFormStructure(formUrl: string): Promise<FormStructure | null> {
    try {
      // Resolve short URL first
      const resolvedUrl = await this.resolveShortUrl(formUrl)
      
      const browser = await this.initializeBrowser()
      const page = await browser.newPage()

      console.log('Navigating to form:', resolvedUrl)
      await page.goto(resolvedUrl, { waitUntil: 'networkidle2' })

      // Wait for form to load
      await page.waitForSelector('form, .freebirdFormView, input, textarea', { timeout: 10000 })

      // Extract form title
      const title = await page.evaluate(() => {
        const titleElement = document.querySelector('.freebirdFormTitle, .form-title, h1')
        return titleElement?.textContent?.trim() || 'Google Form'
      })

      // Extract form fields
      const fields = await page.evaluate(() => {
        const fieldElements = document.querySelectorAll('[data-item-id], [data-item-id^="entry."], .freebirdFormComponentsQuestionBaseRoot')
        const extractedFields: any[] = []

        fieldElements.forEach((element, index) => {
          const itemId = element.getAttribute('data-item-id')
          if (!itemId) return

          // Get label
          const labelElement = element.querySelector('.freebirdFormComponentsQuestionBaseTitle, .question-label, label')
          const label = labelElement?.textContent?.trim() || `Field ${index + 1}`

          // Determine field type
          let type = 'text'
          const options: string[] = []

          if (element.querySelector('input[type="text"]')) {
            type = 'text'
          } else if (element.querySelector('textarea')) {
            type = 'paragraph'
          } else if (element.querySelector('select')) {
            type = 'dropdown'
            const selectOptions = element.querySelectorAll('select option')
            selectOptions.forEach(opt => {
              if ((opt as HTMLOptionElement).value) options.push(opt.textContent?.trim() || '')
            })
          } else if (element.querySelector('input[type="radio"]')) {
            type = 'radio'
            const radioOptions = element.querySelectorAll('input[type="radio"]')
            radioOptions.forEach(radio => {
              const label = radio.parentElement?.textContent?.trim()
              if (label) options.push(label)
            })
          } else if (element.querySelector('input[type="checkbox"]')) {
            type = 'checkbox'
            const checkboxOptions = element.querySelectorAll('input[type="checkbox"]')
            checkboxOptions.forEach(checkbox => {
              const label = checkbox.parentElement?.textContent?.trim()
              if (label) options.push(label)
            })
          } else if (element.querySelector('input[type="date"]')) {
            type = 'date'
          } else if (element.querySelector('input[type="time"]')) {
            type = 'time'
          }

          // Check if required
          const required = element.querySelector('[aria-required="true"], .required') !== null

          extractedFields.push({
            id: itemId,
            label,
            type,
            options: options.length > 0 ? options : undefined,
            required
          })
        })

        return extractedFields
      })

      await page.close()

      const formId = this.extractFormId(resolvedUrl)

      console.log(`Extracted ${fields.length} fields from form`)

      return {
        formUrl: resolvedUrl,
        formId: formId || 'unknown',
        title,
        fields
      }
    } catch (error) {
      console.error('Error extracting form structure:', error)
      return null
    }
  }

  /**
   * Fill Google Form using Puppeteer
   */
  async fillForm(formUrl: string, userProfile: UserProfile): Promise<{ success: boolean; filledUrl?: string; error?: string }> {
    try {
      const browser = await this.initializeBrowser()
      const page = await browser.newPage()

      console.log('Navigating to form for filling:', formUrl)
      await page.goto(formUrl, { waitUntil: 'networkidle2' })

      // Wait for form to load
      await page.waitForSelector('form, .freebirdFormView', { timeout: 10000 })

      // Extract form structure first
      const formStructure = await this.extractFormStructure(formUrl)
      if (!formStructure) {
        await page.close()
        return { success: false, error: 'Failed to extract form structure' }
      }

      // Map user profile to form fields
      const fieldMappings = this.mapUserProfileToFields(userProfile, formStructure.fields)

      // Fill each field
      for (const [fieldId, value] of Object.entries(fieldMappings)) {
        if (!value) continue

        try {
          await page.evaluate((fieldId: string, value: string) => {
            const fieldElement = document.querySelector(`[data-item-id="${fieldId}"]`)
            if (!fieldElement) return

            // Try different input types
            const textInput = fieldElement.querySelector('input[type="text"]') as HTMLInputElement
            const emailInput = fieldElement.querySelector('input[type="email"]') as HTMLInputElement
            const phoneInput = fieldElement.querySelector('input[type="tel"]') as HTMLInputElement
            const textarea = fieldElement.querySelector('textarea') as HTMLTextAreaElement
            const select = fieldElement.querySelector('select') as HTMLSelectElement

            if (textInput) {
              textInput.value = value
              textInput.dispatchEvent(new Event('input', { bubbles: true }))
              textInput.dispatchEvent(new Event('change', { bubbles: true }))
            } else if (emailInput) {
              emailInput.value = value
              emailInput.dispatchEvent(new Event('input', { bubbles: true }))
              emailInput.dispatchEvent(new Event('change', { bubbles: true }))
            } else if (phoneInput) {
              phoneInput.value = value
              phoneInput.dispatchEvent(new Event('input', { bubbles: true }))
              phoneInput.dispatchEvent(new Event('change', { bubbles: true }))
            } else if (textarea) {
              textarea.value = value
              textarea.dispatchEvent(new Event('input', { bubbles: true }))
              textarea.dispatchEvent(new Event('change', { bubbles: true }))
            } else if (select) {
              select.value = value
              select.dispatchEvent(new Event('change', { bubbles: true }))
            }
          }, fieldId, value)

          console.log(`Filled field ${fieldId} with value: ${value}`)
        } catch (error) {
          console.error(`Error filling field ${fieldId}:`, error)
        }
      }

      // Wait a moment for form to process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get the current URL (form should be filled)
      const filledUrl = page.url()

      await page.close()

      console.log('Form filled successfully')

      return { success: true, filledUrl }
    } catch (error) {
      console.error('Error filling form:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Map user profile to form fields
   */
  private mapUserProfileToFields(userProfile: UserProfile, fields: FormField[]): Record<string, string> {
    const mappings: Record<string, string> = {}

    for (const field of fields) {
      const label = field.label.toLowerCase()

      if (label.includes('name') && !label.includes('user')) {
        mappings[field.id] = userProfile.name
      } else if (label.includes('email')) {
        mappings[field.id] = userProfile.email
      } else if (label.includes('phone') || label.includes('mobile') || label.includes('contact')) {
        mappings[field.id] = userProfile.phone
      } else if (label.includes('branch') || label.includes('department') || label.includes('stream')) {
        mappings[field.id] = userProfile.branch
      } else if (label.includes('year') || label.includes('batch')) {
        mappings[field.id] = userProfile.year
      } else if (label.includes('cgpa') || label.includes('gpa') || label.includes('percentage')) {
        mappings[field.id] = userProfile.cgpa
      } else if (label.includes('skill')) {
        mappings[field.id] = userProfile.skills.join(', ')
      } else if (label.includes('experience') || label.includes('work')) {
        mappings[field.id] = userProfile.experience
      }
    }

    return mappings
  }

  /**
   * Extract form ID from URL
   */
  private extractFormId(formUrl: string): string | null {
    const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,
      /formId=([a-zA-Z0-9_-]+)/,
      /\/viewform\?form=([a-zA-Z0-9_-]+)/
    ]

    for (const pattern of patterns) {
      const match = formUrl.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }
}

export function createPuppeteerFormService(): PuppeteerFormService {
  return new PuppeteerFormService()
}
