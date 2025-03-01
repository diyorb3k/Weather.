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
  const [weather, setWeather] = useState(null);
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
    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}${
      countryCode ? `,${encodeURIComponent(countryCode)}` : ''
    }&appid=${API_KEY}&units=metric`;

    setLoading(true);
    try {
      const res = await fetch(URL);
      const data = await res.json();

      if (data.cod === 200) {
        setWeather(data);
        setError("");
        setSuggestions([]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setWeather(null);
      setError(
        error.message === "city_mismatch"
          ? translations[language].errorCityNotFound
          : translations[language].errorDataFetch
      );
    } finally {
      setLoading(false);
    }
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

          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Temperature Card */}
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSun} className="text-xl md:text-2xl text-yellow-500" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">Temperatura</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{Math.round(weather.main.temp)} <sup>o</sup>C</p>
            </div>

            {/* Wind Speed Card */}
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWind} className="text-xl md:text-2xl text-blue-500" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">{translations[language].windLabel}</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{weather.wind.speed} m/s</p>
            </div>

            {/* Humidity Card */}
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faTint} className="text-xl md:text-2xl text-blue-400" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">{translations[language].humidityLabel}</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{weather.main.humidity} %</p>
            </div>

            {/* Pressure Card */}
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCompressAlt} className="text-xl md:text-2xl text-gray-500" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">{translations[language].pressureLabel}</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600">{weather.main.pressure} hPa</p>
            </div>

            {/* Condition Card */}
            <div className="bg-white/70 p-4 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={getWeatherIcon(weather.weather[0].main)} className="text-xl md:text-2xl text-gray-600" />
                <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-800">Holat</span>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 capitalize">{weather.weather[0].description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Data;