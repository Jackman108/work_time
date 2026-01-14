/**
 * Круговая диаграмма материалов
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '@renderer/hooks';
import type { MaterialReport } from '@renderer/types';

interface MaterialsPieChartProps {
  data: MaterialReport[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

export default function MaterialsPieChart({ data }: MaterialsPieChartProps) {
  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return <div className="alert alert-info">Нет данных для отображения</div>;
  }

  const chartData = data.map(mat => ({
    name: mat.name,
    value: mat.total_cost
  })).filter(item => item.value > 0);

  if (chartData.length === 0) {
    return <div className="alert alert-info">Нет расходов на материалы</div>;
  }

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h6 className="mb-0">📦 Расходы на материалы</h6>
      </div>
      <div className="card-body chart-container">
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={isMobile ? 70 : 100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => {
                if (isMobile) {
                  return `${(percent * 100).toFixed(0)}%`;
                }
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => value.toLocaleString('ru-RU') + ' ₽'}
              contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }}
              iconSize={isMobile ? 12 : 14}
              layout={isMobile ? 'horizontal' : 'vertical'}
              verticalAlign={isMobile ? 'bottom' : 'middle'}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


