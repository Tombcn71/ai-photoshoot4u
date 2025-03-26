import Link from "next/link";
import { ArrowRight, Check, Palette, Upload, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site-header";
import { AutoSlider } from "@/components/auto-slider";

export default function HomePage() {
  // Use images from your public directory
  const sliderImages = [
    { src: "/images/headshot1.jpg", alt: "Professional headshot 1" },
    { src: "/images/headshot2.jpg", alt: "Professional headshot 2" },
    { src: "/images/headshot3.jpg", alt: "Professional headshot 3" },
    { src: "/images/headshot4.jpg", alt: "Professional headshot 4" },
    { src: "/images/headshot5.jpg", alt: "Professional headshot 5" },
    { src: "/images/headshot6.jpg", alt: "Professional headshot 6" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  AI Headshots
                </span>{" "}
                in Minutes
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Transform your selfies into stunning professional headshots with
                our AI-powered platform. Perfect for LinkedIn, resumes, and team
                pages.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <Link href="/auth/signin">
                  <Button variant="gradient" size="lg" className="gap-1.5">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline">
                    How It Works
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Auto Slider with continuous horizontal movement */}
          <div className="mt-12 mb-16">
            <AutoSlider
              images={sliderImages}
              speed={40}
              className="w-full mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Rest of the page content remains the same */}
      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="w-full py-12 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Transform your photos into professional headshots in three
                simple steps
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8 md:mt-12">
            <Card className="bg-background border-2 border-muted">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>1. Upload Your Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload your best selfies or portraits. We recommend clear,
                  well-lit photos with neutral backgrounds.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background border-2 border-muted">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>2. Choose Your Style</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select from 5 professional backgrounds and 5 outfit styles to
                  create your perfect professional look.
                </p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1 bg-background border-2 border-muted">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>3. Receive Your Headshots</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI generates 40 professional headshots with your selected
                  backgrounds and outfits. Download and use them anywhere.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-12 md:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Simple Pricing
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Choose the plan that works for you or your team
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8 md:mt-12">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Individual</CardTitle>
                <CardDescription>Perfect for personal use</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-4xl font-bold">€29</div>
                <p className="text-sm text-muted-foreground mt-1">1 credit</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>40 professional headshots</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>5 unique backgrounds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>5 professional outfits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>High-resolution downloads</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/auth/signin" className="w-full">
                  <Button variant="gradient" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="flex flex-col border-primary">
              <CardHeader>
                <CardTitle>Small Team</CardTitle>
                <CardDescription>
                  For small teams or departments
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-4xl font-bold">€99</div>
                <p className="text-sm text-muted-foreground mt-1">5 credits</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>40 headshots per person</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>5 unique backgrounds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>5 professional outfits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Team management dashboard</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/auth/signin" className="w-full">
                  <Button variant="gradient" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>For larger teams or companies</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-4xl font-bold">€199</div>
                <p className="text-sm text-muted-foreground mt-1">10 credits</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>40 headshots per person</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>5 unique backgrounds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>5 professional outfits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Advanced team management</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/auth/signin" className="w-full">
                  <Button variant="gradient" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="w-full py-12 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Find answers to common questions about our AI headshot service
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-3xl mt-8 md:mt-12 grid gap-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      How long does it take to generate headshots?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Most headshots are generated within 15-30 minutes,
                      depending on system load. Team packages may take slightly
                      longer.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>What kind of photos should I upload?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      For best results, upload clear, well-lit photos where your
                      face is clearly visible. Neutral expressions work best,
                      and avoid heavy makeup or accessories.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Can I use these headshots professionally?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Yes! Our AI-generated headshots are perfect for LinkedIn
                      profiles, company websites, resumes, and other
                      professional uses.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="technical" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>What file formats do you support?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      We support JPG, PNG, and HEIC formats for uploads. All
                      generated headshots are provided in high-resolution JPG
                      format.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>How do team credits work?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Each credit allows one person to generate 40 headshots.
                      Team admins can assign credits to team members through the
                      dashboard.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Do you store my original photos?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      We temporarily store your photos during processing, but
                      they are automatically deleted after 7 days. Your privacy
                      is important to us.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-muted border-t">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">AI Headshots</h3>
              <p className="text-sm text-muted-foreground">
                Professional headshots powered by AI
              </p>
            </div>
            <nav className="space-y-2">
              <h3 className="text-lg font-medium">Product</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>
            <nav className="space-y-2">
              <h3 className="text-lg font-medium">Company</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
            <nav className="space-y-2">
              <h3 className="text-lg font-medium">Legal</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground">
                    Cookies
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="mt-8 border-t pt-6">
            <p className="text-sm text-muted-foreground text-center">
              © 2025 AI Headshots. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
