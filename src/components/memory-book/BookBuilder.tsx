'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Palette,
  Users,
  FileText,
  Image,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeSelector from './ThemeSelector';
import PeopleSelector from './PeopleSelector';
import StoriesSelector from './StoriesSelector';
import BookPreview from './BookPreview';
import type {
  BookConfig,
  BookThemeId,
  PageSize,
  SelectedPerson,
  SelectedStory,
  SelectedPhoto,
} from '@/lib/memory-book/types';

interface BookBuilderProps {
  onGenerate?: (pdfBlob: Blob) => void;
}

type WizardStep = 'basics' | 'theme' | 'people' | 'stories' | 'preview';

const STEPS: Array<{ id: WizardStep; label: string; icon: React.ElementType }> = [
  { id: 'basics', label: 'Basics', icon: BookOpen },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'people', label: 'People', icon: Users },
  { id: 'stories', label: 'Stories', icon: FileText },
  { id: 'preview', label: 'Preview', icon: Eye },
];

export default function BookBuilder({ onGenerate }: BookBuilderProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);

  // Book configuration state
  const [config, setConfig] = useState<Partial<BookConfig>>({
    title: '',
    subtitle: '',
    dedication: '',
    theme: 'classic',
    pageSize: 'A4',
    orientation: 'portrait',
    selectedPeople: [],
    selectedStories: [],
    selectedPhotos: [],
    includeTableOfContents: true,
    includePageNumbers: true,
    includeDateGenerated: true,
  });

  const updateConfig = useCallback(
    <K extends keyof BookConfig>(key: K, value: BookConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basics':
        return !!config.title?.trim();
      case 'theme':
        return true;
      case 'people':
        return true; // People are optional
      case 'stories':
        return true; // Stories are optional
      case 'preview':
        return true;
      default:
        return true;
    }
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleGenerate = async () => {
    if (!config.title) {
      alert('Please enter a book title');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/memory-book/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.title?.replace(/[^a-z0-9]/gi, '-') || 'memory-book'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onGenerate?.(blob);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(error.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate total pages for preview navigation
  const totalPages =
    1 + // Cover
    (config.dedication ? 1 : 0) +
    (config.includeTableOfContents ? 1 : 0) +
    (config.selectedPeople?.length || 0) +
    (config.selectedStories?.length || 0) +
    (config.selectedPhotos?.length ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={index > currentStepIndex && !canProceed()}
                  className={cn(
                    'flex flex-col items-center transition-all',
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-400'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all',
                      isActive
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : isCompleted
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-8 sm:w-16 md:w-24 mx-2',
                      index < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {STEPS.find((s) => s.id === currentStep)?.label}
              </CardTitle>
              <CardDescription>
                {currentStep === 'basics' &&
                  'Set up your memory book title and dedication'}
                {currentStep === 'theme' &&
                  'Choose a visual theme for your book'}
                {currentStep === 'people' &&
                  'Select family members to include'}
                {currentStep === 'stories' &&
                  'Pick stories to feature in your book'}
                {currentStep === 'preview' &&
                  'Review your book before generating'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Basics Step */}
              {currentStep === 'basics' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Book Title *</Label>
                    <Input
                      id="title"
                      placeholder="Our Family History"
                      value={config.title || ''}
                      onChange={(e) => updateConfig('title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle (optional)</Label>
                    <Input
                      id="subtitle"
                      placeholder="Memories Through the Years"
                      value={config.subtitle || ''}
                      onChange={(e) => updateConfig('subtitle', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dedication">Dedication (optional)</Label>
                    <Textarea
                      id="dedication"
                      placeholder="To our beloved family, past, present, and future..."
                      value={config.dedication || ''}
                      onChange={(e) =>
                        updateConfig('dedication', e.target.value)
                      }
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Page Size</Label>
                      <Select
                        value={config.pageSize}
                        onValueChange={(value) =>
                          updateConfig('pageSize', value as PageSize)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (International)</SelectItem>
                          <SelectItem value="LETTER">Letter (US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Options</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={config.includeTableOfContents}
                            onChange={(e) =>
                              updateConfig(
                                'includeTableOfContents',
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          Include table of contents
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={config.includePageNumbers}
                            onChange={(e) =>
                              updateConfig('includePageNumbers', e.target.checked)
                            }
                            className="rounded"
                          />
                          Include page numbers
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={config.includeDateGenerated}
                            onChange={(e) =>
                              updateConfig(
                                'includeDateGenerated',
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          Show date on cover
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Theme Step */}
              {currentStep === 'theme' && (
                <ThemeSelector
                  selectedTheme={config.theme || 'classic'}
                  onSelect={(theme) => updateConfig('theme', theme)}
                />
              )}

              {/* People Step */}
              {currentStep === 'people' && (
                <PeopleSelector
                  selectedPeople={config.selectedPeople || []}
                  onSelectionChange={(people) =>
                    updateConfig('selectedPeople', people)
                  }
                />
              )}

              {/* Stories Step */}
              {currentStep === 'stories' && (
                <StoriesSelector
                  selectedStories={config.selectedStories || []}
                  onSelectionChange={(stories) =>
                    updateConfig('selectedStories', stories)
                  }
                  selectedPeopleIds={config.selectedPeople?.map((p) => p.id)}
                />
              )}

              {/* Preview Step */}
              {currentStep === 'preview' && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {config.selectedPeople?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">People</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {config.selectedStories?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Stories</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {totalPages}
                      </p>
                      <p className="text-sm text-gray-600">Pages</p>
                    </div>
                  </div>

                  {/* Page navigation for preview */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                      disabled={previewPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {previewPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPreviewPage(Math.min(totalPages - 1, previewPage + 1))
                      }
                      disabled={previewPage >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Generate button */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Generate & Download PDF
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep !== 'preview' && (
              <Button onClick={goNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Live Preview
            </h3>
            <BookPreview config={config} currentPage={previewPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
