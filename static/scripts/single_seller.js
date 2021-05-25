function purchaseProduct(uploadID) {
  alert(uploadID);
}

let purchaseProductButtons = document.getElementsByClassName("purchaseProduct");
purchaseProduct.onClick = function(this) {
  alert(this);
}