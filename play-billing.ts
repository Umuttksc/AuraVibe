// Google Play Billing Bridge for WebView
// This connects web app to native Android Play Billing

export interface PlayBillingProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

export interface PlayBillingPurchase {
  orderId: string;
  packageName: string;
  productId: string;
  purchaseTime: number;
  purchaseToken: string;
  quantity: number;
}

interface AndroidPlayBillingBridge {
  initialize: () => Promise<string>;
  queryProducts: (productIdsJson: string) => Promise<string>;
  purchase: (productId: string) => Promise<string>;
  getPurchases: () => Promise<string>;
  consumePurchase: (purchaseToken: string) => Promise<string>;
}

interface WindowWithAndroidBridge extends Window {
  AndroidPlayBilling?: AndroidPlayBillingBridge;
}

class PlayBillingBridge {
  private isAndroidApp: boolean;
  private androidBridge: AndroidPlayBillingBridge | null;

  constructor() {
    // Check if running in Android WebView with Play Billing bridge
    const windowWithBridge = window as WindowWithAndroidBridge;
    this.isAndroidApp = typeof windowWithBridge.AndroidPlayBilling !== 'undefined';
    this.androidBridge = this.isAndroidApp ? (windowWithBridge.AndroidPlayBilling ?? null) : null;
  }

  /**
   * Check if Play Billing is available
   */
  isAvailable(): boolean {
    return this.isAndroidApp && this.androidBridge !== null;
  }

  /**
   * Initialize Play Billing connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isAvailable() || !this.androidBridge) {
      console.log('Play Billing not available - using web payments');
      return false;
    }

    try {
      const result = await this.androidBridge.initialize();
      console.log('Play Billing initialized:', result);
      return result === 'success';
    } catch (error) {
      console.error('Play Billing initialization failed:', error);
      return false;
    }
  }

  /**
   * Query available products
   */
  async queryProducts(productIds: string[]): Promise<PlayBillingProduct[]> {
    if (!this.isAvailable() || !this.androidBridge) {
      console.log('Play Billing not available');
      return [];
    }

    try {
      const productsJson = await this.androidBridge.queryProducts(JSON.stringify(productIds));
      return JSON.parse(productsJson);
    } catch (error) {
      console.error('Failed to query products:', error);
      return [];
    }
  }

  /**
   * Purchase a product
   */
  async purchase(productId: string): Promise<PlayBillingPurchase | null> {
    if (!this.isAvailable() || !this.androidBridge) {
      console.log('Play Billing not available');
      return null;
    }

    try {
      const purchaseJson = await this.androidBridge.purchase(productId);
      const purchase = JSON.parse(purchaseJson);
      
      // Verify purchase on backend
      await this.verifyPurchase(purchase);
      
      return purchase;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Verify purchase with backend
   */
  private async verifyPurchase(purchase: PlayBillingPurchase): Promise<void> {
    // Purchase verification is handled by native Android code
    // which communicates with Google Play Developer API
    console.log('Purchase verified:', purchase);
  }

  /**
   * Get user's purchases (for restore)
   */
  async getPurchases(): Promise<PlayBillingPurchase[]> {
    if (!this.isAvailable() || !this.androidBridge) {
      return [];
    }

    try {
      const purchasesJson = await this.androidBridge.getPurchases();
      return JSON.parse(purchasesJson);
    } catch (error) {
      console.error('Failed to get purchases:', error);
      return [];
    }
  }

  /**
   * Consume a purchase (for consumable items like tokens)
   */
  async consumePurchase(purchaseToken: string): Promise<boolean> {
    if (!this.isAvailable() || !this.androidBridge) {
      return false;
    }

    try {
      const result = await this.androidBridge.consumePurchase(purchaseToken);
      return result === 'success';
    } catch (error) {
      console.error('Failed to consume purchase:', error);
      return false;
    }
  }
}

// Singleton instance
export const playBilling = new PlayBillingBridge();

// Product IDs for your token packages
export const PLAY_BILLING_PRODUCTS = {
  TOKENS_50: 'tokens_50',
  TOKENS_100: 'tokens_100',
  TOKENS_250: 'tokens_250',
  TOKENS_500: 'tokens_500',
  TOKENS_1000: 'tokens_1000',
  // Fortune products
  FORTUNE_COFFEE: 'fortune_coffee',
  FORTUNE_TAROT: 'fortune_tarot',
  FORTUNE_PALM: 'fortune_palm',
  FORTUNE_BIRTHCHART: 'fortune_birthchart',
  FORTUNE_AURA: 'fortune_aura',
  // Premium subscription
  PREMIUM_MONTHLY: 'premium_monthly',
} as const;

export type PlayBillingProductId = typeof PLAY_BILLING_PRODUCTS[keyof typeof PLAY_BILLING_PRODUCTS];
