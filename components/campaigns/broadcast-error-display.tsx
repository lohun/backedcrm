'use client';

import { AlertCircle, CheckCircle, AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '@/components/ui/button';
import { BroadcastError, BroadcastErrorType } from '@/app/actions/broadcast-post';

interface BroadcastErrorDisplayProps {
  error: BroadcastError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Displays categorized broadcast errors with actionable guidance
 */
export function BroadcastErrorDisplay({
  error,
  onRetry,
  onDismiss,
}: BroadcastErrorDisplayProps) {
  if (!error) return null;

  const getErrorConfig = (type: BroadcastErrorType) => {
    switch (type) {
      case BroadcastErrorType.USER_ERROR:
        return {
          icon: AlertTriangle,
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          title: 'Input Error',
          severity: 'high',
        };

      case BroadcastErrorType.VALIDATION_ERROR:
        return {
          icon: AlertTriangle,
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-900',
          title: 'Validation Error',
          severity: 'medium',
        };

      case BroadcastErrorType.NETWORK_ERROR:
        return {
          icon: Wifi,
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          title: 'Network Error (Resumable)',
          severity: 'medium',
        };

      case BroadcastErrorType.SERVER_ERROR:
        return {
          icon: AlertCircle,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          title: 'Server Error',
          severity: 'high',
        };

      default:
        return {
          icon: AlertCircle,
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          text: 'text-neutral-900',
          title: 'Error',
          severity: 'medium',
        };
    }
  };

  const config = getErrorConfig(error.type);
  const Icon = config.icon;

  return (
    <Alert className={`${config.bg} border ${config.border}`}>
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.text}`} />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${config.text}`}>{config.title}</span>
          </div>

          <AlertDescription className={config.text}>
            <p className="mb-2">{error.message}</p>

            {error.field && (
              <p className="text-sm mb-2">
                <span className="font-medium">Field:</span> {error.field}
              </p>
            )}

            {error.successCount !== undefined && error.failedCount !== undefined && (
              <p className="text-sm mb-2">
                <span className="font-medium">Status:</span> {error.successCount} succeeded, {error.failedCount}{' '}
                failed
              </p>
            )}

            {error.action && (
              <div className={`mt-2 p-2 ${config.bg} rounded text-sm border-l-2`}>
                <p>
                  <span className="font-medium">Action:</span> {error.action}
                </p>
              </div>
            )}

            {error.failures && error.failures.length > 0 && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer font-medium">
                  Failed Recipients ({error.failures.length})
                </summary>
                <ul className="mt-2 space-y-1 pl-4 list-disc">
                  {error.failures.slice(0, 5).map((f: { email: string; error: string }, i: number) => (
                    <li key={i} className="text-xs">
                      {f.email}: {f.error}
                    </li>
                  ))}
                  {error.failures.length > 5 && (
                    <li className="text-xs italic">
                      +{error.failures.length - 5} more...
                    </li>
                  )}
                </ul>
              </details>
            )}
          </AlertDescription>

          {/* Action Buttons */}
          {(error.type === BroadcastErrorType.NETWORK_ERROR && onRetry) ||
          (error.type === BroadcastErrorType.VALIDATION_ERROR && onDismiss) ? (
            <div className="flex gap-2 mt-3">
              {error.type === BroadcastErrorType.NETWORK_ERROR && onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className={`${config.text} border-current`}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Alert>
  );
}

/**
 * Success notification for broadcasts
 */
export function BroadcastSuccessDisplay({
  recipientCount,
  onDismiss,
}: {
  recipientCount: number;
  onDismiss?: () => void;
}) {
  return (
    <Alert className="bg-green-50 border border-green-200">
      <div className="flex gap-3">
        <CheckCircle className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0" />

        <div className="flex-1">
          <div className="font-semibold text-green-900 mb-1">
            Broadcast Successful
          </div>
          <AlertDescription className="text-green-900">
            <p className="mb-2">Email sent to {recipientCount} alumni</p>
            <p className="text-sm">
              Check the Statistics tab to monitor opens, clicks, and engagement
            </p>
          </AlertDescription>

          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss} className="mt-2">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
