from django.contrib import admin
from .models import Wallet, Block, Transaction, Balance, MiningPool, NetworkStats, StakingPool, Delegation


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['address', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['address']
    readonly_fields = ['address', 'public_key', 'created_at', 'updated_at']
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ['encrypted_private_key', 'mnemonic_encrypted']
        return self.readonly_fields


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ['index', 'hash_short', 'timestamp', 'transaction_count', 'miner_address_short', 'block_reward']
    list_filter = ['timestamp', 'difficulty']
    search_fields = ['hash', 'miner_address']
    readonly_fields = ['index', 'hash', 'previous_hash', 'merkle_root', 'timestamp', 'nonce']
    ordering = ['-index']
    
    def hash_short(self, obj):
        return f"{obj.hash[:10]}...{obj.hash[-6:]}"
    hash_short.short_description = 'Hash'
    
    def miner_address_short(self, obj):
        if obj.miner_address:
            return f"{obj.miner_address[:10]}...{obj.miner_address[-6:]}"
        return "-"
    miner_address_short.short_description = 'Miner'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id_short', 'from_address_short', 'to_address_short', 'amount', 'fee', 'status', 'timestamp']
    list_filter = ['status', 'transaction_type', 'timestamp']
    search_fields = ['transaction_id', 'from_address', 'to_address']
    readonly_fields = ['transaction_id', 'signature', 'timestamp']
    ordering = ['-timestamp']
    
    def transaction_id_short(self, obj):
        return f"{obj.transaction_id[:10]}...{obj.transaction_id[-6:]}"
    transaction_id_short.short_description = 'Transaction ID'
    
    def from_address_short(self, obj):
        if obj.from_address == "0":
            return "Mining Reward"
        return f"{obj.from_address[:10]}...{obj.from_address[-6:]}"
    from_address_short.short_description = 'From'
    
    def to_address_short(self, obj):
        return f"{obj.to_address[:10]}...{obj.to_address[-6:]}"
    to_address_short.short_description = 'To'


@admin.register(Balance)
class BalanceAdmin(admin.ModelAdmin):
    list_display = ['address_short', 'balance', 'transaction_count', 'last_updated']
    list_filter = ['last_updated']
    search_fields = ['address']
    readonly_fields = ['address', 'last_updated']
    ordering = ['-balance']
    
    def address_short(self, obj):
        return f"{obj.address[:10]}...{obj.address[-6:]}"
    address_short.short_description = 'Address'


@admin.register(MiningPool)
class MiningPoolAdmin(admin.ModelAdmin):
    list_display = ['miner_address_short', 'hash_rate', 'blocks_mined', 'total_rewards', 'is_active', 'last_block_time']
    list_filter = ['is_active', 'joined_at']
    search_fields = ['miner_address']
    readonly_fields = ['joined_at', 'last_block_time']
    ordering = ['-hash_rate']
    
    def miner_address_short(self, obj):
        return f"{obj.miner_address[:10]}...{obj.miner_address[-6:]}"
    miner_address_short.short_description = 'Miner Address'


@admin.register(NetworkStats)
class NetworkStatsAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'total_blocks', 'total_transactions', 'total_supply', 'difficulty', 'avg_block_time']
    list_filter = ['timestamp']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']


@admin.register(StakingPool)
class StakingPoolAdmin(admin.ModelAdmin):
    list_display = ['validator_address_short', 'total_amount', 'commission_rate', 'status', 'blocks_validated', 'total_rewards']
    list_filter = ['status', 'created_at']
    search_fields = ['validator_address']
    readonly_fields = ['blocks_validated', 'total_rewards', 'slashing_count', 'created_at', 'last_active']
    ordering = ['-total_amount']
    
    def validator_address_short(self, obj):
        return f"{obj.validator_address[:10]}...{obj.validator_address[-6:]}"
    validator_address_short.short_description = 'Validator Address'


@admin.register(Delegation)
class DelegationAdmin(admin.ModelAdmin):
    list_display = ['delegator_address_short', 'validator_address_short', 'amount', 'rewards_earned', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['delegator_address', 'validator__validator_address']
    readonly_fields = ['rewards_earned', 'created_at']
    ordering = ['-amount']
    
    def delegator_address_short(self, obj):
        return f"{obj.delegator_address[:10]}...{obj.delegator_address[-6:]}"
    delegator_address_short.short_description = 'Delegator'
    
    def validator_address_short(self, obj):
        return f"{obj.validator.validator_address[:10]}...{obj.validator.validator_address[-6:]}"
    validator_address_short.short_description = 'Validator'
