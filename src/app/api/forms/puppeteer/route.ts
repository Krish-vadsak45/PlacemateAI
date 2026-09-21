import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import User from '@/models/User'
import { createPuppeteerFormService } from '@/lib/puppeteer-form-service'
import connectDB from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { formUrl } = await request.json()

    if (!formUrl) {
      return NextResponse.json({ success: false, error: 'Form URL is required' }, { status: 400 })
    }

    await connectDB()

    // Get user profile
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Prepare user profile for Puppeteer
    const userProfile = {
      name: user.name || '',
      email: user.email || '',
      phone: user.profile?.phone || '',
      branch: user.profile?.branch || '',
      year: user.profile?.year || '',
      cgpa: user.profile?.cgpa?.toString() || '',
      skills: user.profile?.skills || [],
      experience: user.profile?.experience || ''
    }

    console.log('Starting Puppeteer form fill for:', formUrl)
    console.log('User profile:', userProfile)

    // Initialize Puppeteer service
    const puppeteerService = createPuppeteerFormService()

    try {
      // Extract form structure first
      const formStructure = await puppeteerService.extractFormStructure(formUrl)
      console.log('Form structure extracted:', formStructure)

      if (!formStructure) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to extract form structure' 
        }, { status: 500 })
      }

      // Fill the form
      const result = await puppeteerService.fillForm(formUrl, userProfile)
      console.log('Form fill result:', result)

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error || 'Failed to fill form' 
        }, { status: 500 })
      }

      // Close browser when done
      await puppeteerService.closeBrowser()

      return NextResponse.json({
        success: true,
        filledUrl: result.filledUrl,
        formStructure,
        userProfile
      })

    } catch (puppeteerError) {
      console.error('Puppeteer error:', puppeteerError)
      await puppeteerService.closeBrowser()
      
      return NextResponse.json({ 
        success: false, 
        error: puppeteerError instanceof Error ? puppeteerError.message : 'Puppeteer operation failed' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}
