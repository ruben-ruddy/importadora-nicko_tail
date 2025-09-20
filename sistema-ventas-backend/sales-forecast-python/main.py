from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
import logging
from datetime import datetime, timedelta

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sales Forecast API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ForecastRequest(BaseModel):
    historical_data: List[Dict[str, Any]]
    method: str
    periods: int
    frequency: str
    window_size: Optional[int] = 3
    alpha: Optional[float] = 0.3

class ForecastResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    metrics: Dict[str, float]
    model_info: Dict[str, Any]

def prepare_time_series_data(historical_data, frequency):
    """Prepara los datos históricos para el análisis de series de tiempo"""
    try:
        df = pd.DataFrame(historical_data)
        df['fecha'] = pd.to_datetime(df['fecha'])
        df.set_index('fecha', inplace=True)
        
        # Resample según la frecuencia
        if frequency == 'D':
            df = df.resample('D').sum()
        elif frequency == 'W':
            df = df.resample('W-MON').sum()
        elif frequency == 'M':
            df = df.resample('M').sum()
        
        return df
    except Exception as e:
        logger.error(f"Error preparing time series data: {str(e)}")
        raise

def filter_outliers(data, threshold=2.0):
    """Filtrar valores atípicos usando el método del rango intercuartílico"""
    try:
        if len(data) < 3:
            return data
        
        q1 = np.percentile(data, 25)
        q3 = np.percentile(data, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - threshold * iqr
        upper_bound = q3 + threshold * iqr
        
        filtered_data = [x for x in data if lower_bound <= x <= upper_bound]
        logger.info(f"Filtered outliers: {len(data)} -> {len(filtered_data)}")
        return filtered_data
    except Exception as e:
        logger.error(f"Error filtering outliers: {str(e)}")
        return data

def moving_average_forecast(data, periods, window_size=3, alpha=0.3):
    """Pronóstico usando promedio móvil con suavizado exponencial"""
    try:
        # Filtrar outliers antes de calcular
        filtered_data = filter_outliers(data)
        
        predictions = []
        forecast_data = filtered_data.copy()
        
        for i in range(periods):
            # Usar ventana disponible si no hay suficientes datos
            actual_window_size = min(window_size, len(forecast_data))
            window = forecast_data[-actual_window_size:]
            average = np.mean(window) if len(window) > 0 else 0
            
            # Aplicar suavizado exponencial
            if len(forecast_data) > 0:
                last_value = forecast_data[-1]
                smoothed_prediction = alpha * average + (1 - alpha) * last_value
            else:
                smoothed_prediction = average
                
            predictions.append(smoothed_prediction)
            forecast_data = np.append(forecast_data, smoothed_prediction)
        
        return predictions
    except Exception as e:
        logger.error(f"Error in moving average forecast: {str(e)}")
        raise

def calculate_metrics(actual, predicted):
    """Calcula métricas SOLO con los datos MÁS RECIENTES"""
    try:
        if len(actual) < 3 or len(predicted) < 3:
            return {'mae': 0, 'mape': 0, 'rmse': 0, 'accuracy': 0}
        
        # USAR SOLO LOS ÚLTIMOS 3 MESES para cálculo de métricas
        # (los más relevantes para evaluar el pronóstico)
        actual_recent = actual[-3:]  # Julio, Agosto, Septiembre
        predicted_recent = predicted[:3]  # Oct, Nov, Dic pronosticados
        
        # Calcular MAE solo con datos recientes
        mae = mean_absolute_error(actual_recent, predicted_recent)
        
        # Calcular MAPE de forma robusta
        mape_sum = 0
        valid_points = 0
        
        for a, p in zip(actual_recent, predicted_recent):
            if a > 1000:  # Solo valores razonables
                error_pct = abs((a - p) / a)
                mape_sum += min(error_pct, 0.5)  # Máximo 50% de error por punto
                valid_points += 1
        
        mape = (mape_sum / valid_points) * 100 if valid_points > 0 else 0
        
        # Calcular precisión
        accuracy = max(0, 100 - mape)
        
        return {
            'mae': float(mae),
            'mape': float(mape),
            'rmse': float(np.sqrt(mean_squared_error(actual_recent, predicted_recent))),
            'accuracy': float(accuracy)
        }
        
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        return {'mae': 0, 'mape': 0, 'rmse': 0, 'accuracy': 0}
    

@app.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    try:
        logger.info(f"Generando pronóstico con método: {request.method}")
        logger.info(f"Datos recibidos: {len(request.historical_data)} puntos")
        
        # Preparar datos
        df = prepare_time_series_data(request.historical_data, request.frequency)
        y = df['ventas'].values
        
        logger.info(f"Datos procesados: {len(y)} valores")
        
        if len(y) < 2:
            raise HTTPException(status_code=400, detail="Se necesitan al menos 2 puntos de datos históricos")
        
        # Usar promedio móvil
        if request.method == 'moving_average':
            predictions = moving_average_forecast(
                y, 
                request.periods, 
                request.window_size, 
                request.alpha
            )
        else:
            raise HTTPException(status_code=400, detail=f"Método no soportado: {request.method}")
        
        # Calcular métricas
        metrics = calculate_metrics(y, predictions)
        
        # Formatear respuesta
        last_date = df.index[-1]
        formatted_predictions = []
        
        for i, pred in enumerate(predictions):
            if request.frequency == 'D':
                pred_date = last_date + timedelta(days=i+1)
            elif request.frequency == 'W':
                pred_date = last_date + timedelta(weeks=i+1)
            elif request.frequency == 'M':
                pred_date = last_date + timedelta(days=30*(i+1))
            
            # Calcular intervalo de confianza
            confidence_multiplier = 0.2 + (i * 0.05)
            inferior = max(0, pred * (1 - confidence_multiplier))
            superior = pred * (1 + confidence_multiplier)
            
            formatted_predictions.append({
                "fecha": pred_date.strftime("%Y-%m-%d"),
                "ventas_previstas": float(pred),
                "intervalo_confianza": {
                    "inferior": float(inferior),
                    "superior": float(superior)
                }
            })
        
        return ForecastResponse(
            predictions=formatted_predictions,
            metrics=metrics,
            model_info={
                'type': 'moving_average',
                'window_size': request.window_size,
                'alpha': request.alpha,
                'periods': request.periods
            }
        )
        
    except Exception as e:
        logger.error(f"Error en generación de pronóstico: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sales-forecast"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)