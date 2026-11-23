export type AnalyticsEvent = 'service_viewed' | 'plan_discovery_viewed' | 'checkout_started' | 'support_started';
export function trackEvent(_event: AnalyticsEvent, _properties: Record<string, string | number | boolean> = {}) {
  // Intentionally a no-op until a privacy-reviewed analytics provider is approved.
}
