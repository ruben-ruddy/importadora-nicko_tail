// sistema-ventas-frontend/src/app/modules/forecast/models/moving-average.model.ts

export class MovingAverageModel {
  // Realizar predicciones utilizando el método de media móvil con suavizado exponencial
  static predict(data: number[], periods: number, windowSize: number, alpha: number): { predictions: number[], accuracy: number } {
    const predictions: number[] = [];
    const forecastData: number[] = [...data];
    
    for (let i = 0; i < periods; i++) {
      const window: number[] = forecastData.slice(-windowSize);
      const average = window.reduce((a, b) => a + b, 0) / window.length;
      const smoothedPrediction = alpha * average + (1 - alpha) * (forecastData[forecastData.length - 1] || average);
      
      predictions.push(smoothedPrediction);
      forecastData.push(smoothedPrediction);
    }

    const actualsForAccuracy = data.slice(-predictions.length);
    const predictionsForAccuracy = predictions.slice(0, actualsForAccuracy.length);

    const mape = actualsForAccuracy.reduce((sum, actual, index) => {
      const absoluteError = Math.abs(actual - predictionsForAccuracy[index]);
      return sum + (actual !== 0 ? absoluteError / actual : 0);
    }, 0) / actualsForAccuracy.length;

    const accuracy = (1 - mape) * 100;
    
    return { predictions, accuracy };
  }

  // Calcular intervalos de confianza para las predicciones
  static calculateConfidenceInterval(predictions: number[], actuals: number[]): { inferior: number; superior: number }[] {
    const confidenceIntervals = predictions.map(pred => ({
      inferior: pred * 0.9,
      superior: pred * 1.1,
    }));
    return confidenceIntervals;
  }
}