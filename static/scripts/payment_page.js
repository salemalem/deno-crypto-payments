let userTronAddress;
let transactionHash;
let transactionData;
let status;

function proceedPayment() {
  let userTronAddressSelector = document.querySelector("#user-tron-address");
  userTronAddress = userTronAddressSelector.value;
  userTronAddressSelector.disabled = true;
  document.querySelector(".payment-step-2").style.visibility = "visible";
}

function checkHash() {
  // actually the checking SHOULD be on SERVER side and data should be encrypted during the process 
  // but since I don't have much time now let's go for this quick way.
  let hashInput = document.querySelector("#transaction-hash");
  transactionHash = hashInput.value;
  $.ajax({
    url: `/tools/checkhash/${transactionHash}`,
    type: "GET",
    success: function (data) {
      console.log(data);
    }
  });
  // 1 / 1million = amount 1
}
