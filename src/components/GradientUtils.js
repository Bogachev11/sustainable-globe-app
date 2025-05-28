/**
 * Создает градиенты для лучей звезд городов
 * @param {Object} svg - Элемент SVG для добавления градиентов
 */
export const createGradients = (svg) => {
  // Создаем defs для градиентов
  const defs = svg.append("defs");
  
  // Градиент для Planet (верхний луч) - зеленый
  const gradientPlanet = defs.append("linearGradient")
    .attr("id", "gradientPlanet")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");
  
  gradientPlanet.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#008844");
  
  gradientPlanet.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#00ff88");
  
  // Градиент для People (левый луч) - синий
  const gradientPeople = defs.append("linearGradient")
    .attr("id", "gradientPeople")
    .attr("x1", "100%")
    .attr("y1", "50%")
    .attr("x2", "0%")
    .attr("y2", "50%");
  
  gradientPeople.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#002288");
  
  gradientPeople.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#4d79ff");
  
  // Градиент для Profit (правый луч) - золотистый
  const gradientProfit = defs.append("linearGradient")
    .attr("id", "gradientProfit")
    .attr("x1", "0%")
    .attr("y1", "50%")
    .attr("x2", "100%")
    .attr("y2", "50%");
  
  gradientProfit.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#b38600");
  
  gradientProfit.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#ffd700");
  
  // Градиент для Progress (нижний луч) - оранжевый
  const gradientProgress = defs.append("linearGradient")
    .attr("id", "gradientProgress")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  
  gradientProgress.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#993300");
  
  gradientProgress.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#ff7700");
};