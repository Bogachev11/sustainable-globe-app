import * as d3 from 'd3';
import * as topojson from 'topojson-client';

/**
 * Функция отрисовки глобуса и управления им
 */
const renderGlobe = ({ svgRef, containerRef, citiesData, scale, selectedCity, createGradients }) => {
  // Проверка наличия необходимых ref и данных
  if (!svgRef.current || !containerRef.current || !citiesData || citiesData.length === 0) {
    console.warn('Нет данных или ref для отрисовки глобуса');
    return () => {};
  }

  console.log('Отрисовка глобуса с', citiesData.length, 'городами');
  
  // Проверка наличия данных для лучей в первых городах
  if (citiesData.length > 0) {
    console.log('Пример данных для лучей:', {
      город: citiesData[0].city,
      planet: citiesData[0].planet,
      people: citiesData[0].people,
      profit: citiesData[0].profit,
      progress: citiesData[0].progress,
      overall: citiesData[0].overall
    });
  }

  // Настройка размеров и создание SVG
  const container = containerRef.current;
  const width = container.clientWidth;
  const height = window.innerHeight;
  const globeRadius = Math.min(width, height) * 0.9 * 0.45 * scale;

  const svg = d3.select(svgRef.current)
    .attr('width', width)
    .attr('height', height)
    .style('background-color', '#12122C')
    .style('overflow', 'hidden');

  svg.selectAll('*').remove();

  // Фоновые изображения
  svg.append('image')
    .attr('href', '/img/space_bgrnd(2).png')
    .attr('x', 0).attr('y', 0)
    .attr('width', width).attr('height', height)
    .on('error', function() { d3.select(this).remove(); });

  svg.append('image')
    .attr('href', '/img/shine (2).png')
    .attr('x', (width / 2) - globeRadius * 1.5)
    .attr('y', (height / 2) - globeRadius * 1.5)
    .attr('width', globeRadius * 3)
    .attr('height', globeRadius * 3)
    .on('error', function() { d3.select(this).remove(); });

  // Настройка проекции и создание пути
  const projection = d3.geoOrthographic()
    .scale(globeRadius)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .rotate([-46.27, -15.20]);

  const path = d3.geoPath().projection(projection);
  const globe = svg.append('g');

  // Основной круг глобуса
  globe.append('circle')
    .attr('cx', width / 2)
    .attr('cy', height / 2)
    .attr('r', globeRadius)
    .attr('fill', '#1C1C45')
    .attr('stroke', 'black')
    .attr('stroke-width', 1);

  // Создание градиентов
  createGradients(svg);

  // Загрузка и отрисовка географических данных
  d3.json('/data/ne_50m_admin_0_countries.json').then(data => {
    const countries = topojson.feature(data, data.objects.ne_50m_admin_0_countries);
    
    // Отрисовка стран
    globe.selectAll('path.country')
      .data(countries.features)
      .enter().append('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', '#12122C')
      .attr('stroke', '#12122C')
      .attr('stroke-width', 1);

    // Координатная сетка
    globe.append('path')
      .datum(d3.geoGraticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#444')
      .attr('stroke-width', 0.5);
      
    // Центрирование на выбранном городе
    if (selectedCity) {
      projection.rotate([-selectedCity.longitude, -selectedCity.latitude]);
    }

    // Функция обновления отображения городов
    const updateCities = () => {
      const rotated = projection.rotate();
      const center = [-rotated[0], -rotated[1]];
      const maxDistance = Math.PI / 2;
      
      // Получение видимых городов и их позиций
      const cityPositions = citiesData
        .filter(city => d3.geoDistance([city.longitude, city.latitude], center) <= maxDistance)
        .map(city => {
          const [x, y] = projection([city.longitude, city.latitude]);
          const distance = d3.geoDistance([city.longitude, city.latitude], center);
          const opacity = selectedCity && selectedCity.city === city.city 
            ? 1 : selectedCity ? 0.5 * (1 - distance / maxDistance) : (1 - distance / maxDistance);
          return { city, x, y, opacity, distance };
        })
        .filter(pos => pos.x !== undefined && pos.y !== undefined && !isNaN(pos.x) && !isNaN(pos.y))
        .sort((a, b) => a.distance - b.distance);

      // Определение видимых подписей
      const labelMinDistance = 40 / scale;
      const visibleLabels = new Set();
      
      cityPositions.forEach(pos => {
        let tooClose = false;
        for (const visibleCityId of visibleLabels) {
          const otherPos = cityPositions.find(cp => cp.city.city === visibleCityId);
          if (otherPos) {
            const dx = pos.x - otherPos.x;
            const dy = pos.y - otherPos.y;
            if (Math.sqrt(dx * dx + dy * dy) < labelMinDistance) {
              tooClose = true;
              break;
            }
          }
        }
        if (!tooClose || (selectedCity && selectedCity.city === pos.city.city)) {
          visibleLabels.add(pos.city.city);
        }
      });

      // Отрисовка городов
      const cityGroups = globe.selectAll('g.city-group')
        .data(cityPositions, d => d.city.city)
        .join('g')
        .attr('class', 'city-group')
        .style('pointer-events', 'all')
        .style('cursor', 'pointer');

      // Очистка предыдущих элементов
      cityGroups.selectAll('*').remove();

      // Создание фона для цифры (круг с градиентом)
      cityGroups.append('circle')
        .attr('class', 'city-background')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 12)
        .attr('fill', d => {
          const overall = d.city.overall || 50;
          const ratio = overall / 100;
          const r = Math.round(255 - ratio * 155); // 255->100
          const g = Math.round(255 - ratio * 155); // 255->100  
          const b = Math.round(100 - ratio * 100); // 100->0
          return `rgb(${r}, ${g}, ${b})`;
        })
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .style('opacity', d => d.opacity);

      // Отображение значения Overall как цифры
      cityGroups.append('text')
        .attr('class', 'city-overall')
        .attr('x', d => d.x)
        .attr('y', d => d.y + 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', d => d.city.overall > 60 ? 'white' : 'black')
        .style('font-family', 'Arial, sans-serif')
        .style('opacity', d => d.opacity)
        .text(d => Math.round(d.city.overall || 0));

      // Группа для лучей (изначально скрыта)
      const rayGroups = cityGroups.append('g')
        .attr('class', 'city-rays')
        .style('opacity', 0)
        .style('transform-origin', d => `${d.x}px ${d.y}px`)
        .style('transform', 'scale(0)')
        .style('pointer-events', 'none');

      // Отрисовка лучей (скрытых по умолчанию)
      // Верхний луч (Planet) - зеленый
      rayGroups.append('path')
        .attr('class', 'city-star-planet')
        .attr('d', d => {
          const value = isNaN(d.city.planet) ? 50 : d.city.planet;
          const rayLength = ((100 - value) / 100) * 60; // в 2 раза больше
          return `M ${d.x} ${d.y} L ${d.x} ${d.y - rayLength}`;
        })
        .attr('stroke', 'url(#gradientPlanet)')
        .attr('stroke-width', 6); // в 3 раза толще

      // Правый луч (Profit) - золотистый
      rayGroups.append('path')
        .attr('class', 'city-star-profit')
        .attr('d', d => {
          const value = isNaN(d.city.profit) ? 50 : d.city.profit;
          const rayLength = ((100 - value) / 100) * 60;
          return `M ${d.x} ${d.y} L ${d.x + rayLength} ${d.y}`;
        })
        .attr('stroke', 'url(#gradientProfit)')
        .attr('stroke-width', 6);

      // Нижний луч (Progress) - оранжевый
      rayGroups.append('path')
        .attr('class', 'city-star-progress')
        .attr('d', d => {
          const value = isNaN(d.city.progress) ? 50 : d.city.progress;
          const rayLength = ((100 - value) / 100) * 60;
          return `M ${d.x} ${d.y} L ${d.x} ${d.y + rayLength}`;
        })
        .attr('stroke', 'url(#gradientProgress)')
        .attr('stroke-width', 6);

      // Левый луч (People) - синий
      rayGroups.append('path')
        .attr('class', 'city-star-people')
        .attr('d', d => {
          const value = isNaN(d.city.people) ? 50 : d.city.people;
          const rayLength = ((100 - value) / 100) * 60;
          return `M ${d.x} ${d.y} L ${d.x - rayLength} ${d.y}`;
        })
        .attr('stroke', 'url(#gradientPeople)')
        .attr('stroke-width', 6);

      // Обработчики событий для показа/скрытия лучей при наведении
      cityGroups
        .on('mouseenter', function(event, d) {
          // Показываем лучи с анимацией роста
          d3.select(this).select('.city-rays')
            .transition()
            .duration(150)
            .style('opacity', d.opacity)
            .style('transform', 'scale(1)');
        })
        .on('mouseleave', function() {
          // Скрываем лучи с анимацией сжатия
          d3.select(this).select('.city-rays')
            .transition()
            .duration(100)
            .style('opacity', 0)
            .style('transform', 'scale(0)');
        });

      // Добавление подписей городов
      cityGroups
        .filter(d => visibleLabels.has(d.city.city))
        .append('text')
        .attr('class', 'city-label')
        .attr('x', d => d.x)
        .attr('y', d => d.y + 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#fff')
        .style('font-family', 'Arial, sans-serif')
        .style('opacity', d => d.opacity * 0.8)
        .style('pointer-events', 'none')
        .text(d => d.city.city);
    };

    updateCities();

    // Настройка вращения с инерцией
    const sensitivity = 75;
    const decay = 0.92;
    const minVelocityThreshold = 0.005;
    
    let dragStartRotation, dragStartMouse, rotationVelocity = [0, 0];
    let lastDragTime, lastDragPosition, inertiaTimer = null;

    // Функция перетаскивания
    const drag = d3.drag()
      .on('start', event => {
        if (inertiaTimer) inertiaTimer.stop();
        dragStartRotation = projection.rotate();
        dragStartMouse = lastDragPosition = [event.x, event.y];
        lastDragTime = Date.now();
        rotationVelocity = [0, 0];
      })
      .on('drag', event => {
        const k = sensitivity / projection.scale();
        const dx = event.x - dragStartMouse[0];
        const dy = event.y - dragStartMouse[1];
        
        // Применение вращения
        const newRotation = [
          dragStartRotation[0] + dx * k,
          Math.max(-80, Math.min(80, dragStartRotation[1] - dy * k))
        ];
        projection.rotate(newRotation);
        
        // Расчет скорости для инерции
        const now = Date.now();
        const dt = Math.max(1, now - lastDragTime);
        rotationVelocity = [
          (event.x - lastDragPosition[0]) * k / dt * 16,
          -(event.y - lastDragPosition[1]) * k / dt * 16
        ];
        
        lastDragPosition = [event.x, event.y];
        lastDragTime = now;
        
        // Обновление карты
        globe.selectAll('path').attr('d', path);
        updateCities();
      })
      .on('end', () => {
        if (inertiaTimer) inertiaTimer.stop();
        
        inertiaTimer = d3.timer(() => {
          // Применение инерции
          rotationVelocity = rotationVelocity.map(v => v * decay);
          
          // Остановка инерции при малой скорости
          if (Math.abs(rotationVelocity[0]) < minVelocityThreshold && 
              Math.abs(rotationVelocity[1]) < minVelocityThreshold) {
            inertiaTimer.stop();
            return;
          }
          
          // Обновление вращения
          const rotate = projection.rotate();
          const newRotation = [
            rotate[0] + rotationVelocity[0],
            Math.max(-80, Math.min(80, rotate[1] + rotationVelocity[1]))
          ];
          
          projection.rotate(newRotation);
          
          // Обновление отображения
          globe.selectAll('path').attr('d', path);
          updateCities();
        });
      });

    // Зум колесиком мыши
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        const newScale = event.transform.k;
        projection.scale(globeRadius * newScale);
        globe.selectAll('path').attr('d', path);
        updateCities();
      });

    svg.call(drag).call(zoom);

    // Обработка изменения размера окна
    const handleResize = () => window.dispatchEvent(new Event('resize'));
    window.addEventListener('resize', handleResize);
    
    // Возврат функции очистки
    return () => {
      window.removeEventListener('resize', handleResize);
      if (inertiaTimer) inertiaTimer.stop();
    };
  }).catch(error => {
    console.error('Ошибка при загрузке географических данных:', error);
    return () => {};
  });
  
  return () => {};
};

// Экспортируем по умолчанию для совместимости с импортом
export default renderGlobe;