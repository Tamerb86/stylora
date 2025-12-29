import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AppointmentsChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

export default function AppointmentsChart({ data }: AppointmentsChartProps) {
  const { t } = useTranslation();

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('no-NO', { weekday: 'short', day: 'numeric', month: 'short' });
    }),
    datasets: [
      {
        label: t('dashboard.appointments'),
        data: data.map(d => d.count),
        borderColor: 'rgb(99, 102, 241)', // Indigo
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)'); // Indigo with opacity
          gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)'); // Purple with opacity
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)'); // Blue with low opacity
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointHoverBackgroundColor: 'rgb(139, 92, 246)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 16,
        borderRadius: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 2,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' avtaler';
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            weight: '500' as const,
          },
          color: 'rgb(107, 114, 128)',
          padding: 8,
        },
        grid: {
          color: 'rgba(99, 102, 241, 0.08)',
          lineWidth: 1,
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: '500' as const,
          },
          color: 'rgb(107, 114, 128)',
          padding: 8,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="h-[250px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
