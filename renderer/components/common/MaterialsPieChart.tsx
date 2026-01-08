/**
 * Круговая диаграмма материалов
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MaterialReport } from '../../types';

interface MaterialsPieChartProps {
  data: MaterialReport[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

export default function MaterialsPieChart({ data }: MaterialsPieChartProps) {
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
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => value.toLocaleString('ru-RU') + ' ₽'} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


