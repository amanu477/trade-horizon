from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField, DecimalField, SelectField, IntegerField, BooleanField
from wtforms.validators import DataRequired, Email, Length, EqualTo, NumberRange, ValidationError
from models import User

class LoginForm(FlaskForm):
    email = EmailField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[
        DataRequired(), 
        Length(min=3, max=20, message="Username must be between 3 and 20 characters")
    ])
    email = EmailField('Email', validators=[DataRequired(), Email()])
    first_name = StringField('First Name', validators=[Length(max=50)])
    last_name = StringField('Last Name', validators=[Length(max=50)])
    password = PasswordField('Password', validators=[
        DataRequired(), 
        Length(min=6, message="Password must be at least 6 characters long")
    ])
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(), 
        EqualTo('password', message="Passwords must match")
    ])
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already exists. Choose a different one.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Choose a different one.')

class TradeForm(FlaskForm):
    asset = SelectField('Asset', choices=[
        ('EURUSD', 'EUR/USD'),
        ('GBPUSD', 'GBP/USD'),
        ('USDJPY', 'USD/JPY'),
        ('BTCUSD', 'BTC/USD'),
        ('ETHUSD', 'ETH/USD'),
        ('XAUUSD', 'Gold/USD'),
        ('CRUDE', 'Crude Oil')
    ], validators=[DataRequired()])
    
    trade_type = SelectField('Direction', choices=[
        ('call', 'Call (Higher)'),
        ('put', 'Put (Lower)')
    ], validators=[DataRequired()])
    
    amount = DecimalField('Investment Amount', validators=[
        DataRequired(), 
        NumberRange(min=1, max=10000, message="Amount must be between $1 and $10,000")
    ])
    
    expiry_minutes = SelectField('Expiry Time', choices=[
        ('1', '1 Minute'),
        ('5', '5 Minutes'),
        ('15', '15 Minutes'),
        ('30', '30 Minutes'),
        ('60', '1 Hour'),
        ('240', '4 Hours'),
        ('1440', '1 Day')
    ], validators=[DataRequired()])

class StakingForm(FlaskForm):
    amount = DecimalField('Staking Amount', validators=[
        DataRequired(), 
        NumberRange(min=100, max=50000, message="Amount must be between $100 and $50,000")
    ])
    
    duration = SelectField('Duration', choices=[
        ('7', '7 Days - 8% APY'),
        ('30', '30 Days - 12% APY'),
        ('90', '90 Days - 18% APY'),
        ('180', '180 Days - 25% APY')
    ], validators=[DataRequired()])

class WithdrawForm(FlaskForm):
    amount = DecimalField('Withdrawal Amount', validators=[
        DataRequired(), 
        NumberRange(min=10, message="Minimum withdrawal is $10")
    ])
    
    method = SelectField('Withdrawal Method', choices=[
        ('bank', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('crypto', 'Cryptocurrency')
    ], validators=[DataRequired()])

class DepositForm(FlaskForm):
    amount = DecimalField('Deposit Amount', validators=[
        DataRequired(), 
        NumberRange(min=10, max=100000, message="Amount must be between $10 and $100,000")
    ])
    
    method = SelectField('Deposit Method', choices=[
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('crypto', 'Cryptocurrency')
    ], validators=[DataRequired()])

class AdminUserForm(FlaskForm):
    is_active = BooleanField('Active')
    is_admin = BooleanField('Admin')
    balance_adjustment = DecimalField('Balance Adjustment', default=0.00)
