import React from "react";

export function Table({ children, className, ...props }) {
  return (
    <table className={`w-full border border-collapse ${className || ""}`} {...props}>
      {children}
    </table>
  );
}

export function TableHead({ children, className, ...props }) {
  return (
    <thead className={`bg-gray-100 ${className || ""}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, ...props }) {
  return <tbody {...props}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }) {
  return (
    <tr className={`border-t ${className || ""}`} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className, ...props }) {
  return (
    <td className={`px-3 py-2 text-center ${className || ""}`} {...props}>
      {children}
    </td>
  );
}

export function TableHeader({ children, className, ...props }) {
  return (
    <th className={`px-3 py-2 font-medium ${className || ""}`} {...props}>
      {children}
    </th>
  );
}