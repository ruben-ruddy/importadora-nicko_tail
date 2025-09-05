from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
import json
from datetime import datetime, timedelta
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sales Forecast API", version="1.0.0")

class ForecastRequest(BaseModel):
    historical_data: List[Dict[str, Any]]
    method: str  # 'lineal', 'promedio_movil', 'estacional', 'arima', 'exponential_smoothing'
    periods: int
    frequency: str  # 'D' (diario), 'W' (semanal), 'M' (mensual)
    alpha: Optional[float] = 0.3
    seasonality: Optional[int] = None

class ForecastResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    metrics: Dict[str, float]
    model_info: Dict[str, Any]

def prepare_time_series_data(historical_data, frequency):
    """Prepara los datos históricos para el análisis de series de tiempo"""
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

@app.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    try:
        logger.info(f"Generando pronóstico con método: {request.method}")
        
        # Preparar datos
        df = prepare_time_series_data(request.historical_data, request.frequency)
        y = df['ventas'].values
        
        if len(y) < 2:
            raise HTTPException(status_code=400, detail="Se necesitan al menos 2 puntos de datos históricos")
        
        predictions = []
        metrics = {}
        model_info = {}
        
        if request.method == 'lineal':
            results = linear_regression_forecast(y, request.periods)
            predictions = results['predictions']
            metrics = results['metrics']
            model_info = results['model_info']
            
        elif request.method == 'promedio_movil':
            results = moving_average_forecast(y, request.periods, request.alpha)
            predictions = results['predictions']
            metrics = results['metrics']
            model_info = results['model_info']
            
        elif request.method == 'estacional':
            if not request.seasonality:
                raise HTTPException(status_code=400, detail="Se requiere parámetro de estacionalidad")
            results = seasonal_forecast(y, request.periods, request.seasonality, request.frequency)
            predictions = results['predictions']
            metrics = results['metrics']
            model_info = results['model_info']
            
        elif request.method == 'exponential_smoothing':
            results = exponential_smoothing_forecast(y, request.periods, request.frequency)
            predictions = results['predictions']
            metrics = results['metrics']
            model_info = results['model_info']
            
        elif request.method == 'arima':
            results = arima_forecast(y, request.periods, request.frequency)
            predictions = results['predictions']
            metrics = results['metrics']
            model_info = results['model_info']
            
        else:
            raise HTTPException(status_code=400, detail="Método de pronóstico no válido")
        
        # Formatear respuesta
        last_date = df.index[-1]
        formatted_predictions = []
        
        for i, pred in enumerate(predictions):
            if request.frequency == 'D':
                pred_date = last_date + timedelta(days=i+1)
            elif request.frequency == 'W':
                pred_date = last_date + timedelta(weeks=i+1)
            elif request.frequency == 'M':
                # Aproximación para meses
                pred_date = last_date + timedelta(days=30*(i+1))
            
            formatted_predictions.append({
                "fecha": pred_date.strftime("%Y-%m-%d"),
                "ventas_previstas": float(pred),
                "intervalo_confianza": {
                    "inferior": float(pred * 0.8),  # Simplificado
                    "superior": float(pred * 1.2)   # Simplificado
                }
            })
        
        return ForecastResponse(
            predictions=formatted_predictions,
            metrics=metrics,
            model_info=model_info
        )
        
    except Exception as e:
        logger.error(f"Error en generación de pronóstico: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def linear_regression_forecast(data, periods):
    """Pronóstico usando regresión lineal"""
    X = np.array(range(len(data))).reshape(-1, 1)
    y = np.array(data)
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predecir
    future_X = np.array(range(len(data), len(data) + periods)).reshape(-1, 1)
    predictions = model.predict(future_X)
    
    # Métricas
    y_pred = model.predict(X)
    mae = mean_absolute_error(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    r2 = r2_score(y, y_pred)
    
    return {
        'predictions': predictions,
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2_score': float(r2),
            'accuracy': float(max(0, 100 - (mae / np.mean(y) * 100)))
        },
        'model_info': {
            'type': 'linear_regression',
            'coefficient': float(model.coef_[0]),
            'intercept': float(model.intercept_)
        }
    }

def moving_average_forecast(data, periods, alpha=0.3):
    """Pronóstico usando promedio móvil con suavizado exponencial"""
    predictions = []
    forecast_data = list(data)
    
    for i in range(periods):
        window = forecast_data[-3:]  # Ventana de 3 períodos
        average = np.mean(window) if window else np.mean(data)
        smoothed_prediction = alpha * average + (1 - alpha) * forecast_data[-1]
        
        predictions.append(smoothed_prediction)
        forecast_data.append(smoothed_prediction)
    
    # Métricas (usando los últimos puntos para validación)
    if len(data) > 5:
        val_size = min(5, len(data) - 1)
        actuals = data[-val_size:]
        preds = predictions[:val_size]
        
        mae = mean_absolute_error(actuals, preds) if len(actuals) == len(preds) else 0
        accuracy = max(0, 100 - (mae / np.mean(actuals) * 100)) if np.mean(actuals) > 0 else 0
    else:
        mae = 0
        accuracy = 0
    
    return {
        'predictions': predictions,
        'metrics': {
            'mae': float(mae),
            'accuracy': float(accuracy)
        },
        'model_info': {
            'type': 'moving_average',
            'alpha': alpha,
            'window_size': 3
        }
    }

def seasonal_forecast(data, periods, seasonality, frequency):
    """Pronóstico considerando estacionalidad"""
    try:
        # Convertir a serie temporal
        if frequency == 'D':
            freq = 'D'
        elif frequency == 'W':
            freq = 'W'
        elif frequency == 'M':
            freq = 'M'
        
        series = pd.Series(data)
        
        # Descomposición estacional
        result = seasonal_decompose(series, model='additive', period=seasonality)
        
        # Pronóstico simple basado en patrones estacionales
        seasonal_component = result.seasonal[-seasonality:].values
        trend = np.mean(series[-seasonality:]) if len(series) >= seasonality else np.mean(series)
        
        predictions = []
        for i in range(periods):
            seasonal_idx = i % seasonality
            prediction = trend + seasonal_component[seasonal_idx]
            predictions.append(prediction)
        
        # Métricas
        if len(data) > seasonality * 2:
            # Validación usando datos históricos
            val_predictions = []
            for i in range(seasonality):
                seasonal_idx = i % seasonality
                val_predictions.append(trend + seasonal_component[seasonal_idx])
            
            actuals = data[-seasonality:]
            mae = mean_absolute_error(actuals, val_predictions)
            accuracy = max(0, 100 - (mae / np.mean(actuals) * 100))
        else:
            mae = 0
            accuracy = 0
        
        return {
            'predictions': predictions,
            'metrics': {
                'mae': float(mae),
                'accuracy': float(accuracy)
            },
            'model_info': {
                'type': 'seasonal',
                'seasonality': seasonality,
                'trend': float(trend)
            }
        }
        
    except Exception as e:
        logger.error(f"Error en pronóstico estacional: {str(e)}")
        # Fallback a método simple
        return moving_average_forecast(data, periods, 0.3)

def exponential_smoothing_forecast(data, periods, frequency):
    """Pronóstico usando suavizado exponencial de Holt-Winters"""
    try:
        if frequency == 'D':
            freq = 7  # Estacionalidad semanal para datos diarios
        elif frequency == 'W':
            freq = 52  # Estacionalidad anual para datos semanales
        elif frequency == 'M':
            freq = 12  # Estacionalidad anual para datos mensuales
        
        model = ExponentialSmoothing(
            data, 
            seasonal='additive', 
            seasonal_periods=min(freq, len(data)//2) if len(data) > freq*2 else None
        )
        fitted_model = model.fit()
        predictions = fitted_model.forecast(periods)
        
        # Métricas
        y_pred = fitted_model.fittedvalues
        mae = mean_absolute_error(data[:len(y_pred)], y_pred)
        accuracy = max(0, 100 - (mae / np.mean(data) * 100)) if np.mean(data) > 0 else 0
        
        return {
            'predictions': predictions,
            'metrics': {
                'mae': float(mae),
                'accuracy': float(accuracy)
            },
            'model_info': {
                'type': 'exponential_smoothing',
                'model_params': str(fitted_model.params)
            }
        }
        
    except Exception as e:
        logger.error(f"Error en suavizado exponencial: {str(e)}")
        return moving_average_forecast(data, periods, 0.3)

def arima_forecast(data, periods, frequency):
    """Pronóstico usando modelo ARIMA"""
    try:
        # Modelo ARIMA simple - en producción se debería hacer una búsqueda de parámetros
        model = ARIMA(data, order=(1, 1, 1))
        fitted_model = model.fit()
        predictions = fitted_model.forecast(periods)
        
        # Métricas
        y_pred = fitted_model.fittedvalues
        mae = mean_absolute_error(data[1:len(y_pred)+1], y_pred)
        accuracy = max(0, 100 - (mae / np.mean(data) * 100)) if np.mean(data) > 0 else 0
        
        return {
            'predictions': predictions,
            'metrics': {
                'mae': float(mae),
                'accuracy': float(accuracy)
            },
            'model_info': {
                'type': 'arima',
                'order': '(1,1,1)',
                'aic': float(fitted_model.aic)
            }
        }
        
    except Exception as e:
        logger.error(f"Error en modelo ARIMA: {str(e)}")
        return moving_average_forecast(data, periods, 0.3)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)