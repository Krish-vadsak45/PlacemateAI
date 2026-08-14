import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export async function GET() {
  try {
    await connectDB()
    return NextResponse.json({ 
      status: 'success', 
      message: 'MongoDB connection successful' 
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
