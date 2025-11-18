        // === CONFIGURATION FIREBASE ===
        const firebaseConfig = {
            apiKey: "AIzaSyBB8zPrG4MjAqBm1SOxIFQdWtiCmz_v92s",
            authDomain: "luxur-6b128.firebaseapp.com",
            projectId: "luxur-6b128",
            storageBucket: "luxur-6b128.firebasestorage.app",
            messagingSenderId: "900453735371",
            appId: "1:900453735371:web:e32188ac6ea261084c344e"
        };
        // Initialiser Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const storage = firebase.storage();

        // Éléments du DOM
        const productsGrid = document.getElementById('products-grid');
        const quickViewModal = document.getElementById('quick-view-modal');
        const currentCountSpan = document.getElementById('current-count');
        const totalCountSpan = document.getElementById('total-count');
        const activeFiltersContainer = document.getElementById('activeFilters');

        // Variables globales pour le panier et la wishlist
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        // Variables pour les filtres
        let allProducts = [];
        let filteredProducts = [];
        let currentFilters = {
            priceMin: 0,
            priceMax: 100000,
            brands: [],
            genders: ['Homme'] // MODIFICATION: Filtrer par défaut pour les produits pour Hommes
        };
        
        // AJOUT: Variable pour stocker l'ID du produit actuel dans la vue rapide
        let currentProductId = null;

        // === FONCTIONS POUR LA GESTION DES PRODUITS ===
        
        // Fonction pour afficher une notification
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 100);
            setTimeout(() => { 
                notification.classList.remove('show'); 
                setTimeout(() => document.body.removeChild(notification), 300); 
            }, 3000);
        }

        // Fonction de debug pour vérifier la connexion Firebase
        async function debugFirebase() {
            try {
                console.log("=== DEBUG FIREBASE ===");
                console.log("Configuration Firebase:", firebaseConfig);
                
                // Tester la connexion avec les deux collections
                const testProduits = await db.collection('produits').limit(1).get();
                const testProducts = await db.collection('products').limit(1).get();
                
                console.log("Collection 'produits':", testProduits.size, "documents");
                console.log("Collection 'products':", testProducts.size, "documents");
                
                // Afficher le premier produit de chaque collection pour debug
                if (!testProduits.empty) {
                    testProduits.forEach(doc => {
                        console.log("Exemple produit 'produits':", doc.data());
                    });
                }
                if (!testProducts.empty) {
                    testProducts.forEach(doc => {
                        console.log("Exemple produit 'products':", doc.data());
                    });
                }
                
            } catch (error) {
                console.error("Erreur debug Firebase:", error);
            }
        }

        // Fonction principale de chargement depuis Firebase
        async function loadProductsFromFirebase() {
            productsGrid.innerHTML = '<div class="spinner"></div>';
            console.log("Chargement des produits depuis Firebase...");
            
            try {
                // Essayer d'abord la collection 'produits' (celle du panel admin)
                let snapshot = await db.collection('produits').orderBy('date_modification', 'desc').get();
                
                // Si vide, essayer la collection 'products'
                if (snapshot.empty) {
                    console.log("Collection 'produits' vide, essai avec 'products'...");
                    snapshot = await db.collection('products').orderBy('date_modification', 'desc').get();
                }
                
                if (snapshot.empty) {
                    console.log("Aucun produit trouvé dans Firebase.");
                    showNotification("Aucun produit disponible pour le moment.", 'info');
                    productsGrid.innerHTML = '<div class="no-results">Aucun produit disponible pour le moment.</div>';
                    return;
                }

                console.log(`${snapshot.size} produits chargés depuis Firebase.`);
                allProducts = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    console.log("Produit chargé:", data); // Debug
                    
                    // Structure compatible avec votre panel admin
                    const product = { 
                        id: doc.id, 
                        ...data,
                        // Mapping des champs pour compatibilité
                        name: data.nom || data.name || 'Nom non spécifié',
                        brand: data.marque || data.brand || 'Marque inconnue',
                        category: data.categorie || data.category || 'Non catégorisé',
                        price: parseFloat(data.prix || data.price || 0),
                        description: data.description || '',
                        image: data.image || data.images?.[0] || 'https://via.placeholder.com/280x280?text=Image+Manquante',
                        images: data.images || [data.image] || ['https://via.placeholder.com/280x280?text=Image+Manquante'],
                        stock: data.stock || 0
                    };
                    
                    // Validation des données essentielles
                    if (product.name && !isNaN(product.price)) {
                        allProducts.push(product);
                    } else {
                        console.warn("Produit ignoré (données invalides):", product);
                    }
                });
                
                // DEBUG: Afficher toutes les catégories trouvées
                const allCategories = [...new Set(allProducts.map(p => p.category))];
                console.log("Toutes les catégories trouvées:", allCategories);
                
                if(allProducts.length === 0) {
                    console.warn("Aucun produit valide trouvé dans Firebase.");
                    showNotification("Les données de Firebase sont invalides.", 'warning');
                    productsGrid.innerHTML = '<div class="no-results">Aucun produit valide disponible.</div>';
                } else {
                    finalizeProductLoading();
                }

            } catch (error) {
                console.error("Erreur lors du chargement depuis Firebase:", error);
                showNotification("Erreur de connexion à Firebase: " + error.message, 'error');
                productsGrid.innerHTML = '<div class="no-results">Erreur de chargement des produits.</div>';
            }
        }

        // Fonction pour finaliser le chargement des produits
        function finalizeProductLoading() {
            console.log("Finalisation du chargement des produits...");
            
            // MODIFICATION: Appliquer le filtre pour les produits pour Hommes par défaut
            applyFilters();
            
            // Peupler les filtres
            populateFilters();
            
            // Mettre à jour les compteurs
            updateProductCounters();
            
            console.log(`Chargement terminé: ${allProducts.length} produits disponibles`);
        }

        // Fonction pour mettre à jour les compteurs de produits
        function updateProductCounters() {
            currentCountSpan.textContent = filteredProducts.length;
            totalCountSpan.textContent = allProducts.filter(product => {
                // MODIFICATION: Ne compter que les produits pour Hommes dans le total
                return isMenProduct(product);
            }).length;
        }

        // NOUVELLE FONCTION: Vérifier si un produit est pour les hommes
        function isMenProduct(product) {
            const category = (product.category || '').toLowerCase().trim();
            const name = (product.name || '').toLowerCase().trim();
            
            // DEBUG: Afficher la catégorie de chaque produit
            console.log(`Vérification produit: "${product.name}" - Catégorie: "${category}"`);
            
            // Vérifications plus flexibles pour les produits pour hommes
            return (
                category === 'homme' ||
                category === 'hommes' ||
                category === 'men' ||
                category === 'male' ||
                category.includes('homme') ||
                category.includes('hommes') ||
                category.includes('men') ||
                category.includes('male') ||
                name.includes('homme') ||
                name.includes('hommes') ||
                name.includes('men') ||
                name.includes('male')
            );
        }

        // Fonction pour extraire les marques et catégories uniques et générer les filtres
        function populateFilters() {
            // MODIFICATION: Filtrer pour n'afficher que les produits pour Hommes
            const menProducts = allProducts.filter(product => isMenProduct(product));
            
            console.log(`Produits pour hommes trouvés: ${menProducts.length}`);
            
            // Extraire les marques uniques
            const brands = [...new Set(menProducts.map(product => product.brand))].filter(Boolean);
            
            // Extraire les catégories uniques
            const categories = [...new Set(menProducts.map(product => product.category))].filter(Boolean);
            
            console.log(`Marques trouvées: ${brands.join(', ')}`);
            console.log(`Catégories trouvées: ${categories.join(', ')}`);
            
            // Générer les filtres de marque pour desktop
            const desktopBrandFilters = document.getElementById('desktop-brand-filters');
            desktopBrandFilters.innerHTML = '';
            
            brands.forEach(brand => {
                const brandValue = brand.toLowerCase().replace(/\s+/g, '-');
                const checkbox = document.createElement('label');
                checkbox.className = 'filter-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" name="brand" value="${brandValue}">
                    <span>${brand}</span>
                `;
                desktopBrandFilters.appendChild(checkbox);
            });
            
            // Générer les filtres de marque pour mobile
            const mobileBrandFilters = document.getElementById('mobile-brand-filters');
            mobileBrandFilters.innerHTML = '';
            
            brands.forEach(brand => {
                const brandValue = brand.toLowerCase().replace(/\s+/g, '-');
                const checkbox = document.createElement('label');
                checkbox.className = 'filter-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" name="brand" value="${brandValue}">
                    <span>${brand}</span>
                `;
                mobileBrandFilters.appendChild(checkbox);
            });
            
            // Générer les filtres de catégorie pour desktop
            const desktopGenderFilters = document.getElementById('desktop-gender-filters');
            desktopGenderFilters.innerHTML = '';
            
            categories.forEach(category => {
                const categoryValue = category.toLowerCase().replace(/\s+/g, '-');
                const checkbox = document.createElement('label');
                checkbox.className = 'filter-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" name="gender" value="${categoryValue}" checked disabled>
                    <span>${category}</span>
                `;
                desktopGenderFilters.appendChild(checkbox);
            });
            
            // Générer les filtres de catégorie pour mobile
            const mobileGenderFilters = document.getElementById('mobile-gender-filters');
            mobileGenderFilters.innerHTML = '';
            
            categories.forEach(category => {
                const categoryValue = category.toLowerCase().replace(/\s+/g, '-');
                const checkbox = document.createElement('label');
                checkbox.className = 'filter-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" name="gender" value="${categoryValue}" checked disabled>
                    <span>${category}</span>
                `;
                mobileGenderFilters.appendChild(checkbox);
            });
            
            // Ajouter les écouteurs d'événements pour les nouveaux filtres
            addFilterEventListeners();
        }

        // Fonction pour ajouter les écouteurs d'événements pour les filtres
        function addFilterEventListeners() {
            // Écouteurs pour les filtres desktop (marques)
            document.querySelectorAll('.shop-filters input[name="brand"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        if (!currentFilters.brands.includes(this.value)) {
                            currentFilters.brands.push(this.value);
                        }
                    } else {
                        currentFilters.brands = currentFilters.brands.filter(brand => brand !== this.value);
                    }
                    applyFilters();
                });
            });
            
            // Écouteurs pour les filtres desktop (genres)
            document.querySelectorAll('.shop-filters input[name="gender"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        if (!currentFilters.genders.includes(this.value)) {
                            currentFilters.genders.push(this.value);
                        }
                    } else {
                        currentFilters.genders = currentFilters.genders.filter(gender => gender !== this.value);
                    }
                    applyFilters();
                });
            });
        }

        // Fonction pour afficher les produits filtrés
        function displayProducts(products) {
            productsGrid.innerHTML = '';
            
            if (products.length === 0) {
                productsGrid.innerHTML = '<div class="no-results">Aucun produit ne correspond à vos critères de filtrage.</div>';
                currentCountSpan.textContent = '0';
                totalCountSpan.textContent = allProducts.filter(product => isMenProduct(product)).length;
                return;
            }
            
            products.forEach(product => {
                const formattedPrice = product.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                
                // CORRECTION: Gérer les produits avec une seule image ou plusieurs images
                let productImage;
                if (product.images && product.images.length > 0) {
                    productImage = product.images[0];
                } else if (product.image) {
                    productImage = product.image;
                } else {
                    productImage = 'https://via.placeholder.com/280x280?text=Image+Manquante';
                }
                
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.setAttribute('data-product-id', product.id);
                productCard.innerHTML = `
                    <div class="product-image-container">
                        <img src="${productImage}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/280x280?text=Image+Manquante'">
                        <div class="product-actions">
                            <span class="action-icon quickview-icon" data-action="quickview" data-product-id="${product.id}"><i class="fa-solid fa-eye"></i></span>
                            <span class="action-icon wishlist-icon" data-action="wishlist" data-product-id="${product.id}"><i class="fa-regular fa-heart"></i></span>
                        </div>
                    </div>
                    <div class="product-details">
                        <p class="name">${product.name}</p>
                        <p class="brand">${product.brand} - ${product.category}</p>
                        <p class="price">${formattedPrice} <span class="currency">د.ج</span></p>
                    </div>
                    <button class="command-button add-to-cart" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-image="${productImage}">AJOUTER AU PANIER</button>
                `;
                productsGrid.appendChild(productCard);
            });
            
            currentCountSpan.textContent = products.length;
            totalCountSpan.textContent = allProducts.filter(product => isMenProduct(product)).length;
            
            initializeProductEventListeners();
            updateWishlistIcons();
        }

        // Fonction pour appliquer les filtres
        function applyFilters() {
            console.log("Application des filtres...");
            
            // MODIFICATION: S'assurer que seuls les produits pour Hommes sont affichés
            filteredProducts = allProducts.filter(product => {
                // Filtrer par genre (toujours inclure les produits pour Hommes)
                if (!isMenProduct(product)) {
                    console.log(`Produit exclu: ${product.name} (catégorie: ${product.category})`);
                    return false;
                }
                
                // Filtrer par prix
                if (product.price < currentFilters.priceMin || product.price > currentFilters.priceMax) {
                    console.log(`Produit exclu par prix: ${product.name} (${product.price})`);
                    return false;
                }
                
                // Filtrer par marque
                if (currentFilters.brands.length > 0) {
                    const productBrandValue = product.brand.toLowerCase().replace(/\s+/g, '-');
                    if (!currentFilters.brands.includes(productBrandValue)) {
                        console.log(`Produit exclu par marque: ${product.name} (${product.brand})`);
                        return false;
                    }
                }
                
                console.log(`Produit inclus: ${product.name}`);
                return true;
            });
            
            console.log(`Produits filtrés: ${filteredProducts.length}`);
            displayProducts(filteredProducts);
            updateActiveFilters();
        }

        // Fonction pour mettre à jour l'affichage des filtres actifs
        function updateActiveFilters() {
            activeFiltersContainer.innerHTML = '';
            
            // MODIFICATION: Ajouter un indicateur pour le filtre "Homme" qui est toujours actif
            const menFilter = document.createElement('div');
            menFilter.className = 'active-filter-tag';
            menFilter.innerHTML = `Homme <i class="fas fa-times" data-filter-type="men"></i>`;
            activeFiltersContainer.appendChild(menFilter);
            
            // Ajouter les filtres de prix
            if (currentFilters.priceMin > 0 || currentFilters.priceMax < 100000) {
                const priceFilter = document.createElement('div');
                priceFilter.className = 'active-filter-tag';
                priceFilter.innerHTML = `Prix: ${currentFilters.priceMin} - ${currentFilters.priceMax} <i class="fas fa-times" data-filter-type="price"></i>`;
                activeFiltersContainer.appendChild(priceFilter);
            }
            
            // Ajouter les filtres de marque
            currentFilters.brands.forEach(brandValue => {
                const brandFilter = document.createElement('div');
                brandFilter.className = 'active-filter-tag';
                // Trouver le nom de la marque correspondant à la valeur
                const brandName = allProducts.find(p => p.brand.toLowerCase().replace(/\s+/g, '-') === brandValue)?.brand || brandValue;
                brandFilter.innerHTML = `${brandName} <i class="fas fa-times" data-filter-type="brand" data-value="${brandValue}"></i>`;
                activeFiltersContainer.appendChild(brandFilter);
            });
            
            // Ajouter les filtres de genre
            currentFilters.genders.forEach(categoryValue => {
                if (categoryValue !== 'Homme') { // Ne pas afficher le filtre "Homme" deux fois
                    const genderFilter = document.createElement('div');
                    genderFilter.className = 'active-filter-tag';
                    // Trouver le nom de la catégorie correspondant à la valeur
                    const categoryName = allProducts.find(p => p.category.toLowerCase().replace(/\s+/g, '-') === categoryValue)?.category || categoryValue;
                    genderFilter.innerHTML = `${categoryName} <i class="fas fa-times" data-filter-type="gender" data-value="${categoryValue}"></i>`;
                    activeFiltersContainer.appendChild(genderFilter);
                }
            });
            
            // Ajouter les écouteurs d'événements pour les boutons de suppression de filtre
            document.querySelectorAll('.active-filter-tag i').forEach(icon => {
                icon.addEventListener('click', removeFilter);
            });
        }

        // Fonction pour supprimer un filtre
        function removeFilter(e) {
            const filterType = e.target.getAttribute('data-filter-type');
            
            if (filterType === 'price') {
                currentFilters.priceMin = 0;
                currentFilters.priceMax = 100000;
                document.querySelector('.desktop-price-min').value = 0;
                document.querySelector('.desktop-price-max').value = 100000;
                document.querySelector('.mobile-price-min').value = 0;
                document.querySelector('.mobile-price-max').value = 100000;
            } else if (filterType === 'brand') {
                const value = e.target.getAttribute('data-value');
                currentFilters.brands = currentFilters.brands.filter(brand => brand !== value);
                document.querySelector(`input[name="brand"][value="${value}"]`).checked = false;
            } else if (filterType === 'gender') {
                const value = e.target.getAttribute('data-value');
                currentFilters.genders = currentFilters.genders.filter(gender => gender !== value);
                document.querySelector(`input[name="gender"][value="${value}"]`).checked = false;
            } else if (filterType === 'men') {
                // MODIFICATION: Ne pas permettre de supprimer le filtre "Homme"
                showNotification("Le filtre 'Homme' ne peut pas être désactivé sur cette page.", 'info');
                return;
            }
            
            applyFilters();
        }

        // Fonction pour réinitialiser tous les filtres
        function resetAllFilters() {
            currentFilters = {
                priceMin: 0,
                priceMax: 100000,
                brands: [],
                genders: ['Homme'] // MODIFICATION: Toujours inclure le filtre "Homme"
            };
            
            // Réinitialiser les inputs
            document.querySelectorAll('.price-input').forEach(input => {
                if (input.classList.contains('desktop-price-min') || input.classList.contains('mobile-price-min')) {
                    input.value = 0;
                } else {
                    input.value = 100000;
                }
            });
            
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.value === 'Homme' || checkbox.value.includes('Homme')) {
                    checkbox.checked = true;
                    checkbox.disabled = true; // MODIFICATION: Désactiver la case à cocher "Homme"
                } else {
                    checkbox.checked = false;
                }
            });
            
            applyFilters();
        }

        // Fonction pour initialiser les écouteurs d'événements pour les produits
        function initializeProductEventListeners() {
            // Écouteurs pour les boutons wishlist
            document.querySelectorAll('.wishlist-icon').forEach(button => {
                button.addEventListener('click', addToWishlist);
            });
            
            // Écouteurs pour les boutons d'ajout au panier
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', function(e) {
                    const productId = this.getAttribute('data-product-id');
                    const productName = this.getAttribute('data-product-name');
                    const productPrice = parseFloat(this.getAttribute('data-product-price'));
                    const productImage = this.getAttribute('data-product-image');
                    
                    addToCartFunction(productId, productName, productPrice, productImage);
                    showNotification('Produit ajouté au panier');
                });
            });
            
            // Écouteurs pour les icônes quickview
            document.querySelectorAll('.quickview-icon').forEach(icon => {
                icon.addEventListener('click', handleQuickViewClick);
            });
        }
        
        function handleQuickViewClick(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            openQuickViewModal(productId);
        }

        // Fonction pour ouvrir le modal quickview
        async function openQuickViewModal(productId) {
            try {
                // Chercher le produit dans la liste locale (allProducts) au lieu de faire un nouvel appel à Firebase
                const product = allProducts.find(p => p.id === productId);

                if (product) {
                    document.getElementById('modal-product-name').textContent = product.name;
                    document.getElementById('modal-product-price').textContent = product.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    document.getElementById('modal-product-category').textContent = `${product.brand} - ${product.category}`;
                    document.getElementById('modal-product-description').textContent = product.description || 'Aucune description disponible.';
                    
                    // CORRECTION: Gérer les produits avec une seule image ou plusieurs images
                    let productImages;
                    if (product.images && product.images.length > 0) {
                        productImages = product.images;
                    } else if (product.image) {
                        productImages = [product.image];
                    } else {
                        productImages = ['https://via.placeholder.com/350x350?text=Image+Manquante'];
                    }
                    
                    // Stocker l'ID du produit actuel et les données complètes
                    currentProductId = productId;
                    
                    // Afficher le carrousel d'images
                    setupImageCarousel(productImages, productId);
                    
                    quickViewModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    showNotification('Produit non trouvé', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du produit:', error);
                showNotification('Erreur lors de l\'affichage du produit', 'error');
            }
        }

        // Fonction pour configurer le carrousel d'images
        function setupImageCarousel(images, productId) {
            const mainImage = document.getElementById('modal-product-image');
            const thumbnailsContainer = document.getElementById('carousel-thumbnails');
            const prevBtn = document.querySelector('.carousel-prev');
            const nextBtn = document.querySelector('.carousel-next');
            
            // Vider les miniatures existantes
            thumbnailsContainer.innerHTML = '';
            
            // Si pas d'images, afficher une image par défaut
            if (!images || images.length === 0) {
                mainImage.src = 'https://via.placeholder.com/350x350?text=Image+Manquante';
                thumbnailsContainer.innerHTML = '<div class="no-images">Aucune image disponible</div>';
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
                return;
            }
            
            let currentImageIndex = 0;
            
            // Afficher la première image
            mainImage.src = images[0];
            
            // Créer les miniatures
            images.forEach((image, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                thumbnail.innerHTML = `<img src="${image}" alt="Miniature ${index + 1}" onerror="this.src='https://via.placeholder.com/60x60?text=Error'">`;
                
                thumbnail.addEventListener('click', () => {
                    // Mettre à jour l'image principale
                    mainImage.src = image;
                    currentImageIndex = index;
                    
                    // Mettre à jour les miniatures actives
                    document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
                    thumbnail.classList.add('active');
                });
                
                thumbnailsContainer.appendChild(thumbnail);
            });
            
            // Gérer le bouton précédent
            prevBtn.onclick = () => {
                currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
                updateCarousel();
            };
            
            // Gérer le bouton suivant
            nextBtn.onclick = () => {
                currentImageIndex = (currentImageIndex + 1) % images.length;
                updateCarousel();
            };
            
            // Fonction pour mettre à jour le carrousel
            function updateCarousel() {
                mainImage.src = images[currentImageIndex];
                
                // Mettre à jour les miniatures actives
                document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                    thumb.classList.toggle('active', index === currentImageIndex);
                });
            }
            
            // Afficher/masquer les boutons de navigation selon le nombre d'images
            if (images.length <= 1) {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            } else {
                prevBtn.style.display = 'flex';
                nextBtn.style.display = 'flex';
            }
            
            // Ajouter un indicateur du nombre d'images
            const existingCounter = document.querySelector('.image-counter');
            if (existingCounter) {
                existingCounter.remove();
            }
            
            if (images.length > 1) {
                const imageCounter = document.createElement('div');
                imageCounter.className = 'image-counter';
                imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
                document.querySelector('.main-image-container').appendChild(imageCounter);
                
                // Mettre à jour le compteur quand on change d'image
                const updateCounter = () => {
                    imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
                };
                
                // Redéfinir les événements pour inclure la mise à jour du compteur
                const originalPrev = prevBtn.onclick;
                const originalNext = nextBtn.onclick;
                
                prevBtn.onclick = () => {
                    originalPrev();
                    updateCounter();
                };
                
                nextBtn.onclick = () => {
                    originalNext();
                    updateCounter();
                };
                
                // Mettre à jour aussi pour les clics sur miniatures
                document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                    const originalClick = thumb.onclick;
                    thumb.onclick = () => {
                        originalClick();
                        currentImageIndex = index;
                        updateCounter();
                    };
                });
            }
        }

        // === FONCTIONS POUR LA WISHLIST ===
        
        // Fonction pour mettre à jour l'affichage de la wishlist
        function updateWishlistDisplay() {
            const wishlistContent = document.getElementById('wishlist-content');
            const wishlistCount = document.getElementById('wishlist-count');
            const mobileWishlistCount = document.getElementById('mobile-wishlist-count');
            
            wishlistContent.innerHTML = '';
            
            if (wishlist.length === 0) {
                wishlistContent.innerHTML = '<div class="wishlist-empty"><i class="far fa-heart" style="font-size: 48px; margin-bottom: 15px;"></i><p>Votre wishlist est vide</p></div>';
                wishlistCount.textContent = '0';
                mobileWishlistCount.textContent = '0';
            } else {
                wishlist.forEach(item => {
                    const wishlistItem = document.createElement('div');
                    wishlistItem.className = 'wishlist-item';
                    wishlistItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
                        <div class="wishlist-item-details">
                            <div class="wishlist-item-name">${item.name}</div>
                            <div class="wishlist-item-price">${item.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} د.ج</div>
                            <div class="wishlist-item-actions">
                                <button class="wishlist-add-to-cart add-to-cart-from-wishlist" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}">AJOUTER AU PANIER</button>
                                <button class="wishlist-item-remove remove-from-wishlist" data-id="${item.id}"><i class="fas fa-trash"></i> Supprimer</button>
                            </div>
                        </div>
                    `;
                    wishlistContent.appendChild(wishlistItem);
                });
                
                wishlistCount.textContent = wishlist.length;
                mobileWishlistCount.textContent = wishlist.length;
                
                // Ajouter les écouteurs d'événements pour les nouveaux éléments
                document.querySelectorAll('.remove-from-wishlist').forEach(btn => {
                    btn.addEventListener('click', removeFromWishlist);
                });
                
                document.querySelectorAll('.add-to-cart-from-wishlist').forEach(btn => {
                    btn.addEventListener('click', addToCartFromWishlist);
                });
            }
            
            // Sauvegarder la wishlist dans le localStorage
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }

        // Fonction pour ouvrir la wishlist
        function openWishlist() {
            document.getElementById('wishlist-sidebar').classList.add('active');
            document.getElementById('wishlist-overlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Fonction pour fermer la wishlist
        function closeWishlist() {
            document.getElementById('wishlist-sidebar').classList.remove('active');
            document.getElementById('wishlist-overlay').classList.remove('active');
            document.body.style.overflow = '';
        }

        // Fonction pour ajouter un produit à la wishlist
        function addToWishlist(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.currentTarget;
            const productCard = button.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id');
            const productName = productCard.querySelector('.name').textContent;
            const productPriceText = productCard.querySelector('.price').textContent;
            const productPrice = parseFloat(productPriceText.replace(/[^\d,]/g, '').replace(',', '.'));
            
            // CORRECTION: Récupérer l'image depuis l'attribut data
            const addToCartButton = productCard.querySelector('.add-to-cart');
            const productImage = addToCartButton.getAttribute('data-product-image');
            
            // Vérifier si le produit est déjà dans la wishlist
            const existingItem = wishlist.find(item => item.id === productId);
            
            if (!existingItem) {
                // Ajouter le produit à la wishlist
                wishlist.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage
                });
                
                // Mettre à jour l'icône du cœur
                button.innerHTML = '<i class="fa-solid fa-heart"></i>';
                button.classList.add('active');
                
                // Afficher une notification
                showNotification('Produit ajouté à la wishlist');
            } else {
                // Retirer le produit de la wishlist
                wishlist = wishlist.filter(item => item.id !== productId);
                
                // Mettre à jour l'icône du cœur
                button.innerHTML = '<i class="fa-regular fa-heart"></i>';
                button.classList.remove('active');
                
                // Afficher une notification
                showNotification('Produit retiré de la wishlist');
            }
            
            // Mettre à jour l'affichage de la wishlist
            updateWishlistDisplay();
        }

        // Fonction pour supprimer un produit de la wishlist
        function removeFromWishlist(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            wishlist = wishlist.filter(item => item.id !== productId);
            updateWishlistDisplay();
            showNotification('Produit retiré de la wishlist');
        }

        // Fonction pour ajouter au panier depuis la wishlist
        function addToCartFromWishlist(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const productName = e.currentTarget.getAttribute('data-name');
            const productPrice = parseFloat(e.currentTarget.getAttribute('data-price'));
            const productImage = e.currentTarget.getAttribute('data-image');
            
            // Ajouter au panier
            addToCartFunction(productId, productName, productPrice, productImage);
            
            // Afficher une notification
            showNotification('Produit ajouté au panier');
            
            // Fermer la wishlist
            closeWishlist();
        }

        // Fonction pour mettre à jour les icônes de wishlist dans les produits
        function updateWishlistIcons() {
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                const productId = card.getAttribute('data-product-id');
                const wishlistBtn = card.querySelector('.wishlist-icon');
                const isInWishlist = wishlist.find(item => item.id === productId);
                
                if (isInWishlist) {
                    wishlistBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    wishlistBtn.classList.add('active');
                } else {
                    wishlistBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    wishlistBtn.classList.remove('active');
                }
            });
        }

        // === FONCTIONS POUR LE PANIER ===
        
        // Fonction pour mettre à jour l'affichage du panier
        function updateCartDisplay() {
            const cartContent = document.getElementById('cart-content');
            const cartCount = document.getElementById('cart-count');
            const mobileCartCount = document.getElementById('mobile-cart-count');
            const cartTotal = document.getElementById('cart-total');
            
            // Vider le contenu du panier
            cartContent.innerHTML = '';
            
            if (cart.length === 0) {
                // Panier vide
                cartContent.innerHTML = `
                    <div class="cart-empty">
                        <i class="fas fa-shopping-bag" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Votre panier est vide</p>
                    </div>
                `;
                cartCount.textContent = '0';
                mobileCartCount.textContent = '0';
                cartTotal.textContent = '0,00 د.ج';
            } else {
                // Panier avec des articles
                let total = 0;
                let itemCount = 0;
                
                cart.forEach(item => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    cartItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">${item.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} د.ج</div>
                            <div class="cart-item-quantity">
                                <button class="quantity-btn decrease-qty" data-id="${item.id}">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                                <button class="quantity-btn increase-qty" data-id="${item.id}">+</button>
                                <button class="cart-item-remove remove-item" data-id="${item.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    cartContent.appendChild(cartItem);
                    
                    total += item.price * item.quantity;
                    itemCount += item.quantity;
                });
                
                cartCount.textContent = itemCount;
                mobileCartCount.textContent = itemCount;
                cartTotal.textContent = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' د.ج';
                
                // Ajouter les écouteurs d'événements pour les nouveaux éléments
                document.querySelectorAll('.decrease-qty').forEach(btn => {
                    btn.addEventListener('click', decreaseQuantity);
                });
                
                document.querySelectorAll('.increase-qty').forEach(btn => {
                    btn.addEventListener('click', increaseQuantity);
                });
                
                document.querySelectorAll('.quantity-input').forEach(input => {
                    input.addEventListener('change', updateQuantity);
                });
                
                document.querySelectorAll('.remove-item').forEach(btn => {
                    btn.addEventListener('click', removeFromCart);
                });
            }
            
            // Sauvegarder le panier dans le localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
        }

        // Fonction pour ouvrir le panier
        function openCart() {
            document.getElementById('cart-sidebar').classList.add('active');
            document.getElementById('cart-overlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Fonction pour fermer le panier
        function closeCart() {
            document.getElementById('cart-sidebar').classList.remove('active');
            document.getElementById('cart-overlay').classList.remove('active');
            document.body.style.overflow = '';
        }

        // Fonction pour ajouter un produit au panier
        function addToCartFunction(productId, productName, productPrice, productImage) {
            // Vérifier si le produit est déjà dans le panier
            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                // Si le produit est déjà dans le panier, augmenter la quantité
                existingItem.quantity++;
            } else {
                // Sinon, ajouter le produit au panier
                cart.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            }
            
            // Mettre à jour l'affichage du panier
            updateCartDisplay();
        }

        // Fonction pour augmenter la quantité d'un produit
        function increaseQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const item = cart.find(item => item.id === productId);
            
            if (item) {
                item.quantity++;
                updateCartDisplay();
            }
        }

        // Fonction pour diminuer la quantité d'un produit
        function decreaseQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const item = cart.find(item => item.id === productId);
            
            if (item && item.quantity > 1) {
                item.quantity--;
                updateCartDisplay();
            }
        }

        // Fonction pour mettre à jour la quantité d'un produit
        function updateQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const newQuantity = parseInt(e.currentTarget.value);
            const item = cart.find(item => item.id === productId);
            
            if (item && newQuantity > 0) {
                item.quantity = newQuantity;
                updateCartDisplay();
            }
        }

        // Fonction pour supprimer un produit du panier
        function removeFromCart(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            cart = cart.filter(item => item.id !== productId);
            updateCartDisplay();
            showNotification('Produit retiré du panier');
        }

        // === NOUVELLES FONCTIONS POUR LA REDIRECTION VERS CHECKOUT ===
        
        // Fonction pour rediriger vers la page de paiement (depuis le panier)
        function redirectToCheckout() {
            if (cart.length === 0) {
                showNotification('Votre panier est vide', 'error');
                return;
            }
            
            // Préparer les données du panier au format attendu par checkout.html
            const cartData = {
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    quantity: item.quantity
                }))
            };
            
            // Sauvegarder dans localStorage (format compatible avec checkout.html)
            localStorage.setItem('maa_luxury_cart', JSON.stringify(cartData));
            
            // Rediriger vers la page de paiement
            window.location.href = 'checkout.html';
        }

        // Fonction pour commander depuis la vue rapide
        function checkoutFromQuickView() {
            if (!currentProductId) {
                showNotification('Erreur: Produit non sélectionné', 'error');
                return;
            }
            
            const product = allProducts.find(p => p.id === currentProductId);
            if (!product) {
                showNotification('Produit non trouvé', 'error');
                return;
            }
            
            // Récupérer la quantité depuis le modal
            const quantity = parseInt(document.getElementById('qty-input').value) || 1;
            
            // Créer un panier temporaire avec ce seul produit
            const tempCart = [{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || product.image,
                quantity: quantity
            }];
            
            // Préparer les données au format attendu par checkout.html
            const cartData = {
                items: tempCart
            };
            
            // Sauvegarder dans localStorage
            localStorage.setItem('maa_luxury_cart', JSON.stringify(cartData));
            
            // Fermer le modal et rediriger
            closeQuickViewModal();
            window.location.href = 'checkout.html';
        }

        // === FONCTIONS POUR LES FILTRES & MODAL ===
        
        // Fonction pour fermer le modal quickview
        function closeQuickViewModal() {
            quickViewModal.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Fonction pour rediriger vers cart.html avec le produit
        function redirectToCartPage() {
            if (!currentProductId) {
                showNotification('Erreur: Produit non sélectionné', 'error');
                return;
            }
            
            const product = allProducts.find(p => p.id === currentProductId);
            if (!product) {
                showNotification('Produit non trouvé', 'error');
                return;
            }
            
            // Récupérer la quantité depuis le modal
            const quantity = parseInt(document.getElementById('qty-input').value) || 1;
            
            // Préparer les données du produit pour cart.html
            const productData = {
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images || [product.image],
                image: product.images?.[0] || product.image,
                quantity: quantity,
                brand: product.brand,
                category: product.category,
                description: product.description,
                stock: product.stock || 10
            };
            
            // Sauvegarder le produit dans localStorage avec la clé attendue par cart.html
            localStorage.setItem('selectedProduct', JSON.stringify(productData));
            
            // Fermer le modal et rediriger vers cart.html
            closeQuickViewModal();
            window.location.href = 'cart.html';
        }

        // Fonction pour rediriger vers checkout.html avec le produit
        function redirectToCheckoutWithProduct() {
            if (!currentProductId) {
                showNotification('Erreur: Produit non sélectionné', 'error');
                return;
            }
            
            const product = allProducts.find(p => p.id === currentProductId);
            if (!product) {
                showNotification('Produit non trouvé', 'error');
                return;
            }
            
            // Récupérer la quantité depuis le modal
            const quantity = parseInt(document.getElementById('qty-input').value) || 1;
            
            // Créer un panier temporaire avec seulement ce produit
            const checkoutCart = {
                items: [{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0] || product.image,
                    images: product.images,
                    quantity: quantity,
                    variant: product.variant || 'Standard'
                }],
                shippingGoal: 9500,
                isSingleProduct: true
            };
            
            // Sauvegarder dans localStorage
            localStorage.setItem('maa_luxury_cart', JSON.stringify(checkoutCart));
            
            // Fermer le modal et rediriger
            closeQuickViewModal();
            window.location.href = 'checkout.html';
        }

        // === INITIALISATION AU CHARGEMENT DE LA PAGE ===
        document.addEventListener('DOMContentLoaded', async function() {
            console.log("=== DÉMARRAGE APPLICATION ===");
            
            // Debug Firebase
            await debugFirebase();
            
            // Charger les produits depuis Firebase
            await loadProductsFromFirebase();
            
            // Initialiser l'affichage du panier et de la wishlist
            updateCartDisplay();
            updateWishlistDisplay();
            
            // Écouteurs d'événements pour le panier
            document.getElementById('cart-icon').addEventListener('click', openCart);
            document.getElementById('mobile-cart-icon').addEventListener('click', openCart);
            document.getElementById('close-cart').addEventListener('click', closeCart);
            document.getElementById('cart-overlay').addEventListener('click', closeCart);
            
            // Écouteurs d'événements pour la wishlist
            document.getElementById('wishlist-icon').addEventListener('click', openWishlist);
            document.getElementById('mobile-wishlist-icon').addEventListener('click', openWishlist);
            document.getElementById('mobile-bottom-wishlist').addEventListener('click', openWishlist);
            document.getElementById('close-wishlist').addEventListener('click', closeWishlist);
            document.getElementById('wishlist-overlay').addEventListener('click', closeWishlist);
            
            // Écouteurs d'événements pour les filtres desktop
            document.getElementById('applyPriceFilter').addEventListener('click', function() {
                currentFilters.priceMin = parseFloat(document.querySelector('.desktop-price-min').value) || 0;
                currentFilters.priceMax = parseFloat(document.querySelector('.desktop-price-max').value) || 100000;
                applyFilters();
            });
            
            // Écouteurs d'événements pour les filtres mobiles
            document.getElementById('mobileFilterToggle').addEventListener('click', function() {
                document.getElementById('mobileFiltersMenu').classList.add('active');
                document.getElementById('filtersOverlay').classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            function closeMobileFilters() {
                document.getElementById('mobileFiltersMenu').classList.remove('active');
                document.getElementById('filtersOverlay').classList.remove('active');
                document.body.style.overflow = '';
            }
            
            document.getElementById('closeFilters').addEventListener('click', closeMobileFilters);
            document.getElementById('filtersOverlay').addEventListener('click', closeMobileFilters);
            
            document.getElementById('mobileFilterApply').addEventListener('click', function() {
                // Appliquer les filtres de prix
                currentFilters.priceMin = parseFloat(document.querySelector('.mobile-price-min').value) || 0;
                currentFilters.priceMax = parseFloat(document.querySelector('.mobile-price-max').value) || 100000;
                
                // Appliquer les filtres de marque
                currentFilters.brands = [];
                document.querySelectorAll('.mobile-filters-menu input[name="brand"]:checked').forEach(checkbox => {
                    currentFilters.brands.push(checkbox.value);
                });
                
                // Appliquer les filtres de genre
                currentFilters.genders = ['Homme']; // MODIFICATION: Toujours inclure le filtre "Homme"
                document.querySelectorAll('.mobile-filters-menu input[name="gender"]:checked').forEach(checkbox => {
                    if (checkbox.value !== 'Homme') { // Ne pas ajouter "Homme" deux fois
                        currentFilters.genders.push(checkbox.value);
                    }
                });
                
                // Synchroniser avec les filtres desktop
                document.querySelector('.desktop-price-min').value = currentFilters.priceMin;
                document.querySelector('.desktop-price-max').value = currentFilters.priceMax;
                
                document.querySelectorAll('.shop-filters input[name="brand"]').forEach(checkbox => {
                    checkbox.checked = currentFilters.brands.includes(checkbox.value);
                });
                
                document.querySelectorAll('.shop-filters input[name="gender"]').forEach(checkbox => {
                    checkbox.checked = currentFilters.genders.includes(checkbox.value);
                });
                
                applyFilters();
                closeMobileFilters();
            });
            
            document.getElementById('mobileFilterReset').addEventListener('click', function() {
                resetAllFilters();
                closeMobileFilters();
            });
            
            // Écouteur pour le bouton de réinitialisation des filtres
            document.getElementById('resetFilters').addEventListener('click', resetAllFilters);
            
            // Écouteurs d'événements pour le modal quickview
            document.querySelector('.close-modal-btn').addEventListener('click', closeQuickViewModal);
            quickViewModal.addEventListener('click', function(e) {
                if (e.target === quickViewModal) {
                    closeQuickViewModal();
                }
            });
            
            // Écouteurs pour les boutons de commande
            document.getElementById('checkout-button').addEventListener('click', redirectToCheckout);
            document.getElementById('modal-checkout-button').addEventListener('click', redirectToCheckoutWithProduct);
    // Écouteur pour le bouton "VIEW DETAILS"
    document.getElementById('view-details-btn').addEventListener('click', redirectToCartPage);

    // Écouteurs d'événements pour les boutons plus et moins pour la quantité
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyInput = document.getElementById('qty-input');
    
    if (qtyMinus && qtyPlus && qtyInput) {
        qtyMinus.addEventListener('click', function() {
            if (qtyInput.value > 1) {
                qtyInput.value = parseInt(qtyInput.value) - 1;
            }
        });
        
        qtyPlus.addEventListener('click', function() {
            if (qtyInput.value < 100) {
                qtyInput.value = parseInt(qtyInput.value) + 1;
            }
        });
    }
});

        // Fonction pour rediriger vers cart.html avec le produit
// Fonction pour rediriger vers cart.html avec le produit
// Fonction pour rediriger vers cart.html avec le produit
function redirectToCartPage() {
    if (!currentProductId) {
        showNotification('Erreur: Produit non sélectionné', 'error');
        return;
    }
    
    const product = allProducts.find(p => p.id === currentProductId);
    if (!product) {
        showNotification('Produit non trouvé', 'error');
        return;
    }
    
    // Récupérer la quantité depuis le modal
    const quantity = parseInt(document.getElementById('qty-input').value) || 1;
    
    // Préparer les données du produit pour cart.html
    const productData = {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images || [product.image],
        image: product.images?.[0] || product.image,
        quantity: quantity,
        brand: product.brand,
        category: product.category,
        description: product.description,
        stock: product.stock || 10
    };
    
    // Sauvegarder le produit dans localStorage avec la clé attendue par cart.html
    localStorage.setItem('selectedProduct', JSON.stringify(productData));
    
    // Fermer le modal et rediriger vers cart.html
    closeQuickViewModal();
    window.location.href = 'cart.html';
}

// Fonction pour rediriger vers checkout.html avec le produit
function redirectToCheckoutWithProduct() {
    if (!currentProductId) {
        showNotification('Erreur: Produit non sélectionné', 'error');
        return;
    }
    
    const product = allProducts.find(p => p.id === currentProductId);
    if (!product) {
        showNotification('Produit non trouvé', 'error');
        return;
    }
    
    // Récupérer la quantité depuis le modal
    const quantity = parseInt(document.getElementById('qty-input').value) || 1;
    
    // Créer un panier temporaire avec seulement ce produit
    const checkoutCart = {
        items: [{
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || product.image,
            images: product.images,
            quantity: quantity,
            variant: product.variant || 'Standard'
        }],
        shippingGoal: 9500,
        isSingleProduct: true
    };
    
    // Sauvegarder dans localStorage
    localStorage.setItem('maa_luxury_cart', JSON.stringify(checkoutCart));
    
    // Fermer le modal et rediriger
    closeQuickViewModal();
    window.location.href = 'checkout.html';
}

// Dans la section d'initialisation, ajoutez cet écouteur :
document.addEventListener('DOMContentLoaded', async function() {
    // ... votre code existant ...
    
    // Écouteur pour le bouton "VIEW DETAILS"
    document.getElementById('view-details-btn').addEventListener('click', redirectToCartPage);
    
    // ... le reste de votre code d'initialisation ...
});