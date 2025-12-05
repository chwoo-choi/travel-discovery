// components/WeatherWidget.tsx
"use client";

import { useEffect, useState } from "react";
// 아이콘을 사용하기 위해 lucide-react 패키지가 필요합니다.
// 설치가 안 되어 있다면 터미널에: npm install lucide-react
import { Loader2 } from "lucide-react"; 

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

export default function WeatherWidget({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // .env 파일에 NEXT_PUBLIC_OPENWEATHER_KEY 키가 없으면 데모 모드로 동작합니다.
  // 키가 없어도 에러가 나지 않고 가짜 날씨(24도, 맑음)를 보여줍니다.
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;

  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      try {
        // API 키가 없는 경우 데모 데이터 표시 (개발 편의성)
        if (!API_KEY) {
          setTimeout(() => {
            setWeather({ temp: 24, description: "맑음", icon: "01d" });
            setLoading(false);
          }, 800);
          return;
        }

        // 실제 날씨 API 호출
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=kr&appid=${API_KEY}`
        );
        
        if (!res.ok) throw new Error("Weather fetch failed");

        const data = await res.json();
        
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
        });
      } catch (error) {
        console.error("날씨 정보를 가져오는데 실패했습니다.", error);
        // 에러 시에도 UI가 깨지지 않도록 데모 데이터 설정
        setWeather({ temp: 22, description: "맑음", icon: "01d" });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, API_KEY]);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm border border-gray-100">
      <span className="text-xl" role="img" aria-label={weather.description}>
        {/* OpenWeatherMap 아이콘 코드에 따른 이모지 매핑 */}
        {weather.icon.includes("01") ? "☀️" : 
         weather.icon.includes("02") ? "⛅" : 
         weather.icon.includes("03") || weather.icon.includes("04") ? "☁️" :
         weather.icon.includes("09") || weather.icon.includes("10") ? "🌧️" : 
         weather.icon.includes("11") ? "⚡" :
         weather.icon.includes("13") ? "❄️" : "🌤️"}
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-xs font-bold text-gray-800">{weather.temp}°C</span>
        <span className="text-[10px] text-gray-500">{weather.description}</span>
      </div>
    </div>
  );
}