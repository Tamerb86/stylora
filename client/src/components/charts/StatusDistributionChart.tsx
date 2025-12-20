import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusDistributionChartProps {
  data: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
}

export default function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const { t } = useTranslation();

  const chartData = {
    labels: [
      t('dashboard.confirmed'),
      t('dashboard.pendingStatus'),
      t('dashboard.cancelled'),
    ],
    datasets: [
      {
        data: [data.confirmed, data.pending, data.cancelled],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // Green for confirmed
          'rgba(245, 158, 11, 0.8)',  // Amber for pending
          'rgba(239, 68, 68, 0.8)',   // Red for cancelled
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
  };

  return (
    <div className="h-[250px] w-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
