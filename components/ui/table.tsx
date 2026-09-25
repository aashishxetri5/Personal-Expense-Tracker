import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Table wrapped in a horizontal scroller so a wide table never breaks the
 * page layout on a narrow screen.
 *
 * @param props - Table element props.
 * @returns The scrollable table.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="scrollbar-thin w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  // A double rule under the header, as in a ruled account book.
  return (
    <thead
      className={cn("[&_tr]:border-b-[3px] [&_tr]:border-double [&_tr]:border-border", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    // Totals sit over a double rule, the bookkeeper's mark for a sum.
    <tfoot
      className={cn("border-t-[3px] border-double border-border bg-muted/40 font-semibold", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors last:border-0 hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-9 px-3 text-left align-middle text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-3 py-2.5 align-middle", className)} {...props} />;
}

export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow };
