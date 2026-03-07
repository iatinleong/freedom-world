import crypto from 'crypto';

// Ensure environment variables are loaded
const HASH_KEY = process.env.NEWEBPAY_HASH_KEY || '';
const HASH_IV = process.env.NEWEBPAY_HASH_IV || '';
const MERCHANT_ID = process.env.NEWEBPAY_MERCHANT_ID || '';

/**
 * Creates the NewebPay TradeInfo AES-256-CBC encrypted string.
 * @param tradeInfo Object containing trade parameters
 * @returns Encrypted string in hex format
 */
export function encryptTradeInfo(tradeInfo: Record<string, any>): string {
    // 1. Build query string (form-urlencoded)
    const queryString = new URLSearchParams(
        Object.entries(tradeInfo).map(([key, value]) => [key, String(value)])
    ).toString();

    // 2. Encrypt with AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', HASH_KEY, HASH_IV);
    // NewebPay requires PKCS7 padding, which is the default in Node.js crypto
    let encrypted = cipher.update(queryString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

/**
 * Creates the NewebPay TradeSha string.
 * @param encryptedTradeInfo The hex string from encryptTradeInfo
 * @returns Uppercase SHA-256 hash string
 */
export function createTradeSha(encryptedTradeInfo: string): string {
    const hashString = `HashKey=${HASH_KEY}&${encryptedTradeInfo}&HashIV=${HASH_IV}`;
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');
    return hash.toUpperCase();
}

/**
 * Decrypts the NewebPay TradeInfo string received from NotifyURL/ReturnURL.
 * @param encryptedTradeInfo The hex string received from NewebPay
 * @returns Decrypted object
 */
export function decryptTradeInfo(encryptedTradeInfo: string): Record<string, any> {
    const decipher = crypto.createDecipheriv('aes-256-cbc', HASH_KEY, HASH_IV);
    
    // Disable auto padding to manually handle NewebPay's specific padding if needed, 
    // but usually auto padding works fine. Let's try with default auto padding first.
    let decrypted = decipher.update(encryptedTradeInfo, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse the query string back into an object
    const params = new URLSearchParams(decrypted);
    const result: Record<string, any> = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    
    // In Notify JSON response, Result might be a JSON string itself
    if (result.Result && typeof result.Result === 'string' && result.Result.startsWith('{')) {
        try {
            result.Result = JSON.parse(result.Result);
        } catch (e) {
            // keep as string if parsing fails
        }
    }

    return result;
}

/**
 * Validates if the required NewebPay environment variables are set.
 */
export function checkNewebPayConfig(): boolean {
    if (!HASH_KEY || !HASH_IV || !MERCHANT_ID) {
        console.error('Missing NewebPay environment variables (HASH_KEY, HASH_IV, MERCHANT_ID)');
        return false;
    }
    return true;
}

export function getMerchantId(): string {
    return MERCHANT_ID;
}
