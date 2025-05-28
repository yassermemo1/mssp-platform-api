import React, { useState } from 'react';
import { DashboardWidget } from '../../hooks/useDashboardCustomization';
import './DashboardCustomization.css';

interface DashboardCustomizationProps {
  widgets: DashboardWidget[];
  isCustomizing: boolean;
  isCustomized: boolean;
  onToggleCustomizing: () => void;
  onToggleWidgetVisibility: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, direction: 'up' | 'down') => void;
  onResetLayout: () => void;
}

/**
 * DashboardCustomization Component
 * Provides an interface for users to customize their dashboard layout
 */
const DashboardCustomization: React.FC<DashboardCustomizationProps> = ({
  widgets,
  isCustomizing,
  isCustomized,
  onToggleCustomizing,
  onToggleWidgetVisibility,
  onMoveWidget,
  onResetLayout,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Widgets', icon: '📊' },
    { id: 'metrics', label: 'Metrics', icon: '📈' },
    { id: 'charts', label: 'Charts', icon: '📉' },
    { id: 'lists', label: 'Lists', icon: '📋' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
  ];

  const filteredWidgets = activeCategory === 'all' 
    ? widgets 
    : widgets.filter(widget => widget.category === activeCategory);

  const sortedWidgets = [...filteredWidgets].sort((a, b) => a.order - b.order);

  const handleResetConfirm = () => {
    if (window.confirm('Are you sure you want to reset the dashboard to its default layout? This will undo all your customizations.')) {
      onResetLayout();
    }
  };

  if (!isCustomizing) {
    return (
      <div className="dashboard-customization-trigger">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onToggleCustomizing}
          title="Customize Dashboard"
        >
          <span className="customize-icon">⚙️</span>
          Customize
          {isCustomized && <span className="customized-indicator">●</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-customization-panel">
      <div className="customization-header">
        <div className="header-content">
          <h3>Customize Dashboard</h3>
          <p>Show, hide, and reorder widgets to personalize your dashboard</p>
        </div>
        <div className="header-actions">
          {isCustomized && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleResetConfirm}
              title="Reset to default layout"
            >
              Reset
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={onToggleCustomizing}
          >
            Done
          </button>
        </div>
      </div>

      <div className="customization-content">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              <span className="category-count">
                {category.id === 'all' 
                  ? widgets.length 
                  : widgets.filter(w => w.category === category.id).length
                }
              </span>
            </button>
          ))}
        </div>

        <div className="widgets-list">
          {sortedWidgets.length === 0 ? (
            <div className="empty-category">
              <p>No widgets in this category</p>
            </div>
          ) : (
            sortedWidgets.map((widget, index) => (
              <div
                key={widget.id}
                className={`widget-item ${widget.visible ? 'visible' : 'hidden'}`}
              >
                <div className="widget-info">
                  <div className="widget-header">
                    <span className="widget-title">{widget.title}</span>
                    <div className="widget-badges">
                      {widget.size && (
                        <span className={`size-badge size-${widget.size}`}>
                          {widget.size}
                        </span>
                      )}
                      {widget.category && (
                        <span className={`category-badge category-${widget.category}`}>
                          {widget.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="widget-meta">
                    <span className="widget-order">Position: {widget.order}</span>
                    <span className="widget-status">
                      {widget.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="widget-controls">
                  <div className="reorder-controls">
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => onMoveWidget(widget.id, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => onMoveWidget(widget.id, 'down')}
                      disabled={index === sortedWidgets.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="visibility-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={widget.visible}
                        onChange={() => onToggleWidgetVisibility(widget.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="customization-footer">
        <div className="footer-info">
          <span className="visible-count">
            {widgets.filter(w => w.visible).length} of {widgets.length} widgets visible
          </span>
          {isCustomized && (
            <span className="customized-notice">
              ✓ Dashboard has been customized
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomization; 