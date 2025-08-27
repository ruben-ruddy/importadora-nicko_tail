// sistema-ventas-frontend/src/app/modules/forecast/models/seasonal.model.ts

export class SeasonalModel {
  static predict(data: number[], periods: number, seasonality: number): { predictions: number[], fittedValues: number[] } {
    // Este modelo asume que el patrón se repite cada 'seasonality' periodos.
    const fittedValues: number[] = [];
    const predictions: number[] = [];

    // Calcular el promedio de cada período estacional para los datos históricos
    const seasonalAverages = new Array(seasonality).fill(0).map((_, i) => {
      const values = data.filter((_, idx) => (idx + 1) % seasonality === (i + 1) % seasonality);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });

    // Generar los valores ajustados para calcular la precisión
    for (let i = 0; i < data.length; i++) {
      fittedValues.push(seasonalAverages[(i % seasonality)]);
    }

    // Generar las predicciones futuras
    for (let i = 0; i < periods; i++) {
      predictions.push(seasonalAverages[(data.length + i) % seasonality]);
    }

    return { predictions, fittedValues };
  }

  static calculateConfidenceInterval(predictions: number[], actuals: number[], seasonality: number): { inferior: number; superior: number }[] {
    // Un intervalo de confianza simple, adaptado al modelo estacional.
    const confidenceIntervals = predictions.map((pred, index) => {
      // Usar la desviación de los datos históricos del mismo periodo estacional
      const historicalValues = actuals.filter((_, idx) => (idx + 1) % seasonality === (index + 1) % seasonality);
      const average = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
      const stdDev = Math.sqrt(historicalValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / historicalValues.length);
      const error = 1.96 * (stdDev / Math.sqrt(historicalValues.length)); // Aproximación simple

      return {
        inferior: pred - error,
        superior: pred + error,
      };
    });
    return confidenceIntervals;
  }
}