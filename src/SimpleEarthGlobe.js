import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const SimpleEarthGlobe = () => {
  const svgRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const globeRef = useRef(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    d3.select(svgRef.current).selectAll('*').remove();
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#12122C');
    
    const globeSize = Math.min(width, height) * 0.7;
    let scale = globeSize / 2 * 4; // Максимальный зум на Европу
    
    const projection = d3.geoOrthographic()
      .scale(scale)
      .translate([width / 2, height / 2])
      .rotate([0, -50]); // Стартуем с зумом на Европу
    
    const path = d3.geoPath().projection(projection);
    const globe = svg.append('g');
    
    const globeCircle = globe.append('circle')
      .attr('fill', '#1C1C45')
      .attr('stroke', '#000')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', scale);
    
    let selectedCityName = null;
    
    Promise.all([
  d3.json(process.env.PUBLIC_URL + '/data/ne_50m_admin_0_countries.json'),
  d3.csv(process.env.PUBLIC_URL + '/data/sust_index_cities_2024.csv')
    ]).then(([geoData, citiesData]) => {
      console.log('Загружены данные:', citiesData.length + ' городов');
      
      const countries = topojson.feature(geoData, geoData.objects.ne_50m_admin_0_countries);
      const countryPaths = globe.selectAll('path.country')
        .data(countries.features)
        .enter().append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', '#0A0A30')
        .attr('stroke', '#303060')
        .attr('stroke-width', 0.5);
      
      function updateCities() {
        globe.selectAll('.city').remove();
        
        const rotated = projection.rotate();
        const center = [-rotated[0], -rotated[1]];
        
        citiesData.forEach(city => {
          const lat = +city.Latitude;
          const lon = +city.Longitude;
          const distance = d3.geoDistance([lon, lat], center);
          
          if (distance > Math.PI / 2) return;
          
          const coords = projection([lon, lat]);
          if (!coords) return;
          
          const x = coords[0];
          const y = coords[1];
          const overall = +city.Overall || 50;
          
          const isSelected = selectedCityName === city.City;
          const opacity = isSelected ? 1 : 0.8; // Увеличили прозрачность по умолчанию
          
          const cityGroup = globe.append('g')
            .attr('class', 'city')
            .style('cursor', 'pointer');
          
          // Кружочек с градиентом
          const ratio = overall / 100;
          const r = Math.round(255 - ratio * 155);
          const g = Math.round(255 - ratio * 155);
          const b = Math.round(100 - ratio * 100);
          
          cityGroup.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 12)
            .attr('fill', `rgb(${r}, ${g}, ${b})`)
            .style('opacity', opacity);
          
          // Цифра
          cityGroup.append('text')
            .attr('x', x)
            .attr('y', y + 1)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('fill', overall > 60 ? 'white' : 'black')
            .style('font-family', 'Arial, sans-serif')
            .style('opacity', opacity)
            .text(Math.round(overall));
          
          // Группа для лучей (скрыта по умолчанию)
          const rayGroup = cityGroup.append('g')
            .attr('class', 'rays')
            .style('opacity', 0)
            .style('transform-origin', `${x}px ${y}px`)
            .style('transform', 'scale(0)');
          
          function rayLength(value) {
            return ((100 - (value || 50)) / 100) * 60;
          }
          
          // Лучи с цифрами на концах
          // Planet - верх
          const planetLen = rayLength(+city.Planet);
          rayGroup.append('line')
            .attr('x1', x).attr('y1', y)
            .attr('x2', x).attr('y2', y - planetLen)
            .attr('stroke', '#00ff88').attr('stroke-width', 6);
          rayGroup.append('text')
            .attr('x', x).attr('y', y - planetLen - 8)
            .attr('text-anchor', 'middle').attr('font-size', '10px')
            .attr('fill', '#00ff88').attr('font-weight', 'bold')
            .text(Math.round(+city.Planet || 0));
          
          // People - лево
          const peopleLen = rayLength(+city.People);
          rayGroup.append('line')
            .attr('x1', x).attr('y1', y)
            .attr('x2', x - peopleLen).attr('y2', y)
            .attr('stroke', '#4d79ff').attr('stroke-width', 6);
          rayGroup.append('text')
            .attr('x', x - peopleLen - 10).attr('y', y + 3)
            .attr('text-anchor', 'middle').attr('font-size', '10px')
            .attr('fill', '#4d79ff').attr('font-weight', 'bold')
            .text(Math.round(+city.People || 0));
          
          // Profit - право
          const profitLen = rayLength(+city.Profit);
          rayGroup.append('line')
            .attr('x1', x).attr('y1', y)
            .attr('x2', x + profitLen).attr('y2', y)
            .attr('stroke', '#ffd700').attr('stroke-width', 6);
          rayGroup.append('text')
            .attr('x', x + profitLen + 10).attr('y', y + 3)
            .attr('text-anchor', 'middle').attr('font-size', '10px')
            .attr('fill', '#ffd700').attr('font-weight', 'bold')
            .text(Math.round(+city.Profit || 0));
          
          // Progress - низ
          const progressLen = rayLength(+city.Progress);
          rayGroup.append('line')
            .attr('x1', x).attr('y1', y)
            .attr('x2', x).attr('y2', y + progressLen)
            .attr('stroke', '#ff7700').attr('stroke-width', 6);
          rayGroup.append('text')
            .attr('x', x).attr('y', y + progressLen + 15)
            .attr('text-anchor', 'middle').attr('font-size', '10px')
            .attr('fill', '#ff7700').attr('font-weight', 'bold')
            .text(Math.round(+city.Progress || 0));
          
          // Метка города
          const cityLabel = cityGroup.append('text')
            .attr('class', 'city-label')
            .attr('x', x + 5)
            .attr('y', y + 25)
            .attr('font-size', '10px')
            .attr('fill', 'white')
            .style('opacity', opacity * 0.8)
            .text(city.City);
          
          // События наведения
          cityGroup
            .on('mouseenter', function() {
              // Затемняем все остальные города
              globe.selectAll('.city').style('opacity', 0.4);
              
              // Поднимаем группу наверх
              this.parentNode.appendChild(this);
              
              // Этот город на полную яркость
              d3.select(this).style('opacity', 1);
              
              // Название крупнее
              d3.select(this).select('.city-label')
                .transition().duration(150)
                .attr('font-size', '14px');
              
              // Показываем лучи
              d3.select(this).select('.rays')
                .transition().duration(150)
                .style('opacity', 1)
                .style('transform', 'scale(1)');
            })
            .on('mouseleave', function() {
              // Возвращаем всем исходную прозрачность
              globe.selectAll('.city').style('opacity', opacity);
              
              // Название в исходный размер
              d3.select(this).select('.city-label')
                .transition().duration(100)
                .attr('font-size', '10px');
              
              // Скрываем лучи
              d3.select(this).select('.rays')
                .transition().duration(100)
                .style('opacity', 0)
                .style('transform', 'scale(0)');
            });
        });
      }
      
      function centerOnCity(cityName) {
        if (!cityName) return;
        
        const city = citiesData.find(c => c.City === cityName);
        
        if (city) {
          console.log('Найден город:', city.City);
          selectedCityName = city.City;
          projection.rotate([-city.Longitude, -city.Latitude]);
          countryPaths.attr('d', path);
          updateCities();
          
          // Clear search
          setSearchText(city.City);
          setSearchResults([]);
          
          // Показываем лучи только для найденного города
          setTimeout(() => {
            globe.selectAll('.city').each(function() {
              const coords = projection([city.Longitude, city.Latitude]);
              const thisX = d3.select(this).select('circle').attr('cx');
              const thisY = d3.select(this).select('circle').attr('cy');
              
              if (Math.abs(coords[0] - thisX) < 5 && Math.abs(coords[1] - thisY) < 5) {
                d3.select(this).select('.rays')
                  .transition().duration(150)
                  .style('opacity', 1)
                  .style('transform', 'scale(1)');
              }
            });
          }, 300);
        }
      }
      
      globeRef.current = { centerOnCity, citiesData };
      updateCities();
      
      svg.call(d3.drag()
        .on('drag', event => {
          const rotate = projection.rotate();
          projection.rotate([
            rotate[0] + event.dx / 4,
            Math.max(-90, Math.min(90, rotate[1] - event.dy / 4))
          ]);
          countryPaths.attr('d', path);
          updateCities();
        }));
      
      svg.call(d3.zoom()
        .scaleExtent([0.5, 4])
        .on('zoom', event => {
          scale = globeSize / 2 * event.transform.k;
          projection.scale(scale);
          globeCircle.attr('r', scale);
          countryPaths.attr('d', path);
          updateCities();
        }));
      
    }).catch(error => console.error('Ошибка загрузки данных:', error));
    
  }, []);
  
  useEffect(() => {
    if (searchText.length > 1 && globeRef.current?.citiesData) {
      const results = globeRef.current.citiesData
        .filter(city => city.City.toLowerCase().includes(searchText.toLowerCase()))
        .slice(0, 8);
      setSearchResults(results);
    } else {
      setSearchResults([]);
      if (!searchText) {
        // Сброс поиска - убираем лучи у всех городов
        if (svgRef.current) {
          d3.select(svgRef.current).selectAll('.rays')
            .transition().duration(100)
            .style('opacity', 0)
            .style('transform', 'scale(0)');
        }
      }
    }
  }, [searchText]);
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px',
        zIndex: 100,
        width: '250px'
      }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Поиск города..."
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'rgba(30, 30, 60, 0.7)',
            border: '1px solid rgba(100, 100, 255, 0.3)',
            borderRadius: '4px',
            color: 'white'
          }}
        />
        {searchResults.length > 0 && (
          <div style={{
            marginTop: '5px',
            background: 'rgba(30, 30, 60, 0.9)',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {searchResults.map(city => (
              <div
                key={city.City}
                onClick={() => globeRef.current?.centerOnCity(city.City)}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(100, 100, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(100, 100, 255, 0.3)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {city.City}
              </div>
            ))}
          </div>
        )}
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
    </div>
  );
};

export default SimpleEarthGlobe;