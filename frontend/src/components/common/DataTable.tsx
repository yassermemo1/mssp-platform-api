import React, { useState, useMemo } from 'react';
import './DataTable.css';

export interface DataTableColumn<T = any> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRow?: (record: T, index: number) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
    className?: string;
  };
  emptyText?: string;
  size?: 'small' | 'medium' | 'large';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DataTable Component
 * A reusable, feature-rich table component with sorting, pagination, and customization options
 */
const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  rowKey = 'id',
  onRow,
  emptyText = 'No data available',
  size = 'medium',
  bordered = true,
  striped = true,
  hoverable = true,
  className = '',
  style,
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Get row key for a record
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey]?.toString() || index.toString();
  };

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key: columnKey, direction });
  };

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;
    const column = columns.find(col => col.key === key);
    
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = a[column.dataIndex];
      const bValue = b[column.dataIndex];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return direction === 'asc' ? -1 : 1;
      if (bValue == null) return direction === 'asc' ? 1 : -1;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return direction === 'asc' ? result : -result;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return direction === 'asc' ? result : -result;
      }

      // Handle dates - use a safer approach to check for dates
      const isAValueDate = Object.prototype.toString.call(aValue) === '[object Date]' || 
                          (typeof aValue === 'string' && !isNaN(Date.parse(aValue)));
      const isBValueDate = Object.prototype.toString.call(bValue) === '[object Date]' || 
                          (typeof bValue === 'string' && !isNaN(Date.parse(bValue)));
      
      if (isAValueDate && isBValueDate) {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        const result = aDate.getTime() - bDate.getTime();
        return direction === 'asc' ? result : -result;
      }

      // Fallback to string comparison
      const result = String(aValue).localeCompare(String(bValue));
      return direction === 'asc' ? result : -result;
    });
  }, [data, sortConfig, columns]);

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <span className="sort-icon sort-icon-default">⇅</span>;
    }
    
    return (
      <span className={`sort-icon sort-icon-${sortConfig.direction}`}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Render table header
  const renderHeader = () => (
    <thead>
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={`
              ${column.className || ''}
              ${column.align ? `text-${column.align}` : ''}
              ${column.sortable ? 'sortable' : ''}
            `.trim()}
            style={{ width: column.width }}
            onClick={column.sortable ? () => handleSort(column.key) : undefined}
          >
            <div className="th-content">
              <span className="th-title">{column.title}</span>
              {column.sortable && renderSortIcon(column.key)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  // Render table body
  const renderBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="loading-cell">
              <div className="loading-container">
                <div className="loading-spinner loading-spinner-sm"></div>
                <span>Loading...</span>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    if (sortedData.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="empty-cell">
              <div className="empty-container">
                <span>{emptyText}</span>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {sortedData.map((record, index) => {
          const rowProps = onRow?.(record, index) || {};
          const key = getRowKey(record, index);

          return (
            <tr
              key={key}
              className={rowProps.className || ''}
              onClick={rowProps.onClick}
              onDoubleClick={rowProps.onDoubleClick}
            >
              {columns.map((column) => {
                const value = record[column.dataIndex];
                const cellContent = column.render 
                  ? column.render(value, record, index)
                  : value;

                return (
                  <td
                    key={column.key}
                    className={`
                      ${column.className || ''}
                      ${column.align ? `text-${column.align}` : ''}
                    `.trim()}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total, showSizeChanger, pageSizeOptions, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startRecord = (current - 1) * pageSize + 1;
    const endRecord = Math.min(current * pageSize, total);

    return (
      <div className="data-table-pagination">
        <div className="pagination-info">
          Showing {startRecord} to {endRecord} of {total} entries
        </div>
        
        <div className="pagination-controls">
          <button
            className="btn btn-sm btn-secondary"
            disabled={current <= 1}
            onClick={() => onChange(current - 1, pageSize)}
          >
            Previous
          </button>
          
          <span className="pagination-current">
            Page {current} of {totalPages}
          </span>
          
          <button
            className="btn btn-sm btn-secondary"
            disabled={current >= totalPages}
            onClick={() => onChange(current + 1, pageSize)}
          >
            Next
          </button>
        </div>

        {showSizeChanger && pageSizeOptions && (
          <div className="pagination-size-changer">
            <label htmlFor="pageSize">Show:</label>
            <select
              id="pageSize"
              className="form-select"
              value={pageSize}
              onChange={(e) => onChange(1, parseInt(e.target.value))}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  const tableClasses = [
    'data-table',
    `data-table-${size}`,
    bordered ? 'data-table-bordered' : '',
    striped ? 'data-table-striped' : '',
    hoverable ? 'data-table-hoverable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="data-table-wrapper">
      <table className={tableClasses} style={style}>
        {renderHeader()}
        {renderBody()}
      </table>
      {renderPagination()}
    </div>
  );
};

export default DataTable; 