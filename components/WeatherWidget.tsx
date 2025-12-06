// components/WeatherWidget.tsx
"use client";

import { useEffect, useState } from "react";
// 전문적인 날씨 아이콘 사용 (lucide-react)
import { 
  Loader2, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  Sun, 
  CloudDrizzle, 
  Wind, 
  Droplets 
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

// 날씨 코드에 따라 예쁜 아이콘을 매칭하는 함수
const getWeatherIcon = (iconCode: string) => {
  if (iconCode.includes("01")) return <Sun className="h-12 w-12 text-orange-400" />; // 맑음
  if (iconCode.includes("02")) return <Cloud className="h-12 w-12 text-yellow-200 fill-yellow-100" />; // 구름 조금
  if (iconCode.includes("03") || iconCode.includes("04")) return <Cloud className="h-12 w-12 text-gray-400" />; // 흐림
  if (iconCode.includes("09")) return <CloudDrizzle className="h-12 w-12 text-blue-300" />; // 이슬비
  if (iconCode.includes("10")) return <CloudRain className="h-12 w-12 text-blue-500" />; // 비
  if (iconCode.includes("11")) return <CloudLightning className="h-12 w-12 text-purple-500" />; // 뇌우
  if (iconCode.includes("13")) return <Snowflake className="h-12 w-12 text-sky-200" />; // 눈
  if (iconCode.includes("50")) return <Wind className="h-12 w-12 text-gray-300" />; // 안개
  return <Sun className="h-12 w-12 text-orange-400" />; // 기본값
};

export default function WeatherWidget({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;

  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        
        // 키가 없으면 콘솔에 경고 출력 후 에러 상태로 전환
        if (!API_KEY) {
          console.error("🚫 OpenWeather API 키가 없습니다.");
          setError(true); 
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=kr&appid=${API_KEY}`
        );
        
        if (!res.ok) throw new Error("Weather fetch failed");

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
        setError(false);
      } catch (err) {
        console.error("날씨 로딩 실패:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, API_KEY]);

  // 로딩 중
  if (loading) {
    return (
      <div className="flex h-28 w-40 flex-col items-center justify-center rounded-3xl bg-white/50 backdrop-blur-md border border-white/40 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        <span className="mt-2 text-xs text-gray-500">날씨 확인 중...</span>
      </div>
    );
  }

  // 에러 발생 시 (API 키 문제 등)
  if (error || !weather) {
    return (
      <div className="flex h-28 w-40 flex-col items-center justify-center rounded-3xl bg-white/50 backdrop-blur-md border border-white/40 shadow-sm">
        <Cloud className="h-8 w-8 text-gray-300" />
        <span className="mt-2 text-xs text-gray-400">정보 없음</span>
      </div>
    );
  }

  // ✅ [디자인 업그레이드] 카드 형태의 날씨 위젯
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white/80 p-5 shadow-lg backdrop-blur-xl border border-white/50 transition-transform hover:scale-105">
      {/* 배경 장식 */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 blur-xl"></div>

      <div className="relative z-10 flex items-center gap-4">
        {/* 아이콘 */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
          {getWeatherIcon(weather.iconCode)}
        </div>

        {/* 온도 및 설명 */}
        <div className="flex flex-col">
          <span className="text-3xl font-extrabold text-gray-800 leading-none">
            {weather.temp}°
          </span>
          <span className="text-xs font-medium text-gray-500 mt-1">
            {weather.description}
          </span>
        </div>
      </div>

      {/* 하단 상세 정보 (습도, 바람) */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Droplets className="h-3 w-3 text-blue-400" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3 w-3 text-gray-400" />
          <span>{weather.wind_speed}m/s</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">H:</span>
          <span>{weather.temp_max}°</span>
        </div>
      </div>
    </div>
  );
}