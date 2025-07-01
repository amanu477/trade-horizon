import qrcode
import base64
from io import BytesIO


def generate_qr_code_base64(data, fill_color="black", back_color="white"):
    """
    Generate a QR code and return it as a base64 encoded string
    
    Args:
        data (str): The data to encode in the QR code
        fill_color (str): Color of the QR code pattern
        back_color (str): Background color of the QR code
    
    Returns:
        str: Base64 encoded image data URL
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create QR code image
    img = qr.make_image(fill_color=fill_color, back_color=back_color)
    
    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def generate_crypto_qr_code(crypto_address, amount=None):
    """
    Generate QR code for cryptocurrency payments
    
    Args:
        crypto_address (str): The cryptocurrency wallet address
        amount (float, optional): Payment amount to include
    
    Returns:
        str: Base64 encoded QR code image
    """
    if amount:
        # For Bitcoin and compatible cryptocurrencies
        qr_data = f"bitcoin:{crypto_address}?amount={amount}"
    else:
        # Just the address for manual amount entry
        qr_data = crypto_address
    
    return generate_qr_code_base64(qr_data)