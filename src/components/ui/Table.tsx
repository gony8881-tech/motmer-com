import type { PropsWithChildren } from "react";

export function Table({ children }: PropsWithChildren) {
  return (
    <div className="overflow-x-auto rounded-md2 border border-primary-100">
      <table className="w-full text-right text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: PropsWithChildren) {
  return <thead className="bg-primary-50 text-primary-700">{children}</thead>;
}

export function TableBody({ children }: PropsWithChildren) {
  return <tbody className="divide-y divide-primary-100">{children}</tbody>;
}

export function TableRow({ children }: PropsWithChildren) {
  return <tr>{children}</tr>;
}

export function TableCell({ children }: PropsWithChildren) {
  return <td className="px-4 py-3">{children}</td>;
}
