import Link from 'next/link';
import {
  Mail,
  Users,
  MessageSquare,
  ArrowRight,
  Check,
  Zap,
  BarChart3,
  Shield,
  Globe,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-lg text-gray-900">BackED</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-[#F22F46] hover:bg-[#d42037] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <h1 className="text-6xl sm:text-7xl font-bold leading-tight mb-6 tracking-tight">
              Connect your alumni with AI-powered precision
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Automate campaigns, orchestrate alumni onboarding, and deliver instant messages. All powered by intelligent automation and deep insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/signup"
                className="bg-[#F22F46] hover:bg-[#d42037] text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-colors justify-center border border-[#F22F46]"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="border border-gray-600 hover:border-gray-400 text-white px-8 py-4 rounded-lg font-semibold transition-colors justify-center flex items-center"
              >
                View Demo
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              ✓ No credit card required · ✓ Free forever plan · ✓ Full feature access
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Built to deliver results
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Powerful tools that engage more alumni, boost response rates, and scale your outreach effortlessly.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Feature 1: Email Campaigns - Spans 4 columns */}
            <div className="lg:col-span-4 border border-gray-200 rounded-xl p-8 hover:border-gray-300 hover:shadow-lg transition-all bg-white">
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 border border-blue-200">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Campaign Management
              </h3>
              <p className="text-gray-600 mb-6">
                Create and send professional email campaigns with AI-assisted copywriting and real-time analytics.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>AI-powered email proofreader</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Real-time delivery analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Dynamic CTA tracking</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: Alumni Onboarding - Spans 4 columns */}
            <div className="lg:col-span-4 border border-gray-200 rounded-xl p-8 hover:border-gray-300 hover:shadow-lg transition-all bg-white">
              <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center mb-6 border border-purple-200">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Alumni Onboarding
              </h3>
              <p className="text-gray-600 mb-6">
                Streamline enrollment with intelligent segmentation and automated workflows for your alumni network.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Bulk import & management</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Smart segmentation rules</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Engagement scoring</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: Quick Messaging - Spans 4 columns */}
            <div className="lg:col-span-4 border border-gray-200 rounded-xl p-8 hover:border-gray-300 hover:shadow-lg transition-all bg-white">
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center mb-6 border border-green-200">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Quick Messaging
              </h3>
              <p className="text-gray-600 mb-6">
                Send instant transactional messages to your entire alumni base with 99.9% delivery reliability.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Instant alumni notifications</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Enterprise-grade reliability</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Message personalization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              AI-powered alumni engagement
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Leverage machine learning to optimize campaigns, predict alumni interest, and automate your entire workflow.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* AI Feature 1 - Spans 6 columns */}
            <div className="lg:col-span-6 border border-purple-200 rounded-xl p-8 bg-white hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Content Generation</h3>
                  <p className="text-gray-600">Powered by Gemini AI</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Generate compelling email copy, subject lines, and social media content with AI assistance. Reduce writer's block and ship campaigns 10x faster.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                  AI-generated social summaries
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                  Smart copy suggestions
                </div>
              </div>
            </div>

            {/* AI Feature 2 - Spans 6 columns */}
            <div className="lg:col-span-6 border border-green-200 rounded-xl p-8 bg-white hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Smart Analytics</h3>
                  <p className="text-gray-600">Data-driven insights</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Understand what moves your alumni. Get actionable insights on engagement patterns, optimal send times, and content preferences.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  Predictive engagement scoring
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  Real-time performance dashboards
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-16">
            Why teams choose BackED
          </h2>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Benefit 1 - Spans 3 columns */}
            <div className="lg:col-span-3 border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 border border-blue-200">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Easy to use</h3>
              <p className="text-sm text-gray-600">
                Intuitive interface requires zero technical expertise. Ship campaigns in minutes.
              </p>
            </div>

            {/* Benefit 2 - Spans 3 columns */}
            <div className="lg:col-span-3 border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
              <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4 border border-purple-200">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Deep analytics</h3>
              <p className="text-sm text-gray-600">
                Understand engagement with real-time dashboards and predictive metrics.
              </p>
            </div>

            {/* Benefit 3 - Spans 3 columns */}
            <div className="lg:col-span-3 border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center mb-4 border border-green-200">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Enterprise secure</h3>
              <p className="text-sm text-gray-600">
                Bank-level security with GDPR compliance and 99.9% reliability SLA.
              </p>
            </div>

            {/* Benefit 4 - Spans 3 columns */}
            <div className="lg:col-span-3 border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
              <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center mb-4 border border-red-200">
                <Globe className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Global scale</h3>
              <p className="text-sm text-gray-600">
                Send to millions without infrastructure headaches. We handle it all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6">
              <h2 className="text-5xl font-bold leading-tight mb-6">
                Trusted by alumni leaders
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Join hundreds of institutions already using BackED to nurture their most valuable relationships.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-700 rounded-lg p-6">
                  <p className="text-4xl font-bold text-[#F22F46] mb-2">2M+</p>
                  <p className="text-gray-400">Emails delivered</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-6">
                  <p className="text-4xl font-bold text-[#F22F46] mb-2">500K+</p>
                  <p className="text-gray-400">Alumni managed</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-6">
                  <p className="text-4xl font-bold text-green-500 mb-2">94.2%</p>
                  <p className="text-gray-400">Delivery rate</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-6">
                  <p className="text-4xl font-bold text-purple-500 mb-2">100+</p>
                  <p className="text-gray-400">Organizations</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 border border-gray-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Latest campaign performance</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-400">Delivered</p>
                    <p className="font-bold">48,234</p>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-[#F22F46]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-400">Opened</p>
                    <p className="font-bold">18,456 (38%)</p>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-7/12 bg-purple-500"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-400">Clicked</p>
                    <p className="font-bold">4,520 (9.4%)</p>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-2/12 bg-green-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to scale alumni engagement?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Start free today. No credit card. No surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-[#F22F46] hover:bg-[#d42037] text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 justify-center transition-colors border border-[#F22F46]"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="border border-gray-600 hover:border-gray-400 text-white px-8 py-4 rounded-lg font-semibold transition-colors justify-center flex items-center"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-14 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status Page</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-gray-500">
                © 2026 BackED. All rights reserved.
              </p>
              <div className="flex gap-6 mt-6 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
