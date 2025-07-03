import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import WalletCreatePage from './pages/WalletCreatePage';
import WalletImportPage from './pages/WalletImportPage';
import WalletAccessedPage from './pages/WalletAccessedPage';
import WalletDashboardPage from './pages/WalletDashboardPage';
import ExplorerPage from './pages/ExplorerPage';
import AllTransactionsPage from './pages/AllTransactionsPage';
import AllBlocksPage from './pages/AllBlocksPage';
import BlockDetailPage from './pages/BlockDetailPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import MiningPage from './pages/MiningPage';
import StakingPage from './pages/StakingPage';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/wallet/create" element={<WalletCreatePage />} />
              <Route path="/wallet/import" element={<WalletImportPage />} />
              <Route path="/wallet/accessed" element={<WalletAccessedPage />} />
              <Route path="/wallet/:address" element={<WalletDashboardPage />} />
              <Route path="/explorer" element={<ExplorerPage />} />
              <Route path="/transactions" element={<AllTransactionsPage />} />
              <Route path="/blocks" element={<AllBlocksPage />} />
              <Route path="/block/:blockId" element={<BlockDetailPage />} />
              <Route path="/transaction/:txId" element={<TransactionDetailPage />} />
              <Route path="/mining" element={<MiningPage />} />
              <Route path="/staking" element={<StakingPage />} />
            </Routes>
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
