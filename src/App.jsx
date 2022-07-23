import { memo, useEffect, useState } from "react";
import "./App.css";
import {
  FaEthereum,
  AiOutlineSend,
  AiOutlineTransaction,
  BiWalletAlt,
} from "react-icons/all";
import ContractABI from "./assets/EtherTransfer.json";
import { ethers, providers } from "ethers";

const contractAddress = "0x2ab3a09598377fcf58a03ffb8a6745ecc8cf950b";
const contractABI = ContractABI.abi;

const { ethereum } = window;

const App = () => {
  var contract;

  const auth = localStorage.getItem("account");
  const [state, setState] = useState({
    walletAddress: "",
    shortenAddress: "",
    auth: auth === null ? false : true,
    balance: "---",
    amount: "---",
    transfer: false,
    transactions: [],
    msg: "",
    msgType: "",
    sendTo: "",
    sendEth: "",
  });

  const shortenAddress = (address) => {
    return (
      <div
        className="shorten-address"
        onClick={() => {
          navigator.clipboard.writeText(address);
          alert("Copied!");
        }}
      >{`${address.slice(0, 5)}...${address.slice(address.length - 4)}`}</div>
    );
  };

  const createEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    return contract;
  };

  if (ethereum){
    contract = createEthereumContract();
  } else {
    alert("Install MetaMask")
  }
    contract = createEthereumContract();


  const getBalances = async (wallet) => {
    const provider = new ethers.providers.Web3Provider(ethereum);

    try {
      const balance = await provider.getBalance(wallet);
      balance.toString();
      const eth = ethers.utils.formatEther(balance);
     
      setState(prevState => ({
        ...prevState,
        balance: Number(eth).toFixed(8),
        amount: `$${parseFloat(Number(eth).toFixed(1) * 1574.81)}`,
      }))
    } catch (err) {
      // console.log(err);
      null;
    }

    // prints 1.0
  };

  const getTransactions = async () => {
    try{
      const transactions = await contract.getTransactions();
    console.log(transactions); 

    setState((prevState) => ({
      ...prevState,
      transactions: transactions,
    }));

    }catch(err){
      alert("Seems you'r offline")
    }
    
    // console.log(state.transactions)
  };

  const checkIfConnected = async () => {
    try{
      // if (!ethereum) return alert("Please install MetaMask");

      const accounts = await ethereum.request({ method: "eth_accounts" });
      // console.log(accounts);
      if (accounts.length > 0) {
        localStorage.setItem("account", accounts[0]);
  
        setState({
          ...state,
          walletAddress: accounts[0],
          auth: true,
        });
      }
    } catch(err){
      alert("Please install MetaMask");

    }
    
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      localStorage.setItem("account", accounts[0]);
    } catch (error) {
      console.log(error);
      alert("Authentication failed");
    }
  };

  const transferEth = async () => {
    setState({
      ...state,
      msg: "",
      msgType: "",
    });

    const { sendEth, sendTo } = state;
    if ([sendEth, sendTo].includes(""))
      return setState({
        ...state,
        msg: "All fields are required",
        msgType: "danger",
      });

    if (!ethers.utils.isAddress(sendTo))
      return setState({
        ...state,
        msg: "Invalid Ethereum Address",
        msgType: "danger",
      });

    try {
      const tx = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: state.walletAddress,
            to: sendTo,
            gas: "0x5208",
            value: ethers.utils.parseEther(sendEth)._hex,
          },
        ],
      });

      if (tx) {
        try {
          const saveTx = await contract.saveTransaction(
            sendTo,
            sendEth
          );

          setState({
            ...state,
            msg: "Ethereum Transfer Successful",
            msgType: "success",
          });

          // console.log(saveTx);

          if (saveTx) {
            setState({
              ...state,
              msg: "Ethereum Transaction Successful",
              msgType: "success",
            });

            getBalances();
            getTransactions();
          }
        } catch (err) {
          console.log(err);

          setState({
            ...state,
            msg: "Ethereum Transaction Failed",
            msgType: "danger",
          });
        }
      }
    } catch (err) {
      console.log(err);
      setState({
        ...state,
        msg: "Ethereum Transfer Failed",
        msgType: "danger",
      });
    }
  };

  useEffect(() => {
    checkIfConnected();
  }, []);

  useEffect(() => {
    getBalances(state.walletAddress);
  }, [state.walletAddress]);

  useState(() => {
    getTransactions();
  }, [state.balance]);

  return (
    <div className="App">
      <header>
        <nav>
          <div className="navbrand">EthTransact</div>

          <div className="navlinks">
            {!state.auth ? (
              <button onClick={connectWallet}>Connect</button>
            ) : (
              <div className="addr-bal">
                {shortenAddress(state.walletAddress)}
              </div>
            )}
            {state.auth && (
              <button onClick={connectWallet}>Logout</button>
            )}
          </div>
        </nav>
      </header>
      <main>
        <section className="bal">
          <h2>
            {state.balance} <FaEthereum className="icon" /> {state.amount}
          </h2>
        </section>
        {!state.transfer ? (
          <section className="transactions">
            <h3>TRANSACTIONS</h3>
            
            {(state.transactions.length === 0) ? (
              <h1 className="item" style={{marginTop: "1rem"}}>
                No Transactions Yet, Make your first transaction
              </h1>
            ) : (
              <div className="items">
                {state.transactions.map((item, i) => {
                  // console.log(item, state.walletAddress)
                  const from = String(item.from)

                  return from !== state.walletAddress && (
                    <div className="item" key={i}>
                      <p id="eth">
                        {item.amount}{" "}
                        <FaEthereum className="icon" />
                      </p>
                      <h4 id="add">to{shortenAddress(item.to)}</h4>
                      <p id="date">
                        {new Date(item.timestamp.toNumber() * 1000)
                          .toLocaleString()
                          .replace("/", "-")
                          .replace("/", "-")}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="transfer">
            <h3>SEND ETHEREUM CONTRACT</h3>

            <div className="input-bar">
              <FaEthereum className="icon" />
              <input
                type="text"
                placeholder="Ethereum Amount"
                onChange={(event) =>
                  setState({ ...state, sendEth: event.target.value, msg: "" })
                }
              />
            </div>
            <div className="input-bar">
              <BiWalletAlt className="icon" />
              <input
                type="text"
                placeholder="Ethereum Address"
                onChange={(event) =>
                  setState({ ...state, sendTo: event.target.value, msg: "" })
                }
              />
            </div>
            <div className={`msg ${state.msgType}`}>{state.msg}</div>
            <button onClick={transferEth}>TRANSFER</button>
          </section>
        )}
      </main>
      <footer>
        <div className="actions">
          <button onClick={() => setState({ ...state, transfer: true })}>
            <AiOutlineSend className="icon" />
            <p>TRANSFER</p>
          </button>
          <button onClick={() => setState({ ...state, transfer: false })}>
            <AiOutlineTransaction className="icon" />
            <p>TRANSACTIONS</p>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
