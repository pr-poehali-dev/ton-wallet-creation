import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/83e42888-c654-4690-9076-fed1122893b5";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const tonPrice = 2.34;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setBalance(data.balance);
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

  const sendTransaction = async (amount: number, address: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'sent',
          amount: amount,
          address: address
        })
      });
      
      if (response.ok) {
        await fetchTransactions();
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto pb-20">
        <div className="gradient-ton p-8 rounded-b-3xl animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">TON Wallet</h1>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Icon name="Settings" size={24} />
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-white/80 mb-2">Общий баланс</p>
            <h2 className="text-5xl font-bold mb-2">{balance.toFixed(2)} TON</h2>
            <p className="text-white/90">≈ ${(balance * tonPrice).toLocaleString()}</p>
          </div>

          <div className="flex gap-3 mt-8">
            <Button 
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              onClick={() => sendTransaction(1000, 'UQDnuKfcBFbPfcUm63GjmeMRmT9b7JcVhjwVik-YHCrmMQsb')}
            >
              <Icon name="ArrowUpRight" size={20} className="mr-2" />
              Отправить
            </Button>
            <Button className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
              <Icon name="ArrowDownLeft" size={20} className="mr-2" />
              Получить
            </Button>
          </div>
        </div>

        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Последние транзакции</h3>
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