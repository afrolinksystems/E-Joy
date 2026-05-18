// apps/admin-web/src/components/table/TableSkeleton.tsx

type Props = {
  rows?: number;
  columns?: number;
  showSearch?: boolean;
};

export default function TableSkeleton({
  rows = 5,
  columns = 5,
  showSearch = true,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse">
      {showSearch && (
        <div className="border-b border-slate-200 bg-slate-50/50 p-4">
          <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <div className="h-4 bg-slate-300 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}