# Email Campaign Manager

A comprehensive end-to-end Email Campaign Manager integrating Brevo for mail services and Google Gemini for AI-powered content intelligence.

## 🚀 Features

### 1. Campaign Analytics Dashboard
- **KPI Cards**: Open Rate, Click Rate, Read Time, Bounce Rate, Unsubscribe Rate, Conversion Rate
- **Campaign Posts Table**: Complete overview of all campaigns with status and performance metrics
- **Real-time Data**: Automatic synchronization with Brevo analytics
- **Visual Insights**: Trend indicators and performance comparisons

### 2. Smart Email Editor
- **Rich Text Editor**: Built with TipTap for advanced formatting
- **Featured Images**: Drag-and-drop upload to Supabase Storage
- **CTA Buttons**: Dedicated UI tool for inserting payment/action buttons
- **Link Management**: Easy link insertion and management
- **Character Count**: Real-time character and word counting

### 3. AI Content Intelligence
- **AI Proofreader**: "Refine with Gemini" button for content enhancement
- **Smart Suggestions**: Engagement boosters and personalization tips
- **Subject Line Generator**: AI-powered subject line optimization
- **Tone Analysis**: Content tone assessment and recommendations

### 4. Recipient Targeting
- **Dynamic Filtering**: Filter by graduation year, department, engagement score
- **Bulk Operations**: Select all, individual selection, or filtered selection
- **Search Functionality**: Quick alumni search by name or email
- **Email Status**: Filter by email availability
- **Visual Feedback**: Clear selection indicators and counts

### 5. Campaign Publishing System
- **Draft Management**: All campaigns saved as drafts initially
- **Send Now**: Immediate campaign delivery to selected recipients
- **Scheduling**: Future date and time scheduling
- **Test Emails**: Send test emails before full deployment
- **Status Tracking**: Real-time delivery and engagement tracking

### 6. Social Media Multi-Channel Summarizer
- **Platform Optimization**: Facebook, WhatsApp, Instagram, Twitter, LinkedIn
- **Character Limits**: Automatic optimization per platform constraints
- **Hashtag Generation**: AI-suggested relevant hashtags
- **Copy to Clipboard**: One-click copying for each platform
- **Media Suggestions**: Visual content recommendations

## 🛠 Technical Implementation

### Database Schema
- **email_campaigns**: Main campaign storage
- **campaign_analytics**: Performance metrics and KPIs
- **campaign_recipients**: Recipient tracking per campaign
- **social_summaries**: Generated social media content
- **email_templates**: Reusable campaign templates

### API Integrations
- **Brevo Email API**: Campaign creation, sending, and analytics
- **Google Gemini AI**: Content refinement and generation
- **Supabase Storage**: Image upload and file management

### Error Handling
- **Categorized Errors**: User, Network, Server error classification
- **User-Friendly Messages**: Clear instructions and recovery options
- **Retry Mechanisms**: Automatic retry for transient failures
- **Graceful Degradation**: Fallback functionality for API failures

## 📁 Project Structure

```
app/
├── actions/
│   ├── email-campaigns.ts     # Brevo API integration
│   ├── ai-content.ts          # Gemini AI integration
│   └── image-upload.ts        # Supabase storage
├── components/
│   └── campaigns/
│       ├── campaign-analytics-dashboard.tsx
│       ├── smart-email-editor.tsx
│       ├── campaign-image-upload.tsx
│       ├── ai-proofreader.tsx
│       ├── recipient-targeting.tsx
│       ├── campaign-publishing.tsx
│       └── social-media-summarizer.tsx
├── dashboard/
│   └── email-campaigns/page.tsx
└── api/
    └── upload-campaign-image/route.ts
```

## 🚀 Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```env
# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_REPLY_EMAIL=noreply@yourdomain.com

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (already configured)
SUPABASE_PROJECT_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 2. Database Setup

Run the migration script:

```sql
-- Execute migrations/email_campaigns_schema.sql in your Supabase database
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

## 🔧 Configuration

### Brevo Setup
1. Create a Brevo account at [brevo.com](https://www.brevo.com)
2. Generate API keys from Account > SMTP & API
3. Configure sender email and domain verification
4. Set up webhook endpoints for real-time analytics

### Gemini AI Setup
1. Enable Gemini API in Google Cloud Console
2. Create API key and enable rate limiting
3. Configure content filtering policies as needed

### Supabase Setup
1. Create storage bucket for `campaign-images`
2. Set up Row Level Security policies
3. Configure CORS for image access

## 📊 Usage Examples

### Creating a Campaign

```typescript
const campaignData = {
  subject_line: "Alumni Fundraising Campaign 2024",
  content_body: "<p>Help us support the next generation...</p>",
  cta_button_text: "Donate Now",
  campaign_goal: "Increase Alumni Donations",
  featured_image_url: "https://example.com/image.jpg"
};

const result = await createEmailCampaign({
  ...campaignData,
  org_id: orgId,
  admin_id: adminId
});
```

### AI Content Refinement

```typescript
const refined = await refineContentWithGemini({
  content: emailContent,
  campaign_goal: "Increase Alumni Donations",
  tone: "professional"
});
```

### Social Media Generation

```typescript
const socialContent = await generateSocialSummaries({
  email_content: emailContent,
  platforms: ['facebook', 'instagram', 'twitter'],
  campaign_goal: "Alumni engagement"
});
```

## 🔒 Security Considerations

- **API Keys**: Never exposed to client-side code
- **Input Validation**: Comprehensive validation with Zod schemas
- **Rate Limiting**: Built-in rate limiting for API calls
- **Image Security**: File type and size validation
- **CORS Configuration**: Proper CORS setup for cross-origin requests

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📈 Performance Optimization

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic image compression and WebP conversion
- **API Caching**: Response caching for frequently accessed data
- **Database Indexing**: Optimized queries with proper indexes

## 🔄 API Endpoints

### Email Campaigns
- `POST /api/email-campaigns` - Create new campaign
- `GET /api/email-campaigns` - List campaigns
- `POST /api/email-campaigns/:id/send` - Send campaign
- `GET /api/email-campaigns/:id/analytics` - Get analytics

### Image Upload
- `POST /api/upload-campaign-image` - Upload campaign image

### AI Services
- `POST /api/ai/refine-content` - Refine email content
- `POST /api/ai/generate-social` - Generate social content

## 📝 Logging and Monitoring

- **Structured Logging**: JSON-formatted logs for easy parsing
- **Error Tracking**: Comprehensive error logging and categorization
- **Performance Metrics**: API response times and success rates
- **User Analytics**: Feature usage and engagement tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the error logs for troubleshooting information

---

**Built with ❤️ for alumni engagement and fundraising success**