from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import hashlib
import secrets
from ecdsa import SigningKey, SECP256k1
import base58


def generate_key_from_password(password: str, salt: bytes = None) -> bytes:
    """Tạo encryption key từ password"""
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt


def encrypt_data(data: str, password: str) -> str:
    """Mã hóa dữ liệu bằng password"""
    key, salt = generate_key_from_password(password)
    f = Fernet(key)
    encrypted_data = f.encrypt(data.encode())
    
    # Kết hợp salt và encrypted data
    combined = salt + encrypted_data
    return base64.b64encode(combined).decode()


def decrypt_data(encrypted_data: str, password: str) -> str:
    """Giải mã dữ liệu bằng password"""
    try:
        combined = base64.b64decode(encrypted_data.encode())
        salt = combined[:16]
        encrypted_content = combined[16:]
        
        key, _ = generate_key_from_password(password, salt)
        f = Fernet(key)
        decrypted_data = f.decrypt(encrypted_content)
        return decrypted_data.decode()
    except Exception:
        raise ValueError("Invalid password or corrupted data")


def generate_wallet_from_mnemonic(mnemonic: str, passphrase: str = "") -> tuple:
    """Tạo wallet từ mnemonic phrase"""
    # Đơn giản hóa cho demo - trong thực tế cần implement BIP39 standard
    seed = hashlib.pbkdf2_hmac('sha512', mnemonic.encode(), passphrase.encode(), 2048)
    
    # Lấy 32 bytes đầu làm private key
    private_key = seed[:32].hex()
    
    # Tạo public key và address
    signing_key = SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
    public_key = signing_key.get_verifying_key().to_string().hex()
    
    # Tạo address từ public key
    address = generate_address_from_public_key(public_key)
    
    return private_key, public_key, address


def generate_address_from_public_key(public_key: str) -> str:
    """Tạo address từ public key"""
    # Hash public key với SHA-256
    sha256_hash = hashlib.sha256(bytes.fromhex(public_key)).digest()
    
    # Sử dụng SHA-256 thay vì RIPEMD-160 để tránh lỗi compatibility
    hash160 = hashlib.sha256(sha256_hash).digest()[:20]  # Lấy 20 bytes đầu
    
    # Thêm version byte (0x00 cho mainnet)
    versioned_payload = b'\x00' + hash160
    
    # Double SHA-256 cho checksum
    checksum = hashlib.sha256(hashlib.sha256(versioned_payload).digest()).digest()[:4]
    
    # Kết hợp và encode Base58
    binary_address = versioned_payload + checksum
    address = base58.b58encode(binary_address).decode()
    
    return address


def validate_address(address: str) -> bool:
    """Kiểm tra tính hợp lệ của address"""
    try:
        # Decode Base58
        decoded = base58.b58decode(address)
        
        # Tách payload và checksum
        payload = decoded[:-4]
        checksum = decoded[-4:]
        
        # Tính checksum mới
        new_checksum = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4]
        
        return checksum == new_checksum
    except:
        return False


def calculate_transaction_fee(transaction_size: int, fee_per_byte: float = 0.00001) -> float:
    """Tính phí giao dịch dựa trên kích thước"""
    return transaction_size * fee_per_byte


def estimate_transaction_size(inputs: int, outputs: int) -> int:
    """Ước tính kích thước giao dịch (bytes)"""
    # Công thức đơn giản: base_size + (inputs * input_size) + (outputs * output_size)
    base_size = 10  # Version, locktime, etc.
    input_size = 148  # Typical input size
    output_size = 34  # Typical output size
    
    return base_size + (inputs * input_size) + (outputs * output_size)


def validate_private_key(private_key: str) -> bool:
    """Kiểm tra tính hợp lệ của private key"""
    try:
        if len(private_key) != 64:  # 32 bytes = 64 hex chars
            return False
        
        # Thử tạo signing key
        SigningKey.from_string(bytes.fromhex(private_key), curve=SECP256k1)
        return True
    except:
        return False


def generate_qr_code_data(address: str, amount: float = None, message: str = None) -> str:
    """Tạo dữ liệu cho QR code"""
    qr_data = f"mycoin:{address}"
    
    params = []
    if amount:
        params.append(f"amount={amount}")
    if message:
        params.append(f"message={message}")
    
    if params:
        qr_data += "?" + "&".join(params)
    
    return qr_data


class ProofOfStake:
    """Thuật toán Proof of Stake đơn giản"""
    
    def __init__(self):
        self.validators = {}  # address -> stake_amount
        self.minimum_stake = 1000  # Minimum MYC để trở thành validator
    
    def add_validator(self, address: str, stake_amount: float):
        """Thêm validator mới"""
        if stake_amount >= self.minimum_stake:
            self.validators[address] = stake_amount
            return True
        return False
    
    def remove_validator(self, address: str):
        """Xóa validator"""
        if address in self.validators:
            del self.validators[address]
            return True
        return False
    
    def select_validator(self, seed: str) -> str:
        """Chọn validator dựa trên stake weight"""
        if not self.validators:
            return None
        
        total_stake = sum(self.validators.values())
        
        # Tạo random number từ seed
        hash_value = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
        random_value = (hash_value % int(total_stake * 1000000)) / 1000000
        
        # Chọn validator dựa trên weight
        current_weight = 0
        for address, stake in self.validators.items():
            current_weight += stake
            if random_value <= current_weight:
                return address
        
        return list(self.validators.keys())[0]  # Fallback
    
    def calculate_reward(self, validator_address: str, base_reward: float) -> float:
        """Tính reward cho validator"""
        if validator_address not in self.validators:
            return 0
        
        # Reward tỷ lệ thuận với stake
        total_stake = sum(self.validators.values())
        validator_stake = self.validators[validator_address]
        
        return base_reward * (validator_stake / total_stake)


def format_hash(hash_string: str, length: int = 10) -> str:
    """Format hash để hiển thị"""
    if len(hash_string) <= length:
        return hash_string
    return f"{hash_string[:length]}...{hash_string[-4:]}"


def convert_wei_to_mycoin(wei_amount: int) -> float:
    """Chuyển đổi từ wei sang MYC (như ETH)"""
    return wei_amount / (10 ** 18)


def convert_mycoin_to_wei(mycoin_amount: float) -> int:
    """Chuyển đổi từ MYC sang wei"""
    return int(mycoin_amount * (10 ** 18))


def get_network_difficulty_adjustment(current_time: float, target_time: float, current_difficulty: int) -> int:
    """Điều chỉnh độ khó mining"""
    if current_time < target_time * 0.5:
        # Quá nhanh, tăng độ khó
        return min(current_difficulty + 1, 10)
    elif current_time > target_time * 2:
        # Quá chậm, giảm độ khó
        return max(current_difficulty - 1, 1)
    else:
        return current_difficulty
