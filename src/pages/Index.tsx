import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import TonWeb from "tonweb";
import { Buffer } from "buffer";

window.Buffer = Buffer;

const API_URL = "https://functions.poehali.dev/83e42888-c654-4690-9076-fed1122893b5";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [mnemonic, setMnemonic] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("UQDnuKfcBFbPfcUm63GjmeMRmT9b7JcVhjwVik-YHCrmMQsb");
  const [sendAmount, setSendAmount] = useState("1000");
  
  const tonPrice = 2.34;
  const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));

  useEffect(() => {
    fetchTransactions();
    loadOrCreateWallet();
  }, []);

  const loadOrCreateWallet = async () => {
    const savedMnemonic = localStorage.getItem('ton_wallet_mnemonic');
    
    if (savedMnemonic) {
      const mnemonicArray = JSON.parse(savedMnemonic);
      await restoreWallet(mnemonicArray);
    }
  };

  const createNewWallet = async () => {
    const mnemonicArray = await TonWeb.mnemonic.generateMnemonic();
    setMnemonic(mnemonicArray);
    setShowMnemonic(true);
    
    localStorage.setItem('ton_wallet_mnemonic', JSON.stringify(mnemonicArray));
    
    await restoreWallet(mnemonicArray);
  };

  const restoreWallet = async (mnemonicArray) => {
    const keyPair = await TonWeb.mnemonic.mnemonicToKeyPair(mnemonicArray);
    
    const WalletClass = tonweb.wallet.all.v4R2;
    const walletInstance = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey
    });
    
    const address = await walletInstance.getAddress();
    const addressString = address.toString(true, true, true);
    
    setWallet({ instance: walletInstance, keyPair });
    setWalletAddress(addressString);
    setMnemonic(mnemonicArray);
    
    await updateBalance(addressString);
  };

  const updateBalance = async (address) => {
    try {
      const balanceNano = await tonweb.getBalance(address);
      const balanceTon = parseFloat(TonWeb.utils.fromNano(balanceNano));
      setBalance(balanceTon);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTransactions(data.transactions.map(tx => ({
        id: tx.id,
        type: tx.transaction_type,
        amount: parseFloat(tx.amount),
        status: tx.status,
        address: tx.address,
        date: new Date(tx.created_at).toLocaleDateString()
      })));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const sendTon = async () => {
    if (!wallet || !recipientAddress || !sendAmount) {
      alert('Заполните все поля');
      return;
    }

    try {
      const amount = TonWeb.utils.toNano(sendAmount);
      
      const seqno = await wallet.instance.methods.seqno().call();
      
      const transfer = wallet.instance.methods.transfer({
        secretKey: wallet.keyPair.secretKey,
        toAddress: recipientAddress,
        amount: amount,
        seqno: seqno || 0,
        payload: '',
        sendMode: 3,
      });

      await transfer.send();
      
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'sent',
          amount: parseFloat(sendAmount),
          address: recipientAddress
        })
      });
      
      alert('Транзакция отправлена!');
      await updateBalance(walletAddress);
      await fetchTransactions();
      
    } catch (error) {
      console.error('Error sending transaction:', error);
      alert('Ошибка отправки: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto pb-20">
        <div className="gradient-ton p-8 rounded-b-3xl animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">TON Wallet</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={() => setShowMnemonic(!showMnemonic)}
            >
              <Icon name="Settings" size={24} />
            </Button>
          </div>
          
          <div className="text-center">
            {!wallet ? (
              <div className="mb-6">
                <p className="text-white/90 mb-4">Создайте новый кошелек</p>
                <Button 
                  onClick={createNewWallet}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Создать кошелек
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-white/80 mb-2">Баланс</p>
                <h2 className="text-5xl font-bold mb-2">{balance.toFixed(2)} TON</h2>
                <p className="text-white/90">≈ ${(balance * tonPrice).toLocaleString()}</p>
                <p className="text-xs text-white/70 mt-2 font-mono break-all px-4">{walletAddress}</p>
              </>
            )}
          </div>

          {wallet && (
            <div className="mt-8 space-y-3">
              <Input
                type="text"
                placeholder="Адрес получателя"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
              <Input
                type="number"
                placeholder="Сумма (TON)"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
              <Button 
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                onClick={sendTon}
              >
                <Icon name="ArrowUpRight" size={20} className="mr-2" />
                Отправить {sendAmount} TON
              </Button>
            </div>
          )}
        </div>

        {showMnemonic && mnemonic.length > 0 && (
          <div className="px-4 mt-6">
            <Card className="p-4 bg-destructive/10 border-destructive/50">
              <h3 className="text-lg font-semibold mb-2 text-destructive">⚠️ Секретная фраза</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Сохраните эти слова в безопасном месте. Они нужны для восстановления кошелька.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {mnemonic.map((word, index) => (
                  <div key={index} className="bg-background p-2 rounded text-sm">
                    <span className="text-muted-foreground">{index + 1}.</span> {word}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => setShowMnemonic(false)}
              >
                Скрыть
              </Button>
            </Card>
          </div>
        )}

        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">История транзакций</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              Все
              <Icon name="ChevronRight" size={16} className="ml-1" />
            </Button>
          </div>

          <div className="space-y-3 animate-scale-in">
            {loading ? (
              <p className="text-center text-muted-foreground">Загрузка...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground">Нет транзакций</p>
            ) : (
              transactions.map((tx) => (
              <Card key={tx.id} className="p-4 gradient-card border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "received" 
                        ? "bg-green-500/20 text-green-500" 
                        : "bg-primary/20 text-primary"
                    }`}>
                      <Icon 
                        name={tx.type === "received" ? "ArrowDownLeft" : "ArrowUpRight"} 
                        size={20} 
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.type === "received" ? "Получено" : "Отправлено"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.type === "received" ? "text-green-500" : "text-foreground"
                    }`}>
                      {tx.type === "received" ? "+" : "-"}{tx.amount} TON
                    </p>
                    <Badge 
                      variant={tx.status === "completed" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {tx.status === "completed" ? "Завершено" : "В обработке"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
            )}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-md mx-auto flex items-center justify-around py-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 ${
              activeTab === "home" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("home")}
          >
            <Icon name="Home" size={24} />
            <span className="text-xs">Главная</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 ${
              activeTab === "wallet" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("wallet")}
          >
            <Icon name="Wallet" size={24} />
            <span className="text-xs">Кошелек</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 ${
              activeTab === "transactions" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            <Icon name="ArrowLeftRight" size={24} />
            <span className="text-xs">Транзакции</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 ${
              activeTab === "settings" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <Icon name="Settings" size={24} />
            <span className="text-xs">Настройки</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
