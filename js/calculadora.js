function calculateROI() {
    const investment = parseFloat(document.getElementById('investment').value) || 0;
    const revenue = parseFloat(document.getElementById('revenue').value) || 0;
    const conversions = parseInt(document.getElementById('conversions').value) || 0;
    const clicks = parseInt(document.getElementById('clicks').value) || 0;

    if (investment === 0) {
        alert('Por favor, insira o valor do investimento.');
        return;
    }

    // Cálculos
    const roi = ((revenue - investment) / investment) * 100;
    const roas = revenue / investment;
    const cpc = clicks > 0 ? investment / clicks : 0;
    const cpa = conversions > 0 ? investment / conversions : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    // Exibir resultados
    const roiElement = document.getElementById('roi-result');
    roiElement.textContent = roi.toFixed(1) + '%';
    roiElement.className = 'result-value ' + (roi > 0 ? 'roi-positive' : 'roi-negative');

    document.getElementById('roas-result').textContent = roas.toFixed(2) + ':1';
    document.getElementById('cpc-result').textContent = 'R$ ' + cpc.toFixed(2);
    document.getElementById('cpa-result').textContent = conversions > 0 ? 'R$ ' + cpa.toFixed(2) : '-';
    document.getElementById('conversion-rate').textContent = clicks > 0 ? conversionRate.toFixed(2) + '%' : '-';

    // Scroll para os resultados em mobile
    if (window.innerWidth <= 768) {
        document.querySelector('.results-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Calcular automaticamente quando os valores mudarem
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        if (document.getElementById('investment').value && document.getElementById('revenue').value) {
            calculateROI();
        }
    });
});