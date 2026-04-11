import posthog from 'posthog-js';

// ─── Auth Events ──────────────────────────────────────────────────────────────

export const analytics = {
  // Auth
  signUp(props: { method: 'email'; has_phone: boolean }) {
    posthog.capture('sign_up', props);
  },

  signIn(props: { method: 'email' | 'google' }) {
    posthog.capture('sign_in', props);
  },

  signOut() {
    posthog.capture('sign_out');
  },

  roleSelected(props: { role: 'shipper' | 'driver' }) {
    posthog.capture('role_selected', props);
  },

  // ─── Navigation ────────────────────────────────────────────────────────────

  pageViewed(props: { path: string; page_name: string; role?: string | null }) {
    posthog.capture('page_viewed', props);
  },

  tabNavigated(props: { tab: string; role: 'shipper' | 'driver' }) {
    posthog.capture('tab_navigated', props);
  },

  // ─── Load Management (Shipper) ─────────────────────────────────────────────

  loadFormStarted(props: { has_draft: boolean }) {
    posthog.capture('load_form_started', props);
  },

  loadPosted(props: {
    route: string;
    price: number;
    load_type: string;
    equipment_type: string;
    weight_kg: number | null;
    is_urgent: boolean;
    has_description: boolean;
    has_photos: boolean;
    ai_price_used: boolean;
    distance_km: number | null;
  }) {
    posthog.capture('load_posted', props);
  },

  aiDescriptionGenerated(props: { route: string; has_weight: boolean; has_equipment: boolean }) {
    posthog.capture('ai_description_generated', props);
  },

  aiPriceApplied(props: { suggested_price: number; route: string }) {
    posthog.capture('ai_price_applied', props);
  },

  loadCancelled(props: { load_id: string; status: string }) {
    posthog.capture('load_cancelled', props);
  },

  bidAccepted(props: { bid_id: string; load_id: string; bid_amount: number; load_price: number; driver_id: string }) {
    posthog.capture('bid_accepted', props);
  },

  // ─── Bidding (Driver) ──────────────────────────────────────────────────────

  bidFormOpened(props: { load_id: string; load_price: number | null; route: string }) {
    posthog.capture('bid_form_opened', props);
  },

  bidSubmitted(props: { load_id: string; amount: number; has_note: boolean; route: string }) {
    posthog.capture('bid_submitted', props);
  },

  bidUnverifiedAttempt(props: { load_id: string }) {
    posthog.capture('bid_unverified_attempt', props);
  },

  // ─── Load Detail View (Driver) ─────────────────────────────────────────────

  loadDetailViewed(props: { load_id: string; route: string; price: number | null; equipment_type: string | null; is_urgent: boolean }) {
    posthog.capture('load_detail_viewed', props);
  },

  loadFiltersApplied(props: { equipment: string; load_type: string; min_price: number; max_price: number; sort_by: string }) {
    posthog.capture('load_filters_applied', props);
  },

  driverOnlineToggled(props: { is_online: boolean }) {
    posthog.capture('driver_online_toggled', props);
  },

  // ─── Chat & Messaging ──────────────────────────────────────────────────────

  messageSent(props: { load_id: string; role: string }) {
    posthog.capture('message_sent', props);
  },

  chatOpened(props: { load_id: string; role: string }) {
    posthog.capture('chat_opened', props);
  },

  // ─── AI Chatbot ────────────────────────────────────────────────────────────

  aiChatbotOpened(props: { role: string | undefined }) {
    posthog.capture('ai_chatbot_opened', props);
  },

  aiChatbotClosed(props: { message_count: number; role: string | undefined }) {
    posthog.capture('ai_chatbot_closed', props);
  },

  aiChatbotMessageSent(props: { role: string | undefined; message_count: number; is_suggestion: boolean }) {
    posthog.capture('ai_chatbot_message_sent', props);
  },

  aiChatbotSuggestionClicked(props: { suggestion_label: string; role: string | undefined }) {
    posthog.capture('ai_chatbot_suggestion_clicked', props);
  },

  // ─── Verification ──────────────────────────────────────────────────────────

  verificationCenterOpened() {
    posthog.capture('verification_center_opened');
  },

  verificationStepStarted(props: { step: string }) {
    posthog.capture('verification_step_started', props);
  },

  documentUploaded(props: { doc_type: string; success: boolean }) {
    posthog.capture('document_uploaded', props);
  },

  verificationSubmitted(props: { entity_type: 'driver' | 'truck' }) {
    posthog.capture('verification_submitted', props);
  },

  manualReviewRequested(props: { entity_type: 'driver' | 'truck' }) {
    posthog.capture('manual_review_requested', props);
  },

  // ─── Subscription ──────────────────────────────────────────────────────────

  paywallViewed(props: { role: string | undefined }) {
    posthog.capture('paywall_viewed', props);
  },

  // ─── Search & Filters ──────────────────────────────────────────────────────

  loadSearched(props: { query: string; role: string }) {
    posthog.capture('load_searched', props);
  },

  // ─── AI Load Insights ──────────────────────────────────────────────────────

  aiLoadInsightsViewed(props: { load_id: string; action: 'match-carriers' | 'dynamic-pricing' }) {
    posthog.capture('ai_load_insights_viewed', props);
  },

  // ─── Errors ────────────────────────────────────────────────────────────────

  apiError(props: { context: string; message: string }) {
    posthog.capture('api_error', props);
  },
};
