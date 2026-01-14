/**
 * График по сотрудникам
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@renderer/hooks';
import type { EmployeeReport } from '@renderer/types';

interface EmployeesBarChartProps {
  data: EmployeeReport[];
}

export default function EmployeesBarChart({ data }: EmployeesBarChartProps) {
  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return <div className="alert alert-info">Нет данных для отображения</div>;
  }

  const maxNameLength = isMobile ? 10 : 12;
  const chartData = data.map(emp => ({
    name: emp.name.length > maxNameLength ? emp.name.substring(0, maxNameLength) + '...' : emp.name,
    salary: emp.total_salary,
    days: emp.days_worked
  }));

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h6 className="mb-0">👷 Заработок сотрудников</h6>
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
              formatter={(value: number, name: string) => 
                name === 'salary' ? value.toLocaleString('ru-RU') + ' ₽' : value + ' дн.'
              }
              contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: isMobile ? '11px' : '14px' }}
              iconSize={isMobile ? 12 : 14}
            />
            <Bar dataKey="salary" fill="#198754" name="Заработано" />
            <Bar dataKey="days" fill="#0d6efd" name="Дней" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


