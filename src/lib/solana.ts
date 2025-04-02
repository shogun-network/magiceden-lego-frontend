type SendTransactionResponse = {
    jsonrpc: string;
    result: string;
    id: number;
  };
  
  export async function sendJITOTransaction(base64Tx: string): Promise<SendTransactionResponse> {
    const response = await fetch("https://mainnet.block-engine.jito.wtf/api/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "sendTransaction",
        params: [
          base64Tx,
          {
            encoding: "base64",
          },
        ],
      }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
  
    const data = (await response.json()) as SendTransactionResponse;
    return data;
  }
  