const styles = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

interface AlertProps {
  type?: keyof typeof styles;
  children: React.ReactNode;
}

export function Alert({ type = "error", children }: AlertProps) {
  return (
    <div role="alert" className={`rounded-md border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
