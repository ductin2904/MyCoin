from django.urls import path
from . import views

urlpatterns = [
    # Wallet endpoints
    path('wallet/create/', views.WalletCreateView.as_view(), name='wallet_create'),
    path('wallet/import/', views.WalletImportView.as_view(), name='wallet_import'),
    path('wallet/access-mnemonic/', views.WalletAccessWithMnemonicView.as_view(), name='wallet_access_mnemonic'),
    path('wallet/<str:address>/', views.WalletDetailView.as_view(), name='wallet_detail'),
    path('wallet/<str:address>/unlock/', views.WalletUnlockView.as_view(), name='wallet_unlock'),
    path('wallet/<str:address>/balance/', views.BalanceView.as_view(), name='wallet_balance'),
    path('wallet/<str:address>/transactions/', views.TransactionHistoryView.as_view(), name='wallet_transactions'),
    
    # Transaction endpoints
    path('transactions/', views.TransactionListView.as_view(), name='transaction_list'),
    path('transaction/send/', views.SendTransactionView.as_view(), name='send_transaction'),
    path('transaction/<str:tx_id>/', views.TransactionDetailView.as_view(), name='transaction_detail'),
    
    # Block endpoints
    path('blocks/', views.BlockListView.as_view(), name='block_list'),
    path('block/<str:block_id>/', views.BlockDetailView.as_view(), name='block_detail'),
    path('mine/', views.MineBlockView.as_view(), name='mine_block'),
    path('auto-mine/', views.AutoMineView.as_view(), name='auto_mine'),
    
    # Network & Stats
    path('stats/', views.NetworkStatsView.as_view(), name='network_stats'),
    path('mining-pools/', views.MiningPoolView.as_view(), name='mining_pools'),
    path('staking-pools/', views.StakingPoolView.as_view(), name='staking_pools'),
    
    # Search
    path('search/', views.search_view, name='search'),

    # Notification endpoints
    path('notifications/<str:address>/', views.NotificationListView.as_view(), name='notification_list'),
    path('notification/<int:notification_id>/', views.NotificationDetailView.as_view(), name='notification_detail'),
    path('notification/respond/', views.NotificationResponseView.as_view(), name='notification_respond'),
]
