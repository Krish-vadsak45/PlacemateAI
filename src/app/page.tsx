"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, Calendar, Brain, Zap, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  const featureVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-background to-secondary/20">
      <main className="flex-1">
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="container mx-auto px-4 py-20 text-center"
        >
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              PlaceMate AI
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-8"
              variants={itemVariants}
            >
              Your Personalized Placement Assistant
            </motion.p>
            <motion.p 
              className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Automatically convert placement emails into structured opportunities, create smart calendar reminders, 
              assist with application forms, and get AI-powered preparation guidance.
            </motion.p>
            <motion.div 
              className="flex gap-4 justify-center"
              variants={itemVariants}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/api/auth/signin">
                  <Button size="lg" className="gap-2">
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="#features">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section 
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="container mx-auto px-4 py-20"
        >
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            variants={itemVariants}
          >
            Key Features
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-card p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Briefcase className="h-12 w-12 text-primary mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Email Detection</h3>
              <p className="text-muted-foreground">
                Automatically detect placement emails from your inbox using AI-powered classification
              </p>
            </motion.div>
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-card p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Calendar className="h-12 w-12 text-primary mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Smart Reminders</h3>
              <p className="text-muted-foreground">
                Never miss a deadline with automatic Google Calendar events and reminders
              </p>
            </motion.div>
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-card p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Zap className="h-12 w-12 text-primary mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Form Assistant</h3>
              <p className="text-muted-foreground">
                Auto-fill application forms with your profile information to save time
              </p>
            </motion.div>
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-card p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Brain className="h-12 w-12 text-primary mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">AI Preparation</h3>
              <p className="text-muted-foreground">
                Get personalized interview questions and preparation guidance for each role
              </p>
            </motion.div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-primary text-primary-foreground py-20"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Placement Journey?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of students who never miss an opportunity with PlaceMate AI
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/api/auth/signin">
                <Button size="lg" variant="secondary" className="gap-2">
                  Start Free Today
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}
