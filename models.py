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
    balance = db.Column(db.Numeric(15, 2), default=1000.00)  # Demo balance
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
    payout_percentage = db.Column(db.Numeric(5, 2), default=85.00)
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
            self.status = 'won'
            self.profit_loss = float(self.amount) * (float(self.payout_percentage) / 100)
        else:
            self.status = 'lost'
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
