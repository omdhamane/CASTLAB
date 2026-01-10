function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}

function saveWishlist(wishlist) {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function addToWishlist(product) {
  let wishlist = getWishlist();

  const exists = wishlist.some(item => item.id === product.id);
  if (exists) {
    alert("Already in wishlist ❤️");
    return;
  }

  wishlist.push(product);
  saveWishlist(wishlist);
  alert("Added to wishlist ❤️");
}
