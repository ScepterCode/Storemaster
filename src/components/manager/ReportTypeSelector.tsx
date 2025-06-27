import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Table, Calendar } from "lucide-react";

interface ReportType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ReportTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const ReportTypeSelector = ({
  selectedType,
  onTypeChange,
}: ReportTypeSelectorProps) => {
  const reportTypes: ReportType[] = [
    { value: "transactions", label: "All Transactions", icon: FileText },
    { value: "staff-performance", label: "Staff Performance", icon: Table },
    { value: "daily-summary", label: "Daily Summary", icon: Calendar },
    { value: "product-sales", label: "Product Sales Analysis", icon: Table },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {reportTypes.map(({ value, label, icon: Icon }) => (
        <Card
          key={value}
          className={`cursor-pointer transition-colors ${
            selectedType === value ? "ring-2 ring-primary" : "hover:bg-muted/50"
          }`}
          onClick={() => onTypeChange(value)}
        >
          <CardContent className="p-4 text-center">
            <Icon className="h-8 w-8 mx-auto mb-2" />
            <h3 className="font-medium text-sm">{label}</h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReportTypeSelector;
