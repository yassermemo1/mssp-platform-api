import React from 'react';
import './BarChart.css';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  height?: number;
  showValues?: boolean;
  onClick?: (item: BarChartData) => void;
}

/**
 * Simple Bar Chart Component
 * Renders a bar chart using CSS without external dependencies
 */
const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 300,
  showValues = true,
  onClick,
}) => {
  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bar-chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      
      <div className="chart-area" style={{ height: `${height}px` }}>
        <div className="bars-container">
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * 100;
            const barColor = item.color || '#3b82f6';
            
            return (
              <div
                key={index}
                className={`bar-wrapper ${onClick ? 'clickable' : ''}`}
                onClick={() => onClick && onClick(item)}
              >
                <div className="bar-column">
                  <div 
                    className="bar"
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: barColor,
                    }}
                  >
                    {showValues && (
                      <span className="bar-value">{item.value}</span>
                    )}
                  </div>
                </div>
                <div className="bar-label">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BarChart; 