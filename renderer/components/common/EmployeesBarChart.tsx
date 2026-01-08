/**
 * График по сотрудникам
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EmployeeReport } from '../../types';

interface EmployeesBarChartProps {
  data: EmployeeReport[];
}

export default function EmployeesBarChart({ data }: EmployeesBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="alert alert-info">Нет данных для отображения</div>;
  }

  const chartData = data.map(emp => ({
    name: emp.name.length > 12 ? emp.name.substring(0, 12) + '...' : emp.name,
    salary: emp.total_salary,
    days: emp.days_worked
  }));

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h6 className="mb-0">👷 Заработок сотрудников</h6>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number, name: string) => 
              name === 'salary' ? value.toLocaleString('ru-RU') + ' ₽' : value + ' дн.'
            } />
            <Legend />
            <Bar dataKey="salary" fill="#198754" name="Заработано" />
            <Bar dataKey="days" fill="#0d6efd" name="Дней" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


