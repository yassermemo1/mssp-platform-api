import { useState, useEffect, useCallback } from 'react';

export interface DashboardWidget {
  id: string;
  title: string;
  component: string;
  visible: boolean;
  order: number;
  size?: 'small' | 'medium' | 'large' | 'full';
  category?: 'metrics' | 'charts' | 'lists' | 'actions';
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  lastModified: string;
  version: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'jira-metrics',
    title: 'Jira Metrics',
    component: 'JiraMetricsCards',
    visible: true,
    order: 1,
    size: 'full',
    category: 'metrics',
  },
  {
    id: 'sla-performance',
    title: 'SLA Performance',
    component: 'SLAPerformanceChart',
    visible: true,
    order: 2,
    size: 'large',
    category: 'charts',
  },
  {
    id: 'ticket-summary',
    title: 'Ticket Summary',
    component: 'TicketSummaryCards',
    visible: true,
    order: 3,
    size: 'large',
    category: 'metrics',
  },
  {
    id: 'service-metrics',
    title: 'Service Performance',
    component: 'ServiceMetricsGauges',
    visible: true,
    order: 4,
    size: 'large',
    category: 'charts',
  },
  {
    id: 'subscription-overview',
    title: 'Subscription Overview',
    component: 'SubscriptionOverview',
    visible: true,
    order: 5,
    size: 'medium',
    category: 'metrics',
  },
  {
    id: 'expiration-alerts',
    title: 'Expiration Alerts',
    component: 'ExpirationAlerts',
    visible: true,
    order: 6,
    size: 'medium',
    category: 'lists',
  },
  {
    id: 'recent-activities',
    title: 'Recent Activities',
    component: 'RecentActivities',
    visible: false,
    order: 7,
    size: 'medium',
    category: 'lists',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    component: 'QuickActions',
    visible: false,
    order: 8,
    size: 'small',
    category: 'actions',
  },
];

const STORAGE_KEY = 'mssp-dashboard-layout';
const LAYOUT_VERSION = 1;

export const useDashboardCustomization = (userId?: string) => {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    const storageKey = userId ? `${STORAGE_KEY}-${userId}` : STORAGE_KEY;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsedLayout = JSON.parse(saved) as DashboardLayout;
        
        // Check if layout version is compatible
        if (parsedLayout.version === LAYOUT_VERSION) {
          // Merge with default widgets to handle new widgets
          const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
            const savedWidget = parsedLayout.widgets.find(w => w.id === defaultWidget.id);
            return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
          });
          
          // Add any new widgets that weren't in the saved layout
          const newWidgets = DEFAULT_WIDGETS.filter(
            defaultWidget => !parsedLayout.widgets.find(w => w.id === defaultWidget.id)
          );
          
          return {
            ...parsedLayout,
            widgets: [...mergedWidgets, ...newWidgets].sort((a, b) => a.order - b.order),
          };
        }
      } catch (error) {
        console.warn('Failed to parse saved dashboard layout:', error);
      }
    }
    
    return {
      widgets: DEFAULT_WIDGETS,
      lastModified: new Date().toISOString(),
      version: LAYOUT_VERSION,
    };
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  // Save layout to localStorage
  const saveLayout = useCallback((newLayout: DashboardLayout) => {
    const storageKey = userId ? `${STORAGE_KEY}-${userId}` : STORAGE_KEY;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
    }
  }, [userId]);

  // Update layout and save
  const updateLayout = useCallback((updater: (layout: DashboardLayout) => DashboardLayout) => {
    setLayout(currentLayout => {
      const newLayout = updater(currentLayout);
      const updatedLayout = {
        ...newLayout,
        lastModified: new Date().toISOString(),
      };
      saveLayout(updatedLayout);
      return updatedLayout;
    });
  }, [saveLayout]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    updateLayout(layout => ({
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, visible: !widget.visible }
          : widget
      ),
    }));
  }, [updateLayout]);

  // Reorder widgets
  const reorderWidgets = useCallback((widgetIds: string[]) => {
    updateLayout(layout => ({
      ...layout,
      widgets: layout.widgets
        .map(widget => {
          const newOrder = widgetIds.indexOf(widget.id);
          return newOrder >= 0 ? { ...widget, order: newOrder + 1 } : widget;
        })
        .sort((a, b) => a.order - b.order),
    }));
  }, [updateLayout]);

  // Move widget up/down
  const moveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    updateLayout(layout => {
      const widgets = [...layout.widgets].sort((a, b) => a.order - b.order);
      const currentIndex = widgets.findIndex(w => w.id === widgetId);
      
      if (currentIndex === -1) return layout;
      
      const newIndex = direction === 'up' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(widgets.length - 1, currentIndex + 1);
      
      if (newIndex === currentIndex) return layout;
      
      // Swap orders
      const temp = widgets[currentIndex].order;
      widgets[currentIndex].order = widgets[newIndex].order;
      widgets[newIndex].order = temp;
      
      return {
        ...layout,
        widgets: widgets,
      };
    });
  }, [updateLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    const defaultLayout: DashboardLayout = {
      widgets: DEFAULT_WIDGETS,
      lastModified: new Date().toISOString(),
      version: LAYOUT_VERSION,
    };
    setLayout(defaultLayout);
    saveLayout(defaultLayout);
  }, [saveLayout]);

  // Get visible widgets in order
  const visibleWidgets = layout.widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.order - b.order);

  // Get widgets by category
  const getWidgetsByCategory = useCallback((category: string) => {
    return layout.widgets.filter(widget => widget.category === category);
  }, [layout.widgets]);

  // Check if layout has been customized
  const isCustomized = layout.widgets.some(widget => {
    const defaultWidget = DEFAULT_WIDGETS.find(dw => dw.id === widget.id);
    return !defaultWidget || 
           widget.visible !== defaultWidget.visible || 
           widget.order !== defaultWidget.order;
  });

  return {
    layout,
    visibleWidgets,
    isCustomizing,
    isCustomized,
    setIsCustomizing,
    toggleWidgetVisibility,
    reorderWidgets,
    moveWidget,
    resetLayout,
    getWidgetsByCategory,
    updateLayout,
  };
}; 