let userTronAddress;

function proceedPayment() {
  let userTronAddressSelector = document.querySelector("#user-tron-address");
  userTronAddress = userTronAddressSelector.value;
  userTronAddressSelector.disabled = true;
  document.querySelector(".payment-step-2").style.visibility = "visible";
}

