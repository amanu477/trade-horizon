from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from app import db
import random

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)  # Admin approval status
    trade_control = db.Column(db.String(20), default='normal')  # 'normal', 'always_lose', 'always_profit'
    kyc_verified = db.Column(db.Boolean, default=False)  # KYC verification status
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    wallet = db.relationship('Wallet', backref='user', uselist=False, cascade='all, delete-orphan')
    trades = db.relationship('Trade', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    staking_positions = db.relationship('StakingPosition', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

class Wallet(db.Model):
    __tablename__ = 'wallets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    balance = db.Column(db.Numeric(15, 2), default=0.00)  # Real balance starts at $0
    demo_balance = db.Column(db.Numeric(15, 2), default=10000.00)
    total_invested = db.Column(db.Numeric(15, 2), default=0.00)
    total_withdrawn = db.Column(db.Numeric(15, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Wallet User:{self.user_id} Balance:{self.balance}>'

class Trade(db.Model):
    __tablename__ = 'trades'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    asset = db.Column(db.String(20), nullable=False)  # EUR/USD, BTC/USD, etc.
    trade_type = db.Column(db.String(10), nullable=False)  # 'call' or 'put'
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    entry_price = db.Column(db.Numeric(10, 5), nullable=False)
    exit_price = db.Column(db.Numeric(10, 5), nullable=True)
    expiry_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, won, lost, cancelled
    payout_percentage = db.Column(db.Numeric(5, 2), default=95.00)
    profit_loss = db.Column(db.Numeric(10, 2), default=0.00)
    is_demo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f'<Trade {self.asset} {self.trade_type} ${self.amount}>'
    
    def is_expired(self):
        return datetime.utcnow() > self.expiry_time
    
    def calculate_result(self, current_price):
        """Calculate trade result based on current price"""
        if self.status != 'active':
            return
        
        if not self.is_expired():
            return
        
        self.exit_price = current_price
        self.closed_at = datetime.utcnow()
        
        if self.trade_type == 'call':
            won = current_price > self.entry_price
        else:  # put
            won = current_price < self.entry_price
        
        if won:
            self.status = 'profit'
            self.profit_loss = float(self.amount) * (float(self.payout_percentage) / 100)
        else:
            self.status = 'lose'
            self.profit_loss = -float(self.amount)

class StakingPosition(db.Model):
    __tablename__ = 'staking_positions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    apy = db.Column(db.Numeric(5, 2), default=12.00)  # Annual Percentage Yield
    duration_days = db.Column(db.Integer, default=30)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, completed, cancelled
    rewards_earned = db.Column(db.Numeric(10, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super(StakingPosition, self).__init__(**kwargs)
        if not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.duration_days)
    
    def calculate_rewards(self):
        """Calculate current rewards based on time elapsed"""
        if self.status != 'active':
            return self.rewards_earned
        
        now = datetime.utcnow()
        if now >= self.end_date:
            # Full rewards
            daily_rate = float(self.apy) / 365 / 100
            total_rewards = float(self.amount) * daily_rate * self.duration_days
        else:
            # Partial rewards
            days_elapsed = (now - self.start_date).days
            daily_rate = float(self.apy) / 365 / 100
            total_rewards = float(self.amount) * daily_rate * days_elapsed
        
        return round(total_rewards, 2)
    
    def is_completed(self):
        return datetime.utcnow() >= self.end_date

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # deposit, withdrawal, trade, staking
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='transactions')
    
    def __repr__(self):
        return f'<Transaction {self.transaction_type} ${self.amount}>'

class MarketData(db.Model):
    __tablename__ = 'market_data'
    
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False)
    price = db.Column(db.Numeric(10, 5), nullable=False)
    change_24h = db.Column(db.Numeric(5, 2), default=0.00)
    volume_24h = db.Column(db.Numeric(15, 2), default=0.00)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<MarketData {self.symbol}: ${self.price}>'

class DepositRequest(db.Model):
    __tablename__ = 'deposit_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False)  # USDT, BTC, ETH
    transaction_hash = db.Column(db.String(100), nullable=True)
    proof_document = db.Column(db.String(255), nullable=True)  # File path
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='deposit_requests')
    processed_by_admin = db.relationship('User', foreign_keys=[processed_by])
    
    def __repr__(self):
        return f'<DepositRequest {self.user.username}: {self.amount} {self.currency}>'

class WithdrawalRequest(db.Model):
    __tablename__ = 'withdrawal_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False)  # USDT, BTC, ETH
    wallet_address = db.Column(db.String(255), nullable=False)  # User's withdrawal address
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='withdrawal_requests')
    processed_by_admin = db.relationship('User', foreign_keys=[processed_by])
    
    def __repr__(self):
        return f'<WithdrawalRequest {self.user.username}: ${self.amount} {self.currency}>'

class KYCRequest(db.Model):
    __tablename__ = 'kyc_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    id_document_type = db.Column(db.String(50), nullable=False)  # passport, driver_license, national_id
    id_document_path = db.Column(db.String(255), nullable=False)
    selfie_path = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='kyc_requests')
    processed_by_admin = db.relationship('User', foreign_keys=[processed_by])
    
    def __repr__(self):
        return f'<KYCRequest {self.user.username} - {self.status}>'

class AdminSettings(db.Model):
    __tablename__ = 'admin_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(50), unique=True, nullable=False)
    setting_value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def __repr__(self):
        return f'<AdminSettings {self.setting_key}: {self.setting_value}>'

class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='open')  # open, in_progress, closed
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='support_tickets')
    messages = db.relationship('SupportMessage', backref='ticket', lazy='dynamic', cascade='all, delete-orphan')
    
    def get_last_message(self):
        return self.messages.order_by(SupportMessage.created_at.desc()).first()
    
    def get_unread_count_for_admin(self):
        return self.messages.filter_by(is_from_user=True, read_by_admin=False).count()

class SupportMessage(db.Model):
    __tablename__ = 'support_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_tickets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    message = db.Column(db.Text, nullable=False)
    is_from_user = db.Column(db.Boolean, default=True)
    read_by_admin = db.Column(db.Boolean, default=False)
    read_by_user = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='support_messages')
