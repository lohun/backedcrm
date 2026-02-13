# Email Composer Implementation Guide

## Overview

A flexible, professional-grade email composer system built with:
- **Transactional Email**: Brevo's `sendTransacEmail` API for reaching entire alumni database
- **Smart CTA System**: Optional, configurable call-to-action buttons
- **AI-Powered**: Gemini-based context-aware proofreading and social media generation
- **Split-Pane UI**: Professional email editor with real-time feedback
- **Comprehensive Error Handling**: Categorized errors with actionable guidance
- **Statistics Tracking**: Real-time delivery, open, and click metrics

---

## Architecture

### 1. Database Schema Extensions

#### Posts Table (CTA Fields)
```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS has_cta BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cta_url TEXT;
ADD COLUMN IF NOT EXISTS title TEXT;
ADD CONSTRAINT valid_cta_config CHECK (...);
```

**Migration File**: `/migrations/posts_cta_schema.sql`

#### New Tables
- **transactional_logs**: Track individual email delivery status
  - Status: pending, sent, delivered, opened, clicked, bounced, blocked
  - Brevo message ID tracking
  - Webhook-compatible for real-time updates

---

## Server Actions

### 1. Broadcasting (`app/actions/broadcast-post.ts`)

**Primary Function**: `broadcastPost(postId, adminId, orgId, options)`

**Flow**:
```
1. Fetch post with CTA config
2. Validate CTA (if enabled)
3. Fetch all alumni with emails
4. Generate HTML template
5. Send via Brevo (with rate limiting)
6. Log to transactional_logs
7. Handle partial failures gracefully
```

**Error Categories**:
```typescript
enum BroadcastErrorType {
  USER_ERROR,       // Invalid input, bad URL
  NETWORK_ERROR,    // Resumable - connection failures
  SERVER_ERROR,     // API auth, rate limits
  VALIDATION_ERROR, // Schema/format errors
}
```

**Features**:
- Rate limiting (configurable delay between sends)
- Partial success handling (45/200 sent, retry failed)
- Resume capability with error token
- Dry-run mode for testing

**Example Usage**:
```typescript
const result = await broadcastPost(postId, adminId, orgId, {
  dryRun: false,
  delayMs: 100 // Rate limiting
});

if (result.success) {
  // 856 alumni contacted successfully
}
```

---

### 2. AI Proofreader (`app/actions/ai-proofreader.ts`)

**Primary Function**: `proofreadEmail(emailContent, ctaConfig?, campaignGoal?)`

**Gemini Prompt Engineering**:
- Context-aware scoring (0-100)
- Category-based feedback: Grammar, Tone, Strategic, CTA-specific
- Severity levels: low, medium, high
- Actionable suggestions with examples

**CTA-Specific Insight**:
When CTA is enabled:
- "Is the CTA clear and compelling?"
- "Does the email naturally lead to this CTA?"
- "Is the button text actionable?"

When CTA is disabled:
- "Should this email have a CTA?"
- "What action would benefit the recipient?"

**Response Format**:
```json
{
  "score": 85,
  "suggestions": [
    {
      "category": "TONE",
      "severity": "medium",
      "suggestion": "The opening feels formal",
      "context": "Dear Alumnae...",
      "action": "Start with a more conversational opener"
    }
  ],
  "summary": "Strong email with good engagement potential",
  "cta_feedback": "CTA wording is clear and compelling"
}
```

**Secondary Function**: `generateSocialSummaries(emailContent, campaignGoal, platforms)`

Generates platform-specific posts:
- **Twitter** (280 chars): Punchy, witty
- **Instagram** (300 chars): Trendy, hashtag-friendly
- **Facebook** (500 chars): Friendly, community-focused
- **LinkedIn** (1300 chars): Professional, thought-leadership
- **WhatsApp** (160 chars): Concise, conversational

---

### 3. Posts Management (`app/actions/posts.ts`)

**savePost(data)**: Create/update post with CTA config
- Validates CTA consistency
- Applies URL validation
- Returns post ID for broadcasting

**getPost(postId)**: Fetch single post

**getPostStatistics(postId)**: Aggregate delivery metrics
```json
{
  "total_sent": 256,
  "delivered": 248,
  "opened": 156,
  "clicked": 43,
  "open_rate": 61,
  "click_rate": 17
}
```

**getOrganizationPosts(orgId)**: List all posts with stats

---

## UI Components

### 1. Split-Pane Email Composer

**Location**: `components/campaigns/split-pane-email-composer.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────┬─────────┐
│ LEFT PANE: Email Editor                         │ CTA     │
│ ┌─────────────────────────────────────────────┐ │ Settings│
│ │ Subject Line                                │ ├─────────┤
│ │ ┌───────────────────────────────────────┐   │ │ AI      │
│ │ │ TipTap Editor (Bold, Italic, Lists)   │   │ │ Tools   │
│ │ │ [...email content...]                 │   │ ├─────────┤
│ │ └───────────────────────────────────────┘   │ │ Stats   │
│ │ [Status Messages]                           │ │ [Meta]  │
│ └─────────────────────────────────────────────┘ └─────────┘
```

**Tabs**:
1. **CTA Tab**: Toggle, button text, URL with live preview
2. **AI Tools Tab**: 
   - Proofreader (score + categorized suggestions)
   - Social Media Generator (platform-specific summaries)
3. **Stats Tab**: Delivery metrics + broadcast button

**Key Features**:
- Collapsible right pane
- Real-time TipTap editor
- CTA live preview
- Error alerts with recovery actions
- Broadcast status notifications

---

### 2. Smart Email Editor

**Location**: `components/campaigns/smart-email-editor.tsx`

TipTap-based editor with:
- Bold, italic, lists (bullet & ordered)
- Link insertion with URL dialog
- Undo/redo
- Placeholder text
- HTML output

---

### 3. Broadcast Error Display

**Location**: `components/campaigns/broadcast-error-display.tsx`

**Error Display Component**:
```typescript
<BroadcastErrorDisplay
  error={broadcastError}
  onRetry={handleRetry}
  onDismiss={() => setBroadcastError(null)}
/>
```

**Shows**:
- Categorized error type (icon + color)
- Error message + affected field
- Actionable guidance
- Failed recipient list (first 10)
- Retry button (network errors only)

**Example**:
```
⚠️ INPUT ERROR
CTA URL is invalid: "htp://example.com"
Field: cta_url
Action: URL must start with http:// or https://

[Retry] [Dismiss]
```

---

## HTML Email Template

**Generated by**: `generateEmailTemplate(tiptapContent, ctaConfig, author)`

**Features**:
- Professional responsive design (600px max-width)
- Themed header with blue border
- CTA button (if enabled)
  - Styled with blue background
  - Padding and border-radius
  - Centered placement
- Footer with unsubscribe link
- Author attribution

**CSS Optimizations**:
- Web-safe font stack
- Inline styles for email client compatibility
- Responsive for mobile

---

## Error Handling Strategy

### Error Categories

| Type | Cause | Recovery |
|------|-------|----------|
| USER_ERROR | Invalid input, bad URL, missing fields | Fix input, highlight field |
| VALIDATION_ERROR | Schema/format violations | Show validation rules |
| NETWORK_ERROR | Connection failure during send | Show partial success + retry |
| SERVER_ERROR | API auth, rate limits, server errors | Check config, contact support |

### Retry Logic

```typescript
// Partial Success Handler
if (successCount > 0 && failureCount > 0) {
  // Show statistics
  // Offer: "Retry failed recipients?"
  // Provide: resumeToken for tracking
}
```

### Rate Limiting

- Configurable delay between recipient sends (default: 100ms)
- Prevents Brevo API rate limit (99/sec)
- Non-blocking queue-like behavior

---

## Workflow Example

### Step 1: Compose Email
```
Subject: Alumni Reunion 2026 - Save the Date
Content: [TipTap editor]
Enable CTA: ✓
Button: "Register Now"
URL: https://alumni.edu/events/2026
```

### Step 2: Proofread
```
Click "Proofread Email"
↓
Gemini Analysis:
- Score: 88/100 ✓
- Grammar: "No issues"
- Tone: "Professional and inviting"
- CTA Advice: "Clear and compelling. 'Register Now' creates urgency"
```

### Step 3: Social Media
```
Click "Generate Social Posts"
↓
LinkedIn (1300 chars): "Join us for Alumni Reunion 2026!"
Instagram (300 chars): "Mark your calendars! 📅 #AlumniReunion2026"
Twitter (280 chars): "Save the date for Alumni Reunion 2026 🎓"
WhatsApp (160 chars): "Alumni Reunion 2026 - Register: [link]"
```

### Step 4: Broadcast
```
Click "Broadcast to All Alumni"
↓
- Validates CTA
- Sends to 1,247 alumni
- Logs to transactional_logs
- Shows real-time status: "845 sent, 402 pending..."
```

### Step 5: Monitor Stats
```
Stats Tab Shows:
- Sent: 1,247
- Delivered: 1,203
- Opened: 734 (61%)
- Clicked: 156 (13%)
```

---

## Configuration

### Environment Variables
```env
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@alumni.edu
BREVO_REPLY_EMAIL=support@alumni.edu
GEMINI_API_KEY=...
```

### Rate Limiting
```typescript
// Adjust in broadcast-post.ts
const delayMs = 100; // 10 emails/second
```

---

## API Integration Points

### Brevo Transactional Email
```typescript
await transactionApi.sendTransacEmail({
  sender: { name, email },
  to: [{ email, name }],
  subject,
  htmlContent,
  replyTo: { email }
});
```

### Gemini AI
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const result = await model.generateContent(prompt);
```

### Supabase
```typescript
- posts (create, read, update)
- transactional_logs (insert, query)
- alumni_list (query for targeting)
```

---

## Testing Checklist

- [ ] Draft email with subject and content
- [ ] Enable/disable CTA and verify preview
- [ ] Run proofreader and verify categories
- [ ] Generate social summaries for all platforms
- [ ] Test dry-run broadcast (0 sends, validation only)
- [ ] Broadcast to small test group (verify stats)
- [ ] Simulate network error (retry flow)
- [ ] Check transactional_logs for correct status values
- [ ] Verify CTA click tracking (via Brevo webhooks)

---

## Future Enhancements

1. **Scheduling**: Schedule sends for specific times
2. **A/B Testing**: Send variations to segments
3. **Templates**: Reusable email templates
4. **Webhooks**: Real-time Brevo event tracking
5. **Analytics Dashboard**: Advanced segmentation & reporting
6. **WYSIWYG Preview**: Live email preview during editing
7. **Spellcheck**: Inline grammar checking
8. **Media Library**: Upload/manage images

---

## Files Created/Modified

### New Files
- `migrations/posts_cta_schema.sql` - Schema extensions
- `app/actions/broadcast-post.ts` - Broadcasting logic
- `app/actions/ai-proofreader.ts` - Gemini integration
- `app/actions/posts.ts` - Post management
- `components/campaigns/split-pane-email-composer.tsx` - Main UI
- `components/campaigns/smart-email-editor.tsx` - TipTap editor
- `components/campaigns/broadcast-error-display.tsx` - Error UI
- `components/ui/alert.tsx` - Alert component
- `app/dashboard/email-composer/page.tsx` - Composer page

### Modified Files
- `app/actions/email-campaigns.ts` - Enhanced with new flow
- Various campaign components - Updated props/interfaces

---

## Deployment Notes

1. Run migration: `posts_cta_schema.sql` in Supabase
2. Ensure Brevo and Gemini API keys are set
3. Update rate limiting based on Brevo tier
4. Test with small alumni group first
5. Set up webhook handlers for delivery tracking (future)

