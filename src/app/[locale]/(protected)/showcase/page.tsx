"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardGlow,
  StatCard,
  FeatureCard,
} from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Input, FloatingInput, SearchInput } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress, CircularProgress } from "@/components/ui/progress";
import {
  SimpleSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonButton,
} from "@/components/ui/skeleton";
import { TooltipProvider, SimpleTooltip } from "@/components/ui/tooltip";

export default function ShowcasePage() {
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [progress, setProgress] = useState(65);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Component Showcase
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium UI components with Stripe-level polish. Smooth animations,
              thoughtful interactions, and beautiful design.
            </p>
          </div>

          {/* Buttons Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Buttons</h2>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Variants */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Variants
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="gradient">Gradient</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Sizes
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* States */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    States & Icons
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      loading={loading}
                      onClick={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 2000);
                      }}
                    >
                      {loading ? "Loading..." : "Click to Load"}
                    </Button>
                    <Button disabled>Disabled</Button>
                    <Button
                      leftIcon={
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      }
                    >
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      rightIcon={
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      }
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cards Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Elevation Examples */}
              <Card elevation="flat">
                <CardHeader>
                  <CardTitle>Flat Card</CardTitle>
                  <CardDescription>No shadow, just border</CardDescription>
                </CardHeader>
              </Card>

              <Card elevation="raised">
                <CardHeader>
                  <CardTitle>Raised Card</CardTitle>
                  <CardDescription>Subtle shadow (default)</CardDescription>
                </CardHeader>
              </Card>

              <Card elevation="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>More prominent shadow</CardDescription>
                </CardHeader>
              </Card>

              {/* Interactive Card */}
              <Card interactive animated>
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>
                    Hover to see the lift effect
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Click anywhere on this card</p>
                </CardContent>
              </Card>

              {/* Glow Card */}
              <CardGlow glowColor="primary">
                <CardHeader className="p-6">
                  <CardTitle>Glow Card</CardTitle>
                  <CardDescription>
                    Hover to see the glow effect
                  </CardDescription>
                </CardHeader>
              </CardGlow>

              {/* Feature Card */}
              <FeatureCard
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                }
                title="Feature Card"
                description="Pre-built component for marketing pages with icon animation on hover"
              />
            </div>

            {/* Stat Cards */}
            <h3 className="text-lg font-medium mt-8">Stat Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total Users"
                value="12,345"
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
                trend={{ value: 12, positive: true }}
              />
              <StatCard
                label="Revenue"
                value="$54,321"
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                trend={{ value: 8, positive: true }}
              />
              <StatCard
                label="Churn Rate"
                value="2.4%"
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  </svg>
                }
                trend={{ value: 3, positive: false }}
              />
            </div>
          </section>

          {/* Badges Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Badges</h2>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Variants */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Variants
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </div>

                {/* With Dot */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    With Status Dot
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success" dot dotColor="success">
                      Active
                    </Badge>
                    <Badge variant="warning" dot dotColor="warning">
                      Pending
                    </Badge>
                    <Badge variant="destructive" dot dotColor="destructive">
                      Error
                    </Badge>
                  </div>
                </div>

                {/* Status Badges */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Status Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status="online" />
                    <StatusBadge status="offline" />
                    <StatusBadge status="busy" />
                    <StatusBadge status="away" />
                    <StatusBadge status="pending" />
                    <StatusBadge status="verified" />
                  </div>
                </div>

                {/* Removable */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Removable
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" removable onRemove={() => {}}>
                      Tag 1
                    </Badge>
                    <Badge variant="secondary" removable onRemove={() => {}}>
                      Tag 2
                    </Badge>
                    <Badge variant="secondary" removable onRemove={() => {}}>
                      Tag 3
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Inputs Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Inputs</h2>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Basic Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input placeholder="Default input" />
                  <Input
                    placeholder="With left icon"
                    leftIcon={
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  />
                </div>

                {/* Validation States */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Validation States
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      placeholder="Normal"
                      helperText="This is helper text"
                    />
                    <Input
                      placeholder="Success state"
                      defaultValue="john@example.com"
                      success="Email is available"
                    />
                    <Input
                      placeholder="Error state"
                      defaultValue="invalid-email"
                      error="Please enter a valid email"
                    />
                  </div>
                </div>

                {/* Floating Labels */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Floating Labels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput label="Email Address" type="email" />
                    <FloatingInput
                      label="Password"
                      type="password"
                      error="Password must be at least 8 characters"
                    />
                  </div>
                </div>

                {/* Search Input */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Search Input
                  </h3>
                  <div className="max-w-md">
                    <SearchInput
                      placeholder="Search..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onClear={() => setSearchValue("")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Select Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Select</h2>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Simple Select
                    </h3>
                    <SimpleSelect
                      placeholder="Select a fruit..."
                      value={selectValue}
                      onValueChange={setSelectValue}
                      options={[
                        { value: "apple", label: "Apple" },
                        { value: "banana", label: "Banana" },
                        { value: "cherry", label: "Cherry" },
                        { value: "grape", label: "Grape", disabled: true },
                      ]}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Different Sizes
                    </h3>
                    <div className="space-y-3">
                      <SimpleSelect
                        size="sm"
                        placeholder="Small"
                        options={[{ value: "1", label: "Option 1" }]}
                      />
                      <SimpleSelect
                        placeholder="Medium (default)"
                        options={[{ value: "1", label: "Option 1" }]}
                      />
                      <SimpleSelect
                        size="lg"
                        placeholder="Large"
                        options={[{ value: "1", label: "Option 1" }]}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Alerts Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Alerts</h2>
            <div className="space-y-4">
              <Alert variant="info">
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This is an informational alert with important details.
                </AlertDescription>
              </Alert>

              <Alert variant="success">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your changes have been saved successfully.
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Please review your information before proceeding.
                </AlertDescription>
              </Alert>

              <Alert variant="error" dismissible>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong. Click the X to dismiss this alert.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Progress Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Progress</h2>
            <Card>
              <CardContent className="p-6 space-y-8">
                {/* Linear Progress */}
                <div className="space-y-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Linear Progress
                  </h3>
                  <Progress value={progress} label="Upload Progress" showValue />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProgress(Math.max(0, progress - 10))}
                    >
                      -10%
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProgress(Math.min(100, progress + 10))}
                    >
                      +10%
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Progress value={75} variant="success" size="lg" />
                    <Progress value={45} variant="warning" size="md" />
                    <Progress value={25} variant="error" size="sm" />
                    <Progress variant="gradient" indeterminate />
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Circular Progress
                  </h3>
                  <div className="flex items-center gap-8">
                    <CircularProgress value={75} size="sm" />
                    <CircularProgress value={60} size="md" showValue />
                    <CircularProgress value={85} size="lg" showValue variant="success" />
                    <CircularProgress indeterminate size="md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Skeletons Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Skeletons</h2>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Skeletons */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Basic Skeletons
                    </h3>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center gap-4">
                      <SkeletonAvatar size="lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Card */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Skeleton Card
                    </h3>
                    <SkeletonCard />
                  </div>
                </div>

                {/* Skeleton Buttons */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Skeleton Buttons
                  </h3>
                  <div className="flex gap-4">
                    <SkeletonButton size="sm" />
                    <SkeletonButton size="md" />
                    <SkeletonButton size="lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tooltips Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Tooltips</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <SimpleTooltip content="This is a tooltip" side="top">
                    <Button variant="outline">Hover me (Top)</Button>
                  </SimpleTooltip>
                  <SimpleTooltip content="Right side tooltip" side="right">
                    <Button variant="outline">Hover me (Right)</Button>
                  </SimpleTooltip>
                  <SimpleTooltip content="Bottom tooltip" side="bottom">
                    <Button variant="outline">Hover me (Bottom)</Button>
                  </SimpleTooltip>
                  <SimpleTooltip
                    content="Light variant tooltip"
                    side="top"
                    variant="light"
                  >
                    <Button variant="outline">Light Variant</Button>
                  </SimpleTooltip>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <div className="text-center py-8 border-t">
            <p className="text-sm text-muted-foreground">
              Built with Tailwind CSS, Radix UI, and love.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
