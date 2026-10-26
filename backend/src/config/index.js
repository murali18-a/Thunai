import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  env: process.env.NODE_ENV || 'development',
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/thunai',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
  },
  bhashini: {
    userId: process.env.BHASHINI_USER_ID,
    apiKey: process.env.BHASHINI_API_KEY,
    asrUrl: process.env.BHASHINI_ASR_URL,
    ttsUrl: process.env.BHASHINI_TTS_URL,
  },
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:4000',
  dashboardOrigin: process.env.DASHBOARD_ORIGIN || 'http://localhost:5173',
};
