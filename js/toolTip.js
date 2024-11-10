function initPosters(){
        document.querySelectorAll('.poster').forEach(cell => {
            const tooltip = cell.querySelector('.descr');
            
            cell.addEventListener('mouseenter', function(event) {
                tooltip.style.display = 'block';
                positionTooltip(event, tooltip);
            });


            cell.addEventListener('mouseleave', function() {
                tooltip.style.display = 'none';
            });
        })
}
            function positionTooltip(event, tooltip) {
                const { clientX: mouseX, clientY: mouseY } = event;
                const { offsetWidth: tooltipWidth, offsetHeight: tooltipHeight } = tooltip;
                const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

                let tooltipX = mouseX + 10; // Сдвигаем немного вправо от курсора
                let tooltipY = mouseY + 10; // Сдвигаем немного вниз от курсора

                // Проверка правой границы
                if (tooltipX + tooltipWidth > windowWidth) {
                    tooltipX = mouseX - tooltipWidth - 10; // Сдвигаем влево, если выходит за правую границу
                }
                // Проверка левой границы
                if (tooltipX < 0) {
                    tooltipX = 10; // Прижимаем к левой границе, если выходит за неё
                }
                // Проверка нижней границы
                if (tooltipY + tooltipHeight > windowHeight) {
                    tooltipY = mouseY - tooltipHeight - 10; // Сдвигаем вверх, если выходит за нижнюю границу
                }
                // Проверка верхней границы
                if (tooltipY < 0) {
                    tooltipY = 10; // Прижимаем к верхней границе, если выходит за неё
                }

                tooltip.style.left = `${tooltipX}px`;
                tooltip.style.top = `${tooltipY}px`;
            }
