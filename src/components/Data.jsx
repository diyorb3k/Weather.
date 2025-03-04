import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloud,
  faSun,
  faWind,
  faTint,
  faCompressAlt,
} from "@fortawesome/free-solid-svg-icons";

const Data = () => {
  const API_KEY = "5f8503fb89ffdb650735ce3ffd36d138";
  const [weather, setWeather] = useState(null); // Hozirgi ob-havo
  const [forecast, setForecast] = useState([]); // 5 kunlik prognoz
  const [cityInput, setCityInput] = useState("Samarqand,UZ"); // Default Samarqand
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [language, setLanguage] = useState("uz");
  const [loading, setLoading] = useState(false);

  const translations = {
    uz: {
      cityPlaceholder: "Shahar (masalan: Tashkent,UZ)",
      dateLabel: "Sana",
      humidityLabel: "Namlik",
      windLabel: "Shamol",
      pressureLabel: "Bosim",
      errorNoCity: "Shahar kirit!",
      errorCityNotFound: "Shahar topilmadi!",
      errorDataFetch: "Xatolik!",
    },
    en: {
      cityPlaceholder: "City (e.g., London,GB)",
      dateLabel: "Date",
      humidityLabel: "Humidity",
      windLabel: "Wind",
      pressureLabel: "Pressure",
      errorNoCity: "Enter city!",
      errorCityNotFound: "City not found!",
      errorDataFetch: "Error!",
    },
    ru: {
      cityPlaceholder: "Город (напр., Москва,RU)",
      dateLabel: "Дата",
      humidityLabel: "Влажность",
      windLabel: "Ветер",
      pressureLabel: "Давление",
      errorNoCity: "Введите город!",
      errorCityNotFound: "Город не найден!",
      errorDataFetch: "Ошибка!",
    },
  };

  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
      );
      const data = await response.json();
      const filteredSuggestions = data.map((item) => ({
        name: item.name,
        country: item.country,
      }));
      setSuggestions(filteredSuggestions);
    } catch (err) {
      setSuggestions([]);
    }
  };

  const getWeather = async (city = "") => {
    const searchCity = city || cityInput;
    if (!searchCity.trim()) {
      setError(translations[language].errorNoCity);
      return;
    }

    const [cityName, countryCode] = searchCity.split(',').map(item => item.trim());
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}${
      countryCode ? `,${encodeURIComponent(countryCode)}` : ''
    }&appid=${API_KEY}&units=metric`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}${
      countryCode ? `,${encodeURIComponent(countryCode)}` : ''
    }&appid=${API_KEY}&units=metric`;

    setLoading(true);
    try {
      const weatherRes = await fetch(weatherURL);
      const weatherData = await weatherRes.json();
      if (weatherData.cod !== 200) throw new Error(weatherData.message);

      const forecastRes = await fetch(forecastURL);
      const forecastData = await forecastRes.json();
      if (forecastData.cod !== "200") throw new Error(forecastData.message);

      setWeather(weatherData);
      const dailyForecast = processForecastData(forecastData.list);
      setForecast(dailyForecast);
      setError("");
      setSuggestions([]);
    } catch (error) {
      setWeather(null);
      setForecast([]);
      setError(
        error.message === "city_mismatch"
          ? translations[language].errorCityNotFound
          : translations[language].errorDataFetch
      );
    } finally {
      setLoading(false);
    }
  };

  // 5 kunlik ma'lumotlarni kunlik o'rtacha sifatida qayta ishlash
  const processForecastData = (list) => {
    const dailyData = {};
    list.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString(language, { day: "numeric", month: "short" });
      if (!dailyData[date]) {
        dailyData[date] = {
          temps: [],
          windSpeeds: [],
          humidities: [],
          pressures: [],
          weather: item.weather[0].main,
        };
      }
      dailyData[date].temps.push(item.main.temp);
      dailyData[date].windSpeeds.push(item.wind.speed);
      dailyData[date].humidities.push(item.main.humidity);
      dailyData[date].pressures.push(item.main.pressure);
    });

    return Object.keys(dailyData).map((date) => ({
      date,
      temp: Math.round(dailyData[date].temps.reduce((a, b) => a + b, 0) / dailyData[date].temps.length),
      windSpeed: Math.round(dailyData[date].windSpeeds.reduce((a, b) => a + b, 0) / dailyData[date].windSpeeds.length),
      humidity: Math.round(dailyData[date].humidities.reduce((a, b) => a + b, 0) / dailyData[date].humidities.length),
      pressure: Math.round(dailyData[date].pressures.reduce((a, b) => a + b, 0) / dailyData[date].pressures.length),
      weather: dailyData[date].weather,
    })).slice(0, 8); // Faqat 5 kun
  };

  useEffect(() => {
    getWeather("Samarqand,UZ"); // Initial fetch for Samarqand
  }, []);

  useEffect(() => {
    const date = new Date();
    setCurrentDate(
      date.toLocaleDateString(language, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, [language]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cityInput) fetchSuggestions(cityInput);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [cityInput]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cityInput) getWeather();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [cityInput]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setCityInput("Samarqand,UZ");
    setWeather(null);
    setForecast([]);
    setSuggestions([]);
    getWeather("Samarqand,UZ");
  };

  const handleSuggestionClick = (suggestion) => {
    const fullCity = `${suggestion.name},${suggestion.country}`;
    setCityInput(fullCity);
    setSuggestions([]);
    getWeather(fullCity);
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case "Clear": return faSun;
      case "Clouds": return faCloud;
      case "Rain":
      case "Drizzle":
      case "Thunderstorm": return faCloud;
      default: return faCloud;
    }
  };

  const getBackgroundGradient = () => {
    if (!weather?.weather) return "bg-gradient-to-br from-blue-100 to-yellow-200";
    const condition = weather.weather[0].main;
    switch (condition) {
      case "Clear": return "bg-gradient-to-br from-yellow-300 to-orange-400";
      case "Clouds": return "bg-gradient-to-br from-gray-200 to-blue-300";
      case "Rain": return "bg-gradient-to-br from-blue-300 to-indigo-400";
      default: return "bg-gradient-to-br from-blue-100 to-yellow-200";
    }
  };

  return (
    <div className={`min-h-screen flex flex-col p-4 md:p-6 lg:p-8 ${getBackgroundGradient()} transition-all duration-500`}>
      {/* Header */}
      <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder={translations[language].cityPlaceholder}
            className="p-2 w-full rounded-lg bg-white/80 text-gray-800 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm text-sm md:text-base"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white/90 border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto mt-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-2 hover:bg-yellow-100 cursor-pointer text-gray-800 text-sm md:text-base"
                >
                  {suggestion.name}, {suggestion.country}
                </div>
              ))}
            </div>
          )}
        </div>
        <select
          onChange={handleLanguageChange}
          value={language}
          className="p-2 w-full md:w-24 rounded-lg bg-white/80 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm text-sm md:text-base"
        >
          <option value="uz">UZ</option>
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center flex-grow">
          <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-t-yellow-400 border-gray-300 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-5xl mx-auto bg-red-100 text-red-600 font-semibold p-2 rounded-lg shadow-md text-center text-sm md:text-base mb-6">
          {error}
        </div>
      )}

      {/* Weather Display */}
      {weather && weather.weather && (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <FontAwesomeIcon
                icon={getWeatherIcon(weather.weather[0].main)}
                className="text-2xl md:text-3xl lg:text-4xl text-yellow-500"
              />
              <span>{weather.name.split(',')[0]}</span>
            </h1>
            <p className="text-gray-600 text-sm md:text-base lg:text-lg">{translations[language].dateLabel}: {currentDate}</p>
          </div>

          {/* Hozirgi ob-havo */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSun} className="text-xl md:text-2xl text-yellow-500" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">Temperatura</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{Math.round(weather.main.temp)} <sup>o</sup>C</p>
            </div>
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWind} className="text-xl md:text-2xl text-blue-500" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">{translations[language].windLabel}</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{weather.wind.speed} m/s</p>
            </div>
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faTint} className="text-xl md:text-2xl text-blue-400" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">{translations[language].humidityLabel}</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{weather.main.humidity} %</p>
            </div>
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCompressAlt} className="text-xl md:text-2xl text-gray-500" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">{translations[language].pressureLabel}</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{weather.main.pressure} hPa</p>
            </div>
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={getWeatherIcon(weather.weather[0].main)} className="text-xl md:text-2xl text-gray-600" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">Holat</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 capitalize">{weather.weather[0].description}</p>
            </div>
          </div>

          {/* 5 kunlik prognoz */}
          {forecast.length > 0 && (
            <div className="w-full mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {forecast.map((day, index) => (
                  <div key={index} className="bg-white/70 p-4 rounded-lg shadow-md flex flex-col items-center">
                    <p className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">{day.date}</p>
                    <FontAwesomeIcon
                      icon={getWeatherIcon(day.weather)}
                      className="text-xl md:text-2xl lg:text-3xl text-yellow-500 my-2"
                    />
                    <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{day.temp} <sup>o</sup>C</p>
                    <p className="text-sm md:text-base text-gray-600 capitalize">{day.weather}</p>
                    <div className="text-sm md:text-base text-gray-600 mt-2">
                      <p><FontAwesomeIcon icon={faWind} className="text-blue-500 mr-1" /> {day.windSpeed} m/s</p>
                      <p><FontAwesomeIcon icon={faTint} className="text-blue-400 mr-1" /> {day.humidity} %</p>
                      <p><FontAwesomeIcon icon={faCompressAlt} className="text-gray-500 mr-1" /> {day.pressure} hPa</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Data;