/**
 * График по проектам
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProjectReport } from '../../types';

interface ProjectsBarChartProps {
  data: ProjectReport[];
}

export default function ProjectsBarChart({ data }: ProjectsBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="alert alert-info">Нет данных для отображения</div>;
  }

  const chartData = data.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    budget: project.budget,
    costs: project.total_costs,
    payments: project.payments_received
  }));

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h6 className="mb-0">📊 Бюджет и расходы по объектам</h6>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => value.toLocaleString('ru-RU') + ' ₽'} />
            <Legend />
            <Bar dataKey="budget" fill="#0d6efd" name="Бюджет" />
            <Bar dataKey="costs" fill="#dc3545" name="Расходы" />
            <Bar dataKey="payments" fill="#198754" name="Поступления" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


