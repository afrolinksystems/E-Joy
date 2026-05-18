// apps/admin-web/src/components/table/TableEmptyState.tsx

type Props = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
};

export default function TableEmptyState({
  title = "No data found",
  description = "There are no records available.",
  actionLabel,
  onAction,
  icon = "📭"
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="text-gray-400 text-5xl mb-4">
        {icon}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}