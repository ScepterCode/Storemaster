/**
 * Quist Response Renderer
 * 
 * Renders rich responses from Quist including:
 * - Text responses
 * - Data tables
 * - Simple charts (bar, line, pie)
 * - Action buttons
 * 
 * @module components/quist/QuistResponseRenderer
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TableIcon, BarChart3, TrendingUp, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import type { QuistResponse, QuistTableConfig, QuistChartConfig, QuistAction } from '@/types/quist';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/services/quistResponseFormatter';
import { Button } from '@/components/ui/button';

// ============================================================================
// Chart Colors
// ============================================================================

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ============================================================================
// Props Types
// ============================================================================

interface QuistResponseRendererProps {
  response: QuistResponse;
  onActionClick?: (action: QuistAction) => void;
  onRetry?: () => void;
}

interface QuistTableRendererProps {
  config: QuistTableConfig;
}

interface QuistChartRendererProps {
  config: QuistChartConfig;
}

// ============================================================================
// Table Renderer
// ============================================================================

const QuistTableRenderer: React.FC<QuistTableRendererProps> = ({ config }) => {
  const formatCellValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return typeof value === 'number' ? formatCurrency(value) : String(value);
      case 'number':
        return typeof value === 'number' ? formatNumber(value) : String(value);
      case 'percentage':
        return typeof value === 'number' ? formatPercentage(value) : String(value);
      case 'date':
        return typeof value === 'string' ? formatDate(value) : String(value);
      default:
        return String(value);
    }
  };

  const getAlignment = (align?: string): string => {
    switch (align) {
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  };

  if (!config.rows || config.rows.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <TableIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No data available</p>
      </div>
    );
  }

  return (
    <Card className="mt-3">
      {config.title && (
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            {config.title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={config.title ? 'pt-0' : 'pt-3'}>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={getAlignment(column.align)}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {config.columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={getAlignment(column.align)}
                    >
                      {formatCellValue(row[column.key], column.type)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {config.rows.length} item{config.rows.length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Chart Renderer
// ============================================================================

const QuistChartRenderer: React.FC<QuistChartRendererProps> = ({ config }) => {
  if (!config.data || config.data.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No chart data available</p>
      </div>
    );
  }

  // Determine if values are currency based on title
  const isCurrency = /revenue|profit|cost|sales|price|amount/i.test(config.title);

  const formatTooltipValue = (value: number): string => {
    return isCurrency ? formatCurrency(value) : formatNumber(value);
  };

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={config.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => isCurrency ? `₦${(value / 1000).toFixed(0)}k` : String(value)}
              />
              <Tooltip
                formatter={(value: number) => [formatTooltipValue(value), 'Value']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Bar 
                dataKey="value" 
                fill={FALLBACK_COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={config.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => isCurrency ? `₦${(value / 1000).toFixed(0)}k` : String(value)}
              />
              <Tooltip
                formatter={(value: number) => [formatTooltipValue(value), 'Value']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={FALLBACK_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: FALLBACK_COLORS[0], strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={config.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => isCurrency ? `₦${(value / 1000).toFixed(0)}k` : String(value)}
              />
              <Tooltip
                formatter={(value: number) => [formatTooltipValue(value), 'Value']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={FALLBACK_COLORS[0]}
                fill={FALLBACK_COLORS[0]}
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={config.data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                nameKey="label"
                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {config.data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatTooltipValue(value), 'Value']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="mt-3">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {config.type === 'line' || config.type === 'area' ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <BarChart3 className="h-4 w-4" />
          )}
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {renderChart()}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Response Renderer
// ============================================================================

export const QuistResponseRenderer: React.FC<QuistResponseRendererProps> = ({
  response,
  onActionClick,
  onRetry,
}) => {
  const isError = response.type === 'error';
  const isNetworkError = response.text?.toLowerCase().includes('connect') || 
                         response.text?.toLowerCase().includes('network') ||
                         response.text?.toLowerCase().includes('internet');

  // Error state with enhanced display
  if (isError) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          {isNetworkError ? (
            <WifiOff className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          )}
          <div className="space-y-2">
            <p className="text-destructive">{response.text}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2 h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </Button>
            )}
          </div>
        </div>

        {/* Suggested actions for errors */}
        {response.actions && response.actions.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Try one of these instead:</p>
            <div className="flex flex-wrap gap-2">
              {response.actions.map((action, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => onActionClick?.(action)}
                >
                  {action.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Text Response */}
      <div className="text-sm whitespace-pre-wrap">
        {response.text}
      </div>

      {/* Table Rendering with Error Boundary */}
      {response.table && response.table.rows && response.table.rows.length > 0 && (
        <TableErrorBoundary>
          <QuistTableRenderer config={response.table} />
        </TableErrorBoundary>
      )}

      {/* Chart Rendering with Error Boundary */}
      {response.chart && response.chart.data && response.chart.data.length > 0 && (
        <ChartErrorBoundary>
          <QuistChartRenderer config={response.chart} />
        </ChartErrorBoundary>
      )}

      {/* Action Buttons */}
      {response.actions && response.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {response.actions.map((action, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onActionClick?.(action)}
            >
              {action.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Metadata */}
      {response.metadata && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t">
          <span>Processed in {response.metadata.processingTimeMs}ms</span>
          {response.metadata.cached && (
            <Badge variant="secondary" className="text-xs py-0">
              Cached
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Error Boundaries for Charts and Tables
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TableErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Table rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="mt-3">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Unable to display table data</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="mt-3">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Unable to display chart</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default QuistResponseRenderer;
