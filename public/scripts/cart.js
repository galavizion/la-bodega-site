// public/scripts/cart.js
(() => {
  const KEY = "ranking_cart_v1";

  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  };

  const getCount = () => getCart().length; // productos distintos

  const getTotalQty = () =>
    getCart().reduce((acc, item) => acc + (item.qty || 1), 0); // opcional

  const emit = () => {
    window.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: {
          count: getCount(),
          totalQty: getTotalQty(),
        },
      })
    );
  };

  const setCart = (items) => {
    localStorage.setItem(KEY, JSON.stringify(items));
    emit();
  };

  const addItem = (item) => {
    const cart = getCart();
    const existing = cart.find((x) => x.slug === item.slug);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({ ...item, qty: 1 });
    setCart(cart);
  };

  const removeItem = (slug) => setCart(getCart().filter((x) => x.slug !== slug));
  const clearCart = () => setCart([]);

  window.Cart = { KEY, getCart, getCount, getTotalQty, addItem, removeItem, clearCart };

  // Inicializa badge al cargar
  emit();
})();