document.addEventListener("DOMContentLoaded", () => {
  // Toggle class active untuk hamburger menu
  const navbarNav = document.querySelector(".navbar-nav");
  // ketika hamburger menu di klik
  document.querySelector("#hamburger-menu").onclick = () => {
    navbarNav.classList.toggle("active");
  };

  // Toggle class active untuk shopping cart
  const shoppingCart = document.querySelector(".shopping-cart");
  document.querySelector("#shopping-cart-button").onclick = (e) => {
    shoppingCart.classList.toggle("active");
    e.preventDefault();
  };

  // Klik fi luar elemen
  const hm = document.querySelector("#hamburger-menu");
  const sc = document.querySelector("#shopping-cart-button");

  document.addEventListener("click", function (e) {
    if (!hm.contains(e.target) && !navbarNav.contains(e.target)) {
      navbarNav.classList.remove("active");
    }
    if (!sc.contains(e.target) && !shoppingCart.contains(e.target)) {
      shoppingCart.classList.remove("active");
    }
  });

  // Modal Box
  const itemDetailModal = document.querySelector("#item-detail-modal");
  let selectedProduct = null;
  const modalImage = document.querySelector("#modal-product-image");
  const modalName = document.querySelector("#modal-product-name");
  const modalDescription = document.querySelector("#modal-product-description");
  const modalPrice = document.querySelector("#modal-product-price");

  window.addEventListener("product-detail", (event) => {
    selectedProduct = event.detail;
    modalImage.src = `img/products/${selectedProduct.img}`;
    modalImage.alt = selectedProduct.name;
    modalName.textContent = selectedProduct.name;
    modalDescription.textContent = selectedProduct.description;
    modalPrice.textContent = rupiah(selectedProduct.price);
    itemDetailModal.style.display = "flex";
  });

  document.querySelector("#modal-add-cart").onclick = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    Alpine.store("cart").add(selectedProduct);
    itemDetailModal.style.display = "none";
  };

  // klik tombol close modal
  document.querySelector(".modal .close-icon").onclick = (e) => {
    itemDetailModal.style.display = "none";
    e.preventDefault();
  };

  // klik fi luar modal
  window.onclick = (e) => {
    if (e.target === itemDetailModal) {
      itemDetailModal.style.display = "none";
    }
  };
});
