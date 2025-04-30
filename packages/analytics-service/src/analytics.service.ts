import { logger } from '@perena/utils';
import * as Mixpanel from 'mixpanel';

export enum AnalyticsProvider {
  MIXPANEL = 'mixpanel',
  AMPLITUDE = 'amplitude',
  MOCK = 'mock'
}

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  apiKey: string;
  options?: Record<string, any>;
}

export interface UserProperties {
  userId: string;
  phoneNumber?: string;
  walletAddress?: string;
  country?: string;
  language?: string;
  [key: string]: any;
}

export interface EventProperties {
  [key: string]: any;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private mixpanelClient?: Mixpanel.Mixpanel;
  
  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.initProvider();
    logger.info('AnalyticsService initialized', { provider: config.provider });
  }
  
  private initProvider() {
    switch (this.config.provider) {
      case AnalyticsProvider.MIXPANEL:
        this.mixpanelClient = Mixpanel.init(this.config.apiKey, this.config.options);
        break;
      
      case AnalyticsProvider.AMPLITUDE:
        // Amplitude initialization would go here
        // Not implemented in this example
        break;
      
      case AnalyticsProvider.MOCK:
      default:
        // No initialization needed for mock
        break;
    }
  }
  
  /**
   * Track a user event
   * @param eventName Name of the event
   * @param userId User identifier
   * @param properties Additional event properties
   */
  async trackEvent(eventName: string, userId: string, properties: EventProperties = {}): Promise<void> {
    logger.info('Tracking event', { provider: this.config.provider, eventName, userId });
    
    switch (this.config.provider) {
      case AnalyticsProvider.MIXPANEL:
        this.trackMixpanelEvent(eventName, userId, properties);
        break;
      
      case AnalyticsProvider.AMPLITUDE:
        this.trackAmplitudeEvent(eventName, userId, properties);
        break;
      
      case AnalyticsProvider.MOCK:
      default:
        this.trackMockEvent(eventName, userId, properties);
        break;
    }
  }
  
  /**
   * Set or update user properties
   * @param userId User identifier
   * @param properties User properties
   */
  async setUserProperties(userId: string, properties: UserProperties): Promise<void> {
    logger.info('Setting user properties', { provider: this.config.provider, userId });
    
    switch (this.config.provider) {
      case AnalyticsProvider.MIXPANEL:
        this.setMixpanelUserProperties(userId, properties);
        break;
      
      case AnalyticsProvider.AMPLITUDE:
        this.setAmplitudeUserProperties(userId, properties);
        break;
      
      case AnalyticsProvider.MOCK:
      default:
        this.setMockUserProperties(userId, properties);
        break;
    }
  }
  
  /**
   * Track a page or screen view
   * @param userId User identifier
   * @param pageName Name of the page or screen
   * @param properties Additional properties
   */
  async trackPageView(userId: string, pageName: string, properties: EventProperties = {}): Promise<void> {
    logger.info('Tracking page view', { provider: this.config.provider, pageName, userId });
    
    // Add page name to properties
    const pageProperties = {
      ...properties,
      page: pageName
    };
    
    // Track as a standard event
    await this.trackEvent('page_view', userId, pageProperties);
  }
  
  /**
   * Track a trade event
   * @param userId User identifier
   * @param tradeType Type of trade
   * @param properties Trade properties
   */
  async trackTrade(
    userId: string,
    tradeType: 'swap' | 'mint' | 'redeem' | 'deposit' | 'withdrawal',
    properties: EventProperties
  ): Promise<void> {
    logger.info('Tracking trade', { provider: this.config.provider, tradeType, userId });
    
    // Add trade type to properties
    const tradeProperties = {
      ...properties,
      trade_type: tradeType
    };
    
    // Track as a standard event
    await this.trackEvent('trade', userId, tradeProperties);
  }
  
  /**
   * Track user engagement metrics
   * @param userId User identifier
   * @param engagementType Type of engagement
   * @param properties Engagement properties
   */
  async trackEngagement(
    userId: string,
    engagementType: 'message_sent' | 'command_executed' | 'help_requested' | 'error',
    properties: EventProperties = {}
  ): Promise<void> {
    logger.info('Tracking engagement', { provider: this.config.provider, engagementType, userId });
    
    // Add engagement type to properties
    const engagementProperties = {
      ...properties,
      engagement_type: engagementType
    };
    
    // Track as a standard event
    await this.trackEvent('engagement', userId, engagementProperties);
  }
  
  /**
   * Track a conversion or funnel step
   * @param userId User identifier
   * @param funnelName Name of the funnel
   * @param stepName Name of the step
   * @param properties Additional properties
   */
  async trackFunnelStep(
    userId: string,
    funnelName: string,
    stepName: string,
    properties: EventProperties = {}
  ): Promise<void> {
    logger.info('Tracking funnel step', { provider: this.config.provider, funnelName, stepName, userId });
    
    // Add funnel and step info to properties
    const funnelProperties = {
      ...properties,
      funnel: funnelName,
      step: stepName
    };
    
    // Track as a standard event
    await this.trackEvent('funnel_step', userId, funnelProperties);
  }
  
  /**
   * Track a Mixpanel event
   */
  private trackMixpanelEvent(eventName: string, userId: string, properties: EventProperties): void {
    if (!this.mixpanelClient) {
      logger.warn('Mixpanel client not initialized');
      return;
    }
    
    try {
      this.mixpanelClient.track(eventName, {
        distinct_id: userId,
        ...properties,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error tracking Mixpanel event', error);
    }
  }
  
  /**
   * Set Mixpanel user properties
   */
  private setMixpanelUserProperties(userId: string, properties: UserProperties): void {
    if (!this.mixpanelClient) {
      logger.warn('Mixpanel client not initialized');
      return;
    }
    
    try {
      this.mixpanelClient.people.set(userId, properties);
    } catch (error) {
      logger.error('Error setting Mixpanel user properties', error);
    }
  }
  
  /**
   * Track an Amplitude event
   */
  private trackAmplitudeEvent(eventName: string, userId: string, properties: EventProperties): void {
    // Amplitude tracking would go here
    // Not implemented in this example
    logger.info('Amplitude tracking not implemented', { eventName, userId });
  }
  
  /**
   * Set Amplitude user properties
   */
  private setAmplitudeUserProperties(userId: string, properties: UserProperties): void {
    // Amplitude user properties would go here
    // Not implemented in this example
    logger.info('Amplitude user properties not implemented', { userId });
  }
  
  /**
   * Track a mock event (for development)
   */
  private trackMockEvent(eventName: string, userId: string, properties: EventProperties): void {
    logger.info('Mock event tracked', { eventName, userId, properties });
  }
  
  /**
   * Set mock user properties (for development)
   */
  private setMockUserProperties(userId: string, properties: UserProperties): void {
    logger.info('Mock user properties set', { userId, properties });
  }
}
