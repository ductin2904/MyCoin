# 💰 MyCoin - Cryptocurrency System

MyCoin là một hệ thống tiền điện tử hoàn chỉnh được xây dựng với Django (Backend) và React (Frontend), tương tự như MyEtherWallet và Etherscan.

## 🌟 Tính năng chính

### 1. Quản lý Ví (Wallet Management)
- ✅ Tạo ví mới với Private Key & Mnemonic Phrase
- ✅ Import ví từ Private Key hoặc Mnemonic
- ✅ Xem thống kê tài khoản (số dư, lịch sử giao dịch)
- ✅ Mã hóa an toàn thông tin ví

### 2. Giao dịch (Transactions)
- ✅ Gửi MyCoin đến địa chỉ khác
- ✅ Xem lịch sử giao dịch chi tiết
- ✅ Ký số giao dịch với ECDSA
- ✅ Hệ thống phí giao dịch

### 3. Blockchain Explorer
- ✅ Xem thông tin blocks và transactions
- ✅ Tìm kiếm theo address, transaction hash, block
- ✅ Giao diện tương tự Etherscan
- ✅ Thống kê mạng lưới real-time

### 4. Mining System
- ✅ Proof of Work consensus
- ✅ Mining dashboard với controls
- ✅ Theo dõi mining pools
- ✅ Lịch sử mining và rewards

### 5. Staking System (Proof of Stake)
- ✅ Validator pools
- ✅ Delegation mechanism
- ✅ Staking rewards
- ✅ Slashing protection

## 🛠 Công nghệ sử dụng

### Backend (Django)
- **Django 5.0+** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL/SQLite** - Database
- **ECDSA** - Digital signatures
- **Cryptography** - Encryption
- **Base58** - Address encoding

### Frontend (React)
- **React 18** - UI framework
- **React Router** - Navigation
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **React Icons** - Icons
- **QRCode.React** - QR code generation
- **SCSS** - Styling

### Blockchain Core
- **SHA-256** - Hashing algorithm
- **ECDSA secp256k1** - Digital signatures
- **RIPEMD-160** - Address generation
- **Merkle Trees** - Transaction verification
- **Proof of Work & Proof of Stake** - Consensus algorithms

## 📁 Cấu trúc dự án

```
Fahaha/
├── core/                           # Django Backend
│   ├── blockchain/                 # MyCoin Blockchain App
│   │   ├── models.py              # Database models
│   │   ├── views.py               # API endpoints
│   │   ├── serializers.py         # Data serialization
│   │   ├── blockchain.py          # Core blockchain logic
│   │   ├── utils.py               # Utility functions
│   │   ├── urls.py                # URL routing
│   │   └── management/            # Management commands
│   │       └── commands/
│   │           └── init_blockchain.py
│   ├── core/
│   │   ├── settings.py            # Django settings
│   │   └── urls.py                # Main URL config
│   ├── manage.py                  # Django management
│   └── requirements.txt           # Python dependencies
│
└── frontend/                      # React Frontend
    ├── src/
    │   ├── components/
    │   │   └── MyCoin/            # MyCoin Components
    │   │       ├── MyCoinApp.js   # Main app component
    │   │       ├── Header/        # Navigation header
    │   │       ├── Wallet/        # Wallet management
    │   │       ├── Transaction/   # Transaction handling
    │   │       ├── Explorer/      # Blockchain explorer
    │   │       ├── Mining/        # Mining dashboard
    │   │       └── Staking/       # Staking system
    │   ├── services/              # API services
    │   │   ├── apiService.js      # Main API client
    │   │   └── walletService.js   # Wallet operations
    │   └── pages/
    │       └── MyCoinPage.js      # MyCoin main page
    └── package.json               # Node dependencies
```

## 🚀 Hướng dẫn cài đặt

### 1. Prerequisites
```bash
# Cài đặt Python 3.8+
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Cài đặt Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

### 2. Backend Setup (Django)
```bash
# Di chuyển vào thư mục backend
cd core

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Cấu hình database
python manage.py makemigrations
python manage.py makemigrations blockchain
python manage.py migrate

# Khởi tạo blockchain
python manage.py init_blockchain

# Tạo superuser (optional)
python manage.py createsuperuser

# Chạy server
python manage.py runserver
```

### 3. Frontend Setup (React)
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

### 4. Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/blockchain/
- **Admin Panel**: http://localhost:8000/admin/

## 📖 API Documentation

### Wallet Endpoints
```
POST /api/blockchain/wallet/create/          # Tạo ví mới
POST /api/blockchain/wallet/import/          # Import ví
GET  /api/blockchain/wallet/{address}/       # Chi tiết ví
GET  /api/blockchain/wallet/{address}/balance/  # Số dư
```

### Transaction Endpoints
```
POST /api/blockchain/transaction/send/       # Gửi giao dịch
GET  /api/blockchain/transaction/{tx_id}/    # Chi tiết giao dịch
GET  /api/blockchain/wallet/{address}/transactions/  # Lịch sử
```

### Block & Mining
```
GET  /api/blockchain/blocks/                 # Danh sách blocks
GET  /api/blockchain/block/{block_id}/       # Chi tiết block
POST /api/blockchain/mine/                   # Mine block mới
```

### Network & Stats
```
GET  /api/blockchain/stats/                  # Thống kê mạng
GET  /api/blockchain/mining-pools/           # Mining pools
GET  /api/blockchain/staking-pools/          # Staking pools
GET  /api/blockchain/search/?q={query}       # Tìm kiếm
```

## 🔐 Bảo mật

### Wallet Security
- **Mã hóa Private Key**: Sử dụng AES với password
- **Mnemonic Protection**: 12-word recovery phrase
- **Address Generation**: Bitcoin-style với checksum
- **Digital Signatures**: ECDSA secp256k1

### Network Security
- **Transaction Validation**: Signature verification
- **Block Validation**: Hash verification
- **Consensus**: Proof of Work/Stake
- **Anti-spam**: Transaction fees

## 🎯 Cách sử dụng

### 1. Tạo Ví Mới
1. Truy cập http://localhost:3000/mycoin/wallet/create
2. Nhập password mạnh
3. Lưu mnemonic phrase an toàn
4. Download wallet info

### 2. Gửi Giao Dịch
1. Vào Wallet Dashboard
2. Click "Send MyCoin"
3. Nhập địa chỉ nhận và số lượng
4. Xác nhận giao dịch

### 3. Mining
1. Vào Mining Dashboard
2. Nhập wallet address để nhận reward
3. Click "Start Mining"
4. Chờ mine thành công

### 4. Khám phá Blockchain
1. Vào Explorer
2. Tìm kiếm address, transaction, block
3. Xem thống kê mạng
4. Theo dõi hoạt động real-time

## 🧪 Testing

### Demo Wallets
Sau khi chạy `init_blockchain`, hệ thống sẽ tạo 3 demo wallets để test:

```
Demo wallet 1: 1000 MYC
Demo wallet 2: 2000 MYC  
Demo wallet 3: 3000 MYC
```

### Test Scenarios
1. **Wallet Creation**: Tạo và import ví
2. **Transactions**: Gửi MyCoin giữa các ví
3. **Mining**: Mine blocks và nhận rewards
4. **Explorer**: Tìm kiếm và xem thông tin

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend (.env)
REACT_APP_MYCOIN_API_URL=http://localhost:8000/api/blockchain
REACT_APP_ENVIRONMENT=development
```

### Blockchain Settings
```python
# blockchain/blockchain.py
DIFFICULTY = 2              # Mining difficulty
MINING_REWARD = 10          # MYC per block
TARGET_BLOCK_TIME = 600     # 10 minutes
```

## 🚀 Production Deployment

### Backend
```bash
# Install production dependencies
pip install gunicorn psycopg2

# Collect static files
python manage.py collectstatic

# Run with Gunicorn
gunicorn core.wsgi:application
```

### Frontend
```bash
# Build for production
npm run build

# Serve with nginx or similar
```

## 📈 Roadmap

### Phase 1 ✅ (Completed)
- [x] Basic blockchain core
- [x] Wallet management
- [x] Transaction system
- [x] Mining (PoW)
- [x] Block explorer
- [x] REST API

### Phase 2 🚧 (In Progress)
- [ ] Staking (PoS) implementation
- [ ] Smart contracts support
- [ ] Mobile app
- [ ] Multi-signature wallets

### Phase 3 🔮 (Future)
- [ ] Cross-chain bridges
- [ ] DeFi protocols
- [ ] NFT marketplace
- [ ] Governance system

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discord**: [Community Server](https://discord.gg/mycoin)
- **Email**: support@mycoin.dev

## 🙏 Acknowledgments

- Bitcoin for blockchain inspiration
- Ethereum for smart contract concepts  
- MyEtherWallet for UI/UX reference
- Etherscan for explorer design
- Django & React communities

---

**⚠️ Disclaimer**: This is a educational/demo project. Do not use in production without proper security audits.
