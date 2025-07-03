from django.core.management.base import BaseCommand
from django.utils import timezone
from blockchain.blockchain import blockchain_instance, Wallet as BlockchainWallet
from blockchain.models import Block, Transaction, Balance, NetworkStats
from decimal import Decimal
import json


class Command(BaseCommand):
    help = 'Initialize MyCoin blockchain with genesis block'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset blockchain and start fresh',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(
                self.style.WARNING('Resetting blockchain...')
            )
            # Clear existing data
            Block.objects.all().delete()
            Transaction.objects.all().delete()
            Balance.objects.all().delete()
            
            # Reset blockchain instance
            blockchain_instance.chain = [blockchain_instance.create_genesis_block()]
            blockchain_instance.pending_transactions = []
            blockchain_instance.balances = {}

        # Check if genesis block exists
        if Block.objects.filter(index=0).exists():
            self.stdout.write(
                self.style.SUCCESS('Genesis block already exists')
            )
            return

        self.stdout.write('Initializing MyCoin blockchain...')

        # Create genesis block in database
        genesis_block = blockchain_instance.chain[0]
        
        block_obj = Block.objects.create(
            index=genesis_block.index,
            hash=genesis_block.hash,
            previous_hash=genesis_block.previous_hash,
            merkle_root=genesis_block.merkle_root,
            timestamp=timezone.now(),
            nonce=genesis_block.nonce,
            difficulty=blockchain_instance.difficulty,
            transaction_count=len(genesis_block.transactions),
            miner_address="genesis",
            block_reward=Decimal('0')
        )

        # Create genesis transaction
        genesis_tx = genesis_block.transactions[0]
        Transaction.objects.create(
            transaction_id=genesis_tx.transaction_id,
            block=block_obj,
            from_address=genesis_tx.from_address,
            to_address=genesis_tx.to_address,
            amount=genesis_tx.amount,
            fee=genesis_tx.fee,
            transaction_type='mining',
            status='confirmed',
            signature=genesis_tx.signature,
            data=genesis_tx.data,
            timestamp=timezone.now()
        )

        # Create genesis balance
        Balance.objects.create(
            address="genesis",
            balance=Decimal('1000000')
        )

        # Create initial network stats
        NetworkStats.objects.create(
            total_blocks=1,
            total_transactions=1,
            total_supply=Decimal('1000000'),
            circulating_supply=Decimal('1000000'),
            difficulty=blockchain_instance.difficulty,
            avg_block_time=0,
            pending_transactions=0,
            active_addresses=1
        )

        self.stdout.write(
            self.style.SUCCESS('MyCoin blockchain initialized successfully!')
        )
        self.stdout.write(f'Genesis block hash: {genesis_block.hash}')
        self.stdout.write(f'Initial supply: 1,000,000 MYC')
        
        # Create some demo wallets for testing
        self.stdout.write('\nCreating demo wallets...')
        
        for i in range(3):
            wallet = BlockchainWallet()
            private_key, public_key, address = wallet.generate_keys()
            
            # Give some initial balance for testing
            initial_balance = Decimal('1000') * (i + 1)
            Balance.objects.create(
                address=address,
                balance=initial_balance
            )
            
            blockchain_instance.balances[address] = initial_balance
            
            self.stdout.write(f'Demo wallet {i+1}:')
            self.stdout.write(f'  Address: {address}')
            self.stdout.write(f'  Balance: {initial_balance} MYC')
            self.stdout.write(f'  Private Key: {private_key}')
            self.stdout.write('')

        self.stdout.write(
            self.style.SUCCESS('Demo wallets created successfully!')
        )
        self.stdout.write(
            self.style.WARNING(
                'Note: Private keys are shown for testing purposes only. '
                'In production, never expose private keys!'
            )
        )
