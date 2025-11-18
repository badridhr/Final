        // Menu hamburger
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMenu = document.getElementById('closeMenu');
        const overlay = document.getElementById('overlay');
        
        function openMenu() {
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeMobileMenu() {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        hamburger.addEventListener('click', openMenu);
        closeMenu.addEventListener('click', closeMobileMenu);
        overlay.addEventListener('click', closeMobileMenu);
        
        // Fermer le menu en cliquant sur un lien
        const mobileLinks = document.querySelectorAll('.mobile-nav a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Activation des éléments de la barre mobile
        const bottomItems = document.querySelectorAll('.mobile-bottom-item');
        bottomItems.forEach(item => {
            item.addEventListener('click', function() {
                bottomItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });


        // panier

        // Panier JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const cartIcon = document.getElementById('cart-icon');
    const mobileCartIcon = document.getElementById('mobile-cart-icon');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartContent = document.getElementById('cart-content');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    // Initialisation du panier
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Mettre à jour l'affichage du panier
    function updateCartDisplay() {
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
    
    // Ouvrir le panier
    function openCart() {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Fermer le panier
    function closeCart() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Ajouter un produit au panier
    function addToCart(e) {
        const button = e.currentTarget;
        const productId = button.getAttribute('data-product-id');
        const productName = button.getAttribute('data-product-name');
        const productPrice = parseFloat(button.getAttribute('data-product-price'));
        const productImage = button.getAttribute('data-product-image');
        
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
        
        // Ouvrir le panier
        openCart();
    }
    
    // Augmenter la quantité d'un produit
    function increaseQuantity(e) {
        const productId = e.currentTarget.getAttribute('data-id');
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            item.quantity++;
            updateCartDisplay();
        }
    }
    
    // Diminuer la quantité d'un produit
    function decreaseQuantity(e) {
        const productId = e.currentTarget.getAttribute('data-id');
        const item = cart.find(item => item.id === productId);
        
        if (item && item.quantity > 1) {
            item.quantity--;
            updateCartDisplay();
        }
    }
    
    // Mettre à jour la quantité d'un produit
    function updateQuantity(e) {
        const productId = e.currentTarget.getAttribute('data-id');
        const newQuantity = parseInt(e.currentTarget.value);
        const item = cart.find(item => item.id === productId);
        
        if (item && newQuantity > 0) {
            item.quantity = newQuantity;
            updateCartDisplay();
        }
    }
    
    // Supprimer un produit du panier
    function removeFromCart(e) {
        const productId = e.currentTarget.getAttribute('data-id');
        cart = cart.filter(item => item.id !== productId);
        updateCartDisplay();
    }
    
    // Écouteurs d'événements
    cartIcon.addEventListener('click', openCart);
    mobileCartIcon.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });
    
    // Initialiser l'affichage du panier au chargement de la page
    updateCartDisplay();
});


    // Wishlist JavaScript
    document.addEventListener('DOMContentLoaded', function() {
        // Éléments du DOM pour la wishlist
        const wishlistIcon = document.getElementById('wishlist-icon');
        const mobileWishlistIcon = document.getElementById('mobile-wishlist-icon');
        const mobileBottomWishlist = document.getElementById('mobile-bottom-wishlist');
        const wishlistSidebar = document.getElementById('wishlist-sidebar');
        const closeWishlistBtn = document.getElementById('close-wishlist');
        const wishlistOverlay = document.getElementById('wishlist-overlay');
        const wishlistContent = document.getElementById('wishlist-content');
        const wishlistCount = document.getElementById('wishlist-count');
        const wishlistButtons = document.querySelectorAll('.wishlist-icon');
        
        // Initialisation de la wishlist
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        // Mettre à jour l'affichage de la wishlist
        function updateWishlistDisplay() {
            // Vider le contenu de la wishlist
            wishlistContent.innerHTML = '';
            
            if (wishlist.length === 0) {
                // Wishlist vide
                wishlistContent.innerHTML = `
                    <div class="wishlist-empty">
                        <i class="far fa-heart" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Votre wishlist est vide</p>
                    </div>
                `;
                wishlistCount.textContent = '0';
            } else {
                // Wishlist avec des articles
                wishlist.forEach(item => {
                    const wishlistItem = document.createElement('div');
                    wishlistItem.className = 'wishlist-item';
                    wishlistItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
                        <div class="wishlist-item-details">
                            <div class="wishlist-item-name">${item.name}</div>
                            <div class="wishlist-item-price">${item.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} د.ج</div>
                            <div class="wishlist-item-actions">
                                <button class="wishlist-add-to-cart add-to-cart-from-wishlist" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}">
                                    AJOUTER AU PANIER
                                </button>
                                <button class="wishlist-item-remove remove-from-wishlist" data-id="${item.id}">
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            </div>
                        </div>
                    `;
                    wishlistContent.appendChild(wishlistItem);
                });
                
                wishlistCount.textContent = wishlist.length;
                
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
        
        // Ouvrir la wishlist
        function openWishlist() {
            wishlistSidebar.classList.add('active');
            wishlistOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Fermer la wishlist
        function closeWishlist() {
            wishlistSidebar.classList.remove('active');
            wishlistOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Ajouter un produit à la wishlist
        function addToWishlist(e) {
            const button = e.currentTarget;
            const productCard = button.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id');
            const productName = productCard.querySelector('.name').textContent;
            const productPriceText = productCard.querySelector('.price').textContent;
            const productPrice = parseFloat(productPriceText.replace(/[^\d,]/g, '').replace(',', '.'));
            const productImage = productCard.querySelector('img').src;
            
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
                
                // Mettre à jour l'affichage de la wishlist
                updateWishlistDisplay();
                updateWishlistIcons();
            } else {
                // Si déjà dans la wishlist, le retirer
                wishlist = wishlist.filter(item => item.id !== productId);
                updateWishlistDisplay();
                updateWishlistIcons();
            }
        }
        
        // Supprimer un produit de la wishlist
        function removeFromWishlist(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            wishlist = wishlist.filter(item => item.id !== productId);
            updateWishlistDisplay();
            updateWishlistIcons();
        }
        
        // Ajouter au panier depuis la wishlist
        function addToCartFromWishlist(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const productName = e.currentTarget.getAttribute('data-name');
            const productPrice = parseFloat(e.currentTarget.getAttribute('data-price'));
            const productImage = e.currentTarget.getAttribute('data-image');
            
            // Ajouter au panier
            addToCartFunction(productId, productName, productPrice, productImage);
            
            // Fermer la wishlist
            closeWishlist();
        }
        
        // Mettre à jour les icônes de wishlist dans les produits
        function updateWishlistIcons() {
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                const productId = card.getAttribute('data-product-id');
                const wishlistBtn = card.querySelector('.wishlist-icon');
                const isInWishlist = wishlist.find(item => item.id === productId);
                
                if (isInWishlist) {
                    wishlistBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    wishlistBtn.style.color = '#ff0000';
                } else {
                    wishlistBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    wishlistBtn.style.color = '';
                }
            });
        }
        
        // Écouteurs d'événements pour la wishlist
        wishlistIcon.addEventListener('click', openWishlist);
        mobileWishlistIcon.addEventListener('click', openWishlist);
        mobileBottomWishlist.addEventListener('click', openWishlist);
        closeWishlistBtn.addEventListener('click', closeWishlist);
        wishlistOverlay.addEventListener('click', closeWishlist);
        
        wishlistButtons.forEach(button => {
            button.addEventListener('click', addToWishlist);
        });
        
        // Initialiser l'affichage de la wishlist au chargement de la page
        updateWishlistDisplay();
        updateWishlistIcons();
    });

    // Panier JavaScript
    document.addEventListener('DOMContentLoaded', function() {
        // Éléments du DOM
        const cartIcon = document.getElementById('cart-icon');
        const mobileCartIcon = document.getElementById('mobile-cart-icon');
        const cartSidebar = document.getElementById('cart-sidebar');
        const closeCartBtn = document.getElementById('close-cart');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartContent = document.getElementById('cart-content');
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        
        // Initialisation du panier
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Mettre à jour l'affichage du panier
        function updateCartDisplay() {
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
        
        // Ouvrir le panier
        function openCart() {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Fermer le panier
        function closeCart() {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Fonction pour ajouter au panier (utilisée par la wishlist)
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
            
            // Ouvrir le panier
            openCart();
        }
        
        // Ajouter un produit au panier
        function addToCart(e) {
            const button = e.currentTarget;
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseFloat(button.getAttribute('data-product-price'));
            const productImage = button.getAttribute('data-product-image');
            
            addToCartFunction(productId, productName, productPrice, productImage);
        }
        
        // Augmenter la quantité d'un produit
        function increaseQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const item = cart.find(item => item.id === productId);
            
            if (item) {
                item.quantity++;
                updateCartDisplay();
            }
        }
        
        // Diminuer la quantité d'un produit
        function decreaseQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const item = cart.find(item => item.id === productId);
            
            if (item && item.quantity > 1) {
                item.quantity--;
                updateCartDisplay();
            }
        }
        
        // Mettre à jour la quantité d'un produit
        function updateQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const newQuantity = parseInt(e.currentTarget.value);
            const item = cart.find(item => item.id === productId);
            
            if (item && newQuantity > 0) {
                item.quantity = newQuantity;
                updateCartDisplay();
            }
        }
        
        // Supprimer un produit du panier
        function removeFromCart(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            cart = cart.filter(item => item.id !== productId);
            updateCartDisplay();
        }
        
        // Écouteurs d'événements
        cartIcon.addEventListener('click', openCart);
        mobileCartIcon.addEventListener('click', openCart);
        closeCartBtn.addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', addToCart);
        });
        
        // Initialiser l'affichage du panier au chargement de la page
        updateCartDisplay();
    });

        // Wishlist JavaScript
    document.addEventListener('DOMContentLoaded', function() {
        // Éléments du DOM pour la wishlist
        const wishlistIcon = document.getElementById('wishlist-icon');
        const mobileWishlistIcon = document.getElementById('mobile-wishlist-icon');
        const mobileBottomWishlist = document.getElementById('mobile-bottom-wishlist');
        const wishlistSidebar = document.getElementById('wishlist-sidebar');
        const closeWishlistBtn = document.getElementById('close-wishlist');
        const wishlistOverlay = document.getElementById('wishlist-overlay');
        const wishlistContent = document.getElementById('wishlist-content');
        const wishlistCount = document.getElementById('wishlist-count');
        const mobileWishlistCount = document.getElementById('mobile-wishlist-count');
        const wishlistButtons = document.querySelectorAll('.wishlist-icon');
        
        // Initialisation de la wishlist
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        // Mettre à jour l'affichage de la wishlist
        function updateWishlistDisplay() {
            // Vider le contenu de la wishlist
            wishlistContent.innerHTML = '';
            
            if (wishlist.length === 0) {
                // Wishlist vide
                wishlistContent.innerHTML = `
                    <div class="wishlist-empty">
                        <i class="far fa-heart" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>Votre wishlist est vide</p>
                    </div>
                `;
                wishlistCount.textContent = '0';
                mobileWishlistCount.textContent = '0';
            } else {
                // Wishlist avec des articles
                wishlist.forEach(item => {
                    const wishlistItem = document.createElement('div');
                    wishlistItem.className = 'wishlist-item';
                    wishlistItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
                        <div class="wishlist-item-details">
                            <div class="wishlist-item-name">${item.name}</div>
                            <div class="wishlist-item-price">${item.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} د.ج</div>
                            <div class="wishlist-item-actions">
                                <button class="wishlist-add-to-cart add-to-cart-from-wishlist" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}">
                                    AJOUTER AU PANIER
                                </button>
                                <button class="wishlist-item-remove remove-from-wishlist" data-id="${item.id}">
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
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
        
        // Ouvrir la wishlist
        function openWishlist() {
            wishlistSidebar.classList.add('active');
            wishlistOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Fermer la wishlist
        function closeWishlist() {
            wishlistSidebar.classList.remove('active');
            wishlistOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Ajouter un produit à la wishlist
        function addToWishlist(e) {
            const button = e.currentTarget;
            const productCard = button.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id');
            const productName = productCard.querySelector('.name').textContent;
            const productPriceText = productCard.querySelector('.price').textContent;
            const productPrice = parseFloat(productPriceText.replace(/[^\d,]/g, '').replace(',', '.'));
            const productImage = productCard.querySelector('img').src;
            
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
                
                // Mettre à jour l'affichage de la wishlist
                updateWishlistDisplay();
                updateWishlistIcons();
            } else {
                // Si déjà dans la wishlist, le retirer
                wishlist = wishlist.filter(item => item.id !== productId);
                updateWishlistDisplay();
                updateWishlistIcons();
            }
        }
        
        // Supprimer un produit de la wishlist
        function removeFromWishlist(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            wishlist = wishlist.filter(item => item.id !== productId);
            updateWishlistDisplay();
            updateWishlistIcons();
        }
        
        // Ajouter au panier depuis la wishlist
        function addToCartFromWishlist(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const productName = e.currentTarget.getAttribute('data-name');
            const productPrice = parseFloat(e.currentTarget.getAttribute('data-price'));
            const productImage = e.currentTarget.getAttribute('data-image');
            
            // Ajouter au panier
            addToCartFunction(productId, productName, productPrice, productImage);
            
            // Fermer la wishlist
            closeWishlist();
        }
        
        // Mettre à jour les icônes de wishlist dans les produits
        function updateWishlistIcons() {
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                const productId = card.getAttribute('data-product-id');
                const wishlistBtn = card.querySelector('.wishlist-icon');
                const isInWishlist = wishlist.find(item => item.id === productId);
                
                if (isInWishlist) {
                    wishlistBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    wishlistBtn.style.color = '#ff0000';
                } else {
                    wishlistBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    wishlistBtn.style.color = '';
                }
            });
        }
        
        // Écouteurs d'événements pour la wishlist
        wishlistIcon.addEventListener('click', openWishlist);
        mobileWishlistIcon.addEventListener('click', openWishlist);
        mobileBottomWishlist.addEventListener('click', openWishlist);
        closeWishlistBtn.addEventListener('click', closeWishlist);
        wishlistOverlay.addEventListener('click', closeWishlist);
        
        wishlistButtons.forEach(button => {
            button.addEventListener('click', addToWishlist);
        });
        
        // Initialiser l'affichage de la wishlist au chargement de la page
        updateWishlistDisplay();
        updateWishlistIcons();
    });

    // Panier JavaScript
    document.addEventListener('DOMContentLoaded', function() {
        // Éléments du DOM
        const cartIcon = document.getElementById('cart-icon');
        const mobileCartIcon = document.getElementById('mobile-cart-icon');
        const cartSidebar = document.getElementById('cart-sidebar');
        const closeCartBtn = document.getElementById('close-cart');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartContent = document.getElementById('cart-content');
        const cartCount = document.getElementById('cart-count');
        const mobileCartCount = document.getElementById('mobile-cart-count');
        const cartTotal = document.getElementById('cart-total');
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        
        // Initialisation du panier
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Mettre à jour l'affichage du panier
        function updateCartDisplay() {
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
        
        // Ouvrir le panier
        function openCart() {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Fermer le panier
        function closeCart() {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Fonction pour ajouter au panier (utilisée par la wishlist)
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
            
            // Ouvrir le panier
            openCart();
        }
        
        // Ajouter un produit au panier
        function addToCart(e) {
            const button = e.currentTarget;
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseFloat(button.getAttribute('data-product-price'));
            const productImage = button.getAttribute('data-product-image');
            
            addToCartFunction(productId, productName, productPrice, productImage);
        }
        
        // Augmenter la quantité d'un produit
        function increaseQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const item = cart.find(item => item.id === productId);
            
            if (item) {
                item.quantity++;
                updateCartDisplay();
            }
        }
        
        // Diminuer la quantité d'un produit
        function decreaseQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const item = cart.find(item => item.id === productId);
            
            if (item && item.quantity > 1) {
                item.quantity--;
                updateCartDisplay();
            }
        }
        
        // Mettre à jour la quantité d'un produit
        function updateQuantity(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            const newQuantity = parseInt(e.currentTarget.value);
            const item = cart.find(item => item.id === productId);
            
            if (item && newQuantity > 0) {
                item.quantity = newQuantity;
                updateCartDisplay();
            }
        }
        
        // Supprimer un produit du panier
        function removeFromCart(e) {
            const productId = e.currentTarget.getAttribute('data-id');
            cart = cart.filter(item => item.id !== productId);
            updateCartDisplay();
        }
        
        // Écouteurs d'événements
        cartIcon.addEventListener('click', openCart);
        mobileCartIcon.addEventListener('click', openCart);
        closeCartBtn.addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', addToCart);
        });
        
        // Initialiser l'affichage du panier au chargement de la page
        updateCartDisplay();
    });