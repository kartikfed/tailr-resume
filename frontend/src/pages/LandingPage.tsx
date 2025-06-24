import type React from "react"
import { Button } from '../components/landing/ui/button';
import { Badge } from "../components/landing/ui/badge"
import { ArrowRight, Target, Zap, BarChart3, Sparkles, Eye, Users, TrendingUp } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext";

export const LandingPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)

    // Trigger animations after component mounts
    setTimeout(() => setIsVisible(true), 100)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  }

  const handleGetStarted = () => {
    navigate('/register');
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 100
            ? "bg-white/98 backdrop-blur-xl border-b border-gray-200 shadow-sm"
            : "bg-white/95 backdrop-blur-lg border-b border-gray-100"
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Tailr
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium"
            >
              How it Works
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
                <Button onClick={handleDashboard} variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
                    Dashboard
                </Button>
            ) : (
                <Button onClick={handleSignIn} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                    Sign In
                </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div
              className={`transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                ✨ AI-Powered Career Assistant
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Stop Blending In.
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Start Standing Out.
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Tailr is your personal AI career stylist, crafting perfectly fitted resumes that land interviews. In a
                sea of generic applications, we make sure yours is the one they can't ignore.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Transform Your Resume
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 border-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                >
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Floating Cards Animation */}
            <div className="relative h-96 lg:h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <FloatingCard
                  delay={0}
                  position="top-4 left-4"
                  icon="📊"
                  title="AI Analysis"
                  description="Decode job requirements instantly"
                />
                <FloatingCard
                  delay={2000}
                  position="top-20 right-8"
                  icon="✨"
                  title="Smart Tailoring"
                  description="Perfect fit, every time"
                />
                <FloatingCard
                  delay={4000}
                  position="bottom-8 left-12"
                  icon="🎯"
                  title="Land Interviews"
                  description="Stand out from the crowd"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Your Resume is Your First Impression. Make it Count.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              The average recruiter spends just 7 seconds scanning a resume. In that time, they're not just looking for
              experience; they're looking for a perfect match. A generic, one-size-fits-all resume rarely makes the cut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StatCard
              number="7"
              unit="Seconds"
              description="Average time recruiters spend on your resume"
              icon={<Eye className="w-6 h-6" />}
              delay={100}
            />
            <StatCard
              number="75%"
              unit="Rejection Rate"
              description="Of resumes never reach human eyes due to poor keyword matching"
              icon={<TrendingUp className="w-6 h-6" />}
              delay={200}
            />
            <StatCard
              number="250+"
              unit="Applications"
              description="Average number per job posting. You need to stand out."
              icon={<Users className="w-6 h-6" />}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Bespoke Resumes, Intelligently Crafted.</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Tailr is here to change the game. We've built a powerful AI platform that treats every job application
                like a custom suit fitting. Our technology deconstructs job descriptions to understand their unique
                DNA—the keywords, skills, and qualifications that matter most.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-indigo-100">
              <ProcessStep
                number={1}
                title="Upload Your Resume"
                description="Support for PDF, DOCX, and TXT formats"
                delay={100}
              />
              <ProcessStep
                number={2}
                title="Paste Job Description"
                description="AI analyzes requirements and keywords"
                delay={200}
              />
              <ProcessStep
                number={3}
                title="Get Tailored Suggestions"
                description="Actionable, data-driven improvements"
                delay={300}
              />
              <ProcessStep
                number={4}
                title="Land the Interview"
                description="A perfectly fitted application"
                delay={400}
                isLast={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Core Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed to give you an unfair advantage in the job market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Target className="w-8 h-8" />}
              title="AI-Powered Job Analysis"
              description="Our AI reads between the lines. Just provide a job description, and Tailr instantly identifies critical skills, keywords, and qualifications. It's like having a cheat sheet for what the hiring manager wants to see."
              delay={100}
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Intelligent Resume Optimization"
              description="This is where the magic happens. Tailr provides a side-by-side comparison of job requirements and your resume, offering clear, actionable suggestions."
              delay={200}
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Smart Application Dashboard"
              description="Say goodbye to cluttered folders and confusing spreadsheets. Tailr provides an elegant dashboard to manage all your applications and track their status."
              delay={300}
            />
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">Tailr</span>
              </div>
              <p className="text-gray-400">Your personal AI career stylist for perfectly fitted resumes.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Tailr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Floating Card Component
function FloatingCard({
  delay,
  position,
  icon,
  title,
  description,
}: {
  delay: number
  position: string
  icon: string
  title: string
  description: string
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), delay)
  }, [delay])

  return (
    <div
      className={`absolute ${position} transform transition-all duration-1000 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{
        animation: isVisible ? `float 6s ease-in-out infinite ${delay}ms` : "none",
      }}
    >
      <div className="bg-white/90 backdrop-blur-xl border border-indigo-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
        <div className="text-2xl mb-2">{icon}</div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  number,
  unit,
  description,
  icon,
  delay,
}: {
  number: string
  unit: string
  description: string
  icon: React.ReactNode
  delay: number
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transform transition-all duration-500 hover:-translate-y-2 hover:border-indigo-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
          {icon}
        </div>
      </div>
      <div className="text-4xl font-bold text-indigo-600 mb-2">{number}</div>
      <h4 className="font-semibold text-gray-900 mb-2">{unit}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

// Process Step Component
function ProcessStep({
  number,
  title,
  description,
  delay,
  isLast = false,
}: {
  number: number
  title: string
  description: string
  delay: number
  isLast?: boolean
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`flex items-center p-4 rounded-xl transition-all duration-500 hover:bg-indigo-50 hover:translate-x-2 group ${
        !isLast ? "mb-4" : ""
      } ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
    >
      <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 group-hover:scale-110 transition-transform duration-200">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  )
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transform transition-all duration-500 hover:-translate-y-3 hover:border-indigo-300 group relative overflow-hidden ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}