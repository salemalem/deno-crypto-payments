let userTronAddress;
let transactionHash;

function proceedPayment() {
  let userTronAddressSelector = document.querySelector("#user-tron-address");
  userTronAddress = userTronAddressSelector.value;
  userTronAddressSelector.disabled = true;
  document.querySelector(".payment-step-2").style.visibility = "visible";
}

function checkHash() {
  let hashInput = document.querySelector("#transaction-hash");
  transactionHash = hashInput.value;
  $.ajax({
    url: `https://apilist.tronscan.org/api/transaction-info?hash=${transactionHash}`,
    type: "GET",
    dataType: 'json',
    success: function (data) {
        console.log(data);
    }
  });
}
