import axios from 'axios';
import { Weather, WeatherForecast, WeatherApiResponse, WeatherApiForecastResponse, ForecastDay } from '@/types/weather';

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.weatherapi.com/v1';

  constructor() {
    this.apiKey = process.env.WEATHERAPI_KEY || '';
    if (!this.apiKey) {
      // 테스트용 더미 데이터 사용
      console.log('WeatherAPI key not found, using dummy data');
    }
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<Weather> {
    // API 키가 없으면 더미 데이터 반환
    if (!this.apiKey) {
      return this.getDummyWeather();
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/current.json`,
        {
          params: {
            key: this.apiKey,
            q: `${latitude},${longitude}`,
            aqi: 'yes', // 대기질 정보 포함
            lang: 'ko',
          },
        }
      );

      return this.transformWeatherApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return this.getDummyWeather();
    }
  }

  async getWeatherByCity(cityName: string): Promise<Weather> {
    // API 키가 없으면 더미 데이터 반환
    if (!this.apiKey) {
      return this.getDummyWeather();
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/current.json`,
        {
          params: {
            key: this.apiKey,
            q: cityName,
            aqi: 'yes',
            lang: 'ko',
          },
        }
      );

      return this.transformWeatherApiResponse(response.data);
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      return this.getDummyWeather();
    }
  }

  async getWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
    // API 키가 없으면 더미 예보 반환
    if (!this.apiKey) {
      return this.getDummyForecast();
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
            lang: 'ko',
          },
        }
      );

      return this.transformWeatherApiForecastResponse(response.data);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return this.getDummyForecast();
    }
  }

  private transformWeatherApiResponse(data: WeatherApiResponse): Weather {
    return {
      temperature: data.current.temp_c,
      feelsLike: data.current.feelslike_c,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph / 3.6, // kph를 m/s로 변환
      description: data.current.condition.text,
      icon: data.current.condition.icon.replace('//', 'https://'),
      main: data.current.condition.text,
      location: data.location.name,
      timestamp: new Date().toISOString(),
    };
  }

  private getDummyWeather(): Weather {
    return {
      temperature: 22.0,
      feelsLike: 24.0,
      humidity: 65,
      windSpeed: 3.5,
      description: '맑음',
      icon: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
      main: 'Clear',
      location: '서울',
      timestamp: new Date().toISOString(),
    };
  }

  private getDummyForecast(): WeatherForecast {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0], // Convert to string format
        minTemp: 15 + Math.random() * 5,
        maxTemp: 25 + Math.random() * 5,
        description: i % 2 === 0 ? '맑음' : '흐림',
        icon: i % 2 === 0 ? '01d' : '03d',
        main: i % 2 === 0 ? 'Clear' : 'Clouds',
      });
    }
    return { days };
  }

  private transformWeatherApiForecastResponse(data: WeatherApiForecastResponse): WeatherForecast {
    const days = data.forecast.forecastday.map((day: ForecastDay) => ({
      date: day.date, // Keep as string to match WeatherDay interface
      minTemp: day.day.mintemp_c,
      maxTemp: day.day.maxtemp_c,
      description: day.day.condition.text,
      icon: day.day.condition.icon.replace('//', 'https://'),
      main: day.day.condition.text,
    }));
    
    return { days };
  }


}
