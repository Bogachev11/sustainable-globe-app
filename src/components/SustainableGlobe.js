import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { createGradients } from './GradientUtils';
import { CitySearch } from './CitySearch';
import { ZoomControls } from './ZoomControls';
import renderGlobe from './GlobeRenderer'; // Исправленный импорт

const SustainableGlobe = () => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [citiesData, setCitiesData] = useState([]);
  const [scale, setScale] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const minScale = 1;
  const maxScale = 3;

  const zoomIn = () => scale < maxScale && setScale(prev => Math.min(prev + 0.2, maxScale));
  const zoomOut = () => scale > minScale && setScale(prev => Math.max(prev - 0.2, minScale));
  const resetZoom = () => setScale(1);
  
  const centerOnCity = (city) => {
    setSelectedCity(city);
    setSearchText(city.city);
    setShowSearchResults(false);
    setScale(Math.min(2, maxScale));
  };

  useEffect(() => {
    d3.csv('/data/sust_index_cities_2024.csv').then(data => {
      const formattedData = data.map(d => ({
        city: d.City,
        latitude: +d.Latitude,
        longitude: +d.Longitude,
        planet: +d.Planet,
        people: +d.People,
        profit: +d.Profit,
        progress: +d.Progress,
        overall: d.Overall ? +d.Overall : 0
      }));
      
      console.log('Загруженные данные с overall:', formattedData[0]); // Проверка данных
      setCitiesData(formattedData);
    }).catch(error => {
      console.error('Ошибка загрузки:', error);
      const testData = [
        { city: 'Москва', latitude: 55.75, longitude: 37.62, planet: 80, people: 70, profit: 60, progress: 75, overall: 71 },
        { city: 'Нью-Йорк', latitude: 40.71, longitude: -74.01, planet: 65, people: 85, profit: 90, progress: 80, overall: 80 },
        { city: 'Лондон', latitude: 51.51, longitude: -0.13, planet: 75, people: 80, profit: 70, progress: 85, overall: 78 }
      ];
      console.log('Используем тестовые данные:', testData);
      setCitiesData(testData);
    });
  }, []);

  useEffect(() => {
    if (searchText.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = citiesData.filter(city => 
      city.city.toLowerCase().includes(searchText.toLowerCase())
    ).slice(0, 8);
    
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, [searchText, citiesData]);

  useEffect(() => {
    if (citiesData.length === 0) return;
    
    console.log('Запуск renderGlobe с новой версией');
    
    const cleanupFn = renderGlobe({
      svgRef,
      containerRef,
      citiesData,
      scale,
      selectedCity,
      createGradients
    });
    
    return cleanupFn;
  }, [citiesData, scale, selectedCity]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
      
      <CitySearch 
        searchText={searchText}
        setSearchText={setSearchText}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        setShowSearchResults={setShowSearchResults}
        centerOnCity={centerOnCity}
      />
      
      <ZoomControls zoomIn={zoomIn} zoomOut={zoomOut} resetZoom={resetZoom} />
    </div>
  );
};

export default SustainableGlobe;