/**
 * График по проектам
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@renderer/hooks';
import type { ProjectReport } from '@renderer/types';

interface ProjectsBarChartProps {
  data: ProjectReport[];
}

export default function ProjectsBarChart({ data }: ProjectsBarChartProps) {
  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return <div className="alert alert-info">Нет данных для отображения</div>;
  }

  // Обрезаем длинные названия для мобильных
  const maxNameLength = isMobile ? 12 : 15;
  const chartData = data.map(project => ({
    name: project.name.length > maxNameLength ? project.name.substring(0, maxNameLength) + '...' : project.name,
    budget: project.budget,
    costs: project.total_costs,
    payments: project.payments_received
  }));

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h6 className="mb-0">📊 Бюджет и расходы по объектам</h6>
      </div>
      <div className="card-body chart-container">
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: isMobile ? 60 : 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
              fontSize={isMobile ? 10 : 12}
            />
            <YAxis 
              fontSize={isMobile ? 10 : 12}
              width={isMobile ? 50 : 60}
            />
            <Tooltip 
              formatter={(value: number) => value.toLocaleString('ru-RU') + ' ₽'}
              contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }}
              iconSize={isMobile ? 12 : 14}
            />
            <Bar dataKey="budget" fill="#0d6efd" name="Бюджет" />
            <Bar dataKey="costs" fill="#dc3545" name="Расходы" />
            <Bar dataKey="payments" fill="#198754" name="Поступления" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


