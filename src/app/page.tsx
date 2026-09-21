"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, Calendar, Brain, Zap, ArrowRight, Sparkles, Target, TrendingUp, Shield } from "lucide-react"
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
    <div className="flex flex-col flex-1 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="flex-1">
        {/* Hero Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="container mx-auto px-4 py-20 md:py-32 text-center relative overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-20 -right-20 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"
            />
          </div>

          <motion.div variants={itemVariants} className="max-w-4xl mx-auto relative z-10">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Sparkles className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto" />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-red-600 via-red-500 to-red-600 dark:from-red-500 dark:via-red-400 dark:to-red-500 bg-clip-text text-transparent"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              PlaceMate AI
            </motion.h1>
            <motion.p 
              className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-4 font-semibold"
              variants={itemVariants}
            >
              Your Personalized Placement Assistant
            </motion.p>
            <motion.p 
              className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Automatically convert placement emails into structured opportunities, create smart calendar reminders, 
              assist with application forms, and get AI-powered preparation guidance.
            </motion.p>
            <motion.div 
              className="flex gap-4 justify-center flex-wrap"
              variants={itemVariants}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/api/auth/signin">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 text-white font-semibold px-8"
                  >
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="#features">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="gap-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 font-semibold px-8"
                  >
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="container mx-auto px-4 py-20 md:py-32"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 bg-clip-text text-transparent"
            >
              Key Features
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Everything you need to succeed in your placement journey
            </motion.p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3 } }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-red-500/30 transition-shadow">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Email Detection</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Automatically detect placement emails from your inbox using AI-powered classification
              </p>
            </motion.div>
            
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3 } }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-red-500/30 transition-shadow">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Smart Reminders</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Never miss a deadline with automatic Google Calendar events and reminders
              </p>
            </motion.div>
            
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3 } }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-red-500/30 transition-shadow">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Form Assistant</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Auto-fill application forms with your profile information to save time
              </p>
            </motion.div>
            
            <motion.div 
              variants={featureVariants}
              whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3 } }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-red-500/30 transition-shadow">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">AI Preparation</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Get personalized interview questions and preparation guidance for each role
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-r from-red-600 to-red-500 text-white py-20"
        >
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Target className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-4xl font-bold mb-2">1000+</h3>
                <p className="text-red-100">Placements Tracked</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-4xl font-bold mb-2">95%</h3>
                <p className="text-red-100">Success Rate</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-4xl font-bold mb-2">24/7</h3>
                <p className="text-red-100">AI Support</p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="py-20 md:py-32"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-8"
            >
              <Sparkles className="h-20 w-20 text-red-600 dark:text-red-400 mx-auto" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 bg-clip-text text-transparent">
              Ready to Transform Your Placement Journey?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of students who never miss an opportunity with PlaceMate AI
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/api/auth/signin">
                <Button 
                  size="lg" 
                  className="gap-2 bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 text-white font-semibold px-10 py-6 text-lg"
                >
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
