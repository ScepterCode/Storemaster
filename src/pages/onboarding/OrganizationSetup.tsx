/**
 * Organization Setup Wizard
 * 
 * Multi-step form for creating a new organization during onboarding
 * Requirements: 1.1, 2.1
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/services/adminService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface OrganizationFormData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
}

const OrganizationSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    email: user?.email || '',
    phone: '',
    address: '',
  });

  const handleInputChange = (field: keyof OrganizationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({
        ...prev,
        slug,
      }));
    }
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization slug is required',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an organization',
        variant: 'destructive',
      });
      return;
    }

    if (!validateStep2()) return;

    try {
      setLoading(true);

      // Create organization with free tier
      // The createOrganization function now automatically adds the user as owner
      const organization = await adminService.createOrganization({
        name: formData.name,
        slug: formData.slug,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        subscription_tier: 'free',
        subscription_status: 'trial',
        max_users: 2,
        max_products: 50,
        max_invoices_per_month: 20,
        max_storage_mb: 100,
        is_active: true,
      });

      toast({
        title: 'Success',
        description: 'Organization created successfully!',
      });

      // Navigate to plan selection
      navigate('/onboarding/select-plan', { 
        state: { organizationId: organization.id } 
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create Your Organization</CardTitle>
              <CardDescription>
                Step {step} of 2 - Let's set up your business
              </CardDescription>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex gap-2">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Store"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  The name of your business or organization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Organization Slug *</Label>
                <Input
                  id="slug"
                  placeholder="e.g., acme-store"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  A unique identifier for your organization (auto-generated from name)
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Primary email for organization communications
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 XXX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Optional contact phone number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your business address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={loading}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Optional physical address for your business
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < 2 ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrganizationSetup;
