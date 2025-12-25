
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeManagement = () => {
  const navigate = useNavigate();

  const handleGoToTeamMembers = () => {
    navigate('/settings?tab=team');
  };

  return (
    <div className="space-y-6">
      <Alert className="border-green-500 bg-green-50">
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Employee management is now available!</strong> Use the Team Members tab to add and manage employees.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-green-600" />
            Team Members Management
          </CardTitle>
          <CardDescription>
            Add team members, assign roles, and manage permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="font-semibold text-green-600 min-w-[24px]">✓</span>
              <p>Add team members by email and role</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-semibold text-green-600 min-w-[24px]">✓</span>
              <p>Manage existing team member roles and permissions</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-semibold text-green-600 min-w-[24px]">✓</span>
              <p>View team member activity and status</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-semibold text-green-600 min-w-[24px]">✓</span>
              <p>Set employee roles: Staff, Manager, or Owner</p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button onClick={handleGoToTeamMembers} className="w-full">
              <Users className="mr-2 h-4 w-4" />
              Manage Team Members
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;
