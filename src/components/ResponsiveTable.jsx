export function ResponsiveTable({ children, className = "" }) {
  return (
    <div className={`w-full max-w-full overflow-x-auto ${className}`}>
      <div className="min-w-[720px] lg:min-w-0">{children}</div>
    </div>
  );
}

export default ResponsiveTable;
