export interface Weather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  main: string;
  location: string;
  timestamp: string;
}

export interface WeatherForecast {
  days: WeatherDay[];
}

export interface WeatherDay {
  date: string;
  minTemp: number;
  maxTemp: number;
  description: string;
  icon: string;
  main: string;
}

export interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{
    description: string;
    icon: string;
    main: string;
  }>;
  name: string;
  dt: number;
}

export interface WeatherApiResponse {
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    cloud: number; // 구름 양 (%)
    condition: {
      text: string;
      icon: string;
    };
  };
  location: {
    name: string;
  };
}

export interface WeatherApiForecastResponse {
  forecast: {
    forecastday: ForecastDay[];
  };
}

export interface ForecastDay {
  date: string;
  day: {
    mintemp_c: number;
    maxtemp_c: number;
    condition: {
      text: string;
      icon: string;
    };
  };
}
