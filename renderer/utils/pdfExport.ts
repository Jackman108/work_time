/**
 * Утилита для экспорта отчётов в PDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProjectReport {
    name: string;
    address?: string;
    date_start?: string;
    date_end?: string;
    budget?: number;
    payments_received?: number;
    salary_costs?: number;
    material_costs?: number;
    total_costs?: number;
    balance?: number;
    budget_remaining?: number;
}

interface EmployeeReport {
    name: string;
    role?: string;
    days_worked?: number;
    total_salary?: number;
    total_received?: number;
    projects_count?: number;
}

interface MaterialReport {
    name: string;
    unit?: string;
    price_per_unit?: number;
    total_amount?: number;
    total_cost?: number;
    projects_count?: number;
}

interface OverallStats {
    projectsCount?: number;
    totalBudget?: number;
    employeesCount?: number;
    materialsCount?: number;
    totalCosts?: number;
    totalSalaryCosts?: number;
    totalMaterialCosts?: number;
    totalPaymentsReceived?: number;
    totalBalance?: number;
}

interface ReportsData {
    overallStats?: OverallStats;
    projectsReport?: ProjectReport[];
    employeesReport?: EmployeeReport[];
    materialsReport?: MaterialReport[];
}

const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

function transliterate(str: string): string {
    return str.split('').map(char => translitMap[char] || char).join('');
}

function normalizeTextForPDF(value: unknown): string {
    if (value === null || value === undefined) return '-';
    const str = String(value).trim();
    if (!str) return '-';
    if (/[а-яёА-ЯЁ]/.test(str)) return transliterate(str);
    return str;
}

function formatCurrencyForPDF(value: number): string {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num) + ' RUB';
}

function formatDateForPDF(date: string | Date | null | undefined): string {
    if (!date) return '-';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    } catch {
        return '-';
    }
}

export function exportProjectsReportToPDF(
    projectsReport: ProjectReport[] | null,
    filename: string | null = null
): void {
    const doc = new jsPDF();
    doc.setProperties({
        title: 'Projects Report',
        author: 'Builder Manager',
        subject: 'Construction Projects Report',
        keywords: 'construction, projects, report'
    });
    const fileName = filename || `projects_report_${new Date().toISOString().split('T')[0]}.pdf`;

    if (!projectsReport || projectsReport.length === 0) {
        doc.setFontSize(16);
        doc.text('Projects Report', 14, 20);
        doc.setFontSize(12);
        doc.setTextColor(128, 128, 128);
        doc.text('No data available', 14, 35);
        doc.save(fileName);
        return;
    }

    doc.setFontSize(18);
    doc.text('Projects Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateForPDF(new Date())}`, 14, 30);

    const tableData = projectsReport.map(project => [
        normalizeTextForPDF(project.name),
        normalizeTextForPDF(project.address),
        `${formatDateForPDF(project.date_start)} - ${formatDateForPDF(project.date_end)}`,
        formatCurrencyForPDF(project.budget || 0),
        formatCurrencyForPDF(project.payments_received || 0),
        formatCurrencyForPDF(project.salary_costs || 0),
        formatCurrencyForPDF(project.material_costs || 0),
        formatCurrencyForPDF(project.total_costs || 0),
        formatCurrencyForPDF(project.balance || 0),
        formatCurrencyForPDF(project.budget_remaining || 0)
    ]);

    const totalBudget = projectsReport.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalPayments = projectsReport.reduce((sum, p) => sum + (Number(p.payments_received) || 0), 0);
    const totalSalary = projectsReport.reduce((sum, p) => sum + (Number(p.salary_costs) || 0), 0);
    const totalMaterials = projectsReport.reduce((sum, p) => sum + (Number(p.material_costs) || 0), 0);
    const totalCosts = projectsReport.reduce((sum, p) => sum + (Number(p.total_costs) || 0), 0);
    const totalBalance = projectsReport.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
    const totalRemaining = projectsReport.reduce((sum, p) => sum + (Number(p.budget_remaining) || 0), 0);

    tableData.push([
        'TOTAL', '-', '-',
        formatCurrencyForPDF(totalBudget),
        formatCurrencyForPDF(totalPayments),
        formatCurrencyForPDF(totalSalary),
        formatCurrencyForPDF(totalMaterials),
        formatCurrencyForPDF(totalCosts),
        formatCurrencyForPDF(totalBalance),
        formatCurrencyForPDF(totalRemaining)
    ]);

    autoTable(doc, {
        head: [['Project', 'Address', 'Period', 'Budget', 'Payments', 'Salary', 'Materials', 'Total Costs', 'Balance', 'Remaining']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } },
        didParseCell: (data) => {
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fillColor = [41, 128, 185];
                data.cell.styles.textColor = 255;
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    doc.save(fileName);
}

export function exportEmployeesReportToPDF(
    employeesReport: EmployeeReport[] | null,
    dateFrom: string | null = null,
    dateTo: string | null = null,
    filename: string | null = null
): void {
    const doc = new jsPDF();
    doc.setProperties({
        title: 'Employees Report',
        author: 'Builder Manager',
        subject: 'Employees Report',
        keywords: 'employees, salary, report'
    });
    const fileName = filename || `employees_report_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.setFontSize(18);
    doc.text('Employees Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateForPDF(new Date())}`, 14, 30);

    if (dateFrom || dateTo) {
        doc.text(`Period: ${dateFrom ? formatDateForPDF(dateFrom) : '-'} - ${dateTo ? formatDateForPDF(dateTo) : '-'}`, 14, 36);
    }

    if (!employeesReport || employeesReport.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(128, 128, 128);
        doc.text('No data available for the selected period', 14, 50);
        doc.save(fileName);
        return;
    }

    const tableData = employeesReport.map(employee => [
        normalizeTextForPDF(employee.name),
        normalizeTextForPDF(employee.role),
        Number(employee.days_worked) || 0,
        formatCurrencyForPDF(Number(employee.total_salary) || 0),
        formatCurrencyForPDF(Number(employee.total_received || employee.total_salary) || 0),
        Number(employee.projects_count) || 0
    ]);

    autoTable(doc, {
        head: [['Employee', 'Role', 'Days Worked', 'Earned', 'Received', 'Projects']],
        body: tableData,
        startY: dateFrom || dateTo ? 42 : 35,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'center' } }
    });

    doc.save(fileName);
}

export function exportMaterialsReportToPDF(
    materialsReport: MaterialReport[] | null,
    filename: string | null = null
): void {
    const doc = new jsPDF();
    doc.setProperties({
        title: 'Materials Report',
        author: 'Builder Manager',
        subject: 'Materials Report',
        keywords: 'materials, construction, report'
    });
    const fileName = filename || `materials_report_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.setFontSize(18);
    doc.text('Materials Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateForPDF(new Date())}`, 14, 30);

    if (!materialsReport || materialsReport.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(128, 128, 128);
        doc.text('No data available', 14, 45);
        doc.save(fileName);
        return;
    }

    const tableData: (string | number)[][] = materialsReport.map(material => [
        normalizeTextForPDF(material.name),
        normalizeTextForPDF(material.unit),
        formatCurrencyForPDF(material.price_per_unit || 0),
        material.total_amount || 0,
        formatCurrencyForPDF(material.total_cost || 0),
        material.projects_count || 0
    ]);

    const totalCost = materialsReport.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);
    const totalAmount = materialsReport.reduce((sum, m) => sum + (Number(m.total_amount) || 0), 0);
    const totalProjects = materialsReport.reduce((sum, m) => sum + (Number(m.projects_count) || 0), 0);

    tableData.push(['TOTAL', '-', '-', totalAmount, formatCurrencyForPDF(totalCost), totalProjects]);

    autoTable(doc, {
        head: [['Material', 'Unit', 'Price per Unit', 'Total Used', 'Total Cost', 'Projects']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'center' } },
        didParseCell: (data) => {
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fillColor = [156, 39, 176];
                data.cell.styles.textColor = 255;
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    doc.save(fileName);
}

export function exportOverallStatsToPDF(
    overallStats: OverallStats | null,
    filename: string | null = null
): void {
    const doc = new jsPDF();
    doc.setProperties({
        title: 'Overall Statistics',
        author: 'Builder Manager',
        subject: 'Overall Statistics Report',
        keywords: 'statistics, overview, report'
    });
    const fileName = filename || `overall_stats_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.setFontSize(20);
    doc.text('Overall Statistics', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateForPDF(new Date())}`, 14, 30);

    if (!overallStats) {
        doc.setFontSize(12);
        doc.setTextColor(128, 128, 128);
        doc.text('No data available', 14, 45);
        doc.save(fileName);
        return;
    }

    let yPos = 40;
    const stats: { label: string; value: string | number; color: [number, number, number] }[] = [
        { label: 'Projects', value: overallStats.projectsCount || 0, color: [41, 128, 185] },
        { label: 'Total Budget', value: formatCurrencyForPDF(overallStats.totalBudget || 0), color: [41, 128, 185] },
        { label: 'Employees', value: overallStats.employeesCount || 0, color: [46, 125, 50] },
        { label: 'Materials', value: overallStats.materialsCount || 0, color: [156, 39, 176] },
        { label: 'Total Costs', value: formatCurrencyForPDF(overallStats.totalCosts || 0), color: [211, 47, 47] },
        { label: 'Salary Costs', value: formatCurrencyForPDF(overallStats.totalSalaryCosts || 0), color: [211, 47, 47] },
        { label: 'Material Costs', value: formatCurrencyForPDF(overallStats.totalMaterialCosts || 0), color: [211, 47, 47] },
        { label: 'Payments', value: formatCurrencyForPDF(overallStats.totalPaymentsReceived || 0), color: [46, 125, 50] },
        { label: 'Balance', value: formatCurrencyForPDF(overallStats.totalBalance || 0), color: (overallStats.totalBalance || 0) >= 0 ? [46, 125, 50] : [211, 47, 47] }
    ];

    stats.forEach((stat, index) => {
        if (index > 0 && index % 3 === 0) yPos += 35;
        const xPos = 14 + (index % 3) * 65;
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.roundedRect(xPos, yPos, 60, 30, 3, 3, 'FD');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(stat.label, xPos + 5, yPos + 12);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value.toString(), xPos + 5, yPos + 22);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
    });

    doc.save(fileName);
}

export function exportAllReportsToPDF(
    reportsData: ReportsData | null,
    filename: string | null = null,
    dateFrom: string | null = null,
    dateTo: string | null = null
): void {
    if (!reportsData) {
        throw new Error('Нет данных для экспорта отчётов');
    }

    const doc = new jsPDF();
    doc.setProperties({
        title: 'All Reports',
        author: 'Builder Manager',
        subject: 'Complete Reports Package',
        keywords: 'reports, projects, employees, materials, statistics'
    });
    const fileName = filename || `all_reports_${new Date().toISOString().split('T')[0]}.pdf`;

    let currentY = 20;

    doc.setFontSize(18);
    doc.text('Overall Statistics', 14, currentY);
    currentY += 10;
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateForPDF(new Date())}`, 14, currentY);
    currentY += 15;

    if (reportsData.overallStats) {
        const stats = [
            ['Projects', reportsData.overallStats.projectsCount || 0],
            ['Total Budget', formatCurrencyForPDF(reportsData.overallStats.totalBudget || 0)],
            ['Employees', reportsData.overallStats.employeesCount || 0],
            ['Materials', reportsData.overallStats.materialsCount || 0],
            ['Total Costs', formatCurrencyForPDF(reportsData.overallStats.totalCosts || 0)],
            ['Payments', formatCurrencyForPDF(reportsData.overallStats.totalPaymentsReceived || 0)],
            ['Balance', formatCurrencyForPDF(reportsData.overallStats.totalBalance || 0)]
        ];

        autoTable(doc, {
            head: [['Metric', 'Value']],
            body: stats,
            startY: currentY,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
        });

        currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    // Employees Summary
    if (reportsData.employeesReport && reportsData.employeesReport.length > 0) {
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        } else {
            currentY += 10;
        }

        doc.setFontSize(14);
        doc.text('Employees Summary', 14, currentY);
        currentY += 8;

        const employeesSummary: (string | number)[][] = reportsData.employeesReport.map(employee => [
            normalizeTextForPDF(employee.name),
            normalizeTextForPDF(employee.role),
            Number(employee.days_worked) || 0,
            formatCurrencyForPDF(Number(employee.total_salary) || 0),
            formatCurrencyForPDF(Number(employee.total_received || employee.total_salary) || 0)
        ]);

        const totalEarned = reportsData.employeesReport.reduce((sum, emp) => sum + (Number(emp.total_salary) || 0), 0);
        const totalReceived = reportsData.employeesReport.reduce((sum, emp) => sum + (Number(emp.total_received || emp.total_salary) || 0), 0);
        const totalDays = reportsData.employeesReport.reduce((sum, emp) => sum + (Number(emp.days_worked) || 0), 0);

        employeesSummary.push(['TOTAL', '-', totalDays, formatCurrencyForPDF(totalEarned), formatCurrencyForPDF(totalReceived)]);

        autoTable(doc, {
            head: [['Employee', 'Role', 'Days Worked', 'Earned', 'Received']],
            body: employeesSummary,
            startY: currentY,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
            didParseCell: (data) => {
                if (data.row.index === employeesSummary.length - 1) {
                    data.cell.styles.fillColor = [46, 125, 50];
                    data.cell.styles.textColor = 255;
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Projects Report
    if (reportsData.projectsReport && reportsData.projectsReport.length > 0) {
        doc.addPage();
        currentY = 20;

        doc.setFontSize(18);
        doc.text('Projects Report', 14, currentY);
        currentY += 10;

        const projectsData: (string | number)[][] = reportsData.projectsReport.map(project => [
            normalizeTextForPDF(project.name),
            normalizeTextForPDF(project.address),
            `${formatDateForPDF(project.date_start) || '-'} - ${formatDateForPDF(project.date_end) || '-'}`,
            formatCurrencyForPDF(project.budget || 0),
            formatCurrencyForPDF(project.payments_received || 0),
            formatCurrencyForPDF(project.salary_costs || 0),
            formatCurrencyForPDF(project.material_costs || 0),
            formatCurrencyForPDF(project.total_costs || 0),
            formatCurrencyForPDF(project.balance || 0),
            formatCurrencyForPDF(project.budget_remaining || 0)
        ]);

        const totalBudget = reportsData.projectsReport.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
        const totalPayments = reportsData.projectsReport.reduce((sum, p) => sum + (Number(p.payments_received) || 0), 0);
        const totalCosts = reportsData.projectsReport.reduce((sum, p) => sum + (Number(p.total_costs) || 0), 0);
        const totalBalance = reportsData.projectsReport.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);

        projectsData.push(['TOTAL', '-', '-', formatCurrencyForPDF(totalBudget), formatCurrencyForPDF(totalPayments), '-', '-', formatCurrencyForPDF(totalCosts), formatCurrencyForPDF(totalBalance), '-']);

        autoTable(doc, {
            head: [['Project', 'Address', 'Period', 'Budget', 'Payments', 'Salary', 'Materials', 'Total Costs', 'Balance', 'Remaining']],
            body: projectsData,
            startY: currentY,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } },
            didParseCell: (data) => {
                if (data.row.index === projectsData.length - 1) {
                    data.cell.styles.fillColor = [41, 128, 185];
                    data.cell.styles.textColor = 255;
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
    }

    // Employees Report Page
    doc.addPage();
    currentY = 20;

    doc.setFontSize(18);
    doc.text('Employees Report', 14, currentY);
    currentY += 10;
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateForPDF(new Date())}`, 14, currentY);
    currentY += 6;

    if (dateFrom || dateTo) {
        doc.text(`Period: ${dateFrom ? formatDateForPDF(dateFrom) : '-'} - ${dateTo ? formatDateForPDF(dateTo) : '-'}`, 14, currentY);
        currentY += 10;
    } else {
        currentY += 4;
    }

    if (reportsData.employeesReport && reportsData.employeesReport.length > 0) {
        const employeesData = reportsData.employeesReport.map(employee => [
            normalizeTextForPDF(employee.name),
            normalizeTextForPDF(employee.role),
            Number(employee.days_worked) || 0,
            formatCurrencyForPDF(Number(employee.total_salary) || 0),
            formatCurrencyForPDF(Number(employee.total_received || employee.total_salary) || 0),
            Number(employee.projects_count) || 0
        ]);

        autoTable(doc, {
            head: [['Employee', 'Role', 'Days', 'Earned', 'Received', 'Projects']],
            body: employeesData,
            startY: currentY,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'center' } }
        });
    } else {
        doc.setFontSize(12);
        doc.setTextColor(128, 128, 128);
        doc.text('No employee data available for the selected period.', 14, currentY);
        doc.setTextColor(0, 0, 0);
    }

    // Materials Report
    if (reportsData.materialsReport && reportsData.materialsReport.length > 0) {
        doc.addPage();
        currentY = 20;

        doc.setFontSize(18);
        doc.text('Materials Report', 14, currentY);
        currentY += 10;

        const materialsData: (string | number)[][] = reportsData.materialsReport.map(material => [
            normalizeTextForPDF(material.name),
            normalizeTextForPDF(material.unit),
            formatCurrencyForPDF(material.price_per_unit || 0),
            material.total_amount || 0,
            formatCurrencyForPDF(material.total_cost || 0),
            material.projects_count || 0
        ]);

        const totalCost = reportsData.materialsReport.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);
        const totalAmount = reportsData.materialsReport.reduce((sum, m) => sum + (Number(m.total_amount) || 0), 0);

        materialsData.push(['TOTAL', '-', '-', totalAmount, formatCurrencyForPDF(totalCost), '-']);

        autoTable(doc, {
            head: [['Material', 'Unit', 'Price per Unit', 'Total Used', 'Total Cost', 'Projects']],
            body: materialsData,
            startY: currentY,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'center' } },
            didParseCell: (data) => {
                if (data.row.index === materialsData.length - 1) {
                    data.cell.styles.fillColor = [156, 39, 176];
                    data.cell.styles.textColor = 255;
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
    }

    doc.save(fileName);
}

