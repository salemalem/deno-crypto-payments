let userTronAddress;
let transactionHash;
let transactionData;
let expectedData = {};
let status;

function proceedPayment() {
  let userTronAddressSelector = document.querySelector("#user-tron-address");
  expectedData["upload-id"] = document.querySelector("#upload-id").value;
  expectedData["github-id"] = document.querySelector("#github-id").value;
  expectedData["title"] = document.querySelector("#product-title").value;
  expectedData["seller-name"] = document.querySelector("#seller-name").value;
  userTronAddress = userTronAddressSelector.value;
  userTronAddressSelector.disabled = true;
  document.querySelector(".payment-step-2").style.visibility = "visible";
}

function checkHash() {
  // actually the checking SHOULD be on SERVER side and data should be encrypted during the process 
  // but since I don't have much time now let's go for this quick way.
  let hashInput = document.querySelector("#transaction-hash");

  expectedData["seller-tron-address"] = document.querySelector("#seller-tron-address").value;
  expectedData["trx-amount"] = document.querySelector("#trx-amount").value;
  
  transactionHash = hashInput.value;
  $.ajax({
    url: `/tools/checkhash/${transactionHash}`,
    type: "GET",
    success: function (hashDataInRecords) {
      if (hashDataInRecords == 0) {
        $.ajax({
          url: `https://apilist.tronscan.org/api/transaction-info?hash=${transactionHash}`,
          type: "GET",
          dataType: 'json',
          success: function (hashDataInTRONscan) {
              transactionData = {
                contractData: hashDataInTRONscan["contractData"],
                confirmed: hashDataInTRONscan["confirmed"],
                contractRet: hashDataInTRONscan["contractRet"],
              };
          }
        });
      }
    }
  });
  // 1 / 1million = amount 1
  console.log(transactionData);
  console.log(expectedData);
  if (transactionData["contractData"]["owner_address"] == userTronAddress) {
    console.log("Successful transaction");
  }
}
