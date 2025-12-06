// components/WeatherWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  Sun, 
  CloudDrizzle, 
  Wind, 
  Droplets,
  AlertCircle,
  MapPin
} from "lucide-react";

interface WeatherData {
  temp: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  description: string;
  iconCode: string;
}

const getWeatherIcon = (iconCode: string) => {
  if (iconCode.includes("01")) return <Sun className="h-12 w-12 text-orange-400" />;
  if (iconCode.includes("02")) return <Cloud className="h-12 w-12 text-yellow-200 fill-yellow-100" />;
  if (iconCode.includes("03") || iconCode.includes("04")) return <Cloud className="h-12 w-12 text-gray-400" />;
  if (iconCode.includes("09")) return <CloudDrizzle className="h-12 w-12 text-blue-300" />;
  if (iconCode.includes("10")) return <CloudRain className="h-12 w-12 text-blue-500" />;
  if (iconCode.includes("11")) return <CloudLightning className="h-12 w-12 text-purple-500" />;
  if (iconCode.includes("13")) return <Snowflake className="h-12 w-12 text-sky-200" />;
  return <Sun className="h-12 w-12 text-orange-400" />;
};

export default function WeatherWidget({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ✅ [핵심 수정] 환경 변수가 없으면 직접 입력한 키를 사용 (안전장치)
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "d9b1c4f91a7e5564e9e4c5abc1d23434";

  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        
        console.log("Weather fetching for:", city); // 디버깅용 로그

        if (!API_KEY) {
          setErrorMessage("키 미설정");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=kr&appid=${API_KEY}`
        );
        
        if (!res.ok) {
            if (res.status === 401) throw new Error("인증 실패");
            if (res.status === 404) throw new Error("도시 없음");
            throw new Error(`오류 ${res.status}`);
        }

        const data = await res.json();
        
        setWeather({
          temp: Math.round(data.main.temp),
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
          description: data.weather[0].description,
          iconCode: data.weather[0].icon,
        });
      } catch (err) {
        console.error("날씨 로딩 실패:", err);
        const msg = err instanceof Error ? err.message : "로딩 실패";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, API_KEY]);

  if (loading) {
    return (
      <div className="flex h-28 w-40 flex-col items-center justify-center rounded-3xl bg-white/50 backdrop-blur-md border border-white/40 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        <span className="mt-2 text-xs text-gray-500">날씨 확인 중...</span>
      </div>
    );
  }

  if (errorMessage || !weather) {
    return (
      <div className="flex h-28 w-40 flex-col items-center justify-center rounded-3xl bg-white/50 backdrop-blur-md border border-white/40 shadow-sm text-center p-2">
        <AlertCircle className="h-6 w-6 text-red-400 mb-1" />
        <span className="text-xs text-gray-500 font-medium">날씨 정보 없음</span>
        <span className="text-[10px] text-gray-400 mt-1 px-1 leading-tight">
          {errorMessage}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white/80 p-5 shadow-lg backdrop-blur-xl border border-white/50 transition-transform hover:scale-105 min-w-[200px]">
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 blur-xl"></div>

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
          {getWeatherIcon(weather.iconCode)}
        </div>

        <div className="flex flex-col">
          <span className="text-3xl font-extrabold text-gray-800 leading-none">
            {weather.temp}°
          </span>
          <span className="text-xs font-medium text-gray-500 mt-1 truncate max-w-[100px]">
            {weather.description}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 gap-3">
        <div className="flex items-center gap-1" title="습도">
          <Droplets className="h-3 w-3 text-blue-400" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1" title="풍속">
          <Wind className="h-3 w-3 text-gray-400" />
          <span>{weather.wind_speed}m/s</span>
        </div>
        <div className="flex items-center gap-1" title="최고 기온">
          <span className="text-gray-400 font-bold">H:</span>
          <span>{weather.temp_max}°</span>
        </div>
      </div>
    </div>
  );
}