import React from 'react';
import './GaugeChart.css';

interface GaugeChartProps {
  value: number;
  maxValue: number;
  label: string;
  unit?: string;
  status?: 'good' | 'warning' | 'critical';
  onClick?: () => void;
}

/**
 * Gauge Chart Component
 * Displays a semi-circular gauge for metrics visualization
 */
const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  maxValue,
  label,
  unit = '',
  status = 'good',
  onClick,
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const rotation = (percentage * 180) / 100;

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'good':
      default:
        return '#10b981';
    }
  };

  return (
    <div 
      className={`gauge-chart-container ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="gauge-wrapper">
        <div className="gauge-background">
          <div 
            className="gauge-fill"
            style={{
              transform: `rotate(${rotation}deg)`,
              backgroundColor: getStatusColor(),
            }}
          />
          <div className="gauge-cover" />
        </div>
        
        <div className="gauge-center">
          <div className="gauge-value">
            {value.toLocaleString()}
            {unit && <span className="gauge-unit">{unit}</span>}
          </div>
          <div className="gauge-max">
            of {maxValue.toLocaleString()} {unit}
          </div>
        </div>
      </div>
      
      <div className="gauge-label">{label}</div>
      
      <div className="gauge-percentage">
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
};

export default GaugeChart; 