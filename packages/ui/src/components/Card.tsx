import clsx from "clsx";
import type { PropsWithChildren, ReactNode } from "react";

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export const Card = ({
  title,
  description,
  actions,
  className,
  children
}: PropsWithChildren<CardProps>) => {
  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-2 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

