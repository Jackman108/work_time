/**
 * График общей статистики
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { OverallStats } from '@renderer/types';

interface OverallStatsChartProps {
  overallStats: OverallStats;
}

const COLORS = ['#dc3545', '#ffc107', '#198754'];

export default function OverallStatsChart({ overallStats }: OverallStatsChartProps) {
  if (!overallStats) {
    return <div className="alert alert-info">Нет данных для отображения</div>;
  }

  const chartData = [
    { name: 'Зарплаты', value: overallStats.totalSalaryCosts },
    { name: 'Материалы', value: overallStats.totalMaterialCosts },
    { name: 'Поступления', value: overallStats.totalPaymentsReceived }
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return <div className="alert alert-info">Нет данных о расходах и поступлениях</div>;
  }

  return (
    <div className="card mt-4">
      <div className="card-header">
        <h6 className="mb-0">📊 Структура финансов</h6>
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


