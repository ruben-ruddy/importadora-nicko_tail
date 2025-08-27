// sistema-ventas-frontend/src/app/utils/chart.utils.ts
import { Chart, registerables } from 'chart.js';

export class ChartUtils {
  static initialize() {
    Chart.register(...registerables);
  }

  static createForecastChart(ctx: CanvasRenderingContext2D, data: any) {
    return new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Fecha'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Ventas'
            }
          }
        }
      }
    });
  }
}