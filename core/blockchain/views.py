from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction, models
from django.core.cache import cache
from django.utils import timezone
from decimal import Decimal
import json

from .models import Wallet, Block, Transaction, Balance, MiningPool, NetworkStats, StakingPool, TransactionNotification, TransactionConfirmation
from .serializers import (
    WalletSerializer, TransactionSerializer, BlockSerializer, BalanceSerializer,
    NetworkStatsSerializer, CreateWalletSerializer, ImportWalletSerializer,
    SendTransactionSerializer, MineBlockSerializer, MiningPoolSerializer, StakingPoolSerializer,
    TransactionNotificationSerializer, TransactionConfirmationSerializer, NotificationResponseSerializer
)
from .blockchain import Wallet as BlockchainWallet, Transaction as BlockchainTransaction, blockchain_instance
from .utils import encrypt_data, decrypt_data, generate_wallet_from_mnemonic


class WalletCreateView(APIView):
    """API để tạo ví mới"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = CreateWalletSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Tạo ví mới
                wallet = BlockchainWallet()
                private_key, public_key, address = wallet.generate_keys()
                mnemonic = wallet.generate_mnemonic()
                
                # Mã hóa private key và mnemonic
                encrypted_private_key = encrypt_data(private_key, serializer.validated_data['password'])
                encrypted_mnemonic = encrypt_data(mnemonic, serializer.validated_data['password'])
                
                # Lưu vào database
                wallet_obj = Wallet.objects.create(
                    address=address,
                    encrypted_private_key=encrypted_private_key,
                    public_key=public_key,
                    mnemonic_encrypted=encrypted_mnemonic
                )
                
                # Tạo balance entry
                Balance.objects.create(address=address, balance=Decimal('0'))
                
                return Response({
                    'success': True,
                    'wallet': {
                        'address': address,
                        'public_key': public_key,
                        'mnemonic': mnemonic,  # Chỉ trả về 1 lần
                        'created_at': wallet_obj.created_at
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WalletImportView(APIView):
    """API để import ví từ private key hoặc mnemonic"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = ImportWalletSerializer(data=request.data)
        if serializer.is_valid():
            try:
                wallet = BlockchainWallet()
                
                if serializer.validated_data.get('private_key'):
                    # Import từ private key
                    if wallet.import_from_private_key(serializer.validated_data['private_key']):
                        private_key = serializer.validated_data['private_key']
                        public_key = wallet.public_key
                        address = wallet.address
                        mnemonic = ""
                    else:
                        return Response({
                            'success': False,
                            'error': 'Invalid private key'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                elif serializer.validated_data.get('mnemonic'):
                    # Import từ mnemonic
                    private_key, public_key, address = generate_wallet_from_mnemonic(
                        serializer.validated_data['mnemonic']
                    )
                    mnemonic = serializer.validated_data['mnemonic']
                
                # Kiểm tra xem ví đã tồn tại chưa
                if Wallet.objects.filter(address=address).exists():
                    return Response({
                        'success': False,
                        'error': 'Wallet already exists'
                    }, status=status.HTTP_409_CONFLICT)
                
                # Mã hóa private key và mnemonic
                encrypted_private_key = encrypt_data(private_key, serializer.validated_data['password'])
                encrypted_mnemonic = encrypt_data(mnemonic, serializer.validated_data['password'])
                
                # Lưu vào database
                wallet_obj = Wallet.objects.create(
                    address=address,
                    encrypted_private_key=encrypted_private_key,
                    public_key=public_key,
                    mnemonic_encrypted=encrypted_mnemonic
                )
                
                # Tạo balance entry nếu chưa có
                Balance.objects.get_or_create(address=address, defaults={'balance': Decimal('0')})
                
                return Response({
                    'success': True,
                    'wallet': {
                        'address': address,
                        'public_key': public_key,
                        'created_at': wallet_obj.created_at
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WalletDetailView(APIView):
    """API để xem chi tiết ví"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, address):
        try:
            wallet = Wallet.objects.get(address=address)
            balance = blockchain_instance.get_balance(address)
            transactions = blockchain_instance.get_transaction_history(address)
            
            return Response({
                'success': True,
                'wallet': {
                    'address': wallet.address,
                    'public_key': wallet.public_key,
                    'balance': str(balance),
                    'transaction_count': len(transactions),
                    'created_at': wallet.created_at,
                    'is_active': wallet.is_active
                }
            })
            
        except Wallet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Wallet not found'
            }, status=status.HTTP_404_NOT_FOUND)


class SendTransactionView(APIView):
    """API để gửi giao dịch"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SendTransactionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Tạo giao dịch
                tx = BlockchainTransaction(
                    from_address=serializer.validated_data['from_address'],
                    to_address=serializer.validated_data['to_address'],
                    amount=serializer.validated_data['amount'],
                    fee=serializer.validated_data['fee'],
                    data=serializer.validated_data.get('data', '')
                )
                
                # Ký giao dịch
                tx.sign_transaction(serializer.validated_data['private_key'])
                
                # Thêm vào blockchain
                if blockchain_instance.add_transaction(tx):
                    # Lưu giao dịch vào database với trạng thái pending_notification
                    transaction_obj = Transaction.objects.create(
                        transaction_id=tx.transaction_id,
                        from_address=tx.from_address,
                        to_address=tx.to_address,
                        amount=tx.amount,
                        fee=tx.fee,
                        signature=tx.signature,
                        data=tx.data,
                        timestamp=timezone.now(),
                        status='pending_notification'
                    )
                    
                    # Tạo thông báo cho người nhận
                    from datetime import timedelta
                    expires_at = timezone.now() + timedelta(hours=24)  # 24h để xác nhận
                    
                    from .models import TransactionNotification
                    notification = TransactionNotification.objects.create(
                        transaction=transaction_obj,
                        recipient_address=tx.to_address,
                        sender_address=tx.from_address,
                        notification_type='incoming_transfer',
                        amount=tx.amount,
                        message=serializer.validated_data.get('message', ''),
                        expires_at=expires_at
                    )
                    
                    return Response({
                        'success': True,
                        'transaction_id': tx.transaction_id,
                        'status': 'pending_notification',
                        'notification_id': notification.id,
                        'message': 'Transaction created. Waiting for recipient confirmation.',
                        'expires_at': expires_at.isoformat()
                    })
                else:
                    # Better error reporting for debugging
                    error_msg = 'Transaction validation failed'
                    
                    # Check if transaction is valid
                    if not tx.is_valid():
                        error_msg += ' - Invalid signature or missing public key'
                    
                    # Check balance
                    if tx.from_address != "0":
                        balance = blockchain_instance.get_balance(tx.from_address)
                        required = tx.amount + tx.fee
                        if balance < required:
                            error_msg += f' - Insufficient balance (have: {balance}, need: {required})'
                    
                    return Response({
                        'success': False,
                        'error': error_msg
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except Exception as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransactionDetailView(APIView):
    """API để xem chi tiết giao dịch"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, tx_id):
        try:
            transaction = Transaction.objects.get(transaction_id=tx_id)
            serializer = TransactionSerializer(transaction)
            return Response({
                'success': True,
                'transaction': serializer.data
            })
        except Transaction.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)


class TransactionHistoryView(APIView):
    """API để xem lịch sử giao dịch của một address"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, address):
        transactions = Transaction.objects.filter(
            models.Q(from_address=address) | models.Q(to_address=address)
        ).order_by('-timestamp')
        
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        start = (page - 1) * limit
        end = start + limit
        
        paginated_transactions = transactions[start:end]
        serializer = TransactionSerializer(paginated_transactions, many=True)
        
        return Response({
            'success': True,
            'transactions': serializer.data,
            'total': transactions.count(),
            'page': page,
            'limit': limit
        })


class TransactionListView(APIView):
    """API để xem danh sách tất cả giao dịch (cho explorer)"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Lấy tất cả giao dịch, sắp xếp theo thời gian mới nhất
        transactions = Transaction.objects.all().order_by('-timestamp')
        
        # Pagination
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        start = (page - 1) * limit
        end = start + limit
        
        paginated_transactions = transactions[start:end]
        serializer = TransactionSerializer(paginated_transactions, many=True)
        
        return Response({
            'success': True,
            'transactions': serializer.data,
            'total': transactions.count(),
            'page': page,
            'limit': limit
        })


class MineBlockView(APIView):
    """API để mine block"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = MineBlockSerializer(data=request.data)
        if serializer.is_valid():
            try:
                miner_address = serializer.validated_data['miner_address']
                
                # Get the correct next block index from database
                latest_block = Block.objects.order_by('-index').first()
                next_index = (latest_block.index + 1) if latest_block else 0
                
                # Mine block with correct index
                block = blockchain_instance.mine_pending_transactions(miner_address)
                # Override the index with the correct one from database
                block.index = next_index
                
                # Lưu block vào database
                with transaction.atomic():
                    block_obj = Block.objects.create(
                        index=block.index,
                        hash=block.hash,
                        previous_hash=block.previous_hash,
                        merkle_root=block.merkle_root,
                        timestamp=timezone.now(),
                        nonce=block.nonce,
                        difficulty=blockchain_instance.difficulty,
                        transaction_count=len(block.transactions),
                        miner_address=miner_address,
                        block_reward=blockchain_instance.mining_reward
                    )
                    
                    # Cập nhật transactions
                    for tx in block.transactions:
                        Transaction.objects.filter(transaction_id=tx.transaction_id).update(
                            block=block_obj,
                            status='confirmed'
                        )
                    
                    # Cập nhật balances
                    for address, balance in blockchain_instance.balances.items():
                        Balance.objects.update_or_create(
                            address=address,
                            defaults={'balance': balance}
                        )
                    
                    # Cập nhật mining pool
                    mining_pool, created = MiningPool.objects.get_or_create(
                        miner_address=miner_address,
                        defaults={'blocks_mined': 0, 'total_rewards': Decimal('0')}
                    )
                    mining_pool.blocks_mined += 1
                    mining_pool.total_rewards += blockchain_instance.mining_reward
                    mining_pool.last_block_time = timezone.now()
                    mining_pool.save()
                
                return Response({
                    'success': True,
                    'block': {
                        'index': block.index,
                        'hash': block.hash,
                        'transaction_count': len(block.transactions),
                        'miner_address': miner_address,
                        'reward': str(blockchain_instance.mining_reward)
                    }
                })
                
            except Exception as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BlockDetailView(APIView):
    """API để xem chi tiết block"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, block_id):
        try:
            # Có thể tìm theo index hoặc hash
            if block_id.isdigit():
                block = Block.objects.get(index=int(block_id))
            else:
                block = Block.objects.get(hash=block_id)
                
            serializer = BlockSerializer(block)
            return Response({
                'success': True,
                'block': serializer.data
            })
        except Block.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Block not found'
            }, status=status.HTTP_404_NOT_FOUND)


class BlockListView(APIView):
    """API để xem danh sách blocks"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        
        blocks = Block.objects.all().order_by('-index')
        start = (page - 1) * limit
        end = start + limit
        
        paginated_blocks = blocks[start:end]
        serializer = BlockSerializer(paginated_blocks, many=True)
        
        return Response({
            'success': True,
            'blocks': serializer.data,
            'total': blocks.count(),
            'page': page,
            'limit': limit
        })


class NetworkStatsView(APIView):
    """API để xem thống kê mạng"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Cache stats for 30 seconds
        cache_key = 'network_stats'
        stats = cache.get(cache_key)
        
        if not stats:
            total_blocks = Block.objects.count()
            total_transactions = Transaction.objects.count()
            total_supply = sum(blockchain_instance.balances.values()) if blockchain_instance.balances else Decimal('0')
            pending_transactions = Transaction.objects.filter(status='pending').count()
            active_addresses = Balance.objects.filter(balance__gt=0).count()
            
            # Tính avg block time
            recent_blocks = list(Block.objects.order_by('-index')[:10])
            avg_block_time = 0
            if len(recent_blocks) > 1:
                time_diff = recent_blocks[0].timestamp - recent_blocks[-1].timestamp
                avg_block_time = time_diff.total_seconds() / (len(recent_blocks) - 1)
            
            stats = {
                'total_blocks': total_blocks,
                'total_transactions': total_transactions,
                'total_supply': str(total_supply),
                'circulating_supply': str(total_supply),
                'difficulty': blockchain_instance.difficulty,
                'avg_block_time': avg_block_time,
                'pending_transactions': pending_transactions,
                'active_addresses': active_addresses,
                'mining_reward': str(blockchain_instance.mining_reward),
                'network_hash_rate': MiningPool.objects.aggregate(
                    total_hash_rate=models.Sum('hash_rate')
                )['total_hash_rate'] or 0
            }
            
            cache.set(cache_key, stats, 30)
        
        return Response({
            'success': True,
            'stats': stats
        })


class MiningPoolView(APIView):
    """API để xem thống kê mining pools"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        pools = MiningPool.objects.filter(is_active=True).order_by('-hash_rate')
        serializer = MiningPoolSerializer(pools, many=True)
        
        return Response({
            'success': True,
            'mining_pools': serializer.data
        })


class BalanceView(APIView):
    """API để xem số dư"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, address):
        # Get balance from database first for most accurate info
        try:
            balance_obj = Balance.objects.get(address=address)
            balance = balance_obj.balance
        except Balance.DoesNotExist:
            # Fallback to blockchain calculation
            balance = blockchain_instance.get_balance(address)
            # Create balance entry in database
            Balance.objects.create(address=address, balance=balance)
        
        transactions = blockchain_instance.get_transaction_history(address)
        
        return Response({
            'success': True,
            'address': address,
            'balance': str(balance),
            'transaction_count': len(transactions)
        })


# API Views cho Proof of Stake
class StakingPoolView(APIView):
    """API để xem các staking pools"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        pools = StakingPool.objects.filter(status='active').order_by('-total_amount')
        serializer = StakingPoolSerializer(pools, many=True)
        
        return Response({
            'success': True,
            'staking_pools': serializer.data
        })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_view(request):
    """API tìm kiếm universal (address, tx, block)"""
    query = request.GET.get('q', '').strip()
    
    if not query:
        return Response({
            'success': False,
            'error': 'Query parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    results = {}
    
    # Tìm address
    if Wallet.objects.filter(address=query).exists():
        results['type'] = 'address'
        results['address'] = query
        results['balance'] = str(blockchain_instance.get_balance(query))
    
    # Tìm transaction
    elif Transaction.objects.filter(transaction_id=query).exists():
        results['type'] = 'transaction'
        results['transaction_id'] = query
    
    # Tìm block (by hash)
    elif Block.objects.filter(hash=query).exists():
        results['type'] = 'block'
        results['block_hash'] = query
    
    # Tìm block (by index)
    elif query.isdigit() and Block.objects.filter(index=int(query)).exists():
        results['type'] = 'block'
        results['block_index'] = int(query)
    
    else:
        return Response({
            'success': False,
            'error': 'Not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        'success': True,
        'results': results
    })


class WalletUnlockView(APIView):
    """API để unlock ví và lấy private key với password"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, address):
        try:
            wallet = Wallet.objects.get(address=address)
            password = request.data.get('password')
            
            if not password:
                return Response({
                    'success': False,
                    'error': 'Password is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Giải mã private key
                private_key = decrypt_data(wallet.encrypted_private_key, password)
                
                # Giải mã mnemonic nếu có
                mnemonic = ""
                if wallet.mnemonic_encrypted:
                    try:
                        mnemonic = decrypt_data(wallet.mnemonic_encrypted, password)
                    except:
                        pass  # Mnemonic có thể không có hoặc không giải mã được
                
                return Response({
                    'success': True,
                    'wallet': {
                        'address': wallet.address,
                        'public_key': wallet.public_key,
                        'private_key': private_key,
                        'mnemonic': mnemonic,
                        'created_at': wallet.created_at
                    }
                })
                
            except Exception as decrypt_error:
                return Response({
                    'success': False,
                    'error': 'Invalid password'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Wallet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Wallet not found'
            }, status=status.HTTP_404_NOT_FOUND)


class WalletAccessWithMnemonicView(APIView):
    """API để access ví bằng mnemonic và password"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        mnemonic = request.data.get('mnemonic')
        password = request.data.get('password')
        
        if not mnemonic or not password:
            return Response({
                'success': False,
                'error': 'Mnemonic and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Tạo address từ mnemonic
            private_key, public_key, address = generate_wallet_from_mnemonic(mnemonic)
            
            # Tìm wallet trong database
            try:
                wallet = Wallet.objects.get(address=address)
            except Wallet.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Wallet not found. Please make sure you created this wallet before.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Thử giải mã để kiểm tra password
            try:
                stored_private_key = decrypt_data(wallet.encrypted_private_key, password)
                stored_mnemonic = ""
                if wallet.mnemonic_encrypted:
                    stored_mnemonic = decrypt_data(wallet.mnemonic_encrypted, password)
                
                return Response({
                    'success': True,
                    'wallet': {
                        'address': wallet.address,
                        'public_key': wallet.public_key,
                        'private_key': stored_private_key,
                        'mnemonic': stored_mnemonic,
                        'created_at': wallet.created_at
                    }
                })
                
            except Exception:
                return Response({
                    'success': False,
                    'error': 'Invalid password'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AutoMineView(APIView):
    """API để tự động mine các giao dịch pending"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            # Kiểm tra xem có giao dịch pending không
            pending_count = Transaction.objects.filter(status='pending').count()
            
            if pending_count == 0:
                return Response({
                    'success': True,
                    'message': 'No pending transactions to mine'
                })
            
            # Sử dụng miner address mặc định hoặc từ request
            miner_address = request.data.get('miner_address', '1H4hdDrAhjer8e1BwGxG4qk9YtWZZFLvds')
            
            # Get the correct next block index from database
            latest_block = Block.objects.order_by('-index').first()
            next_index = (latest_block.index + 1) if latest_block else 0
            
            # Mine block with correct index
            block = blockchain_instance.mine_pending_transactions(miner_address)
            # Override the index with the correct one from database
            block.index = next_index
            
            # Lưu block vào database
            with transaction.atomic():
                block_obj = Block.objects.create(
                    index=block.index,
                    hash=block.hash,
                    previous_hash=block.previous_hash,
                    merkle_root=block.merkle_root,
                    timestamp=timezone.now(),
                    nonce=block.nonce,
                    difficulty=blockchain_instance.difficulty,
                    transaction_count=len(block.transactions),
                    miner_address=miner_address,
                    block_reward=blockchain_instance.mining_reward
                )
                
                # Cập nhật transactions
                for tx in block.transactions:
                    Transaction.objects.filter(transaction_id=tx.transaction_id).update(
                        block=block_obj,
                        status='confirmed'
                    )
                
                # Cập nhật balances
                for address, balance in blockchain_instance.balances.items():
                    Balance.objects.update_or_create(
                        address=address,
                        defaults={'balance': balance}
                    )
                
                # Cập nhật mining pool
                mining_pool, created = MiningPool.objects.get_or_create(
                    miner_address=miner_address,
                    defaults={'blocks_mined': 0, 'total_rewards': Decimal('0')}
                )
                mining_pool.blocks_mined += 1
                mining_pool.total_rewards += blockchain_instance.mining_reward
                mining_pool.last_block_time = timezone.now()
                mining_pool.save()
            
            return Response({
                'success': True,
                'block': {
                    'index': block.index,
                    'hash': block.hash,
                    'transaction_count': len(block.transactions),
                    'miner_address': miner_address,
                    'reward': str(blockchain_instance.mining_reward)
                },
                'message': f'Mined block with {len(block.transactions)} transactions'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationListView(APIView):
    """API để xem danh sách thông báo của một ví"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, address):
        from .models import TransactionNotification
        from .serializers import TransactionNotificationSerializer
        
        # Get query parameters
        status_filter = request.GET.get('status', None)  # pending, accepted, rejected, expired
        
        notifications = TransactionNotification.objects.filter(
            recipient_address=address
        )
        
        # Apply status filter if provided
        if status_filter:
            notifications = notifications.filter(status=status_filter)
        
        notifications = notifications.order_by('-created_at')
        
        serializer = TransactionNotificationSerializer(notifications, many=True)
        
        return Response({
            'success': True,
            'notifications': serializer.data,
            'total': notifications.count(),
            'pending': TransactionNotification.objects.filter(
                recipient_address=address, 
                status='pending'
            ).count()
        })


class NotificationDetailView(APIView):
    """API để xem chi tiết thông báo"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, notification_id):
        try:
            from .models import TransactionNotification
            from .serializers import TransactionNotificationSerializer
            
            notification = TransactionNotification.objects.get(id=notification_id)
            
            # Đánh dấu đã đọc
            if notification.status == 'pending':
                notification.status = 'read'
                notification.read_at = timezone.now()
                notification.save()
            
            serializer = TransactionNotificationSerializer(notification)
            
            return Response({
                'success': True,
                'notification': serializer.data
            })
            
        except TransactionNotification.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)


class NotificationResponseView(APIView):
    """API để phản hồi thông báo (accept/reject)"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from .serializers import NotificationResponseSerializer
        from .models import TransactionNotification, TransactionConfirmation
        
        serializer = NotificationResponseSerializer(data=request.data)
        if serializer.is_valid():
            try:
                notification_id = serializer.validated_data['notification_id']
                action = serializer.validated_data['action']
                message = serializer.validated_data.get('message', '')
                private_key = serializer.validated_data['private_key']
                
                # Lấy notification
                notification = TransactionNotification.objects.get(id=notification_id)
                
                # Kiểm tra xem notification đã hết hạn chưa
                if timezone.now() > notification.expires_at:
                    notification.status = 'expired'
                    notification.save()
                    return Response({
                        'success': False,
                        'error': 'Notification has expired'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Kiểm tra private key có đúng với recipient address không
                from .blockchain import Wallet as BlockchainWallet
                wallet = BlockchainWallet()
                
                # Import private key and validate
                if not wallet.import_from_private_key(private_key):
                    return Response({
                        'success': False,
                        'error': 'Invalid private key format'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if private key matches recipient address
                if wallet.address != notification.recipient_address:
                    return Response({
                        'success': False,
                        'error': f'Private key does not match recipient address. Expected: {notification.recipient_address}, Got: {wallet.address}'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                # Tạo confirmation
                confirmation = TransactionConfirmation.objects.create(
                    transaction=notification.transaction,
                    notification=notification,
                    recipient_address=notification.recipient_address,
                    confirmation_type=action,
                    message=message,
                    confirmed_by_private_key=True
                )
                
                # Cập nhật trạng thái
                if action == 'accept':
                    notification.status = 'accepted'
                    notification.transaction.status = 'pending_confirmation'
                    
                    # Tự động mine để xác nhận giao dịch
                    try:
                        # Thêm transaction vào pending list của blockchain
                        from .blockchain import Transaction as BlockchainTransaction
                        blockchain_tx = BlockchainTransaction(
                            notification.transaction.from_address,
                            notification.transaction.to_address,
                            notification.transaction.amount,
                            notification.transaction.fee
                        )
                        blockchain_tx.transaction_id = notification.transaction.transaction_id
                        blockchain_tx.signature = notification.transaction.signature
                        blockchain_tx.data = notification.transaction.data
                        
                        # Thêm vào pending transactions
                        blockchain_instance.pending_transactions.append(blockchain_tx)
                        
                        # Mine block với giao dịch đã được xác nhận
                        # Mining reward should go to the recipient who confirmed the transaction
                        miner_address = notification.recipient_address
                        
                        # Get the correct next block index from database
                        latest_block = Block.objects.order_by('-index').first()
                        next_index = (latest_block.index + 1) if latest_block else 0
                        
                        # Mine block with correct index
                        block = blockchain_instance.mine_pending_transactions(miner_address)
                        block.index = next_index
                        
                        # Lưu block vào database
                        with transaction.atomic():
                            block_obj = Block.objects.create(
                                index=block.index,
                                hash=block.hash,
                                previous_hash=block.previous_hash,
                                merkle_root=block.merkle_root,
                                timestamp=timezone.now(),
                                nonce=block.nonce,
                                difficulty=blockchain_instance.difficulty,
                                transaction_count=len(block.transactions),
                                miner_address=miner_address,
                                block_reward=blockchain_instance.mining_reward
                            )
                            
                            # Cập nhật transaction status
                            notification.transaction.block = block_obj
                            notification.transaction.status = 'confirmed'
                            notification.transaction.save()
                            
                            # Manually cập nhật balances trong database
                            # Trừ từ người gửi
                            sender_balance, created = Balance.objects.get_or_create(
                                address=notification.transaction.from_address,
                                defaults={'balance': Decimal('0')}
                            )
                            sender_balance.balance -= (notification.transaction.amount + notification.transaction.fee)
                            sender_balance.save()
                            
                            # Cộng cho người nhận
                            recipient_balance, created = Balance.objects.get_or_create(
                                address=notification.transaction.to_address,
                                defaults={'balance': Decimal('0')}
                            )
                            recipient_balance.balance += notification.transaction.amount
                            recipient_balance.save()
                            
                            # Không cộng mining reward - theo logic đơn giản
                        
                        response_data = {
                            'success': True,
                            'action': action,
                            'transaction_status': 'confirmed',
                            'block_hash': block.hash,
                            'block_index': block.index,
                            'message': 'Transaction accepted and confirmed in blockchain'
                        }
                    except Exception as mine_error:
                        # Nếu mine thất bại, transaction vẫn ở trạng thái pending_confirmation
                        print(f"Auto-mine after confirmation failed: {mine_error}")
                        response_data = {
                            'success': True,
                            'action': action,
                            'transaction_status': 'pending_confirmation',
                            'message': 'Transaction accepted, will be mined soon'
                        }
                        
                else:  # reject
                    notification.status = 'rejected'
                    notification.transaction.status = 'rejected'
                    
                    # Hoàn tiền cho người gửi (không trừ phí)
                    sender_balance = Balance.objects.get_or_create(
                        address=notification.sender_address,
                        defaults={'balance': Decimal('0')}
                    )[0]
                    sender_balance.balance += notification.amount  # Không hoàn phí
                    sender_balance.save()
                    
                    response_data = {
                        'success': True,
                        'action': action,
                        'transaction_status': 'rejected',
                        'message': 'Transaction rejected and funds returned'
                    }
                
                notification.responded_at = timezone.now()
                notification.save()
                notification.transaction.save()
                
                return Response(response_data)
                
            except TransactionNotification.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Notification not found'
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)