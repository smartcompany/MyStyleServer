import axios from 'axios';
import { Weather, WeatherForecast, WeatherApiResponse, WeatherApiForecastResponse, ForecastDay } from '@/types/weather';

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.weatherapi.com/v1';

  constructor() {
    this.apiKey = process.env.WEATHERAPI_KEY || '';
    if (!this.apiKey) {
      console.log('WeatherAPI key not found - weather requests will fail');
    }
  }

  async getCurrentWeather(latitude: number, longitude: number, language: string = 'en'): Promise<Weather> {
    // API 키가 없으면 에러 반환
    if (!this.apiKey) {
      throw new Error('WeatherAPI key not found');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/current.json`,
        {
          params: {
            key: this.apiKey,
            q: `${latitude},${longitude}`,
            aqi: 'yes', // 대기질 정보 포함
            lang: language,
          },
        }
      );

      return this.transformWeatherApiResponse(response.data, language);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new Error(`Failed to fetch weather data: ${error}`);
    }
  }

  async getWeatherByCity(cityName: string, language: string = 'en'): Promise<Weather> {
    // API 키가 없으면 에러 반환
    if (!this.apiKey) {
      throw new Error('WeatherAPI key not found');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/current.json`,
        {
          params: {
            key: this.apiKey,
            q: cityName,
            aqi: 'yes',
            lang: language,
          },
        }
      );

      return this.transformWeatherApiResponse(response.data, language);
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      throw new Error(`Failed to fetch weather data for city ${cityName}: ${error}`);
    }
  }

  async getWeatherForecast(latitude: number, longitude: number, language: string = 'en'): Promise<WeatherForecast> {
    // API 키가 없으면 에러 반환
    if (!this.apiKey) {
      throw new Error('WeatherAPI key not found');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/forecast.json`,
        {
          params: {
            key: this.apiKey,
            q: `${latitude},${longitude}`,
            days: 7, // 7일 예보
            aqi: 'yes',
            lang: language,
          },
        }
      );

      return this.transformWeatherApiForecastResponse(response.data, language);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error(`Failed to fetch weather forecast: ${error}`);
    }
  }

  private transformWeatherApiResponse(data: WeatherApiResponse, language: string = 'en'): Weather {
    // 구름 양을 고려한 더 정확한 날씨 조건
    let adjustedDescription = data.current.condition.text;
    let adjustedMain = data.current.condition.text;
    
    // 구름 양이 75% 이상이면 흐림으로 조정
    if (data.current.cloud >= 75) {
      adjustedDescription = this.getLocalizedWeatherDescription('overcast', language);
      adjustedMain = 'Clouds';
    } else if (data.current.cloud >= 50) {
      adjustedDescription = this.getLocalizedWeatherDescription('partly_cloudy', language);
      adjustedMain = 'Partly Cloudy';
    } else if (data.current.cloud >= 25) {
      adjustedDescription = this.getLocalizedWeatherDescription('mostly_clear', language);
      adjustedMain = 'Mostly Clear';
    }

    return {
      temperature: data.current.temp_c,
      feelsLike: data.current.feelslike_c,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph / 3.6, // kph를 m/s로 변환
      description: adjustedDescription,
      icon: data.current.condition.icon.replace('//', 'https://'),
      main: adjustedMain,
      location: data.location.name,
      timestamp: new Date().toISOString(),
    };
  }

  private getLocalizedWeatherDescription(condition: string, language: string): string {
    const translations = {
      overcast: {
        en: 'Overcast',
        ko: '흐림',
        ja: '曇り',
        zh: '阴天',
      },
      partly_cloudy: {
        en: 'Partly Cloudy',
        ko: '부분적으로 흐림',
        ja: '一部曇り',
        zh: '部分多云',
      },
      mostly_clear: {
        en: 'Mostly Clear',
        ko: '약간 흐림',
        ja: 'ほぼ晴れ',
        zh: '大部晴朗',
      },
    };

    return translations[condition as keyof typeof translations]?.[language as keyof typeof translations.overcast] || 
           translations[condition as keyof typeof translations].en || condition;
  }


  private transformWeatherApiForecastResponse(data: WeatherApiForecastResponse, language: string = 'en'): WeatherForecast {
    const days = data.forecast.forecastday.map((day: ForecastDay) => ({
      date: day.date, // Keep as string to match WeatherDay interface
      minTemp: day.day.mintemp_c,
      maxTemp: day.day.maxtemp_c,
      description: day.day.condition.text, // WeatherAPI에서 이미 언어별로 제공됨
      icon: day.day.condition.icon.replace('//', 'https://'),
      main: day.day.condition.text,
    }));
    
    return { days };
  }


}

