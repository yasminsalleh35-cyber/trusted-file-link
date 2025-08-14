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
  CheckCircle,
  Mountain,
  Pickaxe,
  Settings,
  Layers,
  HardHat
} from 'lucide-react';

/**
 * LandingPage Component
 * 
 * Purpose: Modern landing page for the Mining Management HUB
 * Features:
 * - Hero section with animated background
 * - Mining operations feature highlights
 * - Document management and security showcase
 * - Clean, modern design with mining industry theming
 * - Call-to-action button to enter the portal
 */

interface LandingPageProps {
  onEnterPortal: () => void;
}

// Custom Mining Management HUB Logo Component
const MiningLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main logo container with gradient background */}
      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
        {/* Background pattern for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
        
        {/* Mountain silhouette in background */}
        <Mountain className="absolute h-6 w-6 text-white/20 transform rotate-12" />
        
        {/* Main pickaxe icon */}
        <Pickaxe className="h-5 w-5 text-white relative z-10 transform -rotate-12" />
        
        {/* Small gear accent */}
        <Settings className="absolute bottom-0 right-0 h-3 w-3 text-white/60 transform rotate-45" />
        
        {/* Shine effect */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full blur-sm"></div>
      </div>
    </div>
  );
};

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
          <div className="flex items-center space-x-3">
            <MiningLogo />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">Mining Management</span>
              <span className="text-sm font-semibold text-amber-600 leading-tight tracking-wider">HUB</span>
            </div>
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
              Mining Administrative Management
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
                {" "}Streamlined
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Comprehensive mining data management platform for operations, safety, and administrative oversight with real-time monitoring and secure file sharing
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
                  {/* Operations Management */}
                  <Card className="p-6 hover-scale bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                    <HardHat className="h-8 w-8 text-amber-600 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Updates</h3>
                    <p className="text-sm text-muted-foreground">Real-Time Updates and News about Your Projects</p>
                  </Card>

                  {/* Analytics */}
                  <Card className="p-6 hover-scale bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <BarChart3 className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Production Analytics</h3>
                    <p className="text-sm text-muted-foreground">Comprehensive mining data tracking</p>
                  </Card>

                  {/* Security */}
                  <Card className="p-6 hover-scale bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                    <Shield className="h-8 w-8 text-red-600 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Safety & Security</h3>
                    <p className="text-sm text-muted-foreground">Mining safety protocols & data protection</p>
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
              Why Choose Mining Management HUB?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform integreates all the information you need to help you manage and stay up-to-date on your mineral exploration and mining projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <Layers className="h-10 w-10 text-amber-600 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Document Management</h3>
              <p className="text-sm text-muted-foreground">
                Secure file sharing and document control for mining operations
              </p>
              <div className="mt-4 flex items-center text-xs text-amber-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Trusted file links
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <Users className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Multi-Role Access</h3>
              <p className="text-sm text-muted-foreground">
                Admin, mining company, and worker portals with specialized access
              </p>
              <div className="mt-4 flex items-center text-xs text-blue-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Role-based permissions
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <Mountain className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Operations Oversight</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive monitoring and management of mining data
              </p>
              <div className="mt-4 flex items-center text-xs text-orange-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Real-time monitoring
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 hover-scale bg-card/50 backdrop-blur-sm border-muted">
              <Shield className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Safety & Security</h3>
              <p className="text-sm text-muted-foreground">
                Mining-grade security protocols with comprehensive safety management
              </p>
              <div className="mt-4 flex items-center text-xs text-red-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Industry compliance
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Optimize Your Mining Operations?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join mining companies worldwide who trust Mining Management HUB for secure data management
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
          <p>&copy; 2024 Mining Management HUB. All rights reserved. Built with ⛏️ for modern mining operations.</p>
        </div>
      </footer>
    </div>
  );
};