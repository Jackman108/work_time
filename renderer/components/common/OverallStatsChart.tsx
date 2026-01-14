/**
 * График общей статистики
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '@renderer/hooks';
import type { OverallStats } from '@renderer/types';

interface OverallStatsChartProps {
  overallStats: OverallStats;
}

const COLORS = ['#dc3545', '#ffc107', '#198754'];

export default function OverallStatsChart({ overallStats }: OverallStatsChartProps) {
  const isMobile = useIsMobile();

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
                // На мобильных показываем только процент, на desktop - название и процент
                if (isMobile) {
                  return `${(percent * 100).toFixed(0)}%`;
                }
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              }}
            >
              {chartData.map((_, index) => (
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


