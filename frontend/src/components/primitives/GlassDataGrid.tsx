import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  isNumeric?: boolean;
  width?: string | number;
}

export interface GlassDataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string | number;
}

export function GlassDataGrid<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedKey,
  emptyMessage = "No records located",
  className = "",
  maxHeight = "100%",
}: GlassDataGridProps<T>) {
  return (
    <div
      className={`glass-data-grid-container ${className}`}
      style={{ maxHeight, overflowY: "auto" }}
    >
      <table className="glass-data-grid">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  textAlign: col.align || (col.isNumeric ? "right" : "left"),
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="glass-data-grid-empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const key = keyExtractor(row, idx);
              const isSelected = selectedKey === key;
              return (
                <tr
                  key={key}
                  className={`glass-data-grid-row ${
                    isSelected ? "row-selected" : ""
                  } ${onRowClick ? "row-interactive" : ""}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align || (col.isNumeric ? "right" : "left"),
                      }}
                      className={col.isNumeric ? "cell-tabular-numeric" : ""}
                    >
                      {col.render
                        ? col.render(row, idx)
                        : (row as any)[col.key]?.toString() || "—"}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
