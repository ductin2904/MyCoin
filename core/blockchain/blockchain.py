import hashlib
import json
import time
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Optional, Tuple
import secrets
import ecdsa
from ecdsa import SigningKey, SECP256k1
import base58
import base64


class Transaction:
    """Lớp đại diện cho một giao dịch trong blockchain"""
    
    def __init__(self, from_address: str, to_address: str, amount: Decimal, 
                 fee: Decimal = Decimal('0.001'), data: str = ""):
        self.from_address = from_address
        self.to_address = to_address
        self.amount = amount
        self.fee = fee
        self.data = data
        self.timestamp = datetime.now().isoformat()
        self.signature = None
        self.transaction_id = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Tính toán hash của giao dịch"""
        transaction_string = f"{self.from_address}{self.to_address}{self.amount}{self.fee}{self.data}{self.timestamp}"
        return hashlib.sha256(transaction_string.encode()).hexdigest()
    
    def sign_transaction(self, private_key: str):
        """Ký giao dịch bằng private key"""
        if self.from_address == "0":  # Mining reward
            return
            
        signing_key = ecdsa.SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
        self.signature = signing_key.sign(self.transaction_id.encode()).hex()
    
    def is_valid(self) -> bool:
        """Kiểm tra tính hợp lệ của giao dịch"""
        if self.from_address == "0":  # Mining reward
            return True
            
        if not self.signature:
            return False
        
        try:
            public_key = Wallet.get_public_key_from_address(self.from_address)
            if not public_key:
                # If no public key found, transaction is invalid
                return False
            verifying_key = ecdsa.VerifyingKey.from_string(bytes.fromhex(public_key), curve=SECP256k1)
            return verifying_key.verify(bytes.fromhex(self.signature), self.transaction_id.encode())
        except Exception:
            # In case of any validation error, reject the transaction
            return False
    
    def to_dict(self) -> Dict:
        """Chuyển đổi giao dịch thành dictionary"""
        return {
            'transaction_id': self.transaction_id,
            'from_address': self.from_address,
            'to_address': self.to_address,
            'amount': str(self.amount),
            'fee': str(self.fee),
            'data': self.data,
            'timestamp': self.timestamp,
            'signature': self.signature
        }


class Block:
    """Lớp đại diện cho một block trong blockchain"""
    
    def __init__(self, timestamp: str, transactions: List[Transaction], 
                 previous_hash: str, index: int):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = 0
        self.merkle_root = self.calculate_merkle_root()
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Tính toán hash của block"""
        block_string = f"{self.index}{self.timestamp}{self.previous_hash}{self.nonce}{self.merkle_root}"
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def calculate_merkle_root(self) -> str:
        """Tính toán Merkle root của các giao dịch"""
        if not self.transactions:
            return hashlib.sha256("".encode()).hexdigest()
        
        transaction_hashes = [tx.transaction_id for tx in self.transactions]
        
        while len(transaction_hashes) > 1:
            next_level = []
            for i in range(0, len(transaction_hashes), 2):
                if i + 1 < len(transaction_hashes):
                    combined = transaction_hashes[i] + transaction_hashes[i + 1]
                else:
                    combined = transaction_hashes[i] + transaction_hashes[i]
                next_level.append(hashlib.sha256(combined.encode()).hexdigest())
            transaction_hashes = next_level
        
        return transaction_hashes[0]
    
    def mine_block(self, difficulty: int):
        """Đào block với độ khó xác định (Proof of Work)"""
        target = "0" * difficulty
        start_time = time.time()
        
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        
        end_time = time.time()
        print(f"Block mined: {self.hash} in {end_time - start_time:.2f} seconds")
    
    def to_dict(self) -> Dict:
        """Chuyển đổi block thành dictionary"""
        return {
            'index': self.index,
            'timestamp': self.timestamp,
            'transactions': [tx.to_dict() for tx in self.transactions],
            'previous_hash': self.previous_hash,
            'hash': self.hash,
            'nonce': self.nonce,
            'merkle_root': self.merkle_root
        }


class Wallet:
    """Lớp đại diện cho ví tiền điện tử"""
    
    def __init__(self):
        self.private_key = None
        self.public_key = None
        self.address = None
        self.mnemonic = None
    
    def generate_keys(self) -> Tuple[str, str, str]:
        """Tạo private key, public key và address"""
        # Tạo private key
        private_key = secrets.token_hex(32)
        
        # Tạo public key từ private key
        signing_key = SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
        public_key = signing_key.get_verifying_key().to_string().hex()
        
        # Tạo address từ public key
        address = self.generate_address_from_public_key(public_key)
        
        self.private_key = private_key
        self.public_key = public_key
        self.address = address
        
        return private_key, public_key, address
    
    def generate_address_from_public_key(self, public_key: str) -> str:
        """Tạo address từ public key - sử dụng SHA256 thay vì RIPEMD160"""
        # Hash public key với SHA-256
        sha256_hash = hashlib.sha256(bytes.fromhex(public_key)).digest()
        
        # Hash lần nữa với SHA-256 thay vì RIPEMD-160 để tránh lỗi compatibility
        double_sha256 = hashlib.sha256(sha256_hash).digest()
        
        # Lấy 20 bytes đầu (giống như RIPEMD-160)
        hash160 = double_sha256[:20]
        
        # Thêm version byte (0x00 cho mainnet)
        versioned_payload = b'\x00' + hash160
        
        # Double SHA-256 cho checksum
        checksum = hashlib.sha256(hashlib.sha256(versioned_payload).digest()).digest()[:4]
        
        # Kết hợp và encode Base58
        binary_address = versioned_payload + checksum
        address = base58.b58encode(binary_address).decode()
        
        return address
    
    def generate_mnemonic(self) -> str:
        """Tạo mnemonic phrase"""
        # Danh sách từ đơn giản cho demo
        words = [
            "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
            "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
            "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
            "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
            "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
            "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album"
        ]
        
        # Tạo 12 từ ngẫu nhiên
        mnemonic_words = [secrets.choice(words) for _ in range(12)]
        self.mnemonic = " ".join(mnemonic_words)
        return self.mnemonic
    
    def import_from_private_key(self, private_key: str):
        """Import ví từ private key"""
        try:
            signing_key = SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
            public_key = signing_key.get_verifying_key().to_string().hex()
            address = self.generate_address_from_public_key(public_key)
            
            self.private_key = private_key
            self.public_key = public_key
            self.address = address
            
            return True
        except:
            return False
    
    @staticmethod
    def get_public_key_from_address(address: str) -> Optional[str]:
        """Lấy public key từ address"""
        try:
            from .models import Wallet as WalletModel
            wallet = WalletModel.objects.get(address=address)
            return wallet.public_key
        except:
            return None
    
    def to_dict(self) -> Dict:
        """Chuyển đổi wallet thành dictionary"""
        return {
            'address': self.address,
            'public_key': self.public_key,
            'mnemonic': self.mnemonic
        }


class MyCoinBlockchain:
    """Lớp chính của blockchain MyCoin"""
    
    def __init__(self):
        self.difficulty = 2
        self.pending_transactions: List[Transaction] = []
        self.mining_reward = Decimal('10')
        self.balances: Dict[str, Decimal] = {}
        self.chain: List[Block] = [self.create_genesis_block()]
    
    def create_genesis_block(self) -> Block:
        """Tạo block đầu tiên (Genesis block)"""
        genesis_transaction = Transaction("0", "genesis", Decimal('1000000'), Decimal('0'), "Genesis block")
        genesis_block = Block(
            timestamp=datetime.now().isoformat(),
            transactions=[genesis_transaction],
            previous_hash="0",
            index=0
        )
        genesis_block.mine_block(self.difficulty)
        return genesis_block
    
    def get_latest_block(self) -> Block:
        """Lấy block mới nhất"""
        return self.chain[-1]
    
    def add_transaction(self, transaction: Transaction) -> bool:
        """Thêm giao dịch vào pending pool"""
        if not transaction.is_valid():
            return False
        
        # Kiểm tra số dư
        if transaction.from_address != "0":  # Không phải mining reward
            balance = self.get_balance(transaction.from_address)
            if balance < transaction.amount + transaction.fee:
                return False
        
        self.pending_transactions.append(transaction)
        return True
    
    def mine_pending_transactions(self, mining_reward_address: str) -> Block:
        """Đào các giao dịch pending"""
        # Thêm reward transaction
        reward_transaction = Transaction("0", mining_reward_address, self.mining_reward)
        self.pending_transactions.append(reward_transaction)
        
        # Tạo block mới
        block = Block(
            timestamp=datetime.now().isoformat(),
            transactions=self.pending_transactions,
            previous_hash=self.get_latest_block().hash,
            index=len(self.chain)
        )
        
        # Đào block
        block.mine_block(self.difficulty)
        
        # Thêm vào chain
        self.chain.append(block)
        
        # Cập nhật balances
        self.update_balances(block)
        
        # Reset pending transactions
        self.pending_transactions = []
        
        return block
    
    def update_balances(self, block: Block):
        """Cập nhật số dư sau khi mine block"""
        for transaction in block.transactions:
            if transaction.from_address != "0":
                if transaction.from_address not in self.balances:
                    self.balances[transaction.from_address] = Decimal('0')
                self.balances[transaction.from_address] -= (transaction.amount + transaction.fee)
            
            if transaction.to_address not in self.balances:
                self.balances[transaction.to_address] = Decimal('0')
            self.balances[transaction.to_address] += transaction.amount
    
    def get_balance(self, address: str) -> Decimal:
        """Lấy số dư của một address"""
        # First check database for actual balance
        try:
            from .models import Balance
            balance_obj = Balance.objects.get(address=address)
            return balance_obj.balance
        except:
            pass
            
        if address in self.balances:
            return self.balances[address]
        
        # Tính toán số dư từ toàn bộ blockchain
        balance = Decimal('0')
        for block in self.chain:
            for transaction in block.transactions:
                if transaction.from_address == address:
                    balance -= (transaction.amount + transaction.fee)
                if transaction.to_address == address:
                    balance += transaction.amount
        
        self.balances[address] = balance
        return balance
    
    def get_transaction_history(self, address: str) -> List[Dict]:
        """Lấy lịch sử giao dịch của một address"""
        transactions = []
        for block in self.chain:
            for transaction in block.transactions:
                if transaction.from_address == address or transaction.to_address == address:
                    tx_dict = transaction.to_dict()
                    tx_dict['block_index'] = block.index
                    tx_dict['block_hash'] = block.hash
                    transactions.append(tx_dict)
        
        return sorted(transactions, key=lambda x: x['timestamp'], reverse=True)
    
    def is_chain_valid(self) -> bool:
        """Kiểm tra tính hợp lệ của blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Kiểm tra hash của block hiện tại
            if current_block.hash != current_block.calculate_hash():
                return False
            
            # Kiểm tra liên kết với block trước
            if current_block.previous_hash != previous_block.hash:
                return False
            
            # Kiểm tra tính hợp lệ của các giao dịch
            for transaction in current_block.transactions:
                if not transaction.is_valid():
                    return False
        
        return True
    
    def get_chain_stats(self) -> Dict:
        """Lấy thống kê của blockchain"""
        total_transactions = sum(len(block.transactions) for block in self.chain)
        total_supply = sum(self.balances.values())
        
        return {
            'total_blocks': len(self.chain),
            'total_transactions': total_transactions,
            'total_supply': str(total_supply),
            'difficulty': self.difficulty,
            'pending_transactions': len(self.pending_transactions)
        }
    
    def to_dict(self) -> Dict:
        """Chuyển đổi blockchain thành dictionary"""
        return {
            'chain': [block.to_dict() for block in self.chain],
            'difficulty': self.difficulty,
            'pending_transactions': [tx.to_dict() for tx in self.pending_transactions],
            'mining_reward': str(self.mining_reward)
        }


# Singleton instance của blockchain
blockchain_instance = MyCoinBlockchain()
