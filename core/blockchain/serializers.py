from rest_framework import serializers
from django.db import models
from .models import Wallet, Block, Transaction, Balance, MiningPool, NetworkStats, StakingPool, Delegation, TransactionNotification, TransactionConfirmation, TransactionNotification, TransactionConfirmation
from decimal import Decimal


class WalletSerializer(serializers.ModelSerializer):
    """Serializer cho Wallet (không bao gồm private key)"""
    balance = serializers.SerializerMethodField()
    transaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Wallet
        fields = ['address', 'public_key', 'created_at', 'updated_at', 'is_active', 'balance', 'transaction_count']
        read_only_fields = ['address', 'public_key', 'created_at', 'updated_at']
    
    def get_balance(self, obj):
        try:
            balance = Balance.objects.get(address=obj.address)
            return str(balance.balance)
        except Balance.DoesNotExist:
            return "0"
    
    def get_transaction_count(self, obj):
        return Transaction.objects.filter(
            models.Q(from_address=obj.address) | models.Q(to_address=obj.address)
        ).count()


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer cho Transaction"""
    block_hash = serializers.CharField(source='block.hash', read_only=True)
    block_index = serializers.IntegerField(source='block.index', read_only=True)
    confirmations = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'transaction_id', 'block_hash', 'block_index', 'from_address', 'to_address',
            'amount', 'fee', 'transaction_type', 'status', 'signature', 'data',
            'timestamp', 'gas_used', 'gas_price', 'nonce', 'confirmations'
        ]
        read_only_fields = ['transaction_id', 'block_hash', 'block_index', 'confirmations']
    
    def get_confirmations(self, obj):
        if obj.block:
            latest_block = Block.objects.order_by('-index').first()
            if latest_block:
                return latest_block.index - obj.block.index + 1
        return 0


class BlockSerializer(serializers.ModelSerializer):
    """Serializer cho Block"""
    transactions = TransactionSerializer(many=True, read_only=True)
    total_fees = serializers.SerializerMethodField()
    block_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Block
        fields = [
            'index', 'hash', 'previous_hash', 'merkle_root', 'timestamp',
            'nonce', 'difficulty', 'transaction_count', 'block_size',
            'miner_address', 'block_reward', 'transactions', 'total_fees', 'block_time'
        ]
        read_only_fields = ['index', 'hash', 'previous_hash', 'merkle_root', 'timestamp',
                           'nonce', 'difficulty', 'transaction_count', 'block_size']
    
    def get_total_fees(self, obj):
        total_fees = obj.transactions.aggregate(
            total=models.Sum('fee')
        )['total'] or Decimal('0')
        return str(total_fees)
    
    def get_block_time(self, obj):
        if obj.index > 0:
            try:
                previous_block = Block.objects.get(index=obj.index - 1)
                time_diff = obj.timestamp - previous_block.timestamp
                return time_diff.total_seconds()
            except Block.DoesNotExist:
                pass
        return 0


class BalanceSerializer(serializers.ModelSerializer):
    """Serializer cho Balance"""
    wallet_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Balance
        fields = ['address', 'balance', 'last_updated', 'transaction_count', 'wallet_info']
        read_only_fields = ['address', 'balance', 'last_updated', 'transaction_count']
    
    def get_wallet_info(self, obj):
        try:
            wallet = Wallet.objects.get(address=obj.address)
            return {
                'created_at': wallet.created_at,
                'is_active': wallet.is_active
            }
        except Wallet.DoesNotExist:
            return None


class MiningPoolSerializer(serializers.ModelSerializer):
    """Serializer cho Mining Pool"""
    avg_block_time = serializers.SerializerMethodField()
    efficiency = serializers.SerializerMethodField()
    
    class Meta:
        model = MiningPool
        fields = [
            'miner_address', 'hash_rate', 'blocks_mined', 'total_rewards',
            'last_block_time', 'is_active', 'joined_at', 'avg_block_time', 'efficiency'
        ]
        read_only_fields = ['blocks_mined', 'total_rewards', 'last_block_time', 'joined_at']
    
    def get_avg_block_time(self, obj):
        if obj.blocks_mined > 1:
            blocks = Block.objects.filter(miner_address=obj.miner_address).order_by('timestamp')[:10]
            if len(blocks) > 1:
                total_time = (blocks.last().timestamp - blocks.first().timestamp).total_seconds()
                return total_time / (len(blocks) - 1)
        return 0
    
    def get_efficiency(self, obj):
        total_blocks = Block.objects.count()
        if total_blocks > 0:
            return (obj.blocks_mined / total_blocks) * 100
        return 0


class NetworkStatsSerializer(serializers.ModelSerializer):
    """Serializer cho Network Stats"""
    class Meta:
        model = NetworkStats
        fields = [
            'timestamp', 'total_blocks', 'total_transactions', 'total_supply',
            'circulating_supply', 'market_cap', 'price_usd', 'network_hash_rate',
            'difficulty', 'avg_block_time', 'pending_transactions', 'active_addresses'
        ]
        read_only_fields = '__all__'


class StakingPoolSerializer(serializers.ModelSerializer):
    """Serializer cho Staking Pool"""
    delegations = serializers.SerializerMethodField()
    roi = serializers.SerializerMethodField()
    
    class Meta:
        model = StakingPool
        fields = [
            'validator_address', 'staked_amount', 'delegated_amount', 'total_amount',
            'commission_rate', 'status', 'blocks_validated', 'total_rewards',
            'slashing_count', 'created_at', 'last_active', 'delegations', 'roi'
        ]
        read_only_fields = ['blocks_validated', 'total_rewards', 'slashing_count', 'created_at']
    
    def get_delegations(self, obj):
        return obj.delegations.count()
    
    def get_roi(self, obj):
        if obj.total_amount > 0:
            # Calculate annual ROI based on rewards earned
            return (obj.total_rewards / obj.total_amount) * 100
        return 0


class DelegationSerializer(serializers.ModelSerializer):
    """Serializer cho Delegation"""
    validator_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Delegation
        fields = [
            'delegator_address', 'validator', 'amount', 'rewards_earned',
            'created_at', 'is_active', 'validator_info'
        ]
        read_only_fields = ['rewards_earned', 'created_at']
    
    def get_validator_info(self, obj):
        return {
            'validator_address': obj.validator.validator_address,
            'commission_rate': obj.validator.commission_rate,
            'status': obj.validator.status
        }


class CreateWalletSerializer(serializers.Serializer):
    """Serializer để tạo ví mới"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data


class ImportWalletSerializer(serializers.Serializer):
    """Serializer để import ví"""
    private_key = serializers.CharField(write_only=True, required=False)
    mnemonic = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, data):
        if not data.get('private_key') and not data.get('mnemonic'):
            raise serializers.ValidationError("Either private_key or mnemonic is required")
        if data.get('private_key') and data.get('mnemonic'):
            raise serializers.ValidationError("Provide either private_key or mnemonic, not both")
        return data


class SendTransactionSerializer(serializers.Serializer):
    """Serializer để gửi giao dịch"""
    from_address = serializers.CharField()
    to_address = serializers.CharField()
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0.00000001'))
    fee = serializers.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0.001'))
    private_key = serializers.CharField(write_only=True)
    data = serializers.CharField(required=False, default="")
    message = serializers.CharField(required=False, default="")  # Tin nhắn kèm theo giao dịch
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def validate_fee(self, value):
        if value < 0:
            raise serializers.ValidationError("Fee cannot be negative")
        return value


class MineBlockSerializer(serializers.Serializer):
    """Serializer để mine block"""
    miner_address = serializers.CharField()
    
    def validate_miner_address(self, value):
        # Validate address format
        if len(value) < 26 or len(value) > 35:
            raise serializers.ValidationError("Invalid address format")
        return value


class TransactionNotificationSerializer(serializers.ModelSerializer):
    """Serializer cho thông báo giao dịch"""
    transaction = TransactionSerializer(read_only=True)
    
    class Meta:
        model = TransactionNotification
        fields = [
            'id', 'transaction', 'transaction_id', 'recipient_address', 'sender_address',
            'notification_type', 'status', 'amount', 'message', 
            'created_at', 'read_at', 'responded_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at']


class TransactionConfirmationSerializer(serializers.ModelSerializer):
    """Serializer cho xác nhận giao dịch"""
    class Meta:
        model = TransactionConfirmation
        fields = [
            'id', 'transaction_id', 'notification_id', 'recipient_address',
            'confirmation_type', 'signature', 'message', 'confirmed_at',
            'confirmed_by_private_key'
        ]
        read_only_fields = ['id', 'confirmed_at']


class NotificationResponseSerializer(serializers.Serializer):
    """Serializer để phản hồi thông báo"""
    notification_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['accept', 'reject'])
    message = serializers.CharField(required=False, default="")
    private_key = serializers.CharField(write_only=True)  # Để ký xác nhận
