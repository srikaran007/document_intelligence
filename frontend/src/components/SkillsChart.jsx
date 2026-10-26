import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SKILL_COLORS = [
  'rgba(99, 120, 255, 0.85)',
  'rgba(167, 139, 250, 0.85)',
  'rgba(52, 211, 153, 0.85)',
  'rgba(251, 191, 36, 0.85)',
  'rgba(248, 113, 113, 0.85)',
  'rgba(56, 189, 248, 0.85)',
  'rgba(251, 146, 60, 0.85)',
  'rgba(129, 140, 248, 0.85)',
  'rgba(34, 211, 238, 0.85)',
  'rgba(163, 230, 53, 0.85)',
];

function SkillsChart({ skills }) {
  if (!skills || skills.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.88rem' }}>
        No skills extracted from the document.
      </p>
    );
  }

  // Limit to first 12 skills for readability
  const displaySkills = skills.slice(0, 12);

  // Assign a score based on position (first mentioned = more prominent)
  const scores = displaySkills.map((_, i) => Math.max(100 - i * 7, 30));

  const data = {
    labels: displaySkills,
    datasets: [
      {
        label: 'Skill Prominence',
        data: scores,
        backgroundColor: displaySkills.map((_, i) => SKILL_COLORS[i % SKILL_COLORS.length]),
        borderColor: displaySkills.map((_, i) =>
          SKILL_COLORS[i % SKILL_COLORS.length].replace('0.85', '1')),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw}% prominence`,
        },
        backgroundColor: '#1a1d2e',
        titleColor: '#e8eaf6',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(99,120,255,0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(99,120,255,0.08)' },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { color: 'transparent' },
        max: 110,
      },
      y: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12, weight: '500' } },
        border: { color: 'transparent' },
      },
    },
  };

  const chartHeight = Math.max(240, displaySkills.length * 34);

  return (
    <div id="skills-chart" style={{ height: chartHeight, position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default SkillsChart;
