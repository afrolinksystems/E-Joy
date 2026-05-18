// apps/admin-web/src/components/table/TableErrorState.tsx

type Props = {
  message?: string;
  onRetry?: () => void;
  errorDetails?: string;
};

export default function TableErrorState({
  message = "Failed to load data",
  onRetry,
  errorDetails,
}: Props) {
  return (
    <div 
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm"
    >
      {/* Visual Icon */}
      <div className="text-red-500 text-5xl mb-4">
        ⚠️
      </div>
      
      {/* Error Title */}
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        {message}
      </h3>
      
      {/* Error Description */}
      <p className="text-red-700 mb-4 max-w-md mx-auto">
        There was an error loading the table data. Please try again.
      </p>
      
      {/* Optional Error Details (for debugging) */}
      {errorDetails && (
        <details className="mb-4 text-left max-w-md mx-auto">
          <summary className="text-sm text-red-600 cursor-pointer">
            Technical details
          </summary>
          <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-x-auto">
            {errorDetails}
          </pre>
        </details>
      )}
      
      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}