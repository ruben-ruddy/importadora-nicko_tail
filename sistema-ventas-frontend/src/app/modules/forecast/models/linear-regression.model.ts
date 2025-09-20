// sistema-ventas-frontend/src/app/modules/forecast/models/linear-regression.model.ts

export class LinearRegressionModel {
  static predict(data: number[], periods: number): { predictions: number[], rSquared: number } {
    const n = data.length;
    const x: number[] = Array.from({ length: n }, (_, i) => i + 1);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum: number, val: number, idx: number) => sum + val * data[idx], 0);
    const sumX2 = x.reduce((sum: number, val: number) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions: number[] = [];
    for (let i = 1; i <= periods; i++) {
      predictions.push(intercept + slope * (n + i));
    }

    // Cálculo de R²
    const yMean = sumY / n;
    const ssTot = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssRes = data.reduce((sum, val, idx) => sum + Math.pow(val - (intercept + slope * x[idx]), 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    
    return { predictions, rSquared };
  }

  static calculateConfidenceInterval(predictions: number[], salesValues: number[]): { inferior: number; superior: number }[] {
    return predictions.map(pred => ({
      inferior: pred * 0.9,
      superior: pred * 1.1,
    }));
  }
}
