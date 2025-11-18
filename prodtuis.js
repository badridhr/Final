// Gestion simple des icônes sur mobile
document.addEventListener('DOMContentLoaded', function() {
    const productCards = document.querySelectorAll('.product-card');
    
    // Sur mobile, les icônes s'affichent au toucher
    if (window.innerWidth <= 768) {
        productCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Si on clique sur une icône, ne rien faire
                if (e.target.closest('.action-icon')) {
                    return;
                }
                
                // Basculer l'affichage des icônes pour cette carte
                const actions = this.querySelector('.product-actions');
                const isVisible = actions.style.opacity === '1';
                
                // Cacher toutes les icônes d'abord
                document.querySelectorAll('.product-actions').forEach(action => {
                    action.style.opacity = '0';
                    action.style.transform = 'translateX(20px)';
                });
                
                // Afficher/masquer les icônes de cette carte
                if (!isVisible) {
                    actions.style.opacity = '1';
                    actions.style.transform = 'translateX(0)';
                }
            });
        });
        
        // Cacher les icônes quand on clique ailleurs
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.product-card')) {
                document.querySelectorAll('.product-actions').forEach(action => {
                    action.style.opacity = '0';
                    action.style.transform = 'translateX(20px)';
                });
            }
        });
    }
});

