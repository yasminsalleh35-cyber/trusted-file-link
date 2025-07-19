import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  MessageCircle, 
  Shield, 
  Users, 
  BarChart3, 
  Smartphone,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

/**
 * LandingPage Component
 * 
 * Purpose: Modern landing page for the Financial Management Portal
 * Features:
 * - Hero section with animated background
 * - Feature highlights
 * - WhatsApp integration showcase
 * - Clean, modern design inspired by Eduardo Bibiano's portfolio
 * - Call-to-action button to enter the portal
 */

interface LandingPageProps {
  onEnterPortal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterPortal }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">FinanceHub</span>
          </div>
          <Button 
            variant="outline" 
            onClick={onEnterPortal}
            className="hover-scale"
          >
            Access Portal
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          {/* Main Heading */}
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              Financial Management
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                {" "}Simplified
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Stay connected with real-time market updates and personalized financial insights 
              delivered directly through WhatsApp
            </p>
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in delay-300">
            <Button 
              size="lg" 
              onClick={onEnterPortal}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-4 text-lg font-semibold hover-scale shadow-lg"
            >
              Enter Portal
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Hero Image/Animation Area */}
          <div className="mt-16 animate-fade-in delay-500">
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-card to-card/50 rounded-2xl p-8 shadow-2xl border backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* WhatsApp Integration */}
                  <Card className="p-6 hover-scale bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <Smartphone className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">WhatsApp Updates</h3>
                    <p className="text-sm text-muted-foreground">Real-time market news and insights</p>
                  </Card>

                  {/* Analytics */}
                  <Card className="p-6 hover-scale bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <BarChart3 className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Smart Analytics</h3>
                    <p className="text-sm text-muted-foreground">Comprehensive financial tracking</p>
                  </Card>

                  {/* Security */}
                  <Card className="p-6 hover-scale bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <Shield className="h-8 w-8 text-purple-600 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Secure Platform</h3>
                    <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose FinanceHub?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines modern technology with personalized communication 
              to keep you ahead in the financial market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <MessageCircle className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Direct Communication</h3>
              <p className="text-sm text-muted-foreground">
                Receive updates and insights directly on WhatsApp
              </p>
              <div className="mt-4 flex items-center text-xs text-primary">
                <CheckCircle className="h-4 w-4 mr-1" />
                Real-time delivery
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <Users className="h-10 w-10 text-accent mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Multi-Role Access</h3>
              <p className="text-sm text-muted-foreground">
                Admin, client, and user portals with tailored experiences
              </p>
              <div className="mt-4 flex items-center text-xs text-accent">
                <CheckCircle className="h-4 w-4 mr-1" />
                Role-based permissions
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <TrendingUp className="h-10 w-10 text-secondary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Market Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with the latest market trends and analysis
              </p>
              <div className="mt-4 flex items-center text-xs text-secondary">
                <CheckCircle className="h-4 w-4 mr-1" />
                AI-powered insights
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <Shield className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Secure & Reliable</h3>
              <p className="text-sm text-muted-foreground">
                Bank-level security with 99.9% uptime guarantee
              </p>
              <div className="mt-4 flex items-center text-xs text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                End-to-end encryption
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Financial Management?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who trust FinanceHub for their financial communication needs
          </p>
          <Button 
            size="lg" 
            onClick={onEnterPortal}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-4 text-lg font-semibold hover-scale shadow-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 FinanceHub. All rights reserved. Built with ❤️ for modern financial management.</p>
        </div>
      </footer>
    </div>
  );
};