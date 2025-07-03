from django.db import models
from decimal import Decimal
import json


class Wallet(models.Model):
    """Model để lưu thông tin ví"""
    address = models.CharField(max_length=100, unique=True, primary_key=True)
    encrypted_private_key = models.TextField()  # Mã hóa private key
    public_key = models.TextField()
    mnemonic_encrypted = models.TextField(blank=True, null=True)  # Mã hóa mnemonic
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'blockchain_wallets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Wallet {self.address[:10]}..."


class Block(models.Model):
    """Model để lưu thông tin block"""
    index = models.IntegerField(unique=True)
    hash = models.CharField(max_length=64, unique=True)
    previous_hash = models.CharField(max_length=64)
    merkle_root = models.CharField(max_length=64)
    timestamp = models.DateTimeField()
    nonce = models.BigIntegerField()
    difficulty = models.IntegerField()
    transaction_count = models.IntegerField(default=0)
    block_size = models.IntegerField(default=0)  # Size in bytes
    miner_address = models.CharField(max_length=100, blank=True, null=True)
    block_reward = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    
    class Meta:
        db_table = 'blockchain_blocks'
        ordering = ['-index']
    
    def __str__(self):
        return f"Block #{self.index} - {self.hash[:10]}..."


class Transaction(models.Model):
    """Model để lưu thông tin giao dịch"""
    TRANSACTION_TYPES = [
        ('transfer', 'Transfer'),
        ('mining', 'Mining Reward'),
        ('fee', 'Transaction Fee'),
    ]
    
    STATUS_CHOICES = [
        ('pending_notification', 'Pending Notification'),  # Chờ thông báo người nhận
        ('pending_confirmation', 'Pending Confirmation'),  # Chờ xác nhận từ người nhận
        ('confirmed', 'Confirmed'),                        # Đã xác nhận và ghi vào block
        ('rejected', 'Rejected'),                          # Bị từ chối
        ('expired', 'Expired'),                           # Hết hạn chờ xác nhận
        ('failed', 'Failed'),                             # Thất bại
    ]
    
    transaction_id = models.CharField(max_length=64, unique=True, primary_key=True)
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    from_address = models.CharField(max_length=100)  # "0" for mining rewards
    to_address = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    fee = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='transfer')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending_notification')
    signature = models.TextField(blank=True, null=True)
    data = models.TextField(blank=True, null=True)  # Additional data
    timestamp = models.DateTimeField()
    gas_used = models.IntegerField(default=0)
    gas_price = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    nonce = models.IntegerField(default=0)  # Transaction nonce for sender
    
    class Meta:
        db_table = 'blockchain_transactions'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['from_address']),
            models.Index(fields=['to_address']),
            models.Index(fields=['status']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"TX {self.transaction_id[:10]}... - {self.amount} MYC"


class Balance(models.Model):
    """Model để lưu số dư của các address"""
    address = models.CharField(max_length=100, unique=True, primary_key=True)
    balance = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    last_updated = models.DateTimeField(auto_now=True)
    transaction_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'blockchain_balances'
        ordering = ['-balance']
    
    def __str__(self):
        return f"{self.address[:10]}... - {self.balance} MYC"


class MiningPool(models.Model):
    """Model để quản lý mining pool"""
    miner_address = models.CharField(max_length=100)
    hash_rate = models.DecimalField(max_digits=20, decimal_places=2, default=0)  # Hashes per second
    blocks_mined = models.IntegerField(default=0)
    total_rewards = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    last_block_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'blockchain_mining_pool'
        ordering = ['-hash_rate']
    
    def __str__(self):
        return f"Miner {self.miner_address[:10]}... - {self.blocks_mined} blocks"


class NetworkStats(models.Model):
    """Model để lưu thống kê mạng"""
    timestamp = models.DateTimeField(auto_now_add=True)
    total_blocks = models.IntegerField(default=0)
    total_transactions = models.IntegerField(default=0)
    total_supply = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    circulating_supply = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    price_usd = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    network_hash_rate = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    difficulty = models.IntegerField(default=2)
    avg_block_time = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # seconds
    pending_transactions = models.IntegerField(default=0)
    active_addresses = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'blockchain_network_stats'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Network Stats - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class StakingPool(models.Model):
    """Model cho Proof of Stake"""
    STAKING_STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('slashed', 'Slashed'),
    ]
    
    validator_address = models.CharField(max_length=100)
    staked_amount = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    delegated_amount = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    total_amount = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)  # Percentage
    status = models.CharField(max_length=20, choices=STAKING_STATUS, default='active')
    blocks_validated = models.IntegerField(default=0)
    total_rewards = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    slashing_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'blockchain_staking_pool'
        ordering = ['-total_amount']
    
    def __str__(self):
        return f"Validator {self.validator_address[:10]}... - {self.total_amount} MYC"


class Delegation(models.Model):
    """Model cho delegation trong PoS"""
    delegator_address = models.CharField(max_length=100)
    validator = models.ForeignKey(StakingPool, on_delete=models.CASCADE, related_name='delegations')
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    rewards_earned = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'blockchain_delegations'
        unique_together = ['delegator_address', 'validator']
        ordering = ['-amount']
    
    def __str__(self):
        return f"{self.delegator_address[:10]}... delegates {self.amount} to {self.validator.validator_address[:10]}..."


class SmartContract(models.Model):
    """Model cho Smart Contracts (tương lai)"""
    CONTRACT_STATUS = [
        ('deployed', 'Deployed'),
        ('paused', 'Paused'),
        ('destroyed', 'Destroyed'),
    ]
    
    contract_address = models.CharField(max_length=100, unique=True)
    creator_address = models.CharField(max_length=100)
    contract_code = models.TextField()
    abi = models.JSONField(default=dict)  # Application Binary Interface
    bytecode = models.TextField()
    status = models.CharField(max_length=20, choices=CONTRACT_STATUS, default='deployed')
    gas_limit = models.IntegerField(default=1000000)
    creation_transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'blockchain_smart_contracts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Contract {self.contract_address[:10]}..."


class TransactionNotification(models.Model):
    """Model để lưu thông báo giao dịch cho người nhận"""
    NOTIFICATION_TYPES = [
        ('incoming_transfer', 'Incoming Transfer'),
        ('outgoing_transfer', 'Outgoing Transfer'),
        ('mining_reward', 'Mining Reward'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),  # Chờ người nhận xem
        ('read', 'Read'),        # Đã xem nhưng chưa xác nhận
        ('accepted', 'Accepted'), # Đã xác nhận đồng ý
        ('rejected', 'Rejected'), # Từ chối giao dịch
        ('expired', 'Expired'),   # Hết hạn xác nhận
    ]
    
    id = models.AutoField(primary_key=True)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='notifications')
    recipient_address = models.CharField(max_length=100)  # Người nhận thông báo
    sender_address = models.CharField(max_length=100)     # Người gửi
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='incoming_transfer')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    message = models.TextField(blank=True, null=True)  # Tin nhắn kèm theo
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()  # Hạn xác nhận (24h)
    
    class Meta:
        db_table = 'blockchain_notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient_address']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Notification {self.id} - {self.amount} MYC to {self.recipient_address[:10]}..."


class TransactionConfirmation(models.Model):
    """Model để lưu xác nhận giao dịch từ người nhận"""
    CONFIRMATION_TYPES = [
        ('accept', 'Accept'),
        ('reject', 'Reject'),
        ('auto_accept', 'Auto Accept'),  # Tự động chấp nhận sau thời gian
    ]
    
    id = models.AutoField(primary_key=True)
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='confirmation')
    notification = models.OneToOneField(TransactionNotification, on_delete=models.CASCADE, related_name='confirmation')
    recipient_address = models.CharField(max_length=100)
    confirmation_type = models.CharField(max_length=20, choices=CONFIRMATION_TYPES)
    signature = models.TextField(blank=True, null=True)  # Chữ ký xác nhận từ người nhận
    message = models.TextField(blank=True, null=True)    # Lý do xác nhận/từ chối
    confirmed_at = models.DateTimeField(auto_now_add=True)
    confirmed_by_private_key = models.BooleanField(default=False)  # Đã ký bằng private key
    
    class Meta:
        db_table = 'blockchain_confirmations'
        ordering = ['-confirmed_at']
    
    def __str__(self):
        return f"Confirmation {self.id} - {self.confirmation_type}"
