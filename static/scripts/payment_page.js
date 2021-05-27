function proceedPayment() {
  let userTronAddressSelector = document.querySelector("#user-tron-address");
  let userTronAddress = userTronAddressSelector.value;
  userTronAddressSelector.disabled = true;
}